import { useState } from 'react';
import './LoginPage.css';

function LoginPage({ onBack, onSwitchToSignup }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        alert('로그인 기능은 백엔드 연동 후 사용 가능합니다.');
    };

    return (
        <div className="auth-page animate-fade-in">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>로그인</h1>
                    <p>GenGen에 오신 것을 환영합니다</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        계정이 없으신가요?{' '}
                        <button className="link-btn" onClick={onSwitchToSignup}>회원가입</button>
                    </p>
                </div>

                <button className="back-btn" onClick={onBack}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,18 9,12 15,6" />
                    </svg>
                    홈으로 돌아가기
                </button>
            </div>
        </div>
    );
}

export default LoginPage;
