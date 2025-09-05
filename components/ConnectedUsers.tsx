import React, { useState } from 'react';
import { ConnectedUser } from '../services/websocket';
import { UserRole } from '../types';

interface ConnectedUsersProps {
  users: ConnectedUser[];
  currentUser: string;
  isConnected: boolean;
}

const ConnectedUsers: React.FC<ConnectedUsersProps> = ({ users, currentUser, isConnected }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Administrador': return '👑';
      case 'Supervisor': return '👨‍💼';
      case 'Operador': return '👷';
      default: return '👤';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'Administrador': return 'text-yellow-600 dark:text-yellow-400';
      case 'Supervisor': return 'text-purple-600 dark:text-purple-400';
      case 'Operador': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const joinTime = new Date(timestamp);
    const diffMs = now.getTime() - joinTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h`;
  };

  if (!isConnected) {
    return (
      <div className="fixed bottom-4 left-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm text-red-800 dark:text-red-300">Sin conexión en tiempo real</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {users.length} conectado{users.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-gray-400 text-sm">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>

        {/* Lista expandida */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
            {users.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Solo tú estás conectado
              </div>
            ) : (
              users.map((user) => (
                <div 
                  key={user.userId}
                  className={`px-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                    user.userId === currentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getRoleIcon(user.userRole)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.userId}
                          {user.userId === currentUser && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(tú)</span>
                          )}
                        </div>
                        <div className={`text-xs ${getRoleColor(user.userRole)}`}>
                          {user.userRole}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getTimeAgo(user.joinedAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Información adicional */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-750 text-xs text-gray-600 dark:text-gray-400">
              💡 Los cambios se sincronizan automáticamente entre todos los usuarios
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectedUsers;
