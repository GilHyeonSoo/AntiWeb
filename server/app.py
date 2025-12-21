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

# Question generation prompts
QUESTION_PROMPTS = {
    'multiple_choice': '''다음 텍스트를 기반으로 객관식 문제를 {count}개 만들어주세요.

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
    
    'short_answer': '''다음 텍스트를 기반으로 단답형 문제를 {count}개 만들어주세요.

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

    'true_false': '''다음 텍스트를 기반으로 O/X(참/거짓) 문제를 {count}개 만들어주세요.

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

    'fill_blank': '''다음 텍스트를 기반으로 빈칸 채우기 문제를 {count}개 만들어주세요.

각 문제는 다음 JSON 형식으로 작성해주세요:
{{
  "question": "문장에서 중요한 부분을 ___로 표시한 문제",
  "answer": "빈칸에 들어갈 정답",
  "explanation": "정답 해설"
}}

텍스트:
{text}

위 텍스트에 대한 {count}개의 빈칸 채우기 문제를 JSON 배열 형태로만 응답해주세요. 다른 설명 없이 JSON만 응답하세요.
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

if __name__ == '__main__':
    print("🚀 GenGen Python API Server starting...")
    print("📝 Transcript API: GET /api/transcript/<video_id>")
    print("🧠 Question Generation API: POST /api/generate-questions")
    app.run(host='0.0.0.0', port=3001, debug=True)
