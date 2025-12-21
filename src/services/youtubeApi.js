// YouTube API Service - Uses local backend server for transcript
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

// Check if YouTube API is configured
export const isYoutubeApiConfigured = () => {
    return YOUTUBE_API_KEY &&
        YOUTUBE_API_KEY !== 'your_youtube_api_key_here' &&
        YOUTUBE_API_KEY !== undefined;
};

// Check if backend server is available
export const checkBackendServer = async () => {
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        return response.ok;
    } catch {
        return false;
    }
};

// Extract video ID from various YouTube URL formats
export const extractVideoId = (url) => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

// Get video details using YouTube Data API v3
export const getVideoDetails = async (videoId) => {
    if (!isYoutubeApiConfigured()) {
        // Return basic info without API
        return {
            id: videoId,
            title: '',
            description: '',
            channelTitle: '',
            publishedAt: '',
            duration: '',
            thumbnails: null
        };
    }

    const response = await fetch(
        `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '영상 정보를 가져오는데 실패했습니다.');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        throw new Error('영상을 찾을 수 없습니다.');
    }

    const video = data.items[0];
    return {
        id: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails.duration,
        thumbnails: video.snippet.thumbnails
    };
};

// Fetch transcript from backend server
export const fetchTranscript = async (videoId, lang = null) => {
    try {
        const url = lang
            ? `${BACKEND_API_URL}/api/transcript/${videoId}?lang=${lang}`
            : `${BACKEND_API_URL}/api/transcript/${videoId}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            return {
                text: data.text,
                textWithTimestamps: data.textWithTimestamps,
                language: data.language,
                segments: data.segments,
                source: 'backend_server'
            };
        }

        return null;
    } catch (error) {
        console.error('Transcript fetch error:', error);
        return null;
    }
};

// Get video content as text (main function)
export const getVideoContentAsText = async (videoId) => {
    // Get video details (for title, channel info)
    let videoDetails = null;
    try {
        videoDetails = await getVideoDetails(videoId);
    } catch (e) {
        console.warn('Could not fetch video details:', e);
        videoDetails = { id: videoId, title: '', channelTitle: '', description: '' };
    }

    // Try to get transcript from backend server
    const transcript = await fetchTranscript(videoId);

    if (transcript && transcript.text) {
        return {
            success: true,
            type: 'transcript',
            language: transcript.language,
            title: videoDetails.title,
            channelTitle: videoDetails.channelTitle,
            text: transcript.text,
            textWithTimestamps: transcript.textWithTimestamps,
            videoDetails
        };
    }

    // Fallback to description if no transcript available
    if (videoDetails.description && videoDetails.description.trim()) {
        return {
            success: true,
            type: 'description',
            title: videoDetails.title,
            channelTitle: videoDetails.channelTitle,
            text: `[영상 제목]\n${videoDetails.title}\n\n[채널]\n${videoDetails.channelTitle}\n\n[영상 설명]\n${videoDetails.description}`,
            videoDetails,
            warning: '자막을 찾을 수 없어 영상 설명을 가져왔습니다.'
        };
    }

    throw new Error('이 영상에서 자막이나 설명을 찾을 수 없습니다.');
};

// Format ISO 8601 duration to readable format
export const formatDuration = (isoDuration) => {
    if (!isoDuration) return '';
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

