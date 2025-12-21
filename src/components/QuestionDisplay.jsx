import { useState } from 'react';
import './QuestionDisplay.css';

function QuestionDisplay({ questions, onReset }) {
    // Current question index for navigation
    const [currentIndex, setCurrentIndex] = useState(0);

    // User's answers for each question { questionIndex: selectedOptionIndex or answer }
    const [userAnswers, setUserAnswers] = useState({});

    // Whether each question has been answered (locked)
    const [answeredQuestions, setAnsweredQuestions] = useState({});

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;

    // Navigate to previous question
    const goToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Navigate to next question
    const goToNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    // Handle option selection for multiple choice
    const handleOptionSelect = (optionIndex) => {
        // If already answered, don't allow changes
        if (answeredQuestions[currentIndex]) return;

        const selectedOption = currentQuestion.options[optionIndex];

        setUserAnswers(prev => ({
            ...prev,
            [currentIndex]: {
                selectedIndex: optionIndex,
                selectedValue: selectedOption,
                isCorrect: selectedOption === currentQuestion.answer
            }
        }));

        setAnsweredQuestions(prev => ({
            ...prev,
            [currentIndex]: true
        }));
    };

    // Handle answer for non-multiple choice (short answer, etc.)
    const handleTextAnswer = (value) => {
        if (answeredQuestions[currentIndex]) return;

        setUserAnswers(prev => ({
            ...prev,
            [currentIndex]: {
                selectedValue: value,
                isCorrect: value.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase()
            }
        }));
    };

    const submitTextAnswer = () => {
        if (!userAnswers[currentIndex]?.selectedValue) return;

        setAnsweredQuestions(prev => ({
            ...prev,
            [currentIndex]: true
        }));
    };

    // Get the current answer state
    const currentAnswerState = userAnswers[currentIndex];
    const isCurrentAnswered = answeredQuestions[currentIndex];

    // Calculate score
    const answeredCount = Object.keys(answeredQuestions).length;
    const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;

    // Get question type label
    const getTypeLabel = (type) => {
        const labels = {
            'multiple': '객관식',
            'short': '단답형',
            'essay': '서술형',
            'ox': 'O/X',
            'blank': '빈칸채우기'
        };
        return labels[type] || type;
    };

    // Format answer for display (handles O/X boolean)
    const formatAnswer = (answer, type) => {
        if (type === 'ox') {
            if (answer === true || answer === 'true' || answer === 'O') return 'O';
            if (answer === false || answer === 'false' || answer === 'X') return 'X';
        }
        return answer;
    };

    // Check if option is the correct answer
    const isCorrectOption = (option) => option === currentQuestion.answer;

    // Get option class based on state
    const getOptionClass = (option, optionIndex) => {
        if (!isCurrentAnswered) {
            return 'option-item';
        }

        const isSelected = currentAnswerState?.selectedIndex === optionIndex;
        const isCorrect = isCorrectOption(option);

        if (isCorrect) {
            return 'option-item correct';
        }
        if (isSelected && !isCorrect) {
            return 'option-item incorrect';
        }
        return 'option-item disabled';
    };

    return (
        <div className="question-display-container animate-fade-in">
            {/* Header with progress bars */}
            <div className="result-header">
                <div className="result-info">
                    <div className="result-icon-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22,4 12,14.01 9,11.01" />
                        </svg>
                    </div>
                    <div>
                        <h2>문제 풀이</h2>
                    </div>
                </div>

                {/* Progress Bars */}
                <div className="progress-bars">
                    <div className="progress-bar-item">
                        <div className="progress-bar-header">
                            <span className="progress-bar-label">진행률</span>
                            <span className="progress-bar-value">{answeredCount}/{totalQuestions}</span>
                        </div>
                        <div className="progress-bar-track">
                            <div
                                className="progress-bar-fill progress"
                                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                            />
                        </div>
                    </div>

                    {answeredCount > 0 && (
                        <div className="progress-bar-item">
                            <div className="progress-bar-header">
                                <span className="progress-bar-label">정답률</span>
                                <span className={`progress-bar-value ${correctCount === answeredCount ? 'perfect' : ''}`}>
                                    {correctCount}/{answeredCount} ({Math.round((correctCount / answeredCount) * 100)}%)
                                </span>
                            </div>
                            <div className="progress-bar-track">
                                <div
                                    className={`progress-bar-fill accuracy ${correctCount === answeredCount ? 'perfect' : ''}`}
                                    style={{ width: `${(correctCount / answeredCount) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="question-navigation">
                <button
                    className="nav-arrow nav-prev"
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,18 9,12 15,6" />
                    </svg>
                </button>

                <div className="question-indicator">
                    <span className="current-num">{currentIndex + 1}</span>
                    <span className="separator">/</span>
                    <span className="total-num">{totalQuestions}</span>
                </div>

                <button
                    className="nav-arrow nav-next"
                    onClick={goToNext}
                    disabled={currentIndex === totalQuestions - 1}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9,18 15,12 9,6" />
                    </svg>
                </button>
            </div>

            {/* Question Card */}
            <div className="question-card single-view">
                <div className="question-header">
                    <span className="question-number">Q{currentIndex + 1}</span>
                    <div className="question-type-badge">{getTypeLabel(currentQuestion.type)}</div>
                    {isCurrentAnswered && (
                        <div className={`answer-status ${currentAnswerState?.isCorrect ? 'correct' : 'incorrect'}`}>
                            {currentAnswerState?.isCorrect ? '정답!' : '오답'}
                        </div>
                    )}
                </div>

                <div className="question-content">
                    <p className={`question-text ${['ox', 'blank', 'essay', 'short'].includes(currentQuestion.type) ? 'ox-question-text' : ''}`}>{currentQuestion.question}</p>

                    {/* Multiple Choice Options */}
                    {currentQuestion.options && currentQuestion.options.length > 0 && (
                        <div className="question-options">
                            {currentQuestion.options.map((option, optIndex) => (
                                <button
                                    key={optIndex}
                                    className={getOptionClass(option, optIndex)}
                                    onClick={() => handleOptionSelect(optIndex)}
                                    disabled={isCurrentAnswered}
                                >
                                    <span className="option-label">
                                        {String.fromCharCode(65 + optIndex)}
                                    </span>
                                    <span className="option-text">{option}</span>
                                    {isCurrentAnswered && isCorrectOption(option) && (
                                        <span className="option-icon correct-icon">✓</span>
                                    )}
                                    {isCurrentAnswered && currentAnswerState?.selectedIndex === optIndex && !isCorrectOption(option) && (
                                        <span className="option-icon incorrect-icon">✗</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* O/X Question Buttons */}
                    {currentQuestion.type === 'ox' && (!currentQuestion.options || currentQuestion.options.length === 0) && (
                        <div className="ox-buttons">
                            <button
                                className={`ox-btn ox-o ${isCurrentAnswered ? (currentQuestion.answer === true || currentQuestion.answer === 'O' || currentQuestion.answer === 'true' ? 'correct' : currentAnswerState?.selectedValue === 'O' ? 'incorrect' : 'disabled') : ''}`}
                                onClick={() => {
                                    if (answeredQuestions[currentIndex]) return;
                                    const isCorrect = currentQuestion.answer === true || currentQuestion.answer === 'O' || currentQuestion.answer === 'true';
                                    setUserAnswers(prev => ({
                                        ...prev,
                                        [currentIndex]: { selectedValue: 'O', isCorrect }
                                    }));
                                    setAnsweredQuestions(prev => ({ ...prev, [currentIndex]: true }));
                                }}
                                disabled={isCurrentAnswered}
                            >
                                <span className="ox-symbol">O</span>
                                <span className="ox-label">맞다</span>
                            </button>
                            <button
                                className={`ox-btn ox-x ${isCurrentAnswered ? (currentQuestion.answer === false || currentQuestion.answer === 'X' || currentQuestion.answer === 'false' ? 'correct' : currentAnswerState?.selectedValue === 'X' ? 'incorrect' : 'disabled') : ''}`}
                                onClick={() => {
                                    if (answeredQuestions[currentIndex]) return;
                                    const isCorrect = currentQuestion.answer === false || currentQuestion.answer === 'X' || currentQuestion.answer === 'false';
                                    setUserAnswers(prev => ({
                                        ...prev,
                                        [currentIndex]: { selectedValue: 'X', isCorrect }
                                    }));
                                    setAnsweredQuestions(prev => ({ ...prev, [currentIndex]: true }));
                                }}
                                disabled={isCurrentAnswered}
                            >
                                <span className="ox-symbol">X</span>
                                <span className="ox-label">틀리다</span>
                            </button>
                        </div>
                    )}

                    {/* Short Answer / Essay Input */}
                    {currentQuestion.type !== 'ox' && (!currentQuestion.options || currentQuestion.options.length === 0) && (
                        <div className="text-answer-section">
                            <input
                                type="text"
                                className={`text-answer-input ${isCurrentAnswered ? (currentAnswerState?.isCorrect ? 'correct' : 'incorrect') : ''}`}
                                placeholder="정답을 입력하세요..."
                                value={currentAnswerState?.selectedValue || ''}
                                onChange={(e) => handleTextAnswer(e.target.value)}
                                disabled={isCurrentAnswered}
                            />
                            {!isCurrentAnswered && (
                                <button
                                    className="btn btn-primary submit-answer-btn"
                                    onClick={submitTextAnswer}
                                    disabled={!currentAnswerState?.selectedValue}
                                >
                                    제출
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Explanation Section - Shows after answering */}
                {isCurrentAnswered && (
                    <div className={`feedback-section animate-fade-in ${currentAnswerState?.isCorrect ? 'correct' : 'incorrect'}`}>
                        <div className="feedback-header">
                            <span className="feedback-icon">
                                {currentAnswerState?.isCorrect ? '🎉' : '💡'}
                            </span>
                            <span className="feedback-title">
                                {currentAnswerState?.isCorrect ? '정답입니다!' : '아쉽네요, 다시 확인해보세요.'}
                            </span>
                        </div>

                        {!currentAnswerState?.isCorrect && (
                            <div className="your-answer">
                                <span className="label">내가 선택한 답:</span>
                                <span className="value">{currentAnswerState?.selectedValue || '-'}</span>
                            </div>
                        )}

                        <div className="correct-answer">
                            <span className="label">정답:</span>
                            <span className="value">{formatAnswer(currentQuestion.answer, currentQuestion.type)}</span>
                        </div>

                        {currentQuestion.explanation && (
                            <div className="explanation-box">
                                <span className="explanation-label">해설</span>
                                <p className="explanation-text">{currentQuestion.explanation}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Progress Dots */}
            <div className="progress-dots">
                {questions.map((_, index) => (
                    <button
                        key={index}
                        className={`dot ${index === currentIndex ? 'active' : ''} ${answeredQuestions[index] ? (userAnswers[index]?.isCorrect ? 'correct' : 'incorrect') : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>

            {/* Bottom Actions */}
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
