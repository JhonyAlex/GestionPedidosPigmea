import React, { useState, useEffect } from 'react';
import { Notification, ActionHistoryEntry } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import { useActionHistory } from '../hooks/useActionHistory';
import { formatDateDDMMYYYY } from '../utils/date';

interface ActivityPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToPedido?: (pedidoId: string, commentId?: string) => void;
}

type TabType = 'notifications' | 'history';

const ActivityPanel: React.FC<ActivityPanelProps> = ({ isOpen, onClose, onNavigateToPedido }) => {
    const [activeTab, setActiveTab] = useState<TabType>('notifications');
    
    // Hooks de notificaciones
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    
    // Hooks de historial
    const { history, state } = useActionHistory();
    
    // Límites
    const visibleNotifications = showAllNotifications ? notifications : notifications.slice(0, 20);
    const hasMoreNotifications = notifications.length > 20;
    const visibleHistory = history.slice(0, 50);

    // ============ NOTIFICACIONES - Handlers ============
    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            try {
                await markAsRead(notification.id);
            } catch (error) {
                console.error('Error al marcar como leída:', error);
            }
        }

        if (notification.pedidoId && onNavigateToPedido) {
            const commentId = notification.type === 'mention' && notification.metadata?.commentId 
                ? notification.metadata.commentId 
                : undefined;
            
            onNavigateToPedido(notification.pedidoId, commentId);
            onClose();
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
        e.stopPropagation();
        setDeletingId(notificationId);
        
        try {
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
        } finally {
            setDeletingId(null);
        }
    };

    // ============ HISTORIAL - Handlers ============
    const handleActionClick = (action: ActionHistoryEntry) => {
        if (action.contextType !== 'pedido') return;
        if (!onNavigateToPedido) return;

        onClose();
        onNavigateToPedido(action.contextId);
    };

    // ============ UI Helpers ============
    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return '✅';
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'mention': return '@';
            default: return 'ℹ️';
        }
    };

    const getNotificationColor = (type: Notification['type']) => {
        switch (type) {
            case 'success': return 'border-green-500 dark:border-green-400';
            case 'info': return 'border-blue-500 dark:border-blue-400';
            case 'warning': return 'border-yellow-500 dark:border-yellow-400';
            case 'error': return 'border-red-500 dark:border-red-400';
            case 'mention': return 'border-purple-500 dark:border-purple-400';
            default: return 'border-gray-500 dark:border-gray-400';
        }
    };

    const getActionIcon = (type: string) => {
        const icons = {
            CREATE: '➕',
            UPDATE: '✏️',
            DELETE: '🗑️',
            BULK_UPDATE: '📝',
            BULK_DELETE: '🗑️',
        };
        return icons[type as keyof typeof icons] || '📄';
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInMs = now.getTime() - date.getTime();
            const diffInMinutes = Math.floor(diffInMs / 60000);
            const diffInHours = Math.floor(diffInMs / 3600000);
            const diffInDays = Math.floor(diffInMs / 86400000);

            if (diffInMinutes < 1) return 'Ahora mismo';
            if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
            if (diffInHours < 24) return `Hace ${diffInHours} h`;
            if (diffInDays === 1) return 'Ayer';
            if (diffInDays < 7) return `Hace ${diffInDays} días`;
            return formatDateDDMMYYYY(timestamp) + ' ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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
                            🔔 Notificaciones y Actividad
                        </h2>
                        {unreadCount > 0 && activeTab === 'notifications' && (
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

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                            activeTab === 'notifications'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span>Menciones</span>
                            {unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {activeTab === 'notifications' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                            activeTab === 'history'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                    >
                        Historial
                        {activeTab === 'history' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                        )}
                    </button>
                </div>

                {/* Contenido según tab activo */}
                {activeTab === 'notifications' && (
                    <>
                        {/* Botones de acción para notificaciones */}
                        {notifications.length > 0 && (
                            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-2">
                                <button
                                    onClick={handleMarkAllRead}
                                    disabled={unreadCount === 0}
                                    className="w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Marcar todas como leídas
                                </button>
                                
                                {hasMoreNotifications && !showAllNotifications && (
                                    <button
                                        onClick={() => setShowAllNotifications(true)}
                                        className="w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        Ver más antiguas ({notifications.length - 20})
                                    </button>
                                )}
                                
                                {showAllNotifications && hasMoreNotifications && (
                                    <button
                                        onClick={() => setShowAllNotifications(false)}
                                        className="w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                        Mostrar menos
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Lista de notificaciones */}
                        <div className="overflow-y-auto h-[calc(100vh-200px)] p-2">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No hay menciones</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Cuando te mencionen aparecerá aquí</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {visibleNotifications.map((notification) => (
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
                                            {!notification.read && (
                                                <div className="absolute top-2 right-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                                                        NUEVO
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl flex-shrink-0 mt-0.5 bg-purple-100 dark:bg-purple-900/30 w-10 h-10 flex items-center justify-center rounded-full font-bold text-purple-600 dark:text-purple-400">
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
                                                    
                                                    {notification.metadata?.comment && (
                                                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 italic border-l-2 border-purple-400">
                                                            "{notification.metadata.comment}"
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatTimestamp(notification.timestamp)}
                                                        </span>
                                                        {notification.pedidoId && (
                                                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                                Click para ver →
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => handleDelete(e, notification.id)}
                                                    disabled={deletingId === notification.id}
                                                    className="flex-shrink-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                                    aria-label="Eliminar notificación"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'history' && (
                    <div className="overflow-y-auto h-[calc(100vh-150px)] p-2">
                        {visibleHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="text-6xl mb-4">📭</div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    No hay acciones en el historial
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {visibleHistory.map((action, index) => (
                                    <div
                                        key={action.id}
                                        onClick={() => handleActionClick(action)}
                                        role={action.contextType === 'pedido' && onNavigateToPedido ? 'button' : undefined}
                                        tabIndex={action.contextType === 'pedido' && onNavigateToPedido ? 0 : undefined}
                                        className={`p-3 rounded-lg border transition-all duration-200
                                            bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600
                                            ${index === 0 ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                                            ${action.contextType === 'pedido' && onNavigateToPedido ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600/60' : ''}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{getActionIcon(action.type)}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {action.payload?.summary?.title || action.description}
                                                    </p>
                                                    {action.payload?.summary?.details && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                                            {action.payload.summary.details}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {action.userName}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>{formatTimestamp(action.timestamp)}</span>
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">
                                                {action.contextType}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer con info */}
                        <div className="p-4 mt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                {state.historyCount} acciones registradas
                                <br />
                                <span className="text-gray-400 dark:text-gray-500">
                                    Click en una acción para ir al pedido
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ActivityPanel;
