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

const deduplicateHistory = (actions: ActionHistoryEntry[]): ActionHistoryEntry[] => {
    const grouped = new Map<string, ActionHistoryEntry[]>();

    for (const action of actions) {
        const sec = action.timestamp?.substring(0, 19) || '';
        const detailFingerprint = action.payload?.summary?.details || action.description || '';
        const key = `${action.contextType}|${action.contextId}|${sec}|${action.type}|${action.userId}|${detailFingerprint}`;
        const group = grouped.get(key) || [];
        group.push(action);
        grouped.set(key, group);
    }

    const deduped: ActionHistoryEntry[] = [];

    for (const group of grouped.values()) {
        if (group.length === 1) {
            deduped.push(group[0]);
            continue;
        }

        const frontend = group.find(a => a.source === 'frontend');
        deduped.push(frontend || group[0]);
    }

    return deduped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

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
            const deduped = deduplicateHistory(userActions);
            setHistory(deduped);

            setState({
                historyCount: deduped.length,
            });
        } catch (error) {
            console.error('Error al refrescar historial:', error);
        }
    }, [user?.id, maxHistorySize]);

    useEffect(() => {
        if (user?.id) {
            refreshHistory();
        } else {
            setHistory([]);
            setState({ historyCount: 0 });
        }
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
                console.warn('Usuario no autenticado, no se puede registrar accion');
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
                console.error('Error al registrar accion:', error);
            }
        },
        [user, refreshHistory]
    );

    const getContextHistory = useCallback(async (contextId: string): Promise<ActionHistoryEntry[]> => {
        try {
            const contextActions = await actionHistoryDB.getActionsByContext(contextId);
            return deduplicateHistory(contextActions);
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
