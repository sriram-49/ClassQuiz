import React from 'react';
import { Quiz, Question, View } from '../../types';

interface QuizViewerProps {
  quiz: Quiz;
  navigateTo: (view: View) => void;
}

const QuizViewer: React.FC<QuizViewerProps> = ({ quiz, navigateTo }) => {
  return (
    <div className="max-w-3xl mx-auto">
      <button 
        onClick={() => navigateTo(View.INSTRUCTOR_DASHBOARD)} 
        className="text-sm text-violet-600 dark:text-violet-400 hover:underline mb-4"
      >
        &larr; Back to Dashboard
      </button>
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{quiz.topic}</h2>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-violet-300">
            <span>{quiz.questions.length} Questions</span>
            <span>Total Marks: {quiz.totalMarks}</span>
            <span>Time Limit: {quiz.timerMinutes} minutes</span>
            <span>Quiz Code: <span className="font-mono bg-violet-100 dark:bg-violet-800 px-1 rounded">{quiz.quizCode}</span></span>
        </div>
      </div>

      <div className="space-y-6">
        {quiz.questions.map((question: Question, index: number) => {
          const correctOptionPrefix = question.answer.trim().toUpperCase() + ".";
          return (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex flex-1 min-w-0 items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-200 font-bold text-xl rounded-full">
                      {index + 1}
                      </div>
                      <p className="font-semibold text-lg text-gray-800 dark:text-violet-100 pt-1.5 break-words">
                      {question.question}
                      </p>
                  </div>
                  <div className="flex-shrink-0 pt-1.5">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                      </span>
                  </div>
              </div>
              <div className="space-y-4 pl-14">
                {question.options.map((option: string, optIndex: number) => {
                  const isCorrect = option.startsWith(correctOptionPrefix);
                  return (
                    <div
                      key={optIndex}
                      className={`flex items-center p-3 rounded-md border-2 ${
                        isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/40'
                          : 'border-gray-300 dark:border-violet-700'
                      }`}
                    >
                      <span className={`font-medium ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-gray-700 dark:text-violet-200'}`}>
                        {option}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
          <button 
            onClick={() => navigateTo(View.INSTRUCTOR_DASHBOARD)} 
            className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            Done
          </button>
      </div>
    </div>
  );
};

export default QuizViewer;
