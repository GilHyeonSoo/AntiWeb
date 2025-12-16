import './QuestionTypeSelector.css';

function QuestionTypeSelector({ onSelect, onBack }) {
    const questionTypes = [
        {
            id: 'multiple',
            title: '객관식',
            description: '4~5개의 보기 중 정답을 선택하는 문제',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
            ),
            examples: ['다음 중 올바른 것은?', '밑줄 친 부분과 의미가 같은 것은?']
        },
        {
            id: 'short',
            title: '단답형',
            description: '짧은 단어나 문장으로 답하는 문제',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 10H3" />
                    <path d="M21 6H3" />
                    <path d="M21 14H3" />
                    <path d="M17 18H3" />
                </svg>
            ),
            examples: ['위 글의 제목으로 적절한 것은?', '빈칸에 들어갈 단어를 쓰시오.']
        },
        {
            id: 'essay',
            title: '서술형',
            description: '자세한 설명이나 논술이 필요한 문제',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
            ),
            examples: ['위 내용을 요약하시오.', '본인의 의견을 서술하시오.']
        }
    ];

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
                    <h2>문제 유형 선택</h2>
                    <p>생성할 문제의 유형을 선택하세요</p>
                </div>
            </div>

            <div className="type-cards">
                {questionTypes.map((type) => (
                    <button
                        key={type.id}
                        className="type-card"
                        onClick={() => onSelect(type.id)}
                    >
                        <div className="type-card-header">
                            <div className="type-icon">
                                {type.icon}
                            </div>
                            <div className="type-info">
                                <h3 className="type-name">{type.title}</h3>
                                <p className="type-desc">{type.description}</p>
                            </div>
                        </div>
                        <div className="type-examples">
                            <span className="examples-label">예시:</span>
                            <ul>
                                {type.examples.map((example, idx) => (
                                    <li key={idx}>"{example}"</li>
                                ))}
                            </ul>
                        </div>
                        <div className="type-select-indicator">
                            <span>선택</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9,18 15,12 9,6" />
                            </svg>
                        </div>
                    </button>
                ))}
            </div>

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
