import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from '../contexts/AuthContext';
import { saveText } from '../services/textStorage';
import './SummaryView.css';

// Custom heading renderer with blue styling
const components = {
    h1: ({ children }) => <h1 className="sv-heading sv-h1">{children}</h1>,
    h2: ({ children }) => <h2 className="sv-heading sv-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="sv-heading sv-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="sv-heading sv-h4">{children}</h4>,
    h5: ({ children }) => <h5 className="sv-heading sv-h5">{children}</h5>,
    h6: ({ children }) => <h6 className="sv-heading sv-h6">{children}</h6>,
};

// Question types data with colors
const questionTypes = [
    { id: 'multiple', title: '객관식', description: '4~5개의 보기 중 정답 선택', icon: '○', color: '#3b82f6' },
    { id: 'short', title: '단답형', description: '짧은 단어나 문장으로 답변', icon: '≡', color: '#10b981' },
    { id: 'ox', title: 'O/X', description: '참/거짓 판단', icon: '◯✕', color: '#f59e0b' },
    { id: 'blank', title: '빈칸채우기', description: '빈칸에 알맞은 답', icon: '▢', color: '#8b5cf6' },
    { id: 'essay', title: '서술형', description: '자세한 설명 필요', icon: '¶', color: '#ec4899' },
    { id: 'math', title: '수학 문제', description: 'LaTeX 수식 포함', icon: '∑', color: '#06b6d4' }
];

function SummaryView({
    extractedText,
    onBack,
    onNext,
    onFileSelect,
    isProcessing = false,
    processingMessage = '',
    progressSteps = [],
    currentStep = 1,
    onStepClick
}) {
    const [fontSize, setFontSize] = useState(16);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveTitle, setSaveTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    // View mode: 'summary' | 'typeSelector'
    const [viewMode, setViewMode] = useState('summary');
    const [selectedType, setSelectedType] = useState(null);
    const [questionCount, setQuestionCount] = useState(5);

    const { user } = useAuth();

    const allowedExtensions = ['.pdf', '.docx', '.pptx'];

    const validateFile = (file) => {
        const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        if (!allowedExtensions.includes(extension)) {
            setUploadError('PDF, DOCX, 또는 PPTX 파일만 업로드할 수 있습니다.');
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('파일 크기는 10MB 이하여야 합니다.');
            return false;
        }
        return true;
    };

    const handleFile = (file) => {
        setUploadError('');
        if (validateFile(file) && onFileSelect) {
            onFileSelect(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleShowTypeSelector = () => {
        setViewMode('typeSelector');
    };

    const handleBackToSummary = () => {
        setViewMode('summary');
        setSelectedType(null);
    };

    // Handle step navigation from sidebar
    const handleStepNav = (step) => {
        if (step === 2) {
            setViewMode('summary');
        } else if (step === 3) {
            if (extractedText) {
                setViewMode('typeSelector');
            }
        }
    };

    const handleConfirmType = () => {
        if (selectedType) {
            onNext(extractedText, selectedType, questionCount);
        }
    };

    const adjustFontSize = (delta) => {
        setFontSize(prev => Math.min(24, Math.max(12, prev + delta)));
    };

    const handleSave = async () => {
        if (!saveTitle.trim()) {
            setSaveError('제목을 입력해주세요.');
            return;
        }
        setIsSaving(true);
        setSaveError('');
        try {
            await saveText(user.uid, saveTitle, extractedText);
            setShowSaveModal(false);
            setSaveTitle('');
            alert('저장되었습니다!');
        } catch (error) {
            setSaveError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const textLength = extractedText?.length || 0;
    const getRecommendation = () => {
        if (textLength < 500) return { max: 5, recommended: 3, warning: '텍스트가 짧아 문제 품질이 낮을 수 있습니다.' };
        if (textLength < 1500) return { max: 10, recommended: 5, warning: null };
        if (textLength < 3000) return { max: 15, recommended: 10, warning: null };
        return { max: 20, recommended: 10, warning: null };
    };
    const { max, recommended, warning } = getRecommendation();
    const countOptions = [3, 5, 10, 15];

    // Calculate display step based on viewMode
    const displayStep = viewMode === 'typeSelector' ? 3 : currentStep;

    return (
        <div className="sv-wrapper">
            {/* Two Column Layout */}
            <div className="sv-layout">
                {/* Left Panel - Progress Steps, File Upload & History */}
                <div className="sv-sidebar">
                    {/* Progress Steps in Sidebar */}
                    {progressSteps.length > 0 && (
                        <div className="sv-progress-section">
                            <div className="sv-progress-header">진행 상황</div>
                            <div className="sv-progress-steps">
                                {progressSteps.map((item, index) => (
                                    <div key={item.step} className="sv-step-wrapper">
                                        <div
                                            className={`sv-step ${displayStep >= item.step ? 'active' : ''} ${displayStep > item.step ? 'completed' : ''}`}
                                            onClick={() => handleStepNav(item.step)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span className="sv-step-number">
                                                {displayStep > item.step ? (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12">
                                                        <polyline points="20,6 9,17 4,12" />
                                                    </svg>
                                                ) : item.step}
                                            </span>
                                            <span className="sv-step-label">{item.label}</span>
                                        </div>
                                        {index < progressSteps.length - 1 && (
                                            <div className={`sv-step-line ${displayStep > item.step ? 'active' : ''}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="sv-sidebar-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17,8 12,3 7,8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>파일 업로드</span>
                    </div>
                    <div className="sv-sidebar-content">
                        {/* File Upload Area */}
                        <div
                            className={`sv-upload-zone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !isProcessing && fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleInputChange}
                                accept=".pdf,.docx,.pptx"
                                style={{ display: 'none' }}
                            />
                            {isProcessing ? (
                                <div className="sv-upload-processing">
                                    <div className="sv-spinner"></div>
                                    <span>{processingMessage || '처리 중...'}</span>
                                </div>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17,8 12,3 7,8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span className="sv-upload-text">파일을 드래그하거나 클릭</span>
                                    <span className="sv-upload-hint">PDF, DOCX, PPTX (최대 10MB)</span>
                                </>
                            )}
                        </div>
                        {uploadError && (
                            <div className="sv-upload-error">{uploadError}</div>
                        )}

                        {/* User History Section */}
                        <div className="sv-history-section">
                            <div className="sv-history-title">저장된 기록</div>
                            {user ? (
                                <div className="sv-history-empty">저장된 기록이 없습니다</div>
                            ) : (
                                <div className="sv-history-empty">로그인하면 기록을 볼 수 있습니다</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - AI Content with Slide Transition */}
                <div className="sv-main">
                    {/* Header only in summary mode */}
                    {viewMode === 'summary' && (
                        <div className="sv-main-header">
                            <div className="sv-main-header-left">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>

                            </div>
                            <div className="sv-main-header-right">
                                {user && extractedText && (
                                    <button className="sv-header-save-btn" onClick={() => setShowSaveModal(true)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17,21 17,13 7,13 7,21" />
                                            <polyline points="7,3 7,8 15,8" />
                                        </svg>
                                        저장
                                    </button>
                                )}
                                {extractedText && (
                                    <div className="sv-font-controls">
                                        <button onClick={() => adjustFontSize(-2)} disabled={fontSize <= 12}>−</button>
                                        <span>{fontSize}px</span>
                                        <button onClick={() => adjustFontSize(2)} disabled={fontSize >= 24}>+</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content Area with Slide Transition */}
                    <div className="sv-content-wrapper">
                        <div className={`sv-content-slider ${viewMode === 'typeSelector' ? 'show-type' : ''}`}>
                            {/* Summary View */}
                            <div className="sv-slide sv-slide-summary">
                                <div className="sv-content" style={{ fontSize: `${fontSize}px` }}>
                                    {extractedText ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                            components={components}
                                        >
                                            {extractedText}
                                        </ReactMarkdown>
                                    ) : (
                                        <div className="sv-empty-content">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14,2 14,8 20,8" />
                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                <line x1="16" y1="17" x2="8" y2="17" />
                                            </svg>
                                            <p>왼쪽에서 파일을 업로드하면<br />AI 정리본이 여기에 표시됩니다</p>
                                        </div>
                                    )}
                                </div>
                                {/* Generate Button inside sv-main */}
                                {extractedText && (
                                    <div className="sv-inline-actions">
                                        <button
                                            className="sv-next-btn"
                                            onClick={handleShowTypeSelector}
                                            disabled={!extractedText?.trim()}
                                        >
                                            유형 선택하기
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Type Selector View */}
                            <div className="sv-slide sv-slide-type">
                                <div className="sv-type-content">
                                    <div className="sv-type-section">
                                        <div className="sv-type-label">문제 유형</div>
                                        <div className="sv-type-grid">
                                            {questionTypes.map(type => (
                                                <button
                                                    key={type.id}
                                                    className={`sv-type-card ${selectedType === type.id ? 'selected' : ''}`}
                                                    onClick={() => setSelectedType(type.id)}
                                                    style={{ '--type-color': type.color }}
                                                >
                                                    <span className="sv-type-icon" style={{ color: type.color }}>{type.icon}</span>
                                                    <span className="sv-type-title">{type.title}</span>
                                                    <span className="sv-type-desc">{type.description}</span>
                                                    {selectedType === type.id && (
                                                        <span className="sv-type-check" style={{ background: type.color }}>✓</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        {warning && (
                                            <div className="sv-type-warning">⚠️ {warning}</div>
                                        )}
                                    </div>

                                    <div className="sv-type-section">
                                        <div className="sv-type-label">문제 개수</div>
                                        <div className="sv-count-options">
                                            {countOptions.map(count => (
                                                <button
                                                    key={count}
                                                    className={`sv-count-btn ${questionCount === count ? 'selected' : ''} ${count === recommended ? 'recommended' : ''}`}
                                                    onClick={() => setQuestionCount(count)}
                                                >
                                                    <span className="sv-count-num">{count}</span>
                                                    <span className="sv-count-label">문제</span>
                                                    {count === recommended && <span className="sv-recommended-badge">추천</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        className="sv-generate-btn"
                                        onClick={handleConfirmType}
                                        disabled={!selectedType}
                                    >
                                        문제 생성하기
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            {/* Save Modal */}
            {showSaveModal && (
                <div className="sv-modal-overlay" onClick={() => setShowSaveModal(false)}>
                    <div className="sv-modal" onClick={e => e.stopPropagation()}>
                        <h3>💾 정리본 저장</h3>
                        <input
                            type="text"
                            placeholder="저장할 제목을 입력하세요"
                            value={saveTitle}
                            onChange={e => setSaveTitle(e.target.value)}
                            autoFocus
                        />
                        {saveError && <p className="sv-error">{saveError}</p>}
                        <div className="sv-modal-btns">
                            <button onClick={() => setShowSaveModal(false)}>취소</button>
                            <button onClick={handleSave} disabled={isSaving} className="sv-primary">
                                {isSaving ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SummaryView;
