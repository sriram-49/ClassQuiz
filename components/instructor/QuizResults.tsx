import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, View, Attempt } from '../../types';
import * as quizService from '../../services/quizService';
import Spinner from '../shared/Spinner';
import Modal from '../shared/Modal';

interface QuizResultsProps {
  quiz: Quiz;
  navigateTo: (view: View) => void;
}

type PopulatedAttempt = Attempt & { studentName: string; registerNumber?: string };

const QuizResults: React.FC<QuizResultsProps> = ({ quiz, navigateTo }) => {
  const [attempts, setAttempts] = useState<PopulatedAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingAttempt, setViewingAttempt] = useState<PopulatedAttempt | null>(null);

  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    const quizAttempts = await quizService.getAttemptsForQuiz(quiz.id);
    setAttempts(quizAttempts);
    setIsLoading(false);
  }, [quiz.id]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Register Number,Score,Total,Submission Time\n";
    attempts.forEach(attempt => {
        const row = [
            `"${attempt.studentName}"`,
            attempt.registerNumber,
            attempt.score,
            attempt.total,
            `"${new Date(attempt.submittedAt).toLocaleString()}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quiz_${quiz.topic.replace(/\s+/g, '_')}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
          <button onClick={() => navigateTo(View.INSTRUCTOR_DASHBOARD)} className="text-sm text-violet-600 dark:text-violet-400 hover:underline mb-4">&larr; Back to Dashboard</button>
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
          <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{quiz.topic} - Results</h2>
              <p className="text-gray-500 dark:text-violet-300">Quiz Code: <span className="font-mono bg-violet-100 dark:bg-violet-800 px-1 rounded">{quiz.quizCode}</span></p>
          </div>
          {attempts.length > 0 && (
            <button
              onClick={downloadCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV
            </button>
          )}
        </div>

        {isLoading ? (
          <Spinner message="Loading results..." />
        ) : attempts.length === 0 ? (
          <div className="text-center bg-white dark:bg-gray-800 rounded-lg shadow p-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3v3m-3-3v3m-3-3v3M5 14v6a2 2 0 002 2h10a2 2 0 002-2v-6M5 10V6a2 2 0 012-2h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V10M9 10h6" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-violet-100">No submissions yet</h3>
              <p className="mt-1 text-sm text-gray-500">Check back later to see student results.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-violet-800">
              <thead className="bg-violet-50 dark:bg-violet-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-violet-300 uppercase tracking-wider">Student Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-violet-300 uppercase tracking-wider">Register No.</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-violet-300 uppercase tracking-wider">Score</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-violet-300 uppercase tracking-wider">Submitted At</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-violet-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-violet-800">
                {attempts.map(attempt => (
                  <tr key={attempt.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{attempt.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-violet-300">{attempt.registerNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          attempt.score / attempt.total >= 0.5 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                      }`}>
                        {attempt.score} / {attempt.total}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-violet-300">{new Date(attempt.submittedAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setViewingAttempt(attempt)}
                        className="text-violet-600 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-200"
                      >
                        View Answers
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal 
        isOpen={!!viewingAttempt} 
        onClose={() => setViewingAttempt(null)} 
        title={viewingAttempt ? `Answers for ${viewingAttempt.studentName}` : 'Answers'}
      >
        {viewingAttempt && (
            <>
                <div className="max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-6">
                        {quiz.questions.map((question, index) => {
                            const studentAnswer = viewingAttempt.answers[index];
                            const correctAnswerPrefix = question.answer.trim().toUpperCase() + ".";
                            
                            return (
                                <div key={index} className="border-b border-gray-200 dark:border-violet-800 pb-4 last:border-b-0">
                                    <p className="font-semibold text-gray-800 dark:text-violet-100 mb-3">
                                        {index + 1}. {question.question}
                                    </p>
                                    <div className="space-y-2">
                                        {question.options.map((option, optIndex) => {
                                            const isCorrect = option.startsWith(correctAnswerPrefix);
                                            const isSelected = studentAnswer === option;

                                            let styles = 'flex items-center justify-between p-3 rounded-md border text-sm ';
                                            if (isCorrect) {
                                                styles += 'bg-green-50 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-200';
                                            } else if (isSelected) { // and not correct
                                                styles += 'bg-red-50 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-200';
                                            } else {
                                                styles += 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-violet-700 text-gray-700 dark:text-violet-200';
                                            }
                                            
                                            return (
                                                <div key={optIndex} className={styles}>
                                                    <span>{option}</span>
                                                    {isSelected && !isCorrect && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    )}
                                                    {isCorrect && (
                                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {!studentAnswer && (
                                            <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium p-2 bg-yellow-50 dark:bg-yellow-900/40 rounded-md">No answer submitted for this question.</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => setViewingAttempt(null)}
                        className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                    >
                        Close
                    </button>
                </div>
            </>
        )}
      </Modal>
    </>
  );
};

export default QuizResults;