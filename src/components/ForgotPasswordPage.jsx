import { useState } from 'react';
import { resetPassword } from '../firebase';
import './LoginPage.css';

function ForgotPasswordPage({ onBack, onSwitchToLogin }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err) {
            setError(getErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    const getErrorMessage = (code) => {
        const errorMessages = {
            'auth/user-not-found': '등록되지 않은 이메일입니다.',
            'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
            'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
        };
        return errorMessages[code] || code || '비밀번호 재설정 중 오류가 발생했습니다.';
    };

    if (success) {
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
                        <h1>이메일을 확인하세요</h1>
                        <p>
                            <strong>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.
                            <br />
                            이메일의 링크를 클릭하여 비밀번호를 재설정해주세요.
                        </p>
                    </div>

                    <div className="verification-actions">
                        <button
                            className="btn btn-primary"
                            onClick={onSwitchToLogin}
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
                    <h1>비밀번호 찾기</h1>
                    <p>가입한 이메일로 비밀번호 재설정 링크를 보내드립니다</p>
                </div>

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

                    <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                        {isLoading ? '전송 중...' : '비밀번호 재설정 링크 보내기'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        비밀번호가 기억나셨나요?{' '}
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

export default ForgotPasswordPage;
