import type {
    ActionHistoryEntry,
    TrackingAuditFilters,
    TrackingAuditResponse,
} from '../types';

const TRACKING_AUDIT_ENDPOINT = '/api/pedidos/tracking/audit';
const TRACKING_AUDIT_DATE_FIELD = 'timestamp';

const appendQueryParam = (params: URLSearchParams, key: string, value?: string | number | null) => {
    if (value === undefined || value === null || value === '') {
        return;
    }

    params.set(key, String(value));
};

// Helper para obtener headers de autenticación desde localStorage
const getAuthHeaders = (): Record<string, string> => {
    if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('pigmea_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                return {
                    'Content-Type': 'application/json',
                    'x-user-id': String(user.id),
                    'x-user-role': user.role || 'OPERATOR'
                };
            } catch (error) {
                console.warn('Error parsing user from localStorage:', error);
            }
        }
    }
    return { 'Content-Type': 'application/json' };
};

async function addAction(action: ActionHistoryEntry): Promise<void> {
    const response = await fetch('/api/action-history', {
        method: 'POST',
        headers: getAuthHeaders(),
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

    const response = await fetch(url, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error(`Error al obtener historial del contexto: ${response.status}`);
    }

    return response.json();
}

async function getActionsByUser(userId: string, limit: number = 50): Promise<ActionHistoryEntry[]> {
    const url = `/api/action-history/user/${encodeURIComponent(userId)}?limit=${limit}`;

    const response = await fetch(url, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error(`Error al obtener historial del usuario: ${response.status}`);
    }

    return response.json();
}

export interface GlobalActionsResponse {
    actions: ActionHistoryEntry[];
    nextCursor: string | null;
    hasMore: boolean;
}

async function getGlobalActions(
    cursor?: string | null,
    limit: number = 50,
    signal?: AbortSignal,
    search?: string
): Promise<GlobalActionsResponse> {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);
    if (search) params.set('search', search);

    const url = `/api/action-history/global?${params.toString()}`;

    const response = await fetch(url, {
        headers: getAuthHeaders(),
        signal
    });

    if (!response.ok) {
        throw new Error(`Error al obtener historial global: ${response.status}`);
    }

    return response.json();
}

async function getTrackingAudit(
    filters: TrackingAuditFilters = {},
    signal?: AbortSignal
): Promise<TrackingAuditResponse> {
    const params = new URLSearchParams();

    params.set('dateField', TRACKING_AUDIT_DATE_FIELD);
    appendQueryParam(params, 'search', filters.search?.trim());
    appendQueryParam(params, 'stage', filters.stage?.trim());
    appendQueryParam(params, 'dateFrom', filters.dateFrom);
    appendQueryParam(params, 'dateTo', filters.dateTo);
    appendQueryParam(params, 'cursor', filters.cursor);
    appendQueryParam(params, 'limit', filters.limit);

    const response = await fetch(`${TRACKING_AUDIT_ENDPOINT}?${params.toString()}`, {
        headers: getAuthHeaders(),
        signal
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error fetching tracking audit: ${response.status}`);
    }

    return response.json();
}

export const actionHistoryDB = { addAction, getActionsByContext, getActionsByUser, getGlobalActions, getTrackingAudit };
