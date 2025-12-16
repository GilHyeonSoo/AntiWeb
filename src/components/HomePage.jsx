import './HomePage.css';

function HomePage({ onSelectMode }) {
    const modes = [
        {
            id: 'pdf',
            title: 'PDF 텍스트 추출',
            description: 'PDF, DOCX 파일을 업로드하여 시험 문제를 생성합니다',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                </svg>
            ),
            color: '#ef4444',
            bgColor: '#fef2f2'
        },
        {
            id: 'youtube',
            title: '유튜브 텍스트 추출',
            description: '유튜브 영상의 음성을 텍스트로 변환하여 문제를 생성합니다',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75,15.02 15.5,11.75 9.75,8.48" />
                </svg>
            ),
            color: '#dc2626',
            bgColor: '#fef2f2'
        },
        {
            id: 'suneung',
            title: '수능 연습문제',
            description: '과목별 수능 스타일 연습문제를 풀어봅니다',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <path d="M8 7h8" />
                    <path d="M8 11h8" />
                    <path d="M8 15h4" />
                </svg>
            ),
            color: '#4361ee',
            bgColor: '#e8ecfd'
        }
    ];

    return (
        <div className="homepage animate-fade-in">
            <div className="hero-section">
                <h1 className="hero-title">
                    AI로 만드는<br />
                    <span className="gradient-text">스마트 시험 문제</span>
                </h1>
                <p className="hero-description">
                    PDF, 유튜브 영상에서 텍스트를 추출하고<br />
                    AI가 맞춤형 시험 문제를 생성합니다
                </p>
            </div>

            <div className="mode-cards">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        className="mode-card"
                        onClick={() => onSelectMode(mode.id)}
                        style={{ '--mode-color': mode.color, '--mode-bg': mode.bgColor }}
                    >
                        <div className="mode-icon">
                            {mode.icon}
                        </div>
                        <div className="mode-content">
                            <h3 className="mode-title">{mode.title}</h3>
                            <p className="mode-description">{mode.description}</p>
                        </div>
                        <div className="mode-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9,18 15,12 9,6" />
                            </svg>
                        </div>
                    </button>
                ))}
            </div>

            <div className="features-section">
                <h2>주요 기능</h2>
                <div className="features-grid">
                    <div className="feature-item">
                        <div className="feature-icon">📄</div>
                        <h4>다양한 형식 지원</h4>
                        <p>PDF, DOCX, 유튜브 영상 등 다양한 소스에서 텍스트 추출</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">✏️</div>
                        <h4>텍스트 편집</h4>
                        <p>추출된 텍스트를 직접 수정하여 원하는 내용만 선택</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">🎯</div>
                        <h4>문제 유형 선택</h4>
                        <p>객관식, 단답형, 서술형 중 원하는 형식 선택</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">🤖</div>
                        <h4>AI 문제 생성</h4>
                        <p>GPT 기반 AI가 고품질 시험 문제를 자동 생성</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
