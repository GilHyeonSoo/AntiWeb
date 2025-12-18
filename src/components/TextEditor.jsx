import { useState } from 'react';
import './TextEditor.css';

function TextEditor({ extractedText, onBack, onNext }) {
    const [text, setText] = useState(extractedText);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    const handleNext = () => {
        if (!text.trim()) return;
        onNext(text);
    };

    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const charCount = text.length;

    return (
        <div className="text-editor-container animate-fade-in">
            <div className="editor-header">
                <button className="btn btn-secondary back-btn" onClick={onBack}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,18 9,12 15,6" />
                    </svg>
                    뒤로
                </button>
                <div className="editor-title">
                    <h2>텍스트 확인 및 수정</h2>
                    <p>추출된 텍스트를 확인하고 필요시 수정하세요</p>
                </div>
            </div>

            <div className={`editor-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="editor-toolbar">
                    <div className="toolbar-info">
                        <span className="badge badge-primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14,2 14,8 20,8" />
                            </svg>
                            추출된 텍스트
                        </span>
                    </div>
                    <div className="toolbar-actions">
                        <div className="text-stats">
                            <span>{charCount.toLocaleString()} 글자</span>
                            <span className="stats-divider">|</span>
                            <span>{wordCount.toLocaleString()} 단어</span>
                        </div>
                        <button
                            className="btn btn-secondary expand-btn"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {isExpanded ? (
                                    <polyline points="18,15 12,9 6,15" />
                                ) : (
                                    <polyline points="6,9 12,15 18,9" />
                                )}
                            </svg>
                            {isExpanded ? '접기' : '펼치기'}
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <>
                        <div className="textarea-wrapper">
                            <textarea
                                className="input text-area"
                                value={text}
                                onChange={handleTextChange}
                                placeholder="텍스트가 여기에 표시됩니다..."
                            />
                            <div className="textarea-gradient" />
                        </div>

                        <div className="editor-tips">
                            <div className="tip-item">
                                <span className="tip-icon">✏️</span>
                                <span>불필요한 내용을 삭제하면 더 관련성 높은 문제가 생성됩니다</span>
                            </div>
                            <div className="tip-item">
                                <span className="tip-icon">📝</span>
                                <span>핵심 개념을 강조하거나 추가 설명을 넣을 수 있습니다</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="editor-actions">
                <button
                    className="btn btn-primary btn-lg generate-btn"
                    onClick={handleNext}
                    disabled={!text.trim()}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9,18 15,12 9,6" />
                    </svg>
                    다음
                </button>
                <p className="action-hint">
                    다음 단계에서 문제 유형을 선택합니다
                </p>
            </div>
        </div>
    );
}

export default TextEditor;

