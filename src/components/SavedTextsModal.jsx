import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSavedTexts, deleteText } from '../services/textStorage';
import './SavedTextsModal.css';

function SavedTextsModal({ isOpen, onClose, onSelectText }) {
    const [savedTexts, setSavedTexts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { user } = useAuth();

    useEffect(() => {
        if (isOpen && user) {
            loadTexts();
        }
    }, [isOpen, user]);

    const loadTexts = async () => {
        setIsLoading(true);
        setError('');

        try {
            const texts = await getSavedTexts(user.uid);
            setSavedTexts(texts);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectText = (savedText) => {
        onSelectText(savedText);
        onClose();
    };

    const handleDeleteText = async (textId, e) => {
        e.stopPropagation();
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await deleteText(user.uid, textId);
            setSavedTexts(prev => prev.filter(t => t.id !== textId));
        } catch (err) {
            alert('삭제에 실패했습니다: ' + err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="stm-overlay" onClick={onClose}>
            <div className="stm-modal" onClick={e => e.stopPropagation()}>
                <div className="stm-header">
                    <h3>📂 저장된 텍스트 불러오기</h3>
                    <button className="stm-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="stm-content">
                    {isLoading ? (
                        <div className="stm-loading">
                            <span className="spinner"></span>
                            <p>불러오는 중...</p>
                        </div>
                    ) : error ? (
                        <div className="stm-error">{error}</div>
                    ) : savedTexts.length === 0 ? (
                        <div className="stm-empty">
                            <span className="stm-empty-icon">📭</span>
                            <p>저장된 텍스트가 없습니다.</p>
                            <span className="stm-empty-hint">PDF나 YouTube에서 텍스트를 추출한 후 저장해보세요!</span>
                        </div>
                    ) : (
                        <div className="stm-list">
                            {savedTexts.map(item => (
                                <div
                                    key={item.id}
                                    className="stm-item"
                                    onClick={() => handleSelectText(item)}
                                >
                                    <div className="stm-item-info">
                                        <span className="stm-item-title">{item.title}</span>
                                        <span className="stm-item-meta">
                                            {item.content.length.toLocaleString()}자 · {item.updatedAt.toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                    <button
                                        className="stm-delete-btn"
                                        onClick={(e) => handleDeleteText(item.id, e)}
                                        title="삭제"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                            <polyline points="3,6 5,6 21,6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SavedTextsModal;
