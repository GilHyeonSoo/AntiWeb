import { useState } from 'react';
import './QuestionDisplay.css';

function QuestionDisplay({ questions, onReset }) {
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const [showAllAnswers, setShowAllAnswers] = useState(false);

    const toggleAnswer = (index) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const toggleAllAnswers = () => {
        if (showAllAnswers) {
            setExpandedQuestions({});
        } else {
            const allExpanded = {};
            questions.forEach((_, index) => {
                allExpanded[index] = true;
            });
            setExpandedQuestions(allExpanded);
        }
        setShowAllAnswers(!showAllAnswers);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCopyAll = async () => {
        const text = questions.map((q, i) =>
            `${i + 1}. ${q.question}\n답: ${q.answer}${q.explanation ? `\n해설: ${q.explanation}` : ''}`
        ).join('\n\n');

        try {
            await navigator.clipboard.writeText(text);
            // Could add a toast notification here
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="question-display-container animate-fade-in">
            <div className="result-header">
                <div className="result-info">
                    <div className="result-icon-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22,4 12,14.01 9,11.01" />
                        </svg>
                    </div>
                    <div>
                        <h2>문제 생성 완료!</h2>
                        <p>총 <strong>{questions.length}개</strong>의 문제가 생성되었습니다</p>
                    </div>
                </div>

                <div className="result-actions">
                    <button className="btn btn-secondary" onClick={toggleAllAnswers}>
                        {showAllAnswers ? (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                                정답 숨기기
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                정답 모두 보기
                            </>
                        )}
                    </button>
                    <button className="btn btn-secondary" onClick={handleCopyAll}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        복사
                    </button>
                    <button className="btn btn-secondary print-btn" onClick={handlePrint}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6,9 6,2 18,2 18,9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        인쇄
                    </button>
                </div>
            </div>

            <div className="questions-list">
                {questions.map((q, index) => (
                    <div
                        key={index}
                        className={`question-card ${expandedQuestions[index] ? 'expanded' : ''}`}
                    >
                        <div className="question-header">
                            <span className="question-number">{index + 1}</span>
                            <div className="question-type-badge">
                                {q.type === 'multiple' ? '객관식' : q.type === 'short' ? '단답형' : '서술형'}
                            </div>
                        </div>

                        <div className="question-content">
                            <p className="question-text">{q.question}</p>

                            {q.options && (
                                <div className="question-options">
                                    {q.options.map((option, optIndex) => (
                                        <div
                                            key={optIndex}
                                            className={`option-item ${expandedQuestions[index] && option === q.answer ? 'correct' : ''}`}
                                        >
                                            <span className="option-label">
                                                {String.fromCharCode(65 + optIndex)}
                                            </span>
                                            <span className="option-text">{option}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            className="answer-toggle"
                            onClick={() => toggleAnswer(index)}
                        >
                            {expandedQuestions[index] ? (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="18,15 12,9 6,15" />
                                    </svg>
                                    정답 숨기기
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6,9 12,15 18,9" />
                                    </svg>
                                    정답 보기
                                </>
                            )}
                        </button>

                        {expandedQuestions[index] && (
                            <div className="answer-section animate-fade-in">
                                <div className="answer-box">
                                    <span className="answer-label">정답</span>
                                    <span className="answer-text">{q.answer}</span>
                                </div>
                                {q.explanation && (
                                    <div className="explanation-box">
                                        <span className="explanation-label">해설</span>
                                        <p className="explanation-text">{q.explanation}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="bottom-actions">
                <button className="btn btn-primary btn-lg" onClick={onReset}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="1,4 1,10 7,10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    새로운 문제 생성하기
                </button>
            </div>
        </div>
    );
}

export default QuestionDisplay;
