import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { logOut } from './firebase';
import { generateQuestions, QUESTION_TYPES, checkAIAvailability } from './services/aiApi';
import { extractPDFText, checkPDFService } from './services/pdfApi';
import HomePage from './components/HomePage';
import FileUpload from './components/FileUpload';
import YoutubeInput from './components/YoutubeInput';
import SummaryView from './components/SummaryView';
import QuestionTypeSelector from './components/QuestionTypeSelector';
import QuestionDisplay from './components/QuestionDisplay';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import SavedTextsModal from './components/SavedTextsModal';
import './App.css';

// Mock data for demonstration
const MOCK_EXTRACTED_TEXT = `인공지능(AI)은 컴퓨터 시스템이 인간의 지능을 모방하여 학습, 추론, 문제 해결을 수행하는 기술입니다.

머신러닝은 AI의 하위 분야로, 데이터로부터 패턴을 학습하여 예측을 수행합니다. 지도학습, 비지도학습, 강화학습의 세 가지 주요 유형이 있습니다.

딥러닝은 인공 신경망을 사용하여 복잡한 패턴을 학습하는 머신러닝의 한 형태입니다. CNN(합성곱 신경망)은 이미지 인식에, RNN(순환 신경망)은 순차적 데이터 처리에 주로 사용됩니다.

자연어 처리(NLP)는 컴퓨터가 인간의 언어를 이해하고 생성할 수 있도록 하는 AI 분야입니다. GPT와 BERT 같은 대규모 언어 모델이 이 분야의 핵심 기술입니다.`;

const generateMockQuestions = (type) => {
  const questions = {
    multiple: [
      {
        type: 'multiple',
        question: '다음 중 머신러닝의 세 가지 주요 유형에 해당하지 않는 것은?',
        options: ['지도학습', '비지도학습', '강화학습', '전이학습'],
        answer: '전이학습',
        explanation: '머신러닝의 세 가지 주요 유형은 지도학습, 비지도학습, 강화학습입니다.'
      },
      {
        type: 'multiple',
        question: 'CNN(합성곱 신경망)이 주로 사용되는 분야는?',
        options: ['음성 인식', '이미지 인식', '텍스트 생성', '데이터베이스 관리'],
        answer: '이미지 인식',
        explanation: 'CNN은 이미지의 공간적 특성을 효과적으로 학습할 수 있어 이미지 인식 분야에서 주로 사용됩니다.'
      },
      {
        type: 'multiple',
        question: '인공지능의 정의로 가장 적절한 것은?',
        options: [
          '데이터를 저장하는 기술',
          '컴퓨터 시스템이 인간의 지능을 모방하여 학습, 추론, 문제 해결을 수행하는 기술',
          '인터넷에 연결된 기기를 관리하는 기술',
          '하드웨어를 설계하는 기술'
        ],
        answer: '컴퓨터 시스템이 인간의 지능을 모방하여 학습, 추론, 문제 해결을 수행하는 기술',
        explanation: '인공지능은 인간의 인지 능력을 컴퓨터로 구현하여 다양한 문제를 해결하는 것을 목표로 합니다.'
      }
    ],
    short: [
      {
        type: 'short',
        question: '순차적 데이터 처리에 주로 사용되는 신경망의 종류는 무엇인가요?',
        answer: 'RNN(순환 신경망)',
        explanation: 'RNN은 이전 상태의 정보를 현재 상태로 전달하는 구조를 가지고 있습니다.'
      },
      {
        type: 'short',
        question: 'GPT와 BERT는 어떤 분야의 핵심 기술인가요?',
        answer: '자연어 처리(NLP)',
        explanation: 'GPT와 BERT는 대규모 언어 모델로, 자연어 처리 분야의 핵심 기술입니다.'
      },
      {
        type: 'short',
        question: '데이터로부터 패턴을 학습하여 예측을 수행하는 AI의 하위 분야는?',
        answer: '머신러닝',
        explanation: '머신러닝은 AI의 하위 분야로 데이터 기반 학습을 수행합니다.'
      }
    ],
    essay: [
      {
        type: 'essay',
        question: '자연어 처리(NLP)의 정의와 대표적인 기술 두 가지를 설명하시오.',
        answer: '자연어 처리(NLP)는 컴퓨터가 인간의 언어를 이해하고 생성할 수 있도록 하는 AI 분야입니다. 대표적인 기술로는 GPT와 BERT 같은 대규모 언어 모델이 있습니다.',
        explanation: 'NLP는 텍스트 분석, 번역, 챗봇 등 다양한 응용 분야에 활용됩니다.'
      },
      {
        type: 'essay',
        question: '머신러닝의 세 가지 주요 유형을 설명하고 각각의 특징을 서술하시오.',
        answer: '머신러닝의 세 가지 주요 유형은 지도학습, 비지도학습, 강화학습입니다. 지도학습은 정답이 있는 데이터로 학습하고, 비지도학습은 정답 없이 패턴을 찾으며, 강화학습은 보상을 통해 행동을 학습합니다.',
        explanation: '각 유형은 서로 다른 문제 상황에 적합하게 사용됩니다.'
      }
    ]
  };
  return questions[type] || questions.multiple;
};

function AppContent() {
  // Navigation state
  const [currentPage, setCurrentPage] = useState('home'); // home, pdf, youtube
  const [currentStep, setCurrentStep] = useState(1);

  // Data state
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [questions, setQuestions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [pdfProcessing, setPdfProcessing] = useState({ isProcessing: false, progress: '' });

  // Auth state from context
  const { user, isAuthenticated, loading } = useAuth();

  // Password change modal state
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Saved texts modal state
  const [isSavedTextsModalOpen, setIsSavedTextsModalOpen] = useState(false);

  // Mode selection from home page
  const handleSelectMode = (mode) => {
    setCurrentPage(mode);
    setCurrentStep(1);
  };

  // Go back to home
  const handleGoHome = () => {
    setCurrentPage('home');
    setCurrentStep(1);
    resetState();
  };

  // Go back to question type selector (for "새로운 문제 생성하기")
  const handleBackToQuestionType = () => {
    setSelectedQuestionType('');
    setQuestions([]);
    setCurrentStep(3);
  };

  // Reset all state
  const resetState = () => {
    setSelectedFile(null);
    setExtractedText('');
    setEditedText('');
    setSelectedQuestionType('');
    setQuestions([]);
    setSelectedSubject('');
    setPdfProcessing({ isProcessing: false, progress: '' });
  };

  // PDF Flow handlers - using Gemini OCR
  const handleFileSelect = async (file) => {
    setSelectedFile(file);

    if (!file) {
      setExtractedText('');
      return;
    }

    // Only process PDF files with Gemini OCR
    if (file.name.toLowerCase().endsWith('.pdf')) {
      setPdfProcessing({ isProcessing: true, progress: 'PDF 분석 중...' });

      try {
        const result = await extractPDFText(file, (progress) => {
          setPdfProcessing({ isProcessing: true, progress: progress.message });
        });

        if (result.success) {
          setExtractedText(result.text);
          setPdfProcessing({ isProcessing: false, progress: '' });
          setCurrentStep(2);
        } else {
          // Fallback to mock data if OCR fails
          console.error('PDF OCR failed:', result.error);
          setPdfProcessing({ isProcessing: false, progress: '' });
          setExtractedText(`[PDF OCR 실패: ${result.error}]\n\n텍스트를 직접 입력해주세요.`);
          setCurrentStep(2);
        }
      } catch (error) {
        console.error('PDF processing error:', error);
        setPdfProcessing({ isProcessing: false, progress: '' });
        setExtractedText(`[PDF 처리 오류]\n\n텍스트를 직접 입력해주세요.`);
        setCurrentStep(2);
      }
    } else if (file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.docx')) {
      // Handle PPTX and DOCX files
      const fileType = file.name.toLowerCase().endsWith('.pptx') ? 'PPTX' : 'DOCX';
      setPdfProcessing({ isProcessing: true, progress: `${fileType} 텍스트 추출 중...` });

      try {
        const result = await extractPDFText(file, (progress) => {
          setPdfProcessing({ isProcessing: true, progress: progress.message });
        });

        if (result.success) {
          setExtractedText(result.text);
          setPdfProcessing({ isProcessing: false, progress: '' });
          setCurrentStep(2);
        } else {
          console.error(`${fileType} extraction failed:`, result.error);
          setPdfProcessing({ isProcessing: false, progress: '' });
          setExtractedText(`[${fileType} 추출 실패: ${result.error}]\n\n텍스트를 직접 입력해주세요.`);
          setCurrentStep(2);
        }
      } catch (error) {
        console.error(`${fileType} processing error:`, error);
        setPdfProcessing({ isProcessing: false, progress: '' });
        setExtractedText(`[${fileType} 처리 오류]\n\n텍스트를 직접 입력해주세요.`);
        setCurrentStep(2);
      }
    } else {
      // Unsupported file type
      setExtractedText('지원하지 않는 파일 형식입니다.');
      setCurrentStep(2);
    }
  };

  // YouTube Flow handlers
  const handleYoutubeSubmit = (text) => {
    setExtractedText(text);
    setCurrentStep(2);
  };

  // Text Editor handlers
  const handleTextNext = (text) => {
    setEditedText(text);
    setCurrentStep(3);
  };

  const handleBackToInput = () => {
    setCurrentStep(1);
    setExtractedText('');
  };

  const handleBackToEditor = () => {
    setCurrentStep(2);
  };

  // Question Type selection - map UI types to API types
  const mapQuestionType = (uiType) => {
    const typeMap = {
      'multiple': QUESTION_TYPES.MULTIPLE_CHOICE,
      'short': QUESTION_TYPES.SHORT_ANSWER,
      'essay': QUESTION_TYPES.SHORT_ANSWER, // Use short answer for essay
      'ox': QUESTION_TYPES.TRUE_FALSE,
      'blank': QUESTION_TYPES.FILL_BLANK,
      'math': QUESTION_TYPES.MATH
    };
    return typeMap[uiType] || QUESTION_TYPES.MULTIPLE_CHOICE;
  };

  const handleSelectQuestionType = async (type, count = 5) => {
    setSelectedQuestionType(type);
    setIsGenerating(true);
    setGenerationError('');

    try {
      // Check if AI is available
      const aiAvailable = await checkAIAvailability();

      if (!aiAvailable) {
        // Fallback to mock data if AI not available
        console.log('AI not available, using mock data');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setQuestions(generateMockQuestions(type).slice(0, count));
      } else {
        // Use real AI to generate questions
        const apiType = mapQuestionType(type);
        const textToUse = editedText || extractedText || MOCK_EXTRACTED_TEXT;

        const result = await generateQuestions(textToUse, apiType, count);

        // Format questions for display
        const formattedQuestions = result.questions.map(q => ({
          type: type,
          question: q.question,
          options: q.options || [],
          answer: typeof q.answer === 'number' ? q.options[q.answer] : q.answer,
          explanation: q.explanation || ''
        }));

        setQuestions(formattedQuestions);
      }

      setCurrentStep(4);
    } catch (error) {
      console.error('Question generation error:', error);
      setGenerationError(error.message);
      // Fallback to mock data on error
      setQuestions(generateMockQuestions(type));
      setCurrentStep(4);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // Handle step click navigation
  const handleStepClick = (step) => {
    // Only allow going back to completed steps
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  // Get user initials for avatar placeholder
  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  // Get progress steps based on current page
  const getProgressSteps = () => {
    if (currentPage === 'pdf') {
      return [
        { label: '파일 업로드', step: 1 },
        { label: 'AI 정리본', step: 2 },
        { label: '유형 선택', step: 3 },
        { label: '문제 확인', step: 4 }
      ];
    }
    if (currentPage === 'youtube') {
      return [
        { label: '링크 입력', step: 1 },
        { label: 'AI 정리본', step: 2 },
        { label: '유형 선택', step: 3 },
        { label: '문제 확인', step: 4 }
      ];
    }
    return [];
  };

  const renderContent = () => {
    // Loading auth state
    if (loading) {
      return (
        <div className="auth-loading">
          <span className="spinner"></span>
          <p>인증 확인 중...</p>
        </div>
      );
    }

    // Home page (always accessible)
    if (currentPage === 'home') {
      return <HomePage onSelectMode={handleSelectMode} />;
    }

    // Auth pages (always accessible)
    if (currentPage === 'login' || currentPage === 'signup' || currentPage === 'forgot-password') {
      if (currentPage === 'login') {
        return (
          <LoginPage
            onBack={handleGoHome}
            onSwitchToSignup={() => setCurrentPage('signup')}
            onSwitchToForgotPassword={() => setCurrentPage('forgot-password')}
            onLoginSuccess={() => setCurrentPage('home')}
          />
        );
      }
      if (currentPage === 'signup') {
        return (
          <SignupPage
            onBack={handleGoHome}
            onSwitchToLogin={() => setCurrentPage('login')}
            onSignupSuccess={() => setCurrentPage('home')}
          />
        );
      }
      if (currentPage === 'forgot-password') {
        return (
          <ForgotPasswordPage
            onBack={handleGoHome}
            onSwitchToLogin={() => setCurrentPage('login')}
          />
        );
      }
    }

    // Protected routes - require authentication
    if (!isAuthenticated) {
      return (
        <div className="login-required-screen animate-fade-in">
          <div className="login-required-card">
            <div className="login-required-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2>로그인이 필요합니다</h2>
            <p>이 기능을 사용하려면 먼저 로그인해주세요.</p>
            <div className="login-required-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setCurrentPage('login')}
              >
                로그인하기
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleGoHome}
              >
                홈으로 돌아가기
              </button>
            </div>
            <p className="login-required-signup">
              계정이 없으신가요? <button onClick={() => setCurrentPage('signup')}>회원가입</button>
            </p>
          </div>
        </div>
      );
    }

    // PDF Flow
    if (currentPage === 'pdf') {
      // Step 1 is now part of SummaryView (no separate FileUpload page)
      if (currentStep === 1 || currentStep === 2) {
        return (
          <SummaryView
            extractedText={extractedText}
            onBack={handleGoHome}
            onNext={handleTextNext}
            onFileSelect={handleFileSelect}
            isProcessing={pdfProcessing.isProcessing}
            processingMessage={pdfProcessing.progress}
            progressSteps={progressSteps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        );
      }
      if (currentStep === 3) {
        return (
          <QuestionTypeSelector
            onSelect={handleSelectQuestionType}
            onBack={handleBackToEditor}
            isLoading={isGenerating}
            textLength={(editedText || extractedText || '').length}
          />
        );
      }
      if (currentStep === 4) {
        return (
          <QuestionDisplay
            questions={questions}
            onReset={handleBackToQuestionType}
          />
        );
      }
    }

    // YouTube Flow
    if (currentPage === 'youtube') {
      if (currentStep === 1) {
        return <YoutubeInput onSubmit={handleYoutubeSubmit} onBack={handleGoHome} />;
      }
      if (currentStep === 2) {
        return (
          <SummaryView
            extractedText={extractedText}
            onBack={handleBackToInput}
            onNext={handleTextNext}
          />
        );
      }
      if (currentStep === 3) {
        return (
          <QuestionTypeSelector
            onSelect={handleSelectQuestionType}
            onBack={handleBackToEditor}
            isLoading={isGenerating}
            textLength={(editedText || extractedText || '').length}
          />
        );
      }
      if (currentStep === 4) {
        return (
          <QuestionDisplay
            questions={questions}
            onReset={handleBackToQuestionType}
          />
        );
      }
    }

    return null;
  };

  const progressSteps = getProgressSteps();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="app-layout">
        <div className="app">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            color: 'var(--color-text-secondary)'
          }}>
            로딩 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="app">
        <header className="app-header">
          <div className="container">
            <div className="header-content">
              <button className="logo" onClick={handleGoHome}>
                <div className="logo-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <line x1="8" y1="7" x2="16" y2="7" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <span className="logo-text">GenGen</span>
              </button>
              <div className="header-actions">

                {isAuthenticated ? (
                  /* Logged in state - Order: Name | Load | Logout | Password */
                  <div className="user-profile">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="프로필"
                        className="user-avatar"
                      />
                    ) : (
                      <div className="user-avatar-placeholder">
                      </div>
                    )}
                    <span className="user-name">
                      {user?.displayName || user?.email?.split('@')[0]}
                    </span>
                    <button
                      className="header-load-btn"
                      onClick={() => setIsSavedTextsModalOpen(true)}
                      title="저장된 텍스트 불러오기"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>불러오기</span>
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16,17 21,12 16,7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      로그아웃
                    </button>
                    {/* Only show change password for email users */}
                    {user?.providerData?.[0]?.providerId === 'password' && (
                      <button
                        className="change-password-btn"
                        onClick={() => setIsChangePasswordModalOpen(true)}
                        title="비밀번호 변경"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </button>
                    )
                    }
                  </div>
                ) : (
                  /* Logged out state */
                  <>
                    <button className="btn btn-secondary" onClick={() => setCurrentPage('login')}>로그인</button>
                    <button className="btn btn-primary" onClick={() => setCurrentPage('signup')}>회원가입</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            {/* Content */}
            <div className="content-area">
              {renderContent()}
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <div className="container">
            <p>© 2025 GenGen. AI 기반 시험 문제 생성 서비스</p>
          </div>
        </footer>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      {/* Saved Texts Modal */}
      <SavedTextsModal
        isOpen={isSavedTextsModalOpen}
        onClose={() => setIsSavedTextsModalOpen(false)}
        onSelectText={(savedText) => {
          setExtractedText(savedText.content);
          setEditedText(savedText.content);
          setCurrentPage('pdf');
          setCurrentStep(2);
          setIsSavedTextsModalOpen(false);
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
