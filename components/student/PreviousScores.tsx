import React, { useState, useEffect, useCallback } from 'react';
import { User, View, Attempt } from '../../types';
import * as quizService from '../../services/quizService';
import Spinner from '../shared/Spinner';

interface PreviousScoresProps {
  currentUser: User;
  navigateTo: (view: View) => void;
}

type PopulatedAttempt = Attempt & { quizTopic: string };

const PreviousScores: React.FC<PreviousScoresProps> = ({ currentUser, navigateTo }) => {
  const [attempts, setAttempts] = useState<PopulatedAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    const studentAttempts = await quizService.getAttemptsForStudent(currentUser.id);
    setAttempts(studentAttempts);
    setIsLoading(false);
  }, [currentUser.id]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigateTo(View.STUDENT_DASHBOARD)} className="text-sm text-violet-600 dark:text-violet-400 hover:underline mb-4">&larr; Back to Dashboard</button>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">My Previous Scores</h2>

      {isLoading ? (
        <Spinner message="Loading your scores..." />
      ) : attempts.length === 0 ? (
        <div className="text-center bg-white dark:bg-gray-800 rounded-lg shadow p-12">
            <h3 className="text-sm font-medium text-gray-900 dark:text-violet-100">No quizzes taken yet</h3>
            <p className="mt-1 text-sm text-gray-500">Join a quiz from your dashboard to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <ul role="list" className="divide-y divide-gray-200 dark:divide-violet-800">
            {attempts.map(attempt => (
              <li key={attempt.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-gray-800 dark:text-violet-100 truncate">{attempt.quizTopic}</p>
                    <p className="text-lg font-semibold ml-4">
                       <span className={attempt.score / attempt.total >= 0.5 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {attempt.score} / {attempt.total}
                        </span>
                    </p>
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-violet-300">
                    <p>Submitted: {new Date(attempt.submittedAt).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PreviousScores;