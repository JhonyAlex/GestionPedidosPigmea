import { useCallback, useEffect, useState } from 'react';
import type { ActionHistoryEntry, ActionPayload, ActionType } from '../types';
import { actionHistoryDB } from '../services/actionHistory';
import { useAuth } from '../contexts/AuthContext';

export interface ActionHistoryState {
    historyCount: number;
}

export interface UseActionHistoryOptions {
    maxHistorySize?: number;
}

export const useActionHistory = (options: UseActionHistoryOptions = {}) => {
    const { user } = useAuth();
    const { maxHistorySize = 100 } = options;

    const [state, setState] = useState<ActionHistoryState>({
        historyCount: 0,
    });
    const [history, setHistory] = useState<ActionHistoryEntry[]>([]);

    const refreshHistory = useCallback(async () => {
        if (!user?.id) return;

        try {
            const userActions = await actionHistoryDB.getActionsByUser(user.id, maxHistorySize);
            setHistory(userActions);
            setState({ historyCount: userActions.length });
        } catch (error) {
            console.error('Error al refrescar historial:', error);
        }
    }, [user?.id, maxHistorySize]);

    useEffect(() => {
        const initDB = async () => {
            try {
                await actionHistoryDB.init();
                await actionHistoryDB.cleanOldActions(30);

                if (user?.id) {
                    await refreshHistory();
                } else {
                    setHistory([]);
                    setState({ historyCount: 0 });
                }
            } catch (error) {
                console.error('Error al inicializar IndexedDB:', error);
            }
        };

        initDB();
    }, [user?.id, refreshHistory]);

    const recordAction = useCallback(
        async (
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
                    description,
                };

                await actionHistoryDB.addAction(action);
                await refreshHistory();
            } catch (error) {
                console.error('Error al registrar acción:', error);
            }
        },
        [user, refreshHistory]
    );

    const getContextHistory = useCallback(async (contextId: string): Promise<ActionHistoryEntry[]> => {
        try {
            return await actionHistoryDB.getActionsByContext(contextId);
        } catch (error) {
            console.error('Error al obtener historial del contexto:', error);
            return [];
        }
    }, []);

    return {
        state,
        history,
        recordAction,
        getContextHistory,
        refreshHistory,
    };
};
