import React from 'react';

interface ThemeSwitcherProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.95-4.95.94-1.06c.412-.463.324-1.21-.139-1.543A4.5 4.5 0 0 0 7.5 12c0-2.486 2.014-4.5 4.5-4.5 1.51 0 2.84.74 3.682 1.875.463.412 1.21.324 1.543-.139l1.06-.94M15.75 7.5l-1.59-1.59M6 12H3.75m1.591-1.591L3.75 9" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
);


const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, toggleTheme }) => {
    return (
        <button
            onClick={toggleTheme}
            className="fixed bottom-5 right-5 z-50 p-3 rounded-full bg-gray-700 dark:bg-gray-200 text-yellow-400 dark:text-indigo-600 shadow-lg hover:scale-110 transition-transform duration-200"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
    );
};

export default ThemeSwitcher;
