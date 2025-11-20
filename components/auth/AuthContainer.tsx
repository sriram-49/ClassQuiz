import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import { User, Role } from '../../types';

interface AuthContainerProps {
  onLoginSuccess: (user: User) => void;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="max-w-md mx-auto mt-16 animate-slide-up">
      <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-75"></div>

        <div className="p-8">
            <div role="tablist" aria-label="Login or Sign Up" className="flex justify-center mb-8 bg-gray-800/50 p-1 rounded-full backdrop-blur-sm border border-white/5">
                <div className="relative flex w-full">
                    {/* Animated Background for Tabs - Simulated by changing classes */}
                    <button
                        role="tab"
                        aria-selected={isLoginView}
                        onClick={() => setIsLoginView(true)}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all duration-300 z-10 ${isLoginView ? 'text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30' : 'text-gray-400 hover:text-white'}`}
                    >
                        Login
                    </button>
                    <button
                        role="tab"
                        aria-selected={!isLoginView}
                        onClick={() => setIsLoginView(false)}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all duration-300 z-10 ${!isLoginView ? 'text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30' : 'text-gray-400 hover:text-white'}`}
                    >
                        Sign Up
                    </button>
                </div>
            </div>

            <div className="transition-all duration-500 ease-in-out">
                {isLoginView ? (
                    <Login onLoginSuccess={onLoginSuccess} />
                ) : (
                    <Signup onSignupSuccess={onLoginSuccess} />
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;