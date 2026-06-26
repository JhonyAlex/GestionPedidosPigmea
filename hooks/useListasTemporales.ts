import { useState, useCallback, useEffect } from 'react';
import { Etapa } from '../types';

// Mapa: pedidoId → lista de etapas adicionales temporales (no incluye la etapa real del pedido, que siempre se deriva de etapaActual)
type ListasTemporalesMap = Record<string, Etapa[]>;
type ListasTemporalesUpdatedPayload = { pedidoId: string; etapas: Etapa[] };
type SubscribeToListasTemporales = (callback: (data: ListasTemporalesUpdatedPayload) => void) => () => void;

function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};

    const savedUser = localStorage.getItem('pigmea_user');
    if (!savedUser) return {};

    try {
        const user = JSON.parse(savedUser);
        const headers: Record<string, string> = {
            'x-user-id': String(user.id),
            'x-user-role': user.role || 'OPERATOR',
        };

        if (user.permissions && Array.isArray(user.permissions)) {
            headers['x-user-permissions'] = JSON.stringify(user.permissions);
        }

        return headers;
    } catch {
        return {};
    }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options.headers,
        },
        cache: 'no-cache',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido en la API' }));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

export function useListasTemporales(
    subscribeToListasTemporalesUpdated?: SubscribeToListasTemporales,
    enabled = true
) {
    const [map, setMap] = useState<ListasTemporalesMap>({});

    const replacePedidoInMap = useCallback((pedidoId: string, etapas: Etapa[]) => {
        setMap(prev => {
            const next = { ...prev };
            if (etapas.length === 0) {
                delete next[pedidoId];
            } else {
                next[pedidoId] = etapas;
            }
            return next;
        });
    }, []);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        apiFetch<ListasTemporalesMap>('/produccion/listas-temporales')
            .then(data => {
                if (!cancelled) setMap(data || {});
            })
            .catch(error => {
                if (!cancelled) console.error('Error cargando listas temporales:', error);
            });

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    useEffect(() => {
        if (!subscribeToListasTemporalesUpdated) return;

        return subscribeToListasTemporalesUpdated(({ pedidoId, etapas }) => {
            replacePedidoInMap(pedidoId, etapas);
        });
    }, [subscribeToListasTemporalesUpdated, replacePedidoInMap]);

    /**
     * Marca o desmarca una etapa temporal para un pedido.
     * La etapa real del pedido (etapaActual) NUNCA se almacena aquí; es siempre implícita.
     *
     * When checked=true: always ADD a new instance (no dedup — repeated clicks create multiple rows).
     * When checked=false: remove ALL instances for that stage (full uncheck via PUT replace).
     */
    const setListaTemporal = useCallback(async (pedidoId: string, etapa: Etapa, checked: boolean) => {
        let previousMap: ListasTemporalesMap = {};

        if (checked) {
            // Optimistic: always APPEND the stage (multiplicity — repeated clicks create multiple instances)
            setMap(prev => {
                previousMap = prev;
                const current = prev[pedidoId] || [];
                const nextEtapas = [...current, etapa];
                const next = { ...prev };
                next[pedidoId] = nextEtapas;
                return next;
            });

            try {
                const response = await apiFetch<ListasTemporalesUpdatedPayload>(`/produccion/listas-temporales/${pedidoId}`, {
                    method: 'POST',
                    body: JSON.stringify({ etapa }),
                });
                replacePedidoInMap(pedidoId, response.etapas || []);
            } catch (error) {
                setMap(previousMap);
                throw error;
            }
        } else {
            // Remove ALL instances for this stage (full uncheck)
            let nextEtapas: Etapa[] = [];
            setMap(prev => {
                previousMap = prev;
                const current = prev[pedidoId] || [];
                nextEtapas = current.filter(e => e !== etapa);
                const next = { ...prev };
                if (nextEtapas.length === 0) {
                    delete next[pedidoId];
                } else {
                    next[pedidoId] = nextEtapas;
                }
                return next;
            });

            try {
                const response = await apiFetch<ListasTemporalesUpdatedPayload>(`/produccion/listas-temporales/${pedidoId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ etapas: nextEtapas }),
                });
                replacePedidoInMap(pedidoId, response.etapas || []);
            } catch (error) {
                setMap(previousMap);
                throw error;
            }
        }
    }, [replacePedidoInMap]);

    const replaceListaTemporal = useCallback(async (pedidoId: string, etapas: Etapa[]) => {
        let previousMap: ListasTemporalesMap = {};
        setMap(prev => {
            previousMap = prev;
            const next = { ...prev };
            if (etapas.length === 0) {
                delete next[pedidoId];
            } else {
                next[pedidoId] = etapas;
            }
            return next;
        });

        try {
            const response = await apiFetch<ListasTemporalesUpdatedPayload>(`/produccion/listas-temporales/${pedidoId}`, {
                method: 'PUT',
                body: JSON.stringify({ etapas }),
            });
            replacePedidoInMap(pedidoId, response.etapas || []);
        } catch (error) {
            setMap(previousMap);
            throw error;
        }
    }, [replacePedidoInMap]);

    const resetListaTemporal = useCallback(async (pedidoId: string) => {
        let previousMap: ListasTemporalesMap = {};
        setMap(prev => {
            previousMap = prev;
            const next = { ...prev };
            delete next[pedidoId];
            return next;
        });

        try {
            const response = await apiFetch<ListasTemporalesUpdatedPayload>(`/produccion/listas-temporales/${pedidoId}`, {
                method: 'DELETE',
            });
            replacePedidoInMap(pedidoId, response.etapas || []);
        } catch (error) {
            setMap(previousMap);
            throw error;
        }
    }, [replacePedidoInMap]);

    /**
     * Remove only ONE most recent instance for a specific stage (X button).
     * Keeps the stage in the map if more instances remain after removal.
     */
    const removeOneListaTemporal = useCallback(async (pedidoId: string, etapa: Etapa) => {
        let previousMap: ListasTemporalesMap = {};
        setMap(prev => {
            previousMap = { ...prev };
            return prev; // optimistic no-op — server response decides
        });

        try {
            const response = await apiFetch<ListasTemporalesUpdatedPayload>(`/produccion/listas-temporales/${pedidoId}/${etapa}`, {
                method: 'DELETE',
            });
            replacePedidoInMap(pedidoId, response.etapas || []);
        } catch (error) {
            // No optimistic change to rollback — the server response is authoritative
            console.error('Error removing one lista temporal:', error);
            throw error;
        }
    }, [replacePedidoInMap]);

    const limpiarHuerfanos = useCallback((pedidoIds: string[]) => {
        setMap(prev => {
            const pidSet = new Set(pedidoIds);
            const next: ListasTemporalesMap = {};
            let changed = false;
            for (const [k, v] of Object.entries(prev)) {
                if (pidSet.has(k)) {
                    next[k] = v;
                } else {
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, []);

    /**
     * Devuelve las etapas TEMPORALES adicionales de un pedido (no incluye la etapa real).
     */
    const getListasTemporales = useCallback((pedidoId: string): Etapa[] => {
        return map[pedidoId] || [];
    }, [map]);

    /**
     * Indica si un pedido tiene al menos una etapa temporal adicional activa.
     */
    const tieneListaTemporal = useCallback((pedidoId: string): boolean => {
        return (map[pedidoId]?.length ?? 0) > 0;
    }, [map]);

    return {
        listasTemporalesMap: map,
        setListaTemporal,
        replaceListaTemporal,
        resetListaTemporal,
        removeOneListaTemporal,
        getListasTemporales,
        tieneListaTemporal,
        limpiarHuerfanos,
    };
}
