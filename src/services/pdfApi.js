/**
 * PDF API Service
 * Handles PDF upload and OCR extraction using Gemini API
 */

const API_BASE_URL = 'http://localhost:3001';

/**
 * Check if PDF OCR service is available
 */
export const checkPDFService = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pdf/check`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('PDF service check failed:', error);
        return {
            available: false,
            hasApiKey: false,
            issues: ['Server connection failed']
        };
    }
};

/**
 * Extract text from PDF using Gemini API
 * @param {File} file - The PDF file to process
 * @param {function} onProgress - Progress callback (optional)
 * @returns {Promise<{success: boolean, text: string, pageCount?: number, error?: string}>}
 */
export const extractPDFText = async (file, onProgress = null) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        if (onProgress) {
            onProgress({ status: 'uploading', message: 'PDF 업로드 중...' });
        }

        const response = await fetch(`${API_BASE_URL}/api/pdf/extract`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'PDF 처리 실패');
        }

        if (onProgress) {
            onProgress({ status: 'complete', message: '추출 완료!' });
        }

        return {
            success: true,
            text: data.text,
            pageCount: data.pageCount
        };

    } catch (error) {
        console.error('PDF extraction error:', error);
        return {
            success: false,
            text: '',
            error: error.message || 'PDF 처리 중 오류가 발생했습니다.'
        };
    }
};
