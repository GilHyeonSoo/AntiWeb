import { useState, useRef } from 'react';
import './FileUpload.css';

function FileUpload({ onFileSelect, onBack, isProcessing = false, processingMessage = '' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const allowedExtensions = ['.pdf', '.docx'];

  const validateFile = (file) => {
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(extension) && !allowedTypes.includes(file.type)) {
      setError('PDF 또는 DOCX 파일만 업로드할 수 있습니다.');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return false;
    }

    return true;
  };

  const handleFile = (file) => {
    setError('');

    if (validateFile(file)) {
      setSelectedFile(file);
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
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.pdf')) {
      return (
        <svg className="file-type-icon pdf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <path d="M9 15h6" />
          <path d="M9 11h6" />
        </svg>
      );
    }
    return (
      <svg className="file-type-icon docx" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    );
  };

  return (
    <div className="file-upload-container animate-fade-in">
      {onBack && (
        <button className="btn btn-secondary back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          뒤로
        </button>
      )}
      <div className="upload-header">
        <div className="upload-icon-wrapper">
          <svg className="upload-main-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h2>학습 자료 업로드</h2>
        <p className="upload-description">
          시험 문제를 생성할 PDF 또는 DOCX 파일을 업로드하세요
        </p>
      </div>

      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleInputChange}
          className="file-input"
        />

        {isProcessing ? (
          <div className="processing-overlay">
            <div className="processing-spinner"></div>
            <div className="processing-text">
              <span className="processing-title">PDF 텍스트 추출 중...</span>
              <span className="processing-message">{processingMessage || 'Gemini AI가 분석 중입니다'}</span>
            </div>
          </div>
        ) : selectedFile ? (
          <div className="selected-file">
            {getFileIcon(selectedFile.name)}
            <div className="file-info">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
            </div>
            <button
              className="remove-file-btn"
              onClick={handleRemoveFile}
              aria-label="파일 제거"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="upload-text">
              <span className="upload-cta">클릭하여 파일 선택</span>
              <span className="upload-or">또는 파일을 여기에 드래그하세요</span>
            </div>
            <div className="supported-formats">
              <span className="format-badge">PDF</span>
              <span className="format-badge">DOCX</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="upload-tips">
        <h4>💡 팁</h4>
        <ul>
          <li>텍스트가 포함된 문서를 업로드하세요</li>
          <li>최대 파일 크기: 10MB</li>
          <li>명확한 내용일수록 좋은 문제가 생성됩니다</li>
        </ul>
      </div>
    </div>
  );
}

export default FileUpload;
