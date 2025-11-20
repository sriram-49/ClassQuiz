import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, Quiz, View } from '../../types';
import * as quizService from '../../services/quizService';
import Spinner from '../shared/Spinner';
import Modal from '../shared/Modal';

interface InstructorDashboardProps {
  currentUser: User;
  navigateTo: (view: View, data?: any) => void;
}

const DropdownMenuItem: React.FC<{ onClick: () => void; children: React.ReactNode; isDestructive?: boolean }> = ({ onClick, children, isDestructive = false }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-2 text-sm ${isDestructive ? 'text-red-400 hover:bg-red-900/30' : 'text-gray-200 hover:bg-violet-600/20 hover:text-white'} transition-colors`}
    role="menuitem"
  >
    {children}
  </button>
);

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ currentUser, navigateTo }) => {
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  
  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<{ url: string; code: string; topic: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied_link' | 'copied_code'>('idle');
  
  // State for search input and debounced value for filtering
  const [filterInput, setFilterInput] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  
  const [sortBy, setSortBy] = useState('createdAt_desc');
  
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchQuizzes = useCallback(async () => {
    const instructorQuizzes = await quizService.getQuizzesByInstructor(currentUser.id);
    setAllQuizzes(instructorQuizzes);
    setIsLoading(false);
  }, [currentUser.id]);
  
  useEffect(() => {
    setIsLoading(true);
    fetchQuizzes();
  }, [fetchQuizzes]);
  
  // Effect to debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedFilter(filterInput);
    }, 300);

    return () => {
        clearTimeout(handler);
    };
  }, [filterInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleArchive = async (quizId: number, status: boolean) => {
    await quizService.archiveQuiz(quizId, status);
    setOpenMenuId(null);
    fetchQuizzes();
  };
  
  const handleDuplicate = async (quizId: number) => {
    await quizService.duplicateQuiz(quizId);
    setOpenMenuId(null);
    fetchQuizzes();
  };

  const handleShare = (quiz: Quiz) => {
    const encoded = quizService.encodeQuizData(quiz);
    const url = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(encoded)}`;
    
    setShareData({
        url: url,
        code: encoded,
        topic: quiz.topic
    });
    setIsShareModalOpen(true);
    setOpenMenuId(null);
  };

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
      navigator.clipboard.writeText(text).then(() => {
          setCopyStatus(type === 'link' ? 'copied_link' : 'copied_code');
          setTimeout(() => setCopyStatus('idle'), 2000);
      }).catch(err => {
          console.error('Copy failed', err);
          // Fallback for manual copy handled by UI selection
      });
  };
  
  const displayedQuizzes = useMemo(() => {
    const filtered = allQuizzes
        .filter(quiz => !!quiz.isArchived === showArchived)
        .filter(quiz => quiz.topic.toLowerCase().includes(debouncedFilter.toLowerCase()));
    
    switch (sortBy) {
        case 'createdAt_asc':
            return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case 'topic_asc':
            return filtered.sort((a, b) => a.topic.localeCompare(b.topic));
        case 'topic_desc':
            return filtered.sort((a, b) => b.topic.localeCompare(a.topic));
        case 'questions_desc':
            return filtered.sort((a, b) => b.questions.length - a.questions.length);
        case 'questions_asc':
            return filtered.sort((a, b) => a.questions.length - b.questions.length);
        case 'createdAt_desc':
        default:
            return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [allQuizzes, showArchived, debouncedFilter, sortBy]);

  const EmptyState = () => {
    if (filterInput) {
      return (
        <>
          <h3 className="mt-4 text-lg font-medium text-white">No quizzes found</h3>
          <p className="mt-2 text-gray-400">Try adjusting your filter criteria.</p>
        </>
      );
    }
    if (showArchived) {
      return (
        <>
          <h3 className="mt-4 text-lg font-medium text-white">No archived quizzes</h3>
          <p className="mt-2 text-gray-400">You can archive quizzes from their action menu.</p>
        </>
      );
    }
    return (
      <>
        <h3 className="mt-4 text-lg font-medium text-white">No active quizzes</h3>
        <p className="mt-2 text-gray-400">Get started by creating a new quiz.</p>
      </>
    );
  };

  return (
    <div className="animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">My Quizzes</h2>
        <button
          onClick={() => navigateTo(View.CREATE_QUIZ)}
          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-violet-500/20 text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 focus:ring-offset-gray-900 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New Quiz
        </button>
      </div>

      {/* Controls Section */}
      <div className="bg-gray-900/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-1/3">
            <label htmlFor="filter-topic" className="sr-only">Filter by topic</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                id="filter-topic"
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                placeholder="Filter by topic..."
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
                <label htmlFor="sort-by" className="sr-only">Sort by</label>
                <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full sm:w-auto pl-3 pr-8 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none"
                >
                <option value="createdAt_desc">Most Recent</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="topic_asc">Topic (A-Z)</option>
                <option value="topic_desc">Topic (Z-A)</option>
                <option value="questions_desc">Most Questions</option>
                <option value="questions_asc">Fewest Questions</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            
            <div role="tablist" aria-label="Filter Quizzes" className="bg-gray-800/50 border border-gray-700 p-1 rounded-xl flex-shrink-0 flex">
                <button
                    role="tab"
                    aria-selected={!showArchived}
                    onClick={() => setShowArchived(false)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${!showArchived ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                    Active
                </button>
                <button
                    role="tab"
                    aria-selected={showArchived}
                    onClick={() => setShowArchived(true)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${showArchived ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                    Archived
                </button>
            </div>
            </div>
        </div>
      </div>


      {isLoading ? (
        <Spinner message="Loading quizzes..." />
      ) : displayedQuizzes.length === 0 ? (
        <div className="text-center bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl p-16">
            <div className="bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-violet-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
            </div>
            <EmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
            {displayedQuizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className={`group bg-gray-900/60 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-violet-500/10 hover:border-violet-500/30 transition-all duration-300 transform hover:-translate-y-1 ${openMenuId === quiz.id ? 'relative z-20' : 'relative z-0'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">{quiz.topic}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-2">
                             <span className="flex items-center">
                                <svg className="mr-1.5 h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {quiz.questions.length} Questions
                             </span>
                             <span className="flex items-center">
                                <svg className="mr-1.5 h-4 w-4 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {quiz.timerMinutes} min
                             </span>
                             <span className="flex items-center">
                                <svg className="mr-1.5 h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(quiz.createdAt).toLocaleDateString()}
                             </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-gray-800/80 px-3 py-1 rounded-lg border border-gray-700">
                             <span className="text-xs text-gray-400 uppercase tracking-wider mr-2">Code</span>
                             <span className="font-mono font-bold text-white tracking-widest text-lg">{quiz.quizCode}</span>
                        </div>

                        <div className="relative" ref={openMenuId === quiz.id ? menuRef : null}>
                            <button
                                onClick={() => setOpenMenuId(openMenuId === quiz.id ? null : quiz.id)}
                                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <span className="sr-only">Open options</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                            </button>
                            {openMenuId === quiz.id && (
                                <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl bg-gray-800 border border-gray-700 ring-1 ring-black ring-opacity-5 z-20 overflow-hidden animate-fade-in origin-top-right">
                                    <div className="py-1">
                                        <DropdownMenuItem onClick={() => { navigateTo(View.VIEW_QUIZ_RESULTS, quiz); setOpenMenuId(null); }}>View Results</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { navigateTo(View.VIEW_QUIZ, quiz); setOpenMenuId(null); }}>View Quiz</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicate(quiz.id)}>Duplicate</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleShare(quiz)}>Share Quiz</DropdownMenuItem>
                                        <div className="border-t border-gray-700 my-1" />
                                        {quiz.isArchived ? (
                                            <DropdownMenuItem onClick={() => handleToggleArchive(quiz.id, false)}>Unarchive</DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onClick={() => handleToggleArchive(quiz.id, true)} isDestructive>Archive</DropdownMenuItem>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            ))}
        </div>
      )}
      
      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Quiz">
        {shareData && (
            <div className="space-y-6">
                <p className="text-gray-300 text-sm">
                    Share <strong className="text-white">{shareData.topic}</strong> with your students. 
                </p>
                
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-2">Quiz Data Code</h4>
                    <p className="text-xs text-gray-400 mb-3">Copy this code and send it to your students to import the quiz.</p>
                    <textarea 
                        readOnly 
                        value={shareData.code} 
                        className="w-full h-24 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-xs text-gray-400 font-mono focus:outline-none resize-none"
                    />
                    <button 
                        onClick={() => copyToClipboard(shareData.code, 'code')}
                        className="mt-2 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium border border-gray-600"
                    >
                        {copyStatus === 'copied_code' ? 'Code Copied!' : 'Copy Quiz Data Code'}
                    </button>
                </div>
                
                <div className="flex justify-end">
                    <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-white text-sm">Close</button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default InstructorDashboard;