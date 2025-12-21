from flask import Flask, jsonify, request
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
import traceback
import re

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'])

# Create API instance
ytt_api = YouTubeTranscriptApi()

def format_transcript_readable(transcript_list, pause_threshold=2.0):
    """
    Format transcript into readable paragraphs based on pauses and punctuation.
    
    Args:
        transcript_list: List of transcript segments with text, start, duration
        pause_threshold: Seconds of pause to start a new paragraph (default: 2.0)
    
    Returns:
        Formatted readable text with proper paragraphs
    """
    if not transcript_list:
        return ""
    
    paragraphs = []
    current_paragraph = []
    
    for i, item in enumerate(transcript_list):
        text = item['text'].strip()
        
        if not text:
            continue
            
        current_paragraph.append(text)
        
        # Check if there's a significant pause after this segment
        # (indicating a natural break in speech)
        if i < len(transcript_list) - 1:
            current_end = item['start'] + item['duration']
            next_start = transcript_list[i + 1]['start']
            pause = next_start - current_end
            
            # Start new paragraph on long pause
            if pause >= pause_threshold:
                paragraph_text = ' '.join(current_paragraph)
                paragraphs.append(paragraph_text)
                current_paragraph = []
    
    # Add remaining paragraph
    if current_paragraph:
        paragraphs.append(' '.join(current_paragraph))
    
    # Join paragraphs with double newline
    result = '\n\n'.join(paragraphs)
    
    # Clean up whitespace
    result = re.sub(r' +', ' ', result)
    result = re.sub(r'\n{3,}', '\n\n', result)
    
    return result

def format_by_sentences(text):
    """
    Format text by splitting into proper sentences.
    """
    # Add line breaks after sentence-ending punctuation
    # For Korean, also consider Korean punctuation
    text = re.sub(r'([.?!。？！])\s*', r'\1\n', text)
    
    # Remove excessive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Clean up
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    return '\n'.join(lines)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'GenGen Python API Server is running'})

@app.route('/api/transcript/<video_id>', methods=['GET'])
def get_transcript(video_id):
    preferred_lang = request.args.get('lang', 'ko')
    format_type = request.args.get('format', 'readable')  # 'raw', 'readable', 'sentences'
    
    if not video_id:
        return jsonify({'success': False, 'error': '영상 ID가 필요합니다.'}), 400
    
    try:
        print(f"\n=== Fetching transcript: {video_id} (format: {format_type}) ===")
        
        languages_to_try = [preferred_lang, 'ko', 'en']
        
        try:
            transcript_data = ytt_api.fetch(video_id, languages=languages_to_try)
            language_used = preferred_lang
        except Exception as e1:
            print(f"Preferred languages failed: {e1}")
            try:
                transcript_data = ytt_api.fetch(video_id)
                language_used = 'auto'
            except Exception as e2:
                traceback.print_exc()
                raise e2
        
        # Convert to list
        transcript_list = []
        for snippet in transcript_data:
            transcript_list.append({
                'text': snippet.text,
                'start': snippet.start,
                'duration': snippet.duration
            })
        
        if not transcript_list:
            return jsonify({'success': False, 'error': '자막 데이터가 비어있습니다.'}), 404
        
        print(f"Got transcript with {len(transcript_list)} segments")
        
        # Build raw text (just joined)
        raw_text = ' '.join([item['text'] for item in transcript_list])
        raw_text = ' '.join(raw_text.split())
        
        # Build formatted text based on request
        if format_type == 'readable':
            formatted_text = format_transcript_readable(transcript_list)
        elif format_type == 'sentences':
            formatted_text = format_by_sentences(raw_text)
        else:
            formatted_text = raw_text
        
        # Build timestamped text
        text_with_timestamps = '\n'.join([
            f"[{int(item['start'] // 60)}:{int(item['start'] % 60):02d}] {item['text']}"
            for item in transcript_list
        ])
        
        print(f"✅ Success: {len(transcript_list)} segments, {len(formatted_text)} chars")
        
        return jsonify({
            'success': True,
            'videoId': video_id,
            'language': language_used,
            'text': formatted_text,          # Formatted version
            'rawText': raw_text,             # Original unformatted
            'textWithTimestamps': text_with_timestamps,
            'segments': len(transcript_list)
        })
        
    except Exception as e:
        error_str = str(e)
        print(f"Final Error: {error_str}")
        traceback.print_exc()
        
        if 'disabled' in error_str.lower():
            return jsonify({'success': False, 'error': '이 영상은 자막이 비활성화되어 있습니다.'}), 404
        elif 'unavailable' in error_str.lower():
            return jsonify({'success': False, 'error': '영상을 찾을 수 없거나 비공개 영상입니다.'}), 404
        elif 'no transcript' in error_str.lower():
            return jsonify({'success': False, 'error': '이 영상에 사용 가능한 자막이 없습니다.'}), 404
        else:
            return jsonify({'success': False, 'error': f'자막 오류: {error_str}'}), 500

if __name__ == '__main__':
    print("🚀 GenGen Python API Server starting...")
    print("📝 Transcript API: GET /api/transcript/<video_id>")
    print("   ?format=readable (default) - 문단으로 정리된 텍스트")
    print("   ?format=sentences - 문장별로 정리된 텍스트")
    print("   ?format=raw - 원본 텍스트")
    app.run(host='0.0.0.0', port=3001, debug=True)
