from flask import Flask, jsonify, request
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from openai import OpenAI
from dotenv import load_dotenv
import traceback
import re
import os
import json
from pathlib import Path
import cache_manager

# Load environment variables from parent directory (.env in project root)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
# Also try local .env if exists
load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'])

# Create YouTube API instance
ytt_api = YouTubeTranscriptApi()

# DeepSeek API setup (OpenAI compatible)
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
deepseek_client = None

if DEEPSEEK_API_KEY and DEEPSEEK_API_KEY != 'your_deepseek_api_key_here':
    deepseek_client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com"
    )
    print("✅ DeepSeek AI API configured")
else:
    print("⚠️ DeepSeek API key not configured. Question generation will be unavailable.")

def format_transcript_readable(transcript_list, pause_threshold=2.0):
    """Format transcript into readable paragraphs based on pauses."""
    if not transcript_list:
        return ""
    
    paragraphs = []
    current_paragraph = []
    
    for i, item in enumerate(transcript_list):
        text = item['text'].strip()
        if not text:
            continue
        current_paragraph.append(text)
        
        if i < len(transcript_list) - 1:
            current_end = item['start'] + item['duration']
            next_start = transcript_list[i + 1]['start']
            pause = next_start - current_end
            
            if pause >= pause_threshold:
                paragraph_text = ' '.join(current_paragraph)
                paragraphs.append(paragraph_text)
                current_paragraph = []
    
    if current_paragraph:
        paragraphs.append(' '.join(current_paragraph))
    
    result = '\n\n'.join(paragraphs)
    result = re.sub(r' +', ' ', result)
    result = re.sub(r'\n{3,}', '\n\n', result)
    
    return result

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'GenGen Python API Server is running',
        'deepseekConfigured': deepseek_client is not None
    })

@app.route('/api/transcript/<video_id>', methods=['GET'])
def get_transcript(video_id):
    preferred_lang = request.args.get('lang', 'ko')
    format_type = request.args.get('format', 'readable')
    
    if not video_id:
        return jsonify({'success': False, 'error': '영상 ID가 필요합니다.'}), 400
    
    try:
        print(f"\n=== Fetching transcript: {video_id} ===")
        
        languages_to_try = [preferred_lang, 'ko', 'en']
        
        try:
            transcript_data = ytt_api.fetch(video_id, languages=languages_to_try)
            language_used = preferred_lang
        except Exception:
            try:
                transcript_data = ytt_api.fetch(video_id)
                language_used = 'auto'
            except Exception as e2:
                raise e2
        
        transcript_list = []
        for snippet in transcript_data:
            transcript_list.append({
                'text': snippet.text,
                'start': snippet.start,
                'duration': snippet.duration
            })
        
        if not transcript_list:
            return jsonify({'success': False, 'error': '자막 데이터가 비어있습니다.'}), 404
        
        raw_text = ' '.join([item['text'] for item in transcript_list])
        raw_text = ' '.join(raw_text.split())
        
        if format_type == 'readable':
            formatted_text = format_transcript_readable(transcript_list)
        else:
            formatted_text = raw_text
        
        text_with_timestamps = '\n'.join([
            f"[{int(item['start'] // 60)}:{int(item['start'] % 60):02d}] {item['text']}"
            for item in transcript_list
        ])
        
        print(f"✅ Success: {len(transcript_list)} segments")
        
        return jsonify({
            'success': True,
            'videoId': video_id,
            'language': language_used,
            'text': formatted_text,
            'rawText': raw_text,
            'textWithTimestamps': text_with_timestamps,
            'segments': len(transcript_list)
        })
        
    except Exception as e:
        error_str = str(e)
        print(f"Error: {error_str}")
        
        if 'disabled' in error_str.lower():
            return jsonify({'success': False, 'error': '자막이 비활성화된 영상입니다.'}), 404
        elif 'unavailable' in error_str.lower():
            return jsonify({'success': False, 'error': '영상을 찾을 수 없습니다.'}), 404
        else:
            return jsonify({'success': False, 'error': f'오류: {error_str}'}), 500


# ============ Subtitle Formatting with DeepSeek ============

@app.route('/api/format-subtitle', methods=['POST'])
def format_subtitle():
    """Format raw subtitle text into readable markdown using DeepSeek."""
    if not deepseek_client:
        return jsonify({
            'success': False,
            'error': 'DeepSeek API key not configured'
        }), 500
    
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({
            'success': False,
            'error': 'No text provided'
        }), 400
    
    raw_text = data['text']
    
    if not raw_text.strip():
        return jsonify({
            'success': False,
            'error': 'Empty text'
        }), 400
    
    # Check cache first
    cache_key = cache_manager.generate_cache_key('subtitle', raw_text[:500])
    cached_result = cache_manager.get_cached(cache_key)
    
    if cached_result:
        print(f"📦 Returning cached formatted subtitle")
        return jsonify({
            'success': True,
            'formattedText': cached_result,
            'cached': True
        })
    
    try:
        prompt = f"""다음은 유튜브 영상의 자막입니다. 이 자막을 읽기 쉽게 정리해주세요.

규칙:
1. 문장을 자연스럽게 이어붙여서 읽기 좋게 만들어주세요.
2. 주제별로 단락을 나눠주세요.
3. 중요한 핵심 내용은 **굵은 글씨**로 강조해주세요.
4. 마크다운 형식으로 출력해주세요.
5. 불필요한 반복이나 말더듬은 제거해주세요.
6. 내용을 요약하지 말고, 원래 내용을 최대한 유지하면서 정리해주세요.

자막:
{raw_text}

위 자막을 읽기 좋게 정리한 마크다운:"""

        response = deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "당신은 텍스트 정리 전문가입니다. 주어진 자막을 읽기 좋게 정리합니다."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=4000
        )
        
        formatted_text = response.choices[0].message.content.strip()
        
        print(f"✅ Formatted subtitle ({len(raw_text)} -> {len(formatted_text)} chars)")
        
        # Cache the result
        cache_manager.set_cache(cache_key, formatted_text)
        
        return jsonify({
            'success': True,
            'formattedText': formatted_text
        })
        
    except Exception as e:
        print(f"❌ Subtitle formatting error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'자막 정리 중 오류가 발생했습니다: {str(e)}'
        }), 500


# Question generation prompts
QUESTION_PROMPTS = {
    'multiple_choice': '''다음 텍스트를 기반으로 **실제 시험에 나올 법한** 객관식 문제를 {count}개 만들어주세요.

문제 출제 가이드라인:
- 핵심 개념과 중요한 내용을 묻는 문제를 출제하세요
- 단순 암기보다는 이해도를 평가하는 문제를 만드세요
- 오답 선택지도 그럴듯하게 만들어 변별력을 높이세요
- 실제 학교 시험이나 자격증 시험 스타일로 출제하세요

각 문제는 다음 JSON 형식으로 작성해주세요:
{{
  "question": "문제 내용",
  "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
  "answer": 0,  // 정답 인덱스 (0부터 시작)
  "explanation": "정답 해설"
}}

텍스트:
{text}

위 텍스트에 대한 {count}개의 객관식 문제를 JSON 배열 형태로만 응답해주세요. 다른 설명 없이 JSON만 응답하세요.
''',
    
    'short_answer': '''다음 텍스트를 기반으로 **실제 시험에 나올 법한** 단답형 문제를 {count}개 만들어주세요.

문제 출제 가이드라인:
- 핵심 용어, 정의, 중요 개념을 묻는 문제를 출제하세요
- 명확하고 간결한 정답이 나올 수 있는 문제를 만드세요
- 실제 학교 시험이나 자격증 시험에서 볼 수 있는 스타일로 출제하세요

각 문제는 다음 JSON 형식으로 작성해주세요:
{{
  "question": "문제 내용",
  "answer": "정답",
  "explanation": "정답 해설"
}}

텍스트:
{text}

위 텍스트에 대한 {count}개의 단답형 문제를 JSON 배열 형태로만 응답해주세요. 다른 설명 없이 JSON만 응답하세요.
''',

    'true_false': '''다음 텍스트를 기반으로 **실제 시험에 나올 법한** O/X(참/거짓) 문제를 {count}개 만들어주세요.

문제 출제 가이드라인:
- 중요한 개념의 정확한 이해를 확인하는 문제를 출제하세요
- 미묘한 차이나 흔한 오개념을 활용한 문제를 만드세요
- 참/거짓이 명확히 구분되는 진술로 작성하세요
- 실제 시험에서 자주 출제되는 패턴으로 만드세요

각 문제는 다음 JSON 형식으로 작성해주세요:
{{
  "question": "문제 내용 (참 또는 거짓으로 답할 수 있는 진술)",
  "answer": true,  // true 또는 false
  "explanation": "정답 해설"
}}

텍스트:
{text}

위 텍스트에 대한 {count}개의 O/X 문제를 JSON 배열 형태로만 응답해주세요. 다른 설명 없이 JSON만 응답하세요.
''',

    'fill_blank': '''다음 텍스트를 기반으로 **실제 시험에 나올 법한** 빈칸 채우기 문제를 {count}개 만들어주세요.

문제 출제 가이드라인:
- 핵심 용어나 중요 개념이 빈칸이 되도록 문제를 출제하세요
- 문맥을 통해 정답을 유추할 수 있지만, 정확한 지식이 필요한 문제를 만드세요
- 실제 시험에서 자주 나오는 형태로 출제하세요

각 문제는 다음 JSON 형식으로 작성해주세요:
{{
  "question": "문장에서 중요한 부분을 ___로 표시한 문제",
  "answer": "빈칸에 들어갈 정답",
  "explanation": "정답 해설"
}}

텍스트:
{text}

위 텍스트에 대한 {count}개의 빈칸 채우기 문제를 JSON 배열 형태로만 응답해주세요. 다른 설명 없이 JSON만 응답하세요.
''',

    'math': '''다음 텍스트를 기반으로 **실제 시험에 나올 법한** 수학 문제를 {count}개 만들어주세요.

문제 출제 가이드라인:
- 텍스트에서 다루는 수학적 개념을 활용한 문제를 출제하세요
- 수식은 반드시 LaTeX 문법을 사용하세요 (인라인: $수식$, 블록: $$수식$$)
- 계산 문제, 증명 문제, 응용 문제 등 다양한 유형으로 출제하세요
- 풀이 과정이 필요한 문제를 만드세요
- 실제 수학 시험에서 볼 수 있는 형태로 출제하세요

각 문제는 다음 JSON 형식으로 작성해주세요:
{{
  "question": "수학 문제 내용 (LaTeX 수식 포함)",
  "answer": "정답 (LaTeX 수식으로 표현)",
  "explanation": "풀이 과정 (LaTeX 수식으로 단계별 설명)"
}}

예시:
{{
  "question": "다음 이차방정식의 해를 구하시오: $x^2 - 5x + 6 = 0$",
  "answer": "$x = 2$ 또는 $x = 3$",
  "explanation": "인수분해하면 $(x-2)(x-3) = 0$이므로 $x = 2$ 또는 $x = 3$"
}}

텍스트:
{text}

위 텍스트에 대한 {count}개의 수학 문제를 JSON 배열 형태로만 응답해주세요. 다른 설명 없이 JSON만 응답하세요.
'''
}

@app.route('/api/generate-questions', methods=['POST'])
def generate_questions():
    """Generate questions using DeepSeek AI"""
    
    if not deepseek_client:
        return jsonify({
            'success': False,
            'error': 'DeepSeek API가 설정되지 않았습니다. .env 파일에 DEEPSEEK_API_KEY를 설정해주세요.'
        }), 503
    
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'error': '요청 데이터가 없습니다.'}), 400
    
    text = data.get('text', '')
    question_type = data.get('type', 'multiple_choice')
    count = data.get('count', 5)
    
    if not text:
        return jsonify({'success': False, 'error': '텍스트가 필요합니다.'}), 400
    
    if question_type not in QUESTION_PROMPTS:
        return jsonify({'success': False, 'error': f'지원하지 않는 문제 유형입니다: {question_type}'}), 400
    
    # Limit text length to avoid API limits (roughly 8000 tokens)
    max_chars = 15000
    if len(text) > max_chars:
        text = text[:max_chars] + "..."
    
    # Check cache first
    cache_key = cache_manager.generate_cache_key('questions', text[:500], question_type, count)
    cached_result = cache_manager.get_cached(cache_key)
    
    if cached_result:
        print(f"📦 Returning cached questions")
        return jsonify({
            'success': True,
            'questions': cached_result['questions'],
            'type': cached_result['type'],
            'count': cached_result['count'],
            'cached': True
        })
    
    try:
        print(f"\n=== Generating {count} {question_type} questions ===")
        print(f"Text length: {len(text)} chars")
        
        prompt = QUESTION_PROMPTS[question_type].format(text=text, count=count)
        
        response = deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "당신은 교육 전문가입니다. 주어진 텍스트를 분석하여 학습에 도움이 되는 문제를 만듭니다. 항상 순수한 JSON 형식으로만 응답합니다."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        result_text = response.choices[0].message.content.strip()
        print(f"AI Response length: {len(result_text)} chars")
        
        # Parse JSON from response
        # Try to extract JSON array from the response
        json_match = re.search(r'\[[\s\S]*\]', result_text)
        if json_match:
            result_text = json_match.group()
        
        try:
            questions = json.loads(result_text)
        except json.JSONDecodeError:
            # Try to fix common JSON issues
            result_text = result_text.replace("'", '"')
            result_text = re.sub(r',\s*]', ']', result_text)
            result_text = re.sub(r',\s*}', '}', result_text)
            questions = json.loads(result_text)
        
        print(f"✅ Generated {len(questions)} questions")
        
        # Cache the result
        cache_manager.set_cache(cache_key, {
            'questions': questions,
            'type': question_type,
            'count': len(questions)
        })
        
        return jsonify({
            'success': True,
            'questions': questions,
            'type': question_type,
            'count': len(questions)
        })
        
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        print(f"Response was: {result_text[:500]}...")
        return jsonify({
            'success': False,
            'error': 'AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.'
        }), 500
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'문제 생성 중 오류가 발생했습니다: {str(e)}'
        }), 500


# ============ PDF OCR with Gemini API ============

# Gemini API setup
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here':
    print("✅ Gemini API configured for PDF OCR")
else:
    print("⚠️ Gemini API key not configured. PDF OCR will be unavailable.")


@app.route('/api/pdf/check', methods=['GET'])
def check_pdf_service():
    """Check if PDF OCR service is available."""
    from pdf_processor import check_dependencies
    
    issues = check_dependencies()
    has_api_key = bool(GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here')
    
    if not has_api_key:
        issues.append("GEMINI_API_KEY not configured")
    
    return jsonify({
        'available': len(issues) == 0 and has_api_key,
        'hasApiKey': has_api_key,
        'issues': issues
    })


@app.route('/api/pdf/extract', methods=['POST'])
def extract_pdf():
    """Extract text from PDF, PPTX, or DOCX files."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
        return jsonify({
            'success': False,
            'error': 'Gemini API key not configured'
        }), 500
    
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file uploaded'
        }), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected'
        }), 400
    
    filename_lower = file.filename.lower()
    
    # Check file extension
    if not (filename_lower.endswith('.pdf') or 
            filename_lower.endswith('.pptx') or 
            filename_lower.endswith('.docx')):
        return jsonify({
            'success': False,
            'error': 'Supported formats: PDF, PPTX, DOCX'
        }), 400
    
    try:
        file_bytes = file.read()
        print(f"📄 Processing file: {file.filename} ({len(file_bytes)} bytes)")
        
        # Route to appropriate processor based on file type
        if filename_lower.endswith('.pdf'):
            from pdf_processor import process_pdf
            result = process_pdf(file_bytes, GEMINI_API_KEY)
            count_key = 'page_count'
            count_name = 'pageCount'
            
        elif filename_lower.endswith('.pptx'):
            from pdf_processor import process_pptx
            result = process_pptx(file_bytes, GEMINI_API_KEY)
            count_key = 'slide_count'
            count_name = 'slideCount'
            
        elif filename_lower.endswith('.docx'):
            from pdf_processor import extract_docx_text
            result = extract_docx_text(file_bytes)
            count_key = 'paragraph_count'
            count_name = 'paragraphCount'
        
        if result['success']:
            print(f"✅ File processed successfully ({result.get(count_key, 0)} {count_key})")
            return jsonify({
                'success': True,
                'text': result['text'],
                count_name: result.get(count_key, 0)
            })
        else:
            print(f"❌ PDF processing failed: {result.get('error')}")
            return jsonify({
                'success': False,
                'error': result.get('error', 'Unknown error')
            }), 500
            
    except Exception as e:
        print(f"❌ PDF extraction error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'PDF 처리 중 오류가 발생했습니다: {str(e)}'
        }), 500


if __name__ == '__main__':
    print("🚀 GenGen Python API Server starting...")
    print("📝 Transcript API: GET /api/transcript/<video_id>")
    print("🧠 Question Generation API: POST /api/generate-questions")
    print("📄 PDF OCR API: POST /api/pdf/extract")
    app.run(host='0.0.0.0', port=3001, debug=True)
