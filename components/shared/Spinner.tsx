import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', message }) => {
    // Sizes for the container
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-14 h-14',
        lg: 'w-20 h-20'
    };
    
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-10 animate-fade-in">
            <div className={`relative ${sizeClasses[size]}`}>
                <div className="absolute w-full h-full border-4 border-cyan-500/30 rounded-full"></div>
                <div className="absolute w-full h-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute top-1 left-1 right-1 bottom-1 border-4 border-fuchsia-500/30 rounded-full"></div>
                <div className="absolute top-1 left-1 right-1 bottom-1 border-4 border-b-fuchsia-500 border-t-transparent border-l-transparent border-r-transparent rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>
            </div>
            {message && (
                <p className="text-cyan-200 font-medium text-lg animate-pulse tracking-wide">
                    {message}
                </p>
            )}
        </div>
    );
};

export default Spinner;