import { useState } from 'react';
import './QuestionTypeSelector.css';

function QuestionTypeSelector({ onSelect, onBack, isLoading, textLength = 1000 }) {
    const [selectedType, setSelectedType] = useState(null);
    const [questionCount, setQuestionCount] = useState(5);

    // Calculate recommended question count based on text length
    const getRecommendation = () => {
        if (textLength < 500) return { max: 5, recommended: 3, warning: '텍스트가 짧아 문제 품질이 낮을 수 있습니다.' };
        if (textLength < 1500) return { max: 10, recommended: 5, warning: null };
        if (textLength < 3000) return { max: 15, recommended: 10, warning: null };
        return { max: 20, recommended: 10, warning: null };
    };

    const { max, recommended, warning } = getRecommendation();
    const countOptions = [3, 5, 10, 15].filter(c => c <= max);

    const questionTypes = [
        {
            id: 'multiple',
            title: '객관식',
            description: '4~5개의 보기 중 정답 선택',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
            )
        },
        {
            id: 'short',
            title: '단답형',
            description: '짧은 단어나 문장으로 답변',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 10H3" />
                    <path d="M21 6H3" />
                    <path d="M21 14H3" />
                    <path d="M17 18H3" />
                </svg>
            )
        },
        {
            id: 'ox',
            title: 'O/X',
            description: '참/거짓 판단',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="12" r="5" />
                    <path d="M17 7l4 10M21 7l-4 10" />
                </svg>
            )
        },
        {
            id: 'blank',
            title: '빈칸채우기',
            description: '빈칸에 알맞은 답',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M7 15h4M13 15h4" />
                    <path d="M9 9h6" strokeDasharray="2 2" />
                </svg>
            )
        },
        {
            id: 'essay',
            title: '서술형',
            description: '자세한 설명 필요',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            )
        }
    ];

    const handleTypeSelect = (typeId) => {
        setSelectedType(typeId);
    };

    const handleConfirm = () => {
        if (selectedType) {
            onSelect(selectedType, questionCount);
        }
    };

    return (
        <div className="question-type-container animate-fade-in">
            <div className="type-header">
                <button className="btn btn-secondary back-btn" onClick={onBack}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,18 9,12 15,6" />
                    </svg>
                    뒤로
                </button>
                <div className="type-title">
                    <h2>문제 설정</h2>
                    <p>유형과 문제 수를 선택하세요</p>
                </div>
            </div>

            {/* Question Type Selection */}
            <div className="section-label">문제 유형</div>
            <div className="type-cards compact">
                {questionTypes.map((type) => (
                    <button
                        key={type.id}
                        className={`type-card-compact ${selectedType === type.id ? 'selected' : ''}`}
                        onClick={() => handleTypeSelect(type.id)}
                    >
                        <div className="type-icon-small">
                            {type.icon}
                        </div>
                        <div className="type-info-compact">
                            <span className="type-name">{type.title}</span>
                            <span className="type-desc-compact">{type.description}</span>
                        </div>
                        {selectedType === type.id && (
                            <div className="selected-check">✓</div>
                        )}
                    </button>
                ))}
            </div>

            {/* Question Count Selection */}
            <div className="section-label">문제 수</div>
            <div className="count-selector">
                {countOptions.map((count) => (
                    <button
                        key={count}
                        className={`count-btn ${questionCount === count ? 'selected' : ''} ${count === recommended ? 'recommended' : ''}`}
                        onClick={() => setQuestionCount(count)}
                    >
                        <span className="count-num">{count}</span>
                        <span className="count-label">문제</span>
                        {count === recommended && <span className="recommended-badge">추천</span>}
                    </button>
                ))}
            </div>

            {/* Warning if text is short */}
            {warning && (
                <div className="text-warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>{warning}</span>
                </div>
            )}

            {/* Confirm Button */}
            <button
                className="btn btn-primary btn-lg confirm-btn"
                onClick={handleConfirm}
                disabled={!selectedType || isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="spinner"></span>
                        문제 생성 중...
                    </>
                ) : (
                    <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22,4 12,14.01 9,11.01" />
                        </svg>
                        {selectedType ? `${questionCount}문제 생성하기` : '유형을 선택하세요'}
                    </>
                )}
            </button>

            <div className="type-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                </svg>
                <span>선택한 유형에 맞는 문제가 AI에 의해 자동으로 생성됩니다</span>
            </div>
        </div>
    );
}

export default QuestionTypeSelector;
