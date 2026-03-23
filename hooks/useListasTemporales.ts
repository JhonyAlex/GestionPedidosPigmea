import { useState, useCallback } from 'react';
import { Etapa } from '../types';

const STORAGE_KEY = 'gestionPedidos_listasTemporales';

// Mapa: pedidoId → lista de etapas adicionales temporales (no incluye la etapa real del pedido, que siempre se deriva de etapaActual)
type ListasTemporalesMap = Record<string, Etapa[]>;

function loadFromStorage(): ListasTemporalesMap {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveToStorage(map: ListasTemporalesMap) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        // Ignorar errores de localStorage (modo privado, cuota excedida)
    }
}

export function useListasTemporales() {
    const [map, setMap] = useState<ListasTemporalesMap>(() => loadFromStorage());

    /**
     * Marca o desmarca una etapa temporal para un pedido.
     * La etapa real del pedido (etapaActual) NUNCA se almacena aquí; es siempre implícita.
     */
    const setListaTemporal = useCallback((pedidoId: string, etapa: Etapa, checked: boolean) => {
        setMap(prev => {
            const current = prev[pedidoId] || [];
            let updated: Etapa[];
            if (checked) {
                updated = current.includes(etapa) ? current : [...current, etapa];
            } else {
                updated = current.filter(e => e !== etapa);
            }
            const next = { ...prev };
            if (updated.length === 0) {
                delete next[pedidoId];
            } else {
                next[pedidoId] = updated;
            }
            saveToStorage(next);
            return next;
        });
    }, []);

    /**
     * Elimina todos los overrides temporales de un pedido,
     * dejando solo su etapa real como lista activa.
     */
    const resetListaTemporal = useCallback((pedidoId: string) => {
        setMap(prev => {
            if (!prev[pedidoId]) return prev;
            const next = { ...prev };
            delete next[pedidoId];
            saveToStorage(next);
            return next;
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

    /**
     * Elimina del mapa los pedidos que ya no existen, para evitar datos huérfanos.
     */
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
            if (changed) saveToStorage(next);
            return changed ? next : prev;
        });
    }, []);

    return {
        listasTemporalesMap: map,
        setListaTemporal,
        resetListaTemporal,
        getListasTemporales,
        tieneListaTemporal,
        limpiarHuerfanos,
    };
}
