import { useState } from 'react';
import { changePassword } from '../firebase';
import './ChangePasswordModal.css';

function ChangePasswordModal({ isOpen, onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 6) {
            setError('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        if (currentPassword === newPassword) {
            setError('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
            return;
        }

        setIsLoading(true);

        try {
            await changePassword(currentPassword, newPassword);
            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err) {
            setError(getErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    const getErrorMessage = (code) => {
        const errorMessages = {
            'auth/wrong-password': '현재 비밀번호가 올바르지 않습니다.',
            'auth/weak-password': '새 비밀번호가 너무 약합니다.',
            'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
            'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',
        };
        return errorMessages[code] || code || '비밀번호 변경 중 오류가 발생했습니다.';
    };

    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="modal-header">
                    <h2>비밀번호 변경</h2>
                    <p>보안을 위해 정기적으로 비밀번호를 변경해주세요</p>
                </div>

                {success ? (
                    <div className="auth-success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>비밀번호가 성공적으로 변경되었습니다!</span>
                    </div>
                ) : (
                    <>
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
                                <label htmlFor="currentPassword">현재 비밀번호</label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="현재 비밀번호를 입력하세요"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword">새 비밀번호</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="새 비밀번호 (최소 6자)"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="새 비밀번호를 다시 입력하세요"
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={handleClose}>
                                    취소
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    {isLoading ? '변경 중...' : '비밀번호 변경'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default ChangePasswordModal;
