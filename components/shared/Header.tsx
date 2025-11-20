import React from 'react';
import { User, Role, View } from '../../types';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  navigateTo: (view: View) => void;
}

// A reusable NavLink component with glow effect
const NavLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="relative px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-300 rounded-lg group hover:text-white overflow-hidden"
  >
    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></span>
    <span className="relative">{children}</span>
    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
  </button>
);


const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, navigateTo }) => {
  const handleLogoClick = () => {
    if (currentUser) {
      const dashboardView = currentUser.role === Role.INSTRUCTOR ? View.INSTRUCTOR_DASHBOARD : View.STUDENT_DASHBOARD;
      navigateTo(dashboardView);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/70 border-b border-white/10 shadow-lg supports-[backdrop-filter]:bg-gray-900/30">
      <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={handleLogoClick}
          role="button"
          aria-label="Go to dashboard"
        >
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2 rounded-lg shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all duration-300 transform group-hover:rotate-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">Class</span>
                <span className="text-white">Quiz</span>
            </h1>
        </div>
        
        {currentUser && (
          <div className="flex items-center space-x-2 sm:space-x-6">
            <nav className="hidden md:flex items-center space-x-1">
                {currentUser.role === Role.INSTRUCTOR && (
                    <>
                        <NavLink onClick={() => navigateTo(View.INSTRUCTOR_DASHBOARD)}>Dashboard</NavLink>
                        <NavLink onClick={() => navigateTo(View.CREATE_QUIZ)}>Create Quiz</NavLink>
                    </>
                )}
                {currentUser.role === Role.STUDENT && (
                    <>
                        <NavLink onClick={() => navigateTo(View.STUDENT_DASHBOARD)}>Dashboard</NavLink>
                        <NavLink onClick={() => navigateTo(View.PREVIOUS_SCORES)}>My Scores</NavLink>
                    </>
                )}
            </nav>

            <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs text-gray-400">Welcome back,</span>
                    <span className="text-sm font-semibold text-white">{currentUser.name}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-full hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Logout
                </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;