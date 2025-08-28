import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserInfo: React.FC = () => {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Administrador':
                return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
            case 'Supervisor':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
            case 'Operador':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };

    // Renderizar condicionalmente después de definir todos los hooks
    if (!user) {
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.displayName}
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                    </p>
                </div>
                <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {user.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {user.displayName}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    @{user.username}
                                </p>
                                <p className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getRoleColor(user.role)}`}>
                                    {user.role}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-2">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200 flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserInfo;
