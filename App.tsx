import React, { useState, useEffect, useCallback } from 'react';
import { User, Quiz, Attempt, View, Role, QuizResultData } from './types';
import * as authService from './services/authService';
import * as quizService from './services/quizService';
import Header from './components/shared/Header';
import AuthContainer from './components/auth/AuthContainer';
import InstructorDashboard from './components/instructor/InstructorDashboard';
import CreateQuizForm from './components/instructor/CreateQuizForm';
import QuizResults from './components/instructor/QuizResults';
import QuizViewer from './components/instructor/QuizViewer';
import StudentDashboard from './components/student/StudentDashboard';
import QuizTaker from './components/student/QuizTaker';
import PreviousScores from './components/student/PreviousScores';
import QuizResult from './components/student/QuizResult';
import Modal from './components/shared/Modal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(View.AUTH);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuizResult, setActiveQuizResult] = useState<QuizResultData | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importedQuizCode, setImportedQuizCode] = useState<string | null>(null);

  useEffect(() => {
    // Check for URL based quiz sharing
    const params = new URLSearchParams(window.location.search);
    const sharedQuizData = params.get('share');
    
    if (sharedQuizData) {
        // Attempt decode with new compression format
        const quiz = quizService.decodeQuizData(sharedQuizData);
        if (quiz) {
            quizService.importQuiz(quiz).then(() => {
                setImportMessage(`Quiz "${quiz.topic}" has been imported successfully! You can now access it using code: ${quiz.quizCode}`);
                setImportedQuizCode(quiz.quizCode);
                // Clear the URL
                window.history.replaceState({}, '', window.location.pathname);
            });
        }
    }

    const user = authService.getCurrentUser();
    if (user) {
      handleLoginSuccess(user);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === Role.INSTRUCTOR) {
      setView(View.INSTRUCTOR_DASHBOARD);
    } else {
      setView(View.STUDENT_DASHBOARD);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setView(View.AUTH);
    setActiveQuiz(null);
    setImportedQuizCode(null);
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setView(View.TAKE_QUIZ);
  };

  const handleQuizSubmit = (result: QuizResultData) => {
    setActiveQuizResult(result);
    setActiveQuiz(null);
    setView(View.QUIZ_RESULT);
  }

  const navigateTo = useCallback((newView: View, data?: any) => {
    if (newView === View.VIEW_QUIZ_RESULTS || newView === View.TAKE_QUIZ || newView === View.VIEW_QUIZ) {
      setActiveQuiz(data as Quiz);
    }
    setView(newView);
  }, []);

  const renderContent = () => {
    if (!currentUser) {
      return <AuthContainer onLoginSuccess={handleLoginSuccess} />;
    }

    switch (view) {
      case View.INSTRUCTOR_DASHBOARD:
        return <InstructorDashboard currentUser={currentUser} navigateTo={navigateTo} />;
      case View.CREATE_QUIZ:
        return <CreateQuizForm currentUser={currentUser} navigateTo={navigateTo} />;
      case View.VIEW_QUIZ_RESULTS:
        return activeQuiz && <QuizResults quiz={activeQuiz} navigateTo={navigateTo} />;
      case View.VIEW_QUIZ:
        return activeQuiz && currentUser.role === Role.INSTRUCTOR && <QuizViewer quiz={activeQuiz} navigateTo={navigateTo} />;
      
      case View.STUDENT_DASHBOARD:
        return <StudentDashboard currentUser={currentUser} navigateTo={navigateTo} onStartQuiz={handleStartQuiz} initialCode={importedQuizCode} />;
      case View.TAKE_QUIZ:
        return activeQuiz && <QuizTaker quiz={activeQuiz} student={currentUser} onQuizSubmit={handleQuizSubmit} />;
      case View.PREVIOUS_SCORES:
        return <PreviousScores currentUser={currentUser} navigateTo={navigateTo} />;
      case View.QUIZ_RESULT:
          return activeQuizResult && <QuizResult result={activeQuizResult} navigateTo={navigateTo} />;

      default:
        // Default to the correct dashboard if view is auth but user is logged in
        if (currentUser.role === Role.INSTRUCTOR) {
            return <InstructorDashboard currentUser={currentUser} navigateTo={navigateTo} />;
        }
        if (currentUser.role === Role.STUDENT) {
            return <StudentDashboard currentUser={currentUser} navigateTo={navigateTo} onStartQuiz={handleStartQuiz} initialCode={importedQuizCode} />;
        }
        return <AuthContainer onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="min-h-screen text-gray-800 dark:text-violet-200 font-sans">
      <Header currentUser={currentUser} onLogout={handleLogout} navigateTo={navigateTo} />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
      
      <Modal isOpen={!!importMessage} onClose={() => setImportMessage(null)} title="Quiz Imported">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <p className="text-gray-700 dark:text-violet-200 mb-6">{importMessage}</p>
            <button 
                onClick={() => setImportMessage(null)}
                className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
                Okay
            </button>
        </div>
      </Modal>
    </div>
  );
}