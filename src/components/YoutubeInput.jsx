import { useState, useEffect, useCallback } from 'react';
import {
    extractVideoId,
    getVideoDetails,
    getVideoContentAsText,
    isYoutubeApiConfigured,
    checkBackendServer,
    formatDuration,
    formatSubtitleWithAI
} from '../services/youtubeApi';
import './YoutubeInput.css';

function YoutubeInput({ onSubmit, onBack }) {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingInfo, setIsFetchingInfo] = useState(false);
    const [error, setError] = useState('');
    const [videoInfo, setVideoInfo] = useState(null);
    const [apiConfigured] = useState(isYoutubeApiConfigured());
    const [backendAvailable, setBackendAvailable] = useState(null); // null = checking, true/false = result
    const [formatProgress, setFormatProgress] = useState(''); // 정리 진행 상태

    // Check backend server on mount
    useEffect(() => {
        const checkServer = async () => {
            const available = await checkBackendServer();
            setBackendAvailable(available);
        };
        checkServer();
    }, []);

    const validateYoutubeUrl = (url) => {
        const patterns = [
            /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/
        ];
        return patterns.some(pattern => pattern.test(url));
    };

    // Fetch video info when URL changes
    const fetchVideoInfo = useCallback(async (videoId) => {
        if (!apiConfigured) return;

        setIsFetchingInfo(true);
        try {
            const details = await getVideoDetails(videoId);
            setVideoInfo(details);
            setError('');
        } catch (err) {
            setVideoInfo(null);
            // Don't show error for info fetch, just clear the info
            console.warn('Video info fetch failed:', err);
        } finally {
            setIsFetchingInfo(false);
        }
    }, [apiConfigured]);

    useEffect(() => {
        const videoId = extractVideoId(url);
        if (videoId && validateYoutubeUrl(url)) {
            fetchVideoInfo(videoId);
        } else {
            setVideoInfo(null);
        }
    }, [url, fetchVideoInfo]);

    const handleSubmit = async () => {
        setError('');

        if (!url.trim()) {
            setError('유튜브 링크를 입력해주세요');
            return;
        }

        if (!validateYoutubeUrl(url)) {
            setError('올바른 유튜브 링크를 입력해주세요');
            return;
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            setError('영상 ID를 추출할 수 없습니다');
            return;
        }

        setIsLoading(true);
        setFormatProgress('');

        try {
            let rawText = '';

            if (apiConfigured) {
                // Use YouTube API to get content
                setFormatProgress('자막 추출 중...');
                const result = await getVideoContentAsText(videoId);

                rawText = result.text;

                // Add warning if using description fallback
                if (result.warning) {
                    rawText = `⚠️ ${result.warning}\n\n${rawText}`;
                }
            } else {
                // Fallback mock data when API is not configured
                rawText = `안녕하세요, 오늘은 인공지능의 기초에 대해 알아보겠습니다.

인공지능, 줄여서 AI라고 하는데요, 이것은 컴퓨터가 인간처럼 생각하고 학습할 수 있게 만드는 기술입니다.

머신러닝은 AI의 한 분야로, 데이터를 통해 패턴을 학습합니다. 예를 들어, 수많은 고양이 사진을 보여주면 컴퓨터가 스스로 고양이의 특징을 학습하게 됩니다.

딥러닝은 머신러닝의 한 종류로, 인간의 뇌처럼 동작하는 인공 신경망을 사용합니다. 특히 이미지 인식, 음성 인식, 자연어 처리 분야에서 뛰어난 성능을 보여줍니다.

GPT와 같은 대규모 언어 모델은 수백억 개의 문장을 학습하여 인간과 유사한 텍스트를 생성할 수 있습니다.

다음 시간에는 머신러닝의 세 가지 유형인 지도학습, 비지도학습, 강화학습에 대해 자세히 알아보겠습니다.`;
            }

            // Always apply AI formatting when backend is available
            if (backendAvailable) {
                setFormatProgress('AI가 자막을 정리하는 중...');
                const formatResult = await formatSubtitleWithAI(rawText);

                if (formatResult.success) {
                    onSubmit(formatResult.formattedText);
                } else {
                    // If formatting fails, use raw text
                    console.warn('AI formatting failed, using raw text');
                    onSubmit(rawText);
                }
            } else {
                onSubmit(rawText);
            }
        } catch (err) {
            setError(err.message || '텍스트 추출에 실패했습니다');
        } finally {
            setIsLoading(false);
            setFormatProgress('');
        }
    };

    const videoId = extractVideoId(url);

    return (
        <div className="youtube-input-container animate-fade-in">
            <div className="youtube-header">
                <button className="btn btn-secondary back-btn" onClick={onBack}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,18 9,12 15,6" />
                    </svg>
                    뒤로
                </button>
                <div className="youtube-title">
                    <div className="youtube-icon-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                            <polygon points="9.75,15.02 15.5,11.75 9.75,8.48" />
                        </svg>
                    </div>
                    <h2>유튜브 영상 텍스트 추출</h2>
                    <p>유튜브 영상의 자막을 텍스트로 추출합니다</p>
                </div>
            </div>

            {/* Backend Server Status */}
            {backendAvailable === false && (
                <div className="api-warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>자막 서버가 실행되지 않았습니다. <code>cd server && npm start</code>로 서버를 시작해주세요.</span>
                </div>
            )}

            {backendAvailable === true && (
                <div className="api-success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>자막이 있는 영상만 가능합니다</span>
                </div>
            )}

            <div className="url-input-section">
                <label className="input-label">유튜브 링크</label>
                <div className="url-input-wrapper">
                    <input
                        type="url"
                        className="input url-input"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            setError('');
                        }}
                        disabled={isLoading}
                    />
                    {url && (
                        <button
                            className="clear-btn"
                            onClick={() => {
                                setUrl('');
                                setVideoInfo(null);
                            }}
                            aria-label="입력 지우기"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>

                {error && (
                    <div className="input-error animate-fade-in">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {videoId && (
                <div className="video-preview animate-fade-in">
                    <div className="preview-label">
                        {isFetchingInfo ? '정보 로딩 중...' : '미리보기'}
                    </div>
                    <div className="video-preview-content">
                        <div className="video-thumbnail">
                            <img
                                src={videoInfo?.thumbnails?.high?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                alt="영상 썸네일"
                                onError={(e) => {
                                    e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                }}
                            />
                            <div className="play-overlay">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                            </div>
                            {videoInfo?.duration && (
                                <div className="video-duration">
                                    {formatDuration(videoInfo.duration)}
                                </div>
                            )}
                        </div>
                        {videoInfo && (
                            <div className="video-details">
                                <h3 className="video-title">{videoInfo.title}</h3>
                                <p className="video-channel">{videoInfo.channelTitle}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="youtube-actions">
                <button
                    className="btn btn-primary btn-lg extract-btn"
                    onClick={handleSubmit}
                    disabled={!url.trim() || isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner" />
                            {formatProgress || '처리 중...'}
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            텍스트 추출하기
                        </>
                    )}
                </button>
            </div>

            <div className="youtube-tips">
                <h4>💡 팁</h4>
                <ul>
                    <li>자막이 있는 영상에서 더 정확한 결과를 얻을 수 있습니다</li>
                    <li>자막이 없는 경우 영상 설명이 대신 추출됩니다</li>
                    <li>AI 정리 기능을 사용하면 자막이 읽기 쉽게 정리됩니다</li>
                </ul>
            </div>
        </div>
    );
}

export default YoutubeInput;

