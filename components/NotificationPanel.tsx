import React, { useState } from 'react';
import { Notification } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDateDDMMYYYY } from '../utils/date';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToPedido?: (pedidoId: string) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, onNavigateToPedido }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleNotificationClick = async (notification: Notification) => {
        // Marcar como leída si no lo está
        if (!notification.read) {
            try {
                await markAsRead(notification.id);
            } catch (error) {
                console.error('Error al marcar como leída:', error);
            }
        }

        // Navegar al pedido si existe
        if (notification.pedidoId && onNavigateToPedido) {
            onNavigateToPedido(notification.pedidoId);
            onClose(); // Cerrar el panel después de navegar
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation(); // Evitar que se active el click del contenedor
        setDeletingId(notificationId);
        
        try {
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return '✅';
            case 'info':
                return 'ℹ️';
            case 'warning':
                return '⚠️';
            case 'error':
                return '❌';
            default:
                return 'ℹ️';
        }
    };

    const getNotificationColor = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return 'border-green-500 dark:border-green-400';
            case 'info':
                return 'border-blue-500 dark:border-blue-400';
            case 'warning':
                return 'border-yellow-500 dark:border-yellow-400';
            case 'error':
                return 'border-red-500 dark:border-red-400';
            default:
                return 'border-gray-500 dark:border-gray-400';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInMs = now.getTime() - date.getTime();
            const diffInMinutes = Math.floor(diffInMs / 60000);
            const diffInHours = Math.floor(diffInMs / 3600000);
            const diffInDays = Math.floor(diffInMs / 86400000);

            if (diffInMinutes < 1) {
                return 'Ahora mismo';
            } else if (diffInMinutes < 60) {
                return `Hace ${diffInMinutes} min`;
            } else if (diffInHours < 24) {
                return `Hace ${diffInHours} h`;
            } else if (diffInDays === 1) {
                return 'Ayer';
            } else if (diffInDays < 7) {
                return `Hace ${diffInDays} días`;
            } else {
                return formatDateDDMMYYYY(timestamp) + ' ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            }
        } catch (error) {
            return timestamp;
        }
    };

    return (
        <>
            {/* Overlay oscuro */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-40 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Panel lateral */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header del panel */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            Notificaciones
                        </h2>
                        {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        aria-label="Cerrar panel"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Botones de acción */}
                {notifications.length > 0 && (
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <button
                            onClick={handleMarkAllRead}
                            disabled={unreadCount === 0}
                            className="w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Marcar todas como leídas
                        </button>
                    </div>
                )}

                {/* Lista de notificaciones */}
                <div className="overflow-y-auto h-[calc(100vh-120px)] p-2">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No hay notificaciones</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Los cambios en pedidos aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`relative p-3 rounded-lg border-l-4 ${getNotificationColor(notification.type)} ${
                                        notification.read
                                            ? 'bg-white dark:bg-gray-800 opacity-75'
                                            : 'bg-blue-50 dark:bg-blue-900/20'
                                    } ${
                                        notification.pedidoId
                                            ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]'
                                            : ''
                                    } transition-all duration-200`}
                                >
                                    {/* Badge "NUEVO" */}
                                    {!notification.read && (
                                        <div className="absolute top-2 right-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                                                NUEVO
                                            </span>
                                        </div>
                                    )}

                                    {/* Contenido de la notificación */}
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                    {notification.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 break-words mb-2">
                                                {notification.message}
                                            </p>
                                            
                                            {/* Metadata adicional */}
                                            {notification.metadata && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {notification.metadata.cliente && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                            👤 {notification.metadata.cliente}
                                                        </span>
                                                    )}
                                                    {notification.metadata.prioridad && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                            🎯 {notification.metadata.prioridad}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Footer: Timestamp y botón eliminar */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatTimestamp(notification.timestamp)}
                                                </span>
                                                <button
                                                    onClick={(e) => handleDelete(e, notification.id)}
                                                    disabled={deletingId === notification.id}
                                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                                                    aria-label="Eliminar notificación"
                                                >
                                                    {deletingId === notification.id ? (
                                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Indicador de click para navegar */}
                                    {notification.pedidoId && (
                                        <div className="absolute bottom-1 right-2 text-gray-400 dark:text-gray-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationPanel;
