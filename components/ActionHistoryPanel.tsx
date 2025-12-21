import React, { useState, useEffect } from 'react';
import { ActionHistoryEntry } from '../types';
import { useActionHistory } from '../hooks/useActionHistory';

interface ActionHistoryPanelProps {
    onClose?: () => void;
    contextId?: string; // Si se proporciona, muestra solo el historial de este contexto
    onNavigateToPedidoId?: (pedidoId: string) => void;
}

const ActionHistoryPanel: React.FC<ActionHistoryPanelProps> = ({ onClose, contextId, onNavigateToPedidoId }) => {
    const { history, state, getContextHistory } = useActionHistory();
    const [filteredHistory, setFilteredHistory] = useState<ActionHistoryEntry[]>([]);

    useEffect(() => {
        const loadHistory = async () => {
            if (contextId) {
                const contextActions = await getContextHistory(contextId);
                setFilteredHistory(contextActions);
            } else {
                setFilteredHistory(history);
            }
        };

        loadHistory();
    }, [contextId, history, getContextHistory]);

    const handleActionClick = (action: ActionHistoryEntry) => {
        if (action.contextType !== 'pedido') return;
        if (!onNavigateToPedidoId) return;

        onClose?.();
        onNavigateToPedidoId(action.contextId);
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
                        📜 Historial de Acciones
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {contextId ? 'Contexto específico' : `${state.historyCount} acciones registradas`}
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
                            No hay acciones en el historial
                        </p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {filteredHistory.map((action, index) => (
                            <div
                                key={action.id}
                                onClick={() => handleActionClick(action)}
                                role={action.contextType === 'pedido' && onNavigateToPedidoId ? 'button' : undefined}
                                tabIndex={action.contextType === 'pedido' && onNavigateToPedidoId ? 0 : undefined}
                                className={`p-3 rounded-lg border transition-all duration-200
                                    bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600
                                    ${index === 0 ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                                    ${action.contextType === 'pedido' && onNavigateToPedidoId ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600/60' : ''}`}
                            >
                                {/* Action Header */}
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

                                {/* Action Details */}
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
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Tip: haz click en una acción de tipo <span className="font-medium">pedido</span> para ir al pedido.
                </div>
            </div>
        </div>
    );
};

export default ActionHistoryPanel;
