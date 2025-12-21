import { useState, useEffect, useCallback } from 'react';
import { ActionHistoryEntry, ActionType, ActionStatus, UndoRedoState, ActionPayload } from '../types';
import { actionHistoryDB } from '../services/actionHistory';
import { useAuth } from '../contexts/AuthContext';

export interface UseUndoRedoOptions {
    onUndo?: (action: ActionHistoryEntry) => Promise<void>;
    onRedo?: (action: ActionHistoryEntry) => Promise<void>;
    maxHistorySize?: number; // Número máximo de acciones en historial
}

export const useUndoRedo = (options: UseUndoRedoOptions = {}) => {
    const { user } = useAuth();
    const [state, setState] = useState<UndoRedoState>({
        canUndo: false,
        canRedo: false,
        historyCount: 0,
        lastAction: undefined,
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [history, setHistory] = useState<ActionHistoryEntry[]>([]);

    const { onUndo, onRedo, maxHistorySize = 100 } = options;

    /**
     * Inicializa IndexedDB al montar el componente
     */
    useEffect(() => {
        const initDB = async () => {
            try {
                await actionHistoryDB.init();
                console.log('✅ IndexedDB inicializada para undo/redo');
                
                // Limpiar acciones antiguas (más de 30 días)
                await actionHistoryDB.cleanOldActions(30);
                
                // Cargar historial inicial
                if (user?.id) {
                    await refreshHistory();
                }
            } catch (error) {
                console.error('Error al inicializar IndexedDB:', error);
            }
        };

        initDB();
    }, [user?.id]);

    /**
     * Refresca el estado del historial
     */
    const refreshHistory = useCallback(async () => {
        if (!user?.id) return;

        try {
            const userActions = await actionHistoryDB.getActionsByUser(user.id, maxHistorySize);
            setHistory(userActions);

            const lastApplied = await actionHistoryDB.getLastAppliedAction(user.id);
            const lastUndone = await actionHistoryDB.getLastUndoneAction(user.id);

            setState({
                canUndo: lastApplied !== null,
                canRedo: lastUndone !== null,
                historyCount: userActions.length,
                lastAction: lastApplied || undefined,
            });
        } catch (error) {
            console.error('Error al refrescar historial:', error);
        }
    }, [user?.id, maxHistorySize]);

    /**
     * Registra una nueva acción en el historial
     */
    const recordAction = useCallback(async (
        contextId: string,
        contextType: 'pedido' | 'cliente' | 'vendedor' | 'material',
        type: ActionType,
        payload: ActionPayload,
        description: string
    ): Promise<void> => {
        if (!user?.id || !user?.username) {
            console.warn('Usuario no autenticado, no se puede registrar acción');
            return;
        }

        try {
            const action: ActionHistoryEntry = {
                id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                contextId,
                contextType,
                type,
                payload,
                timestamp: new Date().toISOString(),
                userId: user.id,
                userName: user.displayName || user.username,
                status: 'applied',
                description,
            };

            await actionHistoryDB.addAction(action);
            await refreshHistory();

            console.log('✅ Acción registrada:', action.description);
        } catch (error) {
            console.error('Error al registrar acción:', error);
        }
    }, [user, refreshHistory]);

    /**
     * Deshace la última acción aplicada
     */
    const undo = useCallback(async (): Promise<boolean> => {
        if (!user?.id || !state.canUndo || isProcessing) {
            return false;
        }

        setIsProcessing(true);

        try {
            const lastApplied = await actionHistoryDB.getLastAppliedAction(user.id);
            
            if (!lastApplied) {
                console.warn('No hay acciones para deshacer');
                return false;
            }

            console.log('⏪ Deshaciendo acción:', lastApplied.description);

            // Ejecutar callback personalizado si existe
            if (onUndo) {
                await onUndo(lastApplied);
            }

            // Actualizar estado de la acción a 'undone'
            await actionHistoryDB.updateActionStatus(lastApplied.id, 'undone');
            await refreshHistory();

            console.log('✅ Acción deshecha correctamente');
            return true;
        } catch (error) {
            console.error('Error al deshacer acción:', error);
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [user?.id, state.canUndo, isProcessing, onUndo, refreshHistory]);

    /**
     * Rehace la última acción deshecha
     */
    const redo = useCallback(async (): Promise<boolean> => {
        if (!user?.id || !state.canRedo || isProcessing) {
            return false;
        }

        setIsProcessing(true);

        try {
            const lastUndone = await actionHistoryDB.getLastUndoneAction(user.id);
            
            if (!lastUndone) {
                console.warn('No hay acciones para rehacer');
                return false;
            }

            console.log('⏩ Rehaciendo acción:', lastUndone.description);

            // Ejecutar callback personalizado si existe
            if (onRedo) {
                await onRedo(lastUndone);
            }

            // Actualizar estado de la acción a 'applied'
            await actionHistoryDB.updateActionStatus(lastUndone.id, 'applied');
            await refreshHistory();

            console.log('✅ Acción rehecha correctamente');
            return true;
        } catch (error) {
            console.error('Error al rehacer acción:', error);
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [user?.id, state.canRedo, isProcessing, onRedo, refreshHistory]);

    /**
     * Marca una acción como conflictiva (cuando otro usuario modificó el recurso)
     */
    const markAsConflicted = useCallback(async (actionId: string): Promise<void> => {
        try {
            await actionHistoryDB.updateActionStatus(actionId, 'conflicted');
            await refreshHistory();
            console.warn('⚠️ Acción marcada como conflictiva:', actionId);
        } catch (error) {
            console.error('Error al marcar acción como conflictiva:', error);
        }
    }, [refreshHistory]);

    /**
     * Purga el historial de un contexto específico
     * Se llama cuando un recurso es eliminado o modificado externamente
     */
    const purgeContext = useCallback(async (contextId: string): Promise<void> => {
        try {
            const deletedCount = await actionHistoryDB.purgeActionsByContext(contextId);
            await refreshHistory();
            console.log(`🗑️ Purgadas ${deletedCount} acciones del contexto ${contextId}`);
        } catch (error) {
            console.error('Error al purgar contexto:', error);
        }
    }, [refreshHistory]);

    /**
     * Obtiene el historial de un contexto específico
     */
    const getContextHistory = useCallback(async (contextId: string): Promise<ActionHistoryEntry[]> => {
        try {
            return await actionHistoryDB.getActionsByContext(contextId);
        } catch (error) {
            console.error('Error al obtener historial del contexto:', error);
            return [];
        }
    }, []);

    /**
     * Limpia todo el historial (útil para debug)
     */
    const clearHistory = useCallback(async (): Promise<void> => {
        try {
            await actionHistoryDB.clearAll();
            await refreshHistory();
            console.log('🗑️ Historial limpiado completamente');
        } catch (error) {
            console.error('Error al limpiar historial:', error);
        }
    }, [refreshHistory]);

    return {
        // Estado
        state,
        history,
        isProcessing,

        // Acciones
        recordAction,
        undo,
        redo,
        markAsConflicted,
        purgeContext,
        getContextHistory,
        clearHistory,
        refreshHistory,
    };
};
