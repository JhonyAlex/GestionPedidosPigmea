import { ActionHistoryEntry } from '../types';

async function addAction(action: ActionHistoryEntry): Promise<void> {
    const response = await fetch('/api/action-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al guardar acción: ${response.status}`);
    }
}

async function getActionsByContext(
    contextId: string,
    options?: { contextType?: string; limit?: number }
): Promise<ActionHistoryEntry[]> {
    const params = new URLSearchParams();
    if (options?.contextType) params.set('contextType', options.contextType);
    if (options?.limit) params.set('limit', String(options.limit));

    const qs = params.toString();
    const url = `/api/action-history/${encodeURIComponent(contextId)}${qs ? `?${qs}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Error al obtener historial del contexto: ${response.status}`);
    }

    return response.json();
}

async function getActionsByUser(userId: string, limit: number = 50): Promise<ActionHistoryEntry[]> {
    const url = `/api/action-history/user/${encodeURIComponent(userId)}?limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Error al obtener historial del usuario: ${response.status}`);
    }

    return response.json();
}

export const actionHistoryDB = { addAction, getActionsByContext, getActionsByUser };
