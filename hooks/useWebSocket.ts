import { useEffect, useState, useCallback } from 'react';
import { UserRole } from '../types';
import webSocketService, { NotificationData, ConnectedUser } from '../services/websocket';

export interface UseWebSocketReturn {
  isConnected: boolean;
  notifications: NotificationData[];
  connectedUsers: ConnectedUser[];
  removeNotification: (id: string) => void;
  emitActivity: (activity: string, data?: any) => void;
}

export const useWebSocket = (userId: string, userRole: UserRole): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  useEffect(() => {
    // Autenticar usuario cuando se conecte
    if (webSocketService.isSocketConnected()) {
      webSocketService.authenticate(userId, userRole);
      setIsConnected(true);
    }

    // Suscribirse a notificaciones
    const unsubscribeNotifications = webSocketService.subscribeToNotifications((newNotifications) => {
      setNotifications(newNotifications);
    });

    // Suscribirse a usuarios conectados
    const unsubscribeUsers = webSocketService.subscribeToConnectedUsers((users) => {
      setConnectedUsers(users);
    });

    // Obtener datos iniciales
    setNotifications(webSocketService.getNotifications());
    setConnectedUsers(webSocketService.getConnectedUsers());

    // Verificar conexión periódicamente
    const connectionCheck = setInterval(() => {
      const connected = webSocketService.isSocketConnected();
      setIsConnected(connected);
      
      // Re-autenticar si se reconectó
      if (connected && !isConnected) {
        webSocketService.authenticate(userId, userRole);
      }
    }, 1000);

    return () => {
      unsubscribeNotifications();
      unsubscribeUsers();
      clearInterval(connectionCheck);
    };
  }, [userId, userRole, isConnected]);

  const removeNotification = useCallback((id: string) => {
    webSocketService.removeNotification(id);
  }, []);

  const emitActivity = useCallback((activity: string, data?: any) => {
    webSocketService.emitActivity(activity, data);
  }, []);

  return {
    isConnected,
    notifications,
    connectedUsers,
    removeNotification,
    emitActivity
  };
};
