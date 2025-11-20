import React, { useState, useEffect } from 'react';
import { User, View, Quiz } from '../../types';
import * as quizService from '../../services/quizService';
import Spinner from '../shared/Spinner';
import Modal from '../shared/Modal';

interface StudentDashboardProps {
  currentUser: User;
  navigateTo: (view: View, data?: any) => void;
  onStartQuiz: (quiz: Quiz) => void;
  initialCode?: string | null;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser, navigateTo, onStartQuiz, initialCode }) => {
    const [quizCode, setQuizCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importDataString, setImportDataString] = useState('');
    const [importError, setImportError] = useState('');

    useEffect(() => {
        if (initialCode) {
            setQuizCode(initialCode);
        }
    }, [initialCode]);

    const handleJoinQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if(!quizCode.trim()) {
            setError("Please enter a quiz code.");
            setIsLoading(false);
            return;
        }

        try {
            const quiz = await quizService.getQuizByCode(quizCode);
            if (!quiz) {
                throw new Error("Quiz not found. If you are using a different device, please ask your instructor for a Share Link to import the quiz.");
            }

            const hasAttempted = await quizService.hasStudentAttemptedQuiz(currentUser.id, quiz.id);
            if (hasAttempted) {
                throw new Error("You have already attempted this quiz.");
            }

            onStartQuiz(quiz);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleManualImport = async () => {
        if (!importDataString.trim()) return;
        setImportError('');
        setIsLoading(true);
        
        try {
            const quizData = quizService.decodeQuizData(importDataString);
            if (!quizData) throw new Error("Invalid data code.");
            
            await quizService.importQuiz(quizData);
            setQuizCode(quizData.quizCode);
            setIsImportModalOpen(false);
            setImportDataString('');
            // Show brief success feedback in main UI logic if needed, or just autofill code
            setError(''); // Clear any previous errors
        } catch (err) {
            setImportError("Failed to import. The code might be corrupted.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="h-96 flex justify-center items-center"><Spinner message="Processing..." size="lg" /></div>
    }

    return (
        <div className="max-w-3xl mx-auto pt-10 animate-fade-in">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 mb-4">Ready to Learn?</h2>
                <p className="text-lg text-gray-300">Enter your code to start a new challenge.</p>
            </div>
            
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl shadow-violet-900/20 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/30 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-600/30 rounded-full blur-3xl pointer-events-none"></div>

                <form onSubmit={handleJoinQuiz} className="relative z-10 flex flex-col gap-6">
                    <div className="relative">
                        <label htmlFor="quiz-code" className="block text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2 text-center">Quiz Code</label>
                        <input 
                            type="text"
                            id="quiz-code"
                            value={quizCode}
                            onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                            placeholder="ABC123"
                            maxLength={6}
                            className="block w-full text-center text-4xl font-mono font-bold tracking-[0.3em] px-4 py-6 bg-gray-800/50 border-2 border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 uppercase"
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={!quizCode}
                        className="w-full py-4 px-6 rounded-xl shadow-xl shadow-fuchsia-500/20 text-lg font-bold text-white bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-gray-900 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        Enter Quiz
                    </button>
                </form>
                
                {/* Import Alternative */}
                <div className="relative z-10 mt-6 text-center">
                    <p className="text-gray-500 text-sm mb-2">Link didn't work?</p>
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="text-sm text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                    >
                        Import from Data Code
                    </button>
                </div>
                
                {error && <div role="alert" className="mt-6 bg-red-900/30 border border-red-500/50 text-red-200 text-sm p-4 rounded-xl text-center animate-pulse">{error}</div>}
            </div>

            <div className="text-center mt-12">
                <button 
                    onClick={() => navigateTo(View.PREVIOUS_SCORES)}
                    className="group inline-flex items-center font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                    View My Previous Scores 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
            
            {/* Import Modal */}
            <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Quiz Data">
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">Paste the raw quiz data code shared by your instructor here.</p>
                    <textarea
                        value={importDataString}
                        onChange={(e) => setImportDataString(e.target.value)}
                        className="w-full h-32 bg-gray-900 border border-gray-600 rounded p-3 text-xs text-gray-300 font-mono focus:outline-none focus:border-cyan-500"
                        placeholder="Paste code here..."
                    />
                    {importError && <p className="text-red-400 text-sm">{importError}</p>}
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                        <button 
                            onClick={handleManualImport}
                            disabled={!importDataString.trim()}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-bold disabled:opacity-50"
                        >
                            Import & Join
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StudentDashboard;