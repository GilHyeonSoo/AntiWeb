import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Helper function to fetch URL content
const fetchUrl = (url) => {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const urlObj = new URL(url);

        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        };

        protocol.get(options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }

            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'GenGen API Server is running' });
});

// Extract caption tracks from YouTube page
const extractCaptionTracks = (html) => {
    try {
        const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})(?:;|<\/script>)/s);
        if (playerResponseMatch) {
            const playerData = JSON.parse(playerResponseMatch[1]);
            const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (captionTracks && captionTracks.length > 0) {
                return captionTracks;
            }
        }
        return null;
    } catch (e) {
        console.error('Error parsing caption tracks:', e.message);
        return null;
    }
};

// Parse transcript - handles both XML and JSON3 formats
const parseTranscript = (data) => {
    const segments = [];

    // Try XML format first
    const xmlRegex = /<text start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    let match;
    while ((match = xmlRegex.exec(data)) !== null) {
        const text = decodeHtmlEntities(match[2]).trim();
        if (text) {
            segments.push({
                text,
                startMs: Math.floor(parseFloat(match[1]) * 1000)
            });
        }
    }

    if (segments.length > 0) return segments;

    // Try JSON3 format
    try {
        const json = JSON.parse(data);
        if (json.events) {
            for (const event of json.events) {
                if (event.segs) {
                    const text = event.segs.map(s => s.utf8 || '').join('').trim();
                    if (text) {
                        segments.push({
                            text,
                            startMs: event.tStartMs || 0
                        });
                    }
                }
            }
        }
    } catch (e) {
        // Not JSON format
    }

    return segments;
};

const decodeHtmlEntities = (text) => {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\\n/g, ' ')
        .replace(/<[^>]+>/g, '');
};

// YouTube 자막 가져오기 API
app.get('/api/transcript/:videoId', async (req, res) => {
    const { videoId } = req.params;
    const preferredLang = req.query.lang || 'ko';

    if (!videoId) {
        return res.status(400).json({ success: false, error: '영상 ID가 필요합니다.' });
    }

    try {
        console.log(`\n=== Fetching transcript: ${videoId} ===`);

        const html = await fetchUrl(`https://www.youtube.com/watch?v=${videoId}`);

        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : '';

        const captionTracks = extractCaptionTracks(html);

        if (!captionTracks || captionTracks.length === 0) {
            return res.status(404).json({
                success: false,
                error: '이 영상에서 자막을 찾을 수 없습니다.'
            });
        }

        console.log('Caption tracks:', captionTracks.map(t => t.languageCode));

        // Select track
        let selectedTrack = captionTracks.find(t => t.languageCode === preferredLang) ||
            captionTracks.find(t => t.languageCode === 'ko') ||
            captionTracks.find(t => t.languageCode === 'en') ||
            captionTracks[0];

        if (!selectedTrack?.baseUrl) {
            return res.status(404).json({ success: false, error: '자막 URL을 찾을 수 없습니다.' });
        }

        console.log('Selected:', selectedTrack.languageCode, '- URL length:', selectedTrack.baseUrl.length);

        // Fetch and parse transcript
        const captionData = await fetchUrl(selectedTrack.baseUrl);
        console.log('Caption data length:', captionData.length, '- Preview:', captionData.substring(0, 100));

        const segments = parseTranscript(captionData);
        console.log('Parsed segments:', segments.length);

        if (segments.length === 0) {
            // Try with fmt=json3
            const json3Data = await fetchUrl(selectedTrack.baseUrl + '&fmt=json3');
            const json3Segments = parseTranscript(json3Data);
            console.log('JSON3 segments:', json3Segments.length);

            if (json3Segments.length > 0) {
                segments.push(...json3Segments);
            }
        }

        if (segments.length === 0) {
            return res.status(404).json({ success: false, error: '자막 데이터를 파싱할 수 없습니다.' });
        }

        const fullText = segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim();

        const textWithTimestamps = segments.map(s => {
            const sec = Math.floor(s.startMs / 1000);
            const m = Math.floor(sec / 60);
            const ss = sec % 60;
            return `[${m}:${ss.toString().padStart(2, '0')}] ${s.text}`;
        }).join('\n');

        console.log(`✅ Success: ${segments.length} segments, ${fullText.length} chars`);

        res.json({
            success: true,
            videoId,
            title,
            language: selectedTrack.languageCode,
            text: fullText,
            textWithTimestamps,
            segments: segments.length
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 GenGen API Server running on http://localhost:${PORT}`);
    console.log(`📝 Transcript API: GET /api/transcript/:videoId`);
});
