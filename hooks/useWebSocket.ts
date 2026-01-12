import { useEffect, useState, useCallback } from 'react';
import { UserRole, Pedido } from '../types';
import webSocketService, { NotificationData, ConnectedUser } from '../services/websocket';

export interface UseWebSocketReturn {
  isConnected: boolean;
  notifications: NotificationData[];
  connectedUsers: ConnectedUser[];
  removeNotification: (id: string) => void;
  emitActivity: (activity: string, data?: any) => void;
  // Callbacks para sincronización de datos
  subscribeToPedidoCreated: (callback: (pedido: Pedido) => void) => () => void;
  subscribeToPedidoUpdated: (callback: (pedido: Pedido) => void) => () => void;
  subscribeToPedidoDeleted: (callback: (pedidoId: string) => void) => () => void;
  subscribeToPageReturn: (callback: () => void) => () => void;
}

export const useWebSocket = (userId: string, userRole: UserRole, displayName?: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Obtener datos iniciales
    setNotifications(webSocketService.getNotifications());
    setConnectedUsers(webSocketService.getConnectedUsers());

    // Suscribirse a notificaciones
    const unsubscribeNotifications = webSocketService.subscribeToNotifications((newNotifications) => {
      setNotifications(newNotifications);
    });

    // Suscribirse a usuarios conectados
    const unsubscribeUsers = webSocketService.subscribeToConnectedUsers((users) => {
      setConnectedUsers(users);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    // Verificar conexión y autenticar
    const connectionCheck = setInterval(() => {
      const connected = webSocketService.isSocketConnected();
      setIsConnected(connected);
      
      // Autenticar solo si está conectado pero no autenticado
      // ✅ NO autenticar si userId es 'guest-user' (esperar a que se cargue el usuario real)
      if (connected && !isAuthenticated && userId !== 'guest-user') {
        webSocketService.authenticate(userId, userRole, displayName);
        setIsAuthenticated(true);
      } else if (!connected) {
        setIsAuthenticated(false);
      }
    }, 2000); // Verificar cada 2 segundos en lugar de cada segundo

    return () => {
      clearInterval(connectionCheck);
    };
  }, [userId, userRole, displayName, isAuthenticated]);

  const removeNotification = useCallback((id: string) => {
    webSocketService.removeNotification(id);
  }, []);

  const emitActivity = useCallback((activity: string, data?: any) => {
    webSocketService.emitActivity(activity, data);
  }, []);

  const subscribeToPageReturn = useCallback((callback: () => void) => {
    return webSocketService.subscribeToPageReturn(callback);
  }, []);

  return {
    isConnected,
    notifications,
    connectedUsers,
    removeNotification,
    emitActivity,
    // Callbacks para sincronización de datos
    subscribeToPedidoCreated: webSocketService.subscribeToPedidoCreated.bind(webSocketService),
    subscribeToPedidoUpdated: webSocketService.subscribeToPedidoUpdated.bind(webSocketService),
    subscribeToPedidoDeleted: webSocketService.subscribeToPedidoDeleted.bind(webSocketService),
    subscribeToPageReturn
  };
};
