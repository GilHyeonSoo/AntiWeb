// DeepSeek AI Question Generation API Service
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

// Question types
export const QUESTION_TYPES = {
    MULTIPLE_CHOICE: 'multiple_choice',
    SHORT_ANSWER: 'short_answer',
    TRUE_FALSE: 'true_false',
    FILL_BLANK: 'fill_blank',
    MATH: 'math'
};

export const QUESTION_TYPE_LABELS = {
    [QUESTION_TYPES.MULTIPLE_CHOICE]: '객관식',
    [QUESTION_TYPES.SHORT_ANSWER]: '단답형',
    [QUESTION_TYPES.TRUE_FALSE]: 'O/X',
    [QUESTION_TYPES.FILL_BLANK]: '빈칸 채우기',
    [QUESTION_TYPES.MATH]: '수학 문제'
};

// Check if AI API is available
export const checkAIAvailability = async () => {
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/health`);
        const data = await response.json();
        return data.deepseekConfigured === true;
    } catch {
        return false;
    }
};

// Generate questions from text
export const generateQuestions = async (text, questionType = QUESTION_TYPES.MULTIPLE_CHOICE, count = 5) => {
    if (!text || text.trim().length === 0) {
        throw new Error('텍스트가 필요합니다.');
    }

    const response = await fetch(`${BACKEND_API_URL}/api/generate-questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text.trim(),
            type: questionType,
            count: count
        })
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || '문제 생성에 실패했습니다.');
    }

    return {
        questions: data.questions,
        type: data.type,
        count: data.count
    };
};

// Generate questions from YouTube video
export const generateQuestionsFromYouTube = async (videoId, questionType, count) => {
    // First get the transcript
    const transcriptResponse = await fetch(
        `${BACKEND_API_URL}/api/transcript/${videoId}?format=readable`
    );
    const transcriptData = await transcriptResponse.json();

    if (!transcriptData.success) {
        throw new Error(transcriptData.error || '자막을 가져올 수 없습니다.');
    }

    // Then generate questions from the transcript
    return generateQuestions(transcriptData.text, questionType, count);
};
