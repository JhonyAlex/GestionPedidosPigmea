import React from 'react';
import { NotificationData } from '../services/websocket';

interface NotificationProps {
  notification: NotificationData;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationProps> = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/20 dark:border-green-600 dark:text-green-300';
      case 'info': return 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300';
      case 'warning': return 'bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-600 dark:text-yellow-300';
      case 'error': return 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/20 dark:border-red-600 dark:text-red-300';
      default: return 'bg-gray-100 border-gray-400 text-gray-800 dark:bg-gray-900/20 dark:border-gray-600 dark:text-gray-300';
    }
  };

  return (
    <div className={`border-l-4 p-3 mb-2 rounded-r-lg shadow-sm transition-all duration-300 ${getColorClasses()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <span className="text-lg flex-shrink-0 mt-0.5">{getIcon()}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-xs mt-1 opacity-90">{notification.message}</p>
            <p className="text-xs mt-1 opacity-60">
              {new Date(notification.timestamp).toLocaleTimeString('es-ES')}
            </p>
          </div>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="ml-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
          title="Cerrar notificación"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

interface NotificationCenterProps {
  notifications: NotificationData[];
  onRemoveNotification: (id: string) => void;
  isConnected: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onRemoveNotification, 
  isConnected 
}) => {
  if (notifications.length === 0 && isConnected) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-h-96 overflow-y-auto">
      {/* Indicador de conexión */}
      <div className={`mb-2 px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 ${
        isConnected 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      }`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span>{isConnected ? 'Tiempo real activo' : 'Sin conexión en tiempo real'}</span>
      </div>
      
      {/* Notificaciones */}
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemoveNotification}
        />
      ))}
    </div>
  );
};

export default NotificationCenter;
