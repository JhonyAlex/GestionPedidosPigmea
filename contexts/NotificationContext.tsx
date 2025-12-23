import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, NotificationContextType } from '../types';
import { useAuth } from './AuthContext';
import websocketService from '../services/websocket';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications debe ser usado dentro de NotificationProvider');
    }
    return context;
};

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // Función para obtener headers de autenticación
    const getAuthHeaders = useCallback(() => {
        if (!user) return {};
        return {
            'x-user-id': String(user.id),
            'x-user-role': user.role || 'OPERATOR',
            'Content-Type': 'application/json'
        };
    }, [user]);

    // Cargar notificaciones desde el backend
    const refreshNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/notifications`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
            // No lanzar error, solo mantener el estado actual
        } finally {
            setLoading(false);
        }
    }, [user, getAuthHeaders]);

    // Cargar notificaciones iniciales
    useEffect(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    // Añadir notificación (desde WebSocket)
    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            read: false
        };

        setNotifications(prev => {
            // Añadir al principio y mantener solo las últimas 50
            const updated = [newNotification, ...prev];
            return updated.slice(0, 50);
        });
    }, []);

    // Marcar notificación como leída
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Actualizar estado local
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            throw error;
        }
    }, [user, getAuthHeaders]);

    // Marcar todas como leídas
    const markAllAsRead = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Actualizar estado local
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        } catch (error) {
            console.error('Error al marcar todas las notificaciones como leídas:', error);
            throw error;
        }
    }, [user, getAuthHeaders]);

    // Eliminar notificación
    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Actualizar estado local
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
            throw error;
        }
    }, [user, getAuthHeaders]);

    // Calcular contador de no leídas
    const unreadCount = notifications.filter(n => !n.read).length;

    // Escuchar eventos de WebSocket
    useEffect(() => {
        if (!user) return;

        let socket: ReturnType<typeof websocketService.getSocket> | null = null;
        try {
            // Intentar obtener el socket, podría no estar conectado aún
            if (websocketService.isWebSocketConnected()) {
                socket = websocketService.getSocket();
            }
        } catch (e) {
            console.debug('Socket no inicializado en NotificationContext');
        }

        const handleNewNotification = (notification: Notification) => {
            console.log('🔔 Nueva notificación recibida:', notification);
            setNotifications(prev => {
                // Evitar duplicados si ya existe por ID
                if (prev.some(n => n.id === notification.id)) return prev;

                const updated = [notification, ...prev];
                return updated.slice(0, 50);
            });
        };

        const handleNotificationRead = (data: { notificationId: string }) => {
            console.log('🔔 Notificación marcada como leída:', data.notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === data.notificationId ? { ...n, read: true } : n)
            );
        };

        const handleNotificationsReadAll = () => {
            console.log('🔔 Todas las notificaciones marcadas como leídas');
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        };

        const handleNotificationDeleted = (data: { notificationId: string }) => {
            console.log('🔔 Notificación eliminada:', data.notificationId);
            setNotifications(prev => prev.filter(n => n.id !== data.notificationId));
        };

        if (socket) {
            socket.on('notification', handleNewNotification);
            socket.on('notification-read', handleNotificationRead);
            socket.on('notifications-read-all', handleNotificationsReadAll);
            socket.on('notification-deleted', handleNotificationDeleted);
        }

        // Por ahora, solo refrescamos periódicamente si el usuario está activo
        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                refreshNotifications();

                // Intentar reconectar listeners si el socket se conectó después
                if (!socket && websocketService.isWebSocketConnected()) {
                    try {
                        socket = websocketService.getSocket();
                        socket.on('notification', handleNewNotification);
                        socket.on('notification-read', handleNotificationRead);
                        socket.on('notifications-read-all', handleNotificationsReadAll);
                        socket.on('notification-deleted', handleNotificationDeleted);
                    } catch (e) {
                        // Ignorar
                    }
                }
            }
        }, 30000); // Refrescar cada 30 segundos si la pestaña está visible

        return () => {
            clearInterval(intervalId);
            if (socket) {
                socket.off('notification', handleNewNotification);
                socket.off('notification-read', handleNotificationRead);
                socket.off('notifications-read-all', handleNotificationsReadAll);
                socket.off('notification-deleted', handleNotificationDeleted);
            }
        };
    }, [user, refreshNotifications]);

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        loading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;
