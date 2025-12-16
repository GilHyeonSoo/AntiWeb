import { useState } from 'react';
import FileUpload from './components/FileUpload';
import TextEditor from './components/TextEditor';
import QuestionDisplay from './components/QuestionDisplay';
import './App.css';

// Mock data for demonstration (will be replaced with actual LLM responses)
const MOCK_EXTRACTED_TEXT = `인공지능(AI)은 컴퓨터 시스템이 인간의 지능을 모방하여 학습, 추론, 문제 해결을 수행하는 기술입니다.

머신러닝은 AI의 하위 분야로, 데이터로부터 패턴을 학습하여 예측을 수행합니다. 지도학습, 비지도학습, 강화학습의 세 가지 주요 유형이 있습니다.

딥러닝은 인공 신경망을 사용하여 복잡한 패턴을 학습하는 머신러닝의 한 형태입니다. CNN(합성곱 신경망)은 이미지 인식에, RNN(순환 신경망)은 순차적 데이터 처리에 주로 사용됩니다.

자연어 처리(NLP)는 컴퓨터가 인간의 언어를 이해하고 생성할 수 있도록 하는 AI 분야입니다. GPT와 BERT 같은 대규모 언어 모델이 이 분야의 핵심 기술입니다.`;

const MOCK_QUESTIONS = [
  {
    type: 'multiple',
    question: '다음 중 머신러닝의 세 가지 주요 유형에 해당하지 않는 것은?',
    options: ['지도학습', '비지도학습', '강화학습', '전이학습'],
    answer: '전이학습',
    explanation: '머신러닝의 세 가지 주요 유형은 지도학습, 비지도학습, 강화학습입니다. 전이학습은 학습된 모델을 다른 문제에 적용하는 기법으로, 주요 유형에는 포함되지 않습니다.'
  },
  {
    type: 'multiple',
    question: 'CNN(합성곱 신경망)이 주로 사용되는 분야는?',
    options: ['음성 인식', '이미지 인식', '텍스트 생성', '데이터베이스 관리'],
    answer: '이미지 인식',
    explanation: 'CNN(합성곱 신경망)은 이미지의 공간적 특성을 효과적으로 학습할 수 있어 이미지 인식 분야에서 주로 사용됩니다.'
  },
  {
    type: 'short',
    question: '순차적 데이터 처리에 주로 사용되는 신경망의 종류는 무엇인가요?',
    answer: 'RNN(순환 신경망)',
    explanation: 'RNN은 이전 상태의 정보를 현재 상태로 전달하는 구조를 가지고 있어 시계열 데이터, 텍스트 등 순차적 데이터 처리에 적합합니다.'
  },
  {
    type: 'essay',
    question: '자연어 처리(NLP)의 정의와 대표적인 기술 두 가지를 설명하시오.',
    answer: '자연어 처리(NLP)는 컴퓨터가 인간의 언어를 이해하고 생성할 수 있도록 하는 AI 분야입니다. 대표적인 기술로는 GPT와 BERT 같은 대규모 언어 모델이 있습니다.',
    explanation: 'NLP는 텍스트 분석, 번역, 챗봇 등 다양한 응용 분야에 활용됩니다. GPT는 텍스트 생성에, BERT는 텍스트 이해에 강점을 가집니다.'
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
];

function App() {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [questions, setQuestions] = useState([]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (file) {
      setTimeout(() => {
        setExtractedText(MOCK_EXTRACTED_TEXT);
        setStep(2);
      }, 1000);
    }
  };

  const handleBack = () => {
    setStep(1);
    setSelectedFile(null);
    setExtractedText('');
  };

  const handleGenerate = (finalText) => {
    setQuestions(MOCK_QUESTIONS);
    setStep(3);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedFile(null);
    setExtractedText('');
    setQuestions([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <span className="logo-text">ExamGen</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="progress-steps">
            <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="step-number">
                {step > 1 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                ) : '1'}
              </span>
              <span className="step-label">파일 업로드</span>
            </div>
            <div className={`step-connector ${step > 1 ? 'active' : ''}`} />
            <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="step-number">
                {step > 2 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                ) : '2'}
              </span>
              <span className="step-label">텍스트 편집</span>
            </div>
            <div className={`step-connector ${step > 2 ? 'active' : ''}`} />
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">문제 확인</span>
            </div>
          </div>

          <div className="content-area">
            {step === 1 && (
              <FileUpload onFileSelect={handleFileSelect} />
            )}
            {step === 2 && (
              <TextEditor
                extractedText={extractedText}
                onBack={handleBack}
                onGenerate={handleGenerate}
              />
            )}
            {step === 3 && (
              <QuestionDisplay
                questions={questions}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>© 2024 ExamGen. AI 기반 시험 문제 생성 서비스</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
