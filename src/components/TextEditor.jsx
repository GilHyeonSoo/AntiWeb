import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from '../contexts/AuthContext';
import { saveText } from '../services/textStorage';
import './TextEditor.css';

function TextEditor({ extractedText, onBack, onNext }) {
    const [text, setText] = useState(extractedText);
    const [viewMode, setViewMode] = useState('edit');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fontSize, setFontSize] = useState(16);

    // Save states
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveTitle, setSaveTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const { user } = useAuth();

    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    const handleNext = () => {
        if (!text.trim()) return;
        onNext(text);
    };

    const adjustFontSize = (delta) => {
        setFontSize(prev => Math.min(24, Math.max(12, prev + delta)));
    };

    // Save text to Firestore
    const handleSave = async () => {
        if (!saveTitle.trim()) {
            setSaveError('제목을 입력해주세요.');
            return;
        }
        if (!text.trim()) {
            setSaveError('저장할 내용이 없습니다.');
            return;
        }

        setIsSaving(true);
        setSaveError('');

        try {
            await saveText(user.uid, saveTitle, text);
            setShowSaveModal(false);
            setSaveTitle('');
            alert('저장되었습니다!');
        } catch (error) {
            setSaveError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const charCount = text.length;

    return (
        <div className={`text-editor-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}>
            {/* Back Button Row - Hidden in fullscreen */}
            {!isFullscreen && (
                <div className="te-back-row">
                    <button className="btn btn-secondary back-btn" onClick={onBack}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        <span>뒤로</span>
                    </button>
                </div>
            )}

            {/* Title */}
            <div className="te-title-row">
            </div>

            {/* Toolbar */}
            <div className="te-toolbar">
                <div className="te-toolbar-left">
                    <button
                        className={`te-mode-btn ${viewMode === 'edit' ? 'active' : ''}`}
                        onClick={() => setViewMode('edit')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        편집
                    </button>
                    <button
                        className={`te-mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
                        onClick={() => setViewMode('preview')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        미리보기
                    </button>
                    {user && (
                        <button
                            className="te-save-toolbar-btn"
                            onClick={() => setShowSaveModal(true)}
                            title="저장하기"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17,21 17,13 7,13 7,21" />
                                <polyline points="7,3 7,8 15,8" />
                            </svg>
                            저장
                        </button>
                    )}
                </div>
                <div className="te-toolbar-center">
                    <button onClick={() => adjustFontSize(-2)} disabled={fontSize <= 12}>−</button>
                    <span>{fontSize}px</span>
                    <button onClick={() => adjustFontSize(2)} disabled={fontSize >= 24}>+</button>
                </div>
                <div className="te-toolbar-right">
                    <span>{charCount.toLocaleString()} 글자</span>
                    <span>•</span>
                    <span>{wordCount.toLocaleString()} 단어</span>
                    <button
                        className="te-fullscreen-btn"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        title="전체화면"
                    >
                        ⛶
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="te-editor-area">
                {viewMode === 'edit' ? (
                    <textarea
                        className="te-textarea"
                        value={text}
                        onChange={handleTextChange}
                        placeholder="텍스트가 여기에 표시됩니다..."
                        style={{ fontSize: `${fontSize}px` }}
                    />
                ) : (
                    <div className="te-preview" style={{ fontSize: `${fontSize}px` }}>
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                        >
                            {text}
                        </ReactMarkdown>
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="te-tips">
                💡 불필요한 내용을 삭제하면 더 관련성 높은 문제가 생성됩니다 | 수학 수식: $x^2$ 또는 $$수식$$
            </div>

            {/* Action Button */}
            <div className="te-actions">
                <button
                    className="te-next-btn"
                    onClick={handleNext}
                    disabled={!text.trim()}
                >
                    문제 유형 선택하기 →
                </button>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="te-modal-overlay" onClick={() => setShowSaveModal(false)}>
                    <div className="te-modal" onClick={e => e.stopPropagation()}>
                        <h3>💾 텍스트 저장</h3>
                        <input
                            type="text"
                            placeholder="저장할 제목을 입력하세요"
                            value={saveTitle}
                            onChange={e => setSaveTitle(e.target.value)}
                            className="te-modal-input"
                            autoFocus
                        />
                        {saveError && <p className="te-modal-error">{saveError}</p>}
                        <div className="te-modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowSaveModal(false)}
                            >
                                취소
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TextEditor;
