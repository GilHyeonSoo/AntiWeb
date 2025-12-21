import { useState } from 'react';
import { signInWithGoogle, signInWithEmail } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

function LoginPage({ onBack, onSwitchToSignup, onSwitchToForgotPassword, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { isFirebaseConfigured } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signInWithEmail(email, password);
            onLoginSuccess?.();
            onBack();
        } catch (err) {
            setError(getErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);

        try {
            await signInWithGoogle();
            onLoginSuccess?.();
            onBack();
        } catch (err) {
            setError(getErrorMessage(err.code || err.message));
        } finally {
            setIsLoading(false);
        }
    };



    const getErrorMessage = (code) => {
        const errorMessages = {
            'auth/user-not-found': '등록되지 않은 이메일입니다.',
            'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
            'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
            'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
            'auth/popup-closed-by-user': '로그인 팝업이 닫혔습니다.',
            'auth/account-exists-with-different-credential': '이미 다른 방법으로 가입된 계정입니다.',
            'auth/configuration-not-found': 'Firebase에서 해당 로그인 방식이 활성화되지 않았습니다.',
            'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
        };
        return errorMessages[code] || code || '로그인 중 오류가 발생했습니다.';
    };

    return (
        <div className="auth-page animate-fade-in">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>로그인</h1>
                    <p>GenGen에 오신 것을 환영합니다</p>
                </div>

                {!isFirebaseConfigured && (
                    <div className="auth-warning">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>Firebase 설정이 필요합니다. .env 파일을 확인해주세요.</span>
                    </div>
                )}

                {error && (
                    <div className="auth-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Social Login Buttons */}
                <div className="social-login">
                    <button
                        type="button"
                        className="social-btn google-btn"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google로 로그인
                    </button>
                </div>

                <div className="auth-divider">
                    <span>또는</span>
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

                    <div className="forgot-password-link">
                        <button type="button" className="link-btn" onClick={onSwitchToForgotPassword}>
                            비밀번호를 잊으셨나요?
                        </button>
                    </div>

                    <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                        {isLoading ? '로그인 중...' : '이메일로 로그인'}
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

