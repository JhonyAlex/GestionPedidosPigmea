import React, { useState, useEffect } from 'react';
import { ActionHistoryEntry, ActionStatus } from '../types';
import { useUndoRedo } from '../hooks/useUndoRedo';

interface ActionHistoryPanelProps {
    onClose?: () => void;
    contextId?: string; // Si se proporciona, muestra solo el historial de este contexto
}

const ActionHistoryPanel: React.FC<ActionHistoryPanelProps> = ({ onClose, contextId }) => {
    const { history, state, isProcessing, undo, redo, getContextHistory } = useUndoRedo();
    const [filteredHistory, setFilteredHistory] = useState<ActionHistoryEntry[]>([]);
    const [showUndoAnimation, setShowUndoAnimation] = useState(false);
    const [showRedoAnimation, setShowRedoAnimation] = useState(false);

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

    const handleUndo = async () => {
        setShowUndoAnimation(true);
        const success = await undo();
        if (success) {
            setTimeout(() => setShowUndoAnimation(false), 500);
        } else {
            setShowUndoAnimation(false);
        }
    };

    const handleRedo = async () => {
        setShowRedoAnimation(true);
        const success = await redo();
        if (success) {
            setTimeout(() => setShowRedoAnimation(false), 500);
        } else {
            setShowRedoAnimation(false);
        }
    };

    const getStatusBadge = (status: ActionStatus) => {
        const badges = {
            applied: { text: 'Aplicada', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
            undone: { text: 'Deshecha', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
            conflicted: { text: 'Conflicto', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
            pending: { text: 'Pendiente', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
        };

        const badge = badges[status] || badges.pending;

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                {badge.text}
            </span>
        );
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

            {/* Undo/Redo Controls */}
            <div className="flex gap-2 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleUndo}
                    disabled={!state.canUndo || isProcessing}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${state.canUndo && !isProcessing
                            ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                            : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                        }
                        ${showUndoAnimation ? 'animate-pulse' : ''}`}
                    title="Deshacer (Ctrl+Z)"
                >
                    <span className="text-lg">⏪</span>
                    <span>Deshacer</span>
                </button>

                <button
                    onClick={handleRedo}
                    disabled={!state.canRedo || isProcessing}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${state.canRedo && !isProcessing
                            ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                            : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                        }
                        ${showRedoAnimation ? 'animate-pulse' : ''}`}
                    title="Rehacer (Ctrl+Y)"
                >
                    <span className="text-lg">⏩</span>
                    <span>Rehacer</span>
                </button>
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
                                className={`p-3 rounded-lg border transition-all duration-200
                                    ${action.status === 'applied'
                                        ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                        : action.status === 'undone'
                                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                    }
                                    ${index === 0 ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                            >
                                {/* Action Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{getActionIcon(action.type)}</span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {action.description}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {action.userName}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(action.status)}
                                </div>

                                {/* Action Details */}
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>{formatTimestamp(action.timestamp)}</span>
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">
                                        {action.contextType}
                                    </span>
                                </div>

                                {/* Conflict Warning */}
                                {action.status === 'conflicted' && (
                                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-800 dark:text-red-200">
                                        ⚠️ Esta acción ha sido modificada por otro usuario y no se puede deshacer.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                        {state.canUndo ? '✅ Deshacer disponible' : '⚪ Sin acciones para deshacer'}
                    </span>
                    <span>
                        {state.canRedo ? '✅ Rehacer disponible' : '⚪ Sin acciones para rehacer'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ActionHistoryPanel;
