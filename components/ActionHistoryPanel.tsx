import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { Notification } from '../types';

interface ActionHistoryPanelProps {
    onClose?: () => void;
    contextId?: string; // Si se proporciona, muestra solo el historial de este contexto
    onNavigateToPedidoId?: (pedidoId: string) => void;
}

const ActionHistoryPanel: React.FC<ActionHistoryPanelProps> = ({ onClose, contextId, onNavigateToPedidoId }) => {
    const { notifications } = useNotifications();
    const { user } = useAuth();

    // Filtrar notificaciones si se especifica contextId (por ahora solo para pedidos)
    const filteredHistory = contextId
        ? notifications.filter(n => n.pedidoId === contextId)
        : notifications;

    const handleActionClick = (notification: Notification) => {
        if (!notification.pedidoId) return;
        if (!onNavigateToPedidoId) return;

        onClose?.();
        onNavigateToPedidoId(notification.pedidoId);
    };

    const getActionIcon = (type: string) => {
        const icons: Record<string, string> = {
            success: '✅',
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
        };

        return icons[type] || '📄';
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Hace un momento';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} h`;
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 w-80">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        📜 Historial de Actividad
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {contextId ? 'Contexto específico' : `${filteredHistory.length} movimientos recientes`}
                    </p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Cerrar panel"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto">
                {filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-500 dark:text-gray-400">
                            No hay actividad reciente
                        </p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {filteredHistory.map((notification, index) => {
                            // Detectar si la acción fue realizada por el usuario actual
                            const isMyAction = notification.metadata?.authorId && user?.id && String(notification.metadata.authorId) === String(user.id);

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleActionClick(notification)}
                                    role={notification.pedidoId && onNavigateToPedidoId ? 'button' : undefined}
                                    tabIndex={notification.pedidoId && onNavigateToPedidoId ? 0 : undefined}
                                    className={`p-3 rounded-lg border transition-all duration-200
                                        ${isMyAction
                                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                            : 'bg-white border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                                        }
                                        ${index === 0 ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                                        ${notification.pedidoId && onNavigateToPedidoId ? 'cursor-pointer hover:shadow-md' : ''}`}
                                >
                                    {/* Action Header */}
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="text-xl flex-shrink-0">{getActionIcon(notification.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate pr-1">
                                                        {notification.title}
                                                    </p>
                                                    {isMyAction && (
                                                        <span className="flex-shrink-0 text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                                                            Yo
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 break-words leading-snug">
                                                    {notification.message}
                                                </p>

                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                                                    <span className="opacity-70">👤</span>
                                                    {notification.metadata?.authorName || 'Sistema'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Details */}
                                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600/50">
                                        <span>{formatTimestamp(notification.timestamp)}</span>
                                        {notification.metadata?.categoria && (
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600/50 rounded capitalize">
                                                {notification.metadata.categoria}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Las notificaciones se guardan por 30 días.<br/>
                    Haz click para ver detalles.
                </div>
            </div>
        </div>
    );
};

export default ActionHistoryPanel;
