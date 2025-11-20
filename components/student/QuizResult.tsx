import React from 'react';
import { QuizResultData, View } from '../../types';

interface QuizResultProps {
    result: QuizResultData;
    navigateTo: (view: View) => void;
}

const QuizResult: React.FC<QuizResultProps> = ({ result, navigateTo }) => {
    const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    const isPass = percentage >= 50;

    return (
        <div className="max-w-lg mx-auto text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg" aria-live="assertive">
            <h2 className="text-xl font-semibold text-gray-500 dark:text-violet-300 mb-2">Quiz Completed!</h2>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{result.quizTopic}</h3>

            <div className="mb-8">
                <div className={`mx-auto w-40 h-40 rounded-full flex items-center justify-center text-white ${isPass ? 'bg-green-500' : 'bg-red-500'}`}>
                    <div className="text-center">
                        <span className="text-5xl font-bold">{result.score}</span>
                        <span className="text-xl"> / {result.total}</span>
                    </div>
                </div>
                <p className={`mt-4 text-3xl font-bold ${isPass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {percentage}%
                </p>
            </div>

            <p className="text-gray-600 dark:text-violet-300 mb-8">
                {isPass ? "Great job! You passed the quiz." : "Keep practicing! You can do better next time."}
            </p>

            <button
                onClick={() => navigateTo(View.STUDENT_DASHBOARD)}
                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default QuizResult;