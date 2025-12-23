# GenGen (젠젠) - AI Exam Generator

GenGen is an AI-powered educational tool that automatically generates exam questions from **YouTube videos** or **PDF/PPTX/DOCX documents**. It uses DeepSeek AI and Gemini API to create high-quality quizzes and provides an interactive interface for solving them.

## ✨ Key Features

### 1. Multi-Source Support
- **YouTube Transcripts**: Simply paste a YouTube URL to extract subtitles and generate questions based on the video content.
- **PDF**: Upload PDF files - uses Gemini OCR for accurate text extraction including handwritten content and math formulas.
- **PPTX (NEW!)**: Upload PowerPoint presentations - converts slides to images and uses Gemini OCR for extraction.
- **DOCX**: Upload Word documents for direct text extraction.

### 2. Various Question Types
- **Multiple Choice (객관식)**: Standard 4-option questions.
- **Short Answer (단답형)**: Concise answer checking with smart similarity matching.
- **O/X (True/False)**: Interactive big-button UI for quick True/False testing.
- **Fill in the Blank (빈칸 채우기)**: Context-aware blank filling.
- **Essay (서술형)**: Open-ended questions with sample answers.
- **Math (수학)**: LaTeX-rendered math problems with step-by-step solutions.

### 3. Smart Question Settings
- **Question Count Selection**: Choose from 3, 5, 10, or 15 questions.
- **Smart Recommendations**: Automatically recommends the optimal number of questions based on text length.
- **AI-Powered Generation**: Utilizes DeepSeek AI for accurate and context-aware question creation.
- **Smart Answer Checking**: Flexible text comparison using Levenshtein similarity (80% threshold).

### 4. Interactive Solving Experience
- **Focus Mode**: Solves one question at a time to maintain focus.
- **Real-time Feedback**: Instant correct/incorrect visual feedback.
- **Explanations**: Detailed AI-generated explanations for every question.
- **Progress Tracking**: 
  - **Progress Bar**: Visual gauge for completion rate.
  - **Accuracy Bar**: Visual gauge for correctness (changes color on 100% score).

### 5. Text Storage (NEW!)
- **Save Texts**: Save extracted texts to Firebase Firestore for later use (max 5 per user).
- **Load Texts**: Access saved texts from the header "불러오기" button on any page.
- **Cross-Device Sync**: Texts are synced across devices via cloud storage.

## 🛠 Tech Stack

- **Frontend**: React, Vite, CSS Modules
- **Backend**: Python, Flask
- **AI**: DeepSeek API (question generation), Gemini API (PDF/PPTX OCR)
- **Authentication**: Firebase Auth (Google & Email)
- **Database**: Firebase Firestore (text storage)
- **External APIs**: `youtube-transcript-api`, `python-pptx`, `python-docx`

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Python 3.8+
- DeepSeek API Key
- Gemini API Key (for PDF/PPTX OCR)
- Firebase Project (for Auth & Firestore)
- LibreOffice (optional, for PPTX Gemini OCR)

### 1. Backend Setup (Flask)
```bash
cd server
pip install -r requirements.txt
# Create .env file in root directory with API keys
python app.py
```
Server runs on `http://localhost:3001`

### 2. Frontend Setup (React)
```bash
# In the root directory
npm install
npm run dev
```
Client runs on `http://localhost:5173`

## 📝 Environment Variables (.env)

Create a `.env` file in the root directory:

```env
# AI Services
DEEPSEEK_API_KEY=your_deepseek_api_key
GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🎨 Project Structure

- `/src/components`: React components (QuestionDisplay, TextEditor, SavedTextsModal, etc.)
- `/src/services`: API handling (aiApi.js, pdfApi.js, textStorage.js)
- `/src/contexts`: Auth context provider
- `/server`: Flask backend application
- `/server/cache`: Cached AI responses for performance

## 📦 Dependencies

### Backend (Python)
- flask, flask-cors
- youtube-transcript-api
- openai (DeepSeek compatible)
- google-generativeai (Gemini OCR)
- pdf2image, Pillow
- python-pptx, python-docx

### Frontend (React)
- react-markdown, remark-math, rehype-katex (Math rendering)
- firebase (Auth & Firestore)
