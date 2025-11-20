import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quiz, User, QuizResultData } from '../../types';
import * as quizService from '../../services/quizService';
import Spinner from '../shared/Spinner';
import Modal from '../shared/Modal';

interface QuizTakerProps {
  quiz: Quiz;
  student: User;
  onQuizSubmit: (result: QuizResultData) => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, student, onQuizSubmit }) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timerMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const submitRef = useRef(onQuizSubmit);
  submitRef.current = onQuizSubmit;

  const handleSelectAnswer = (questionIndex: number, option: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await quizService.submitAttempt(quiz.id, student.id, answers);
      submitRef.current({score: result.score, total: result.total, quizTopic: quiz.topic});
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      setIsSubmitting(false); // Allow retry if submission fails
    }
  }, [quiz.id, student.id, answers, isSubmitting, quiz.topic]);
  
  const playWarningSound = () => {
      try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
          osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1); // Alert chirp

          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);

          osc.start();
          osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
          console.error("Audio play failed", e);
      }
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    
    // Play warning sound exactly at 60 seconds
    if (timeLeft === 60) {
        playWarningSound();
    }

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, handleSubmit]);

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setFade(false);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setFade(true);
      }, 300);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setFade(false);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setFade(true);
      }, 300);
    }
  };
  
  const handleConfirmSubmit = () => {
    setIsConfirmModalOpen(false);
    handleSubmit();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isSubmitting) {
      return <div className="h-96 flex justify-center items-center"><Spinner message="Submitting your answers..." size="lg"/></div>
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        {timeLeft <= 60 && (
            <div className="mb-6 bg-red-500/10 backdrop-blur-md border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center justify-center animate-pulse shadow-lg shadow-red-900/20" role="alert">
                <svg className="h-6 w-6 mr-3 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-bold">Hurry! Less than 1 minute remaining!</p>
            </div>
        )}

      <div className={`bg-gray-900/70 backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden transition-colors duration-500 w-full ${timeLeft <= 10 ? 'border-red-500 shadow-red-500/30' : 'border-white/10'}`}>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-800 h-1.5">
            <div 
                className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 h-1.5 transition-all duration-500"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
            ></div>
        </div>

        {/* Card Header */}
        <div className="px-6 py-6 sm:px-10 flex justify-between items-center border-b border-white/10">
            <div>
                <h2 className="text-lg font-semibold text-gray-400 uppercase tracking-wider">{quiz.topic}</h2>
                <p className="text-sm text-cyan-300 mt-1 font-medium">
                    Question {currentQuestionIndex + 1} <span className="text-gray-500">/</span> {quiz.questions.length}
                </p>
            </div>
            <div 
                className={`text-3xl font-mono font-bold px-4 py-2 rounded-lg border transition-all duration-500 ${
                    timeLeft < 60 
                    ? 'text-red-400 border-red-500/50 bg-red-900/20 animate-pulse' 
                    : 'text-white border-white/10 bg-gray-800/50'
                }`}
            >
                {formatTime(timeLeft)}
            </div>
        </div>

        {/* Card Body - Question */}
        <div className={`px-6 py-8 sm:px-10 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            {currentQuestion && (
                <div className="min-h-[400px] flex flex-col">
                    <div className="flex-grow">
                        <div className="flex gap-5 mb-8">
                            <div className="hidden sm:flex flex-shrink-0 w-12 h-12 items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-xl rounded-xl shadow-lg">
                                {currentQuestionIndex + 1}
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-medium text-white leading-relaxed">
                                    {currentQuestion.question}
                                </p>
                                <span className="inline-block mt-3 px-3 py-1 text-xs font-bold rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                                    {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Point' : 'Points'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                        {currentQuestion.options.map((option, optIndex) => {
                            const isSelected = answers[currentQuestionIndex] === option;
                            return (
                                <label 
                                    key={optIndex} 
                                    className={`relative flex items-center p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                                        isSelected 
                                        ? 'border-fuchsia-500 bg-fuchsia-900/20 shadow-lg shadow-fuchsia-500/10' 
                                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestionIndex}`}
                                        value={option}
                                        checked={isSelected}
                                        onChange={() => handleSelectAnswer(currentQuestionIndex, option)}
                                        className="sr-only"
                                    />
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${isSelected ? 'border-fuchsia-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                                        {isSelected && <div className="w-3 h-3 rounded-full bg-fuchsia-500"></div>}
                                    </div>
                                    <span className={`text-lg ${isSelected ? 'text-white font-medium' : 'text-gray-300 group-hover:text-white'}`}>{option}</span>
                                    
                                    {/* Glow effect on selection */}
                                    {isSelected && <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-fuchsia-400/50"></div>}
                                </label>
                            );
                        })}
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        {/* Card Footer - Navigation */}
        <div className="bg-gray-900/80 px-6 py-6 sm:px-10 border-t border-white/10 flex justify-between items-center">
            <button
                onClick={goToPrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center px-5 py-2.5 text-sm font-medium rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                Previous
            </button>

            {isLastQuestion ? (
                <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform hover:-translate-y-0.5 transition-all duration-300"
                >
                    Submit Quiz
                    <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </button>
            ) : (
                <button
                    onClick={goToNextQuestion}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-violet-500/20 text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transform hover:-translate-y-0.5 transition-all duration-300"
                >
                    Next Question
                    <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
            )}
        </div>
      </div>
      
      <Modal 
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            title="Submit Assessment"
        >
            <div className="text-gray-300">
                <p className="text-lg mb-2">Are you ready to submit?</p>
                <p className="text-sm text-gray-400 bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <span className="text-yellow-400 font-bold mr-2">Warning:</span>
                    You will not be able to change your answers after submitting.
                </p>
            </div>
            <div className="mt-8 flex justify-end space-x-4">
                <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                    Continue Reviewing
                </button>
                <button
                    onClick={handleConfirmSubmit}
                    className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-md text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all"
                >
                    Yes, Submit Now
                </button>
            </div>
        </Modal>
    </div>
  );
};

export default QuizTaker;