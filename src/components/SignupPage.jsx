import { useState } from 'react';
import { signUpWithEmail, signInWithGoogle, resendVerificationEmail, logOut } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

function SignupPage({ onBack, onSwitchToLogin, onSignupSuccess }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [signupComplete, setSignupComplete] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const { isFirebaseConfigured } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (password.length < 6) {
            setError('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        setIsLoading(true);

        try {
            await signUpWithEmail(email, password, name);
            setSignupComplete(true);
        } catch (err) {
            setError(getErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        setIsLoading(true);

        try {
            await signInWithGoogle();
            onSignupSuccess?.();
            onBack();
        } catch (err) {
            setError(getErrorMessage(err.code || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setResendMessage('');
        setIsLoading(true);
        try {
            await resendVerificationEmail();
            setResendMessage('인증 이메일이 다시 발송되었습니다.');
        } catch (err) {
            setResendMessage('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = async () => {
        await logOut();
        onSwitchToLogin();
    };

    const getErrorMessage = (code) => {
        const errorMessages = {
            'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
            'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
            'auth/weak-password': '비밀번호가 너무 약합니다.',
            'auth/popup-closed-by-user': '가입 팝업이 닫혔습니다.',
            'auth/account-exists-with-different-credential': '이미 다른 방법으로 가입된 계정입니다.',
            'auth/configuration-not-found': 'Firebase에서 해당 로그인 방식이 활성화되지 않았습니다.',
        };
        return errorMessages[code] || code || '회원가입 중 오류가 발생했습니다.';
    };

    // Show email verification message after successful signup
    if (signupComplete) {
        return (
            <div className="auth-page animate-fade-in">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="verification-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </div>
                        <h1>이메일 인증이 필요합니다</h1>
                        <p>
                            <strong>{email}</strong>로 인증 이메일을 발송했습니다.
                            <br />
                            이메일의 링크를 클릭하여 인증을 완료해주세요.
                        </p>
                    </div>

                    {resendMessage && (
                        <div className={resendMessage.includes('실패') ? 'auth-error' : 'auth-success'}>
                            <span>{resendMessage}</span>
                        </div>
                    )}

                    <div className="verification-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={handleResendEmail}
                            disabled={isLoading}
                        >
                            {isLoading ? '발송 중...' : '인증 이메일 다시 보내기'}
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleBackToLogin}
                        >
                            로그인 페이지로 이동
                        </button>
                    </div>

                    <p className="verification-note">
                        이메일이 보이지 않으면 스팸 폴더를 확인해주세요.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page animate-fade-in">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>회원가입</h1>
                    <p>GenGen과 함께 시작하세요</p>
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

                {/* Social Signup Buttons */}
                <div className="social-login">
                    <button
                        type="button"
                        className="social-btn google-btn"
                        onClick={handleGoogleSignup}
                        disabled={isLoading}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google로 가입
                    </button>
                </div>

                <div className="auth-divider">
                    <span>또는</span>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">이름</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="홍길동"
                            required
                        />
                    </div>

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
                            placeholder="최소 6자 이상"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">비밀번호 확인</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="비밀번호를 다시 입력하세요"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                        {isLoading ? '가입 중...' : '이메일로 가입'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        이미 계정이 있으신가요?{' '}
                        <button className="link-btn" onClick={onSwitchToLogin}>로그인</button>
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

export default SignupPage;
