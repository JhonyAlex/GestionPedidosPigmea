import { useCallback, useEffect, useState } from 'react';
import type { ActionHistoryEntry, ActionPayload, ActionType } from '../types';
import { actionHistoryDB } from '../services/actionHistory';
import { useAuth } from '../contexts/AuthContext';

export interface ActionHistoryState {
    historyCount: number;
    unreadCount: number;
}

export interface UseActionHistoryOptions {
    maxHistorySize?: number;
}

export const useActionHistory = (options: UseActionHistoryOptions = {}) => {
    const { user } = useAuth();
    const { maxHistorySize = 100 } = options;

    const getLastSeenKey = useCallback(() => {
        if (!user?.id) return null;
        return `actionHistory.lastSeen.${user.id}`;
    }, [user?.id]);

    const getLastSeenTimestamp = useCallback((): string | null => {
        const key = getLastSeenKey();
        if (!key) return null;
        if (typeof window === 'undefined') return null;

        const value = window.localStorage.getItem(key);
        return value && value.length > 0 ? value : null;
    }, [getLastSeenKey]);

    const [state, setState] = useState<ActionHistoryState>({
        historyCount: 0,
        unreadCount: 0,
    });
    const [history, setHistory] = useState<ActionHistoryEntry[]>([]);

    const refreshHistory = useCallback(async () => {
        if (!user?.id) return;

        try {
            const userActions = await actionHistoryDB.getActionsByUser(user.id, maxHistorySize);
            setHistory(userActions);

            const lastSeen = getLastSeenTimestamp();
            const unreadCount = lastSeen
                ? userActions.filter(a => a.timestamp > lastSeen).length
                : userActions.length;

            setState({
                historyCount: userActions.length,
                unreadCount,
            });
        } catch (error) {
            console.error('Error al refrescar historial:', error);
        }
    }, [user?.id, maxHistorySize, getLastSeenTimestamp]);

    useEffect(() => {
        const initDB = async () => {
            try {
                await actionHistoryDB.init();
                await actionHistoryDB.cleanOldActions(30);

                if (user?.id) {
                    await refreshHistory();
                } else {
                    setHistory([]);
                    setState({ historyCount: 0, unreadCount: 0 });
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

    const markAllAsRead = useCallback(async () => {
        const key = getLastSeenKey();
        if (!key) return;
        if (typeof window === 'undefined') return;

        try {
            const latestTimestamp = history[0]?.timestamp ?? new Date().toISOString();
            window.localStorage.setItem(key, latestTimestamp);
            setState(prev => ({ ...prev, unreadCount: 0 }));
        } catch (error) {
            console.error('Error al marcar historial como leído:', error);
        }
    }, [getLastSeenKey, history]);

    return {
        state,
        history,
        recordAction,
        getContextHistory,
        markAllAsRead,
        refreshHistory,
    };
};
