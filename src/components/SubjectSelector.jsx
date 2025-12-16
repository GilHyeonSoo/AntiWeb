import './SubjectSelector.css';

function SubjectSelector({ onSelect, onBack }) {
    const subjects = [
        {
            id: 'korean',
            name: '국어',
            icon: '📚',
            color: '#8b5cf6',
            bgColor: '#f3e8ff',
            subItems: ['독서', '문학', '언어와 매체', '화법과 작문']
        },
        {
            id: 'math',
            name: '수학',
            icon: '🔢',
            color: '#3b82f6',
            bgColor: '#dbeafe',
            subItems: ['수학Ⅰ', '수학Ⅱ', '미적분', '확률과 통계', '기하']
        },
        {
            id: 'english',
            name: '영어',
            icon: '🌍',
            color: '#10b981',
            bgColor: '#d1fae5',
            subItems: ['듣기', '읽기', '어법', '어휘']
        },
        {
            id: 'history',
            name: '한국사',
            icon: '🏛️',
            color: '#f59e0b',
            bgColor: '#fef3c7',
            subItems: ['전근대사', '근현대사']
        },
        {
            id: 'exploration',
            name: '탐구',
            icon: '🔬',
            color: '#ef4444',
            bgColor: '#fee2e2',
            subItems: ['사회탐구', '과학탐구', '직업탐구']
        },
        {
            id: 'foreign',
            name: '제2외국어/한문',
            icon: '🗣️',
            color: '#6366f1',
            bgColor: '#e0e7ff',
            subItems: ['일본어', '중국어', '프랑스어', '독일어', '한문']
        }
    ];

    return (
        <div className="subject-selector-container animate-fade-in">
            <div className="subject-header">
                <button className="btn btn-secondary back-btn" onClick={onBack}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,18 9,12 15,6" />
                    </svg>
                    뒤로
                </button>
                <div className="subject-title">
                    <div className="subject-icon-wrapper">
                        <span>📝</span>
                    </div>
                    <h2>수능 연습문제</h2>
                    <p>연습할 과목을 선택하세요</p>
                </div>
            </div>

            <div className="subjects-grid">
                {subjects.map((subject) => (
                    <button
                        key={subject.id}
                        className="subject-card"
                        onClick={() => onSelect(subject.id)}
                        style={{ '--subject-color': subject.color, '--subject-bg': subject.bgColor }}
                    >
                        <div className="subject-emoji">{subject.icon}</div>
                        <h3 className="subject-name">{subject.name}</h3>
                        <div className="subject-sub-items">
                            {subject.subItems.slice(0, 3).map((item, idx) => (
                                <span key={idx} className="sub-item">{item}</span>
                            ))}
                            {subject.subItems.length > 3 && (
                                <span className="sub-item more">+{subject.subItems.length - 3}</span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            <div className="subject-info">
                <div className="info-card">
                    <div className="info-icon">🎯</div>
                    <div className="info-content">
                        <h4>수능 스타일 문제</h4>
                        <p>실제 수능 시험과 유사한 형식의 문제가 제공됩니다</p>
                    </div>
                </div>
                <div className="info-card">
                    <div className="info-icon">📊</div>
                    <div className="info-content">
                        <h4>난이도 선택</h4>
                        <p>쉬움, 보통, 어려움 중 원하는 난이도를 선택할 수 있습니다</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SubjectSelector;
