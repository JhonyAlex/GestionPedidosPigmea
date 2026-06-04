import { KANBAN_FUNNELS } from '../constants';
import { Etapa, Pedido } from '../types';

const STORAGE_KEY = 'gestionPedidos_kanbanManualOrder';
const DRAGGABLE_ID_SEPARATOR = '::KANBAN::';

export type KanbanManualOrderMap = Partial<Record<Etapa, string[]>>;

const PRODUCCION_STAGE_SET = new Set<Etapa>([
    ...KANBAN_FUNNELS.IMPRESION.stages,
    ...KANBAN_FUNNELS.POST_IMPRESION.stages,
]);

const dedupeIds = (ids: string[]): string[] => Array.from(new Set(ids.filter(Boolean)));

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

export const isProduccionKanbanStage = (stageId: string): stageId is Etapa => {
    return PRODUCCION_STAGE_SET.has(stageId as Etapa);
};

export const buildKanbanDraggableId = (pedidoId: string, stageId: Etapa): string => {
    return `${pedidoId}${DRAGGABLE_ID_SEPARATOR}${stageId}`;
};

const getKanbanOrderKey = (pedido: Pedido, stageId: Etapa): string => {
    return buildKanbanDraggableId(pedido.id, stageId);
};

export const parseKanbanDraggableId = (draggableId: string): { pedidoId: string; visualStageId: Etapa | null } => {
    const separatorIndex = draggableId.indexOf(DRAGGABLE_ID_SEPARATOR);

    if (separatorIndex === -1) {
        return { pedidoId: draggableId, visualStageId: null };
    }

    return {
        pedidoId: draggableId.slice(0, separatorIndex),
        visualStageId: draggableId.slice(separatorIndex + DRAGGABLE_ID_SEPARATOR.length) as Etapa,
    };
};

/**
 * Carga el orden manual del kanban desde el servidor (API REST).
 * Fallback: localStorage legacy para migración y modo offline.
 */
export const loadKanbanManualOrderMap = async (): Promise<KanbanManualOrderMap> => {
    try {
        const response = await fetch('/api/kanban/orders', {
            headers: getAuthHeaders(),
        });
        if (response.ok) {
            return await response.json();
        }
    } catch {
        // Silencioso: intentar fallback legacy
    }

    // Fallback: localStorage legacy (migración y modo offline)
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {};

        const next: KanbanManualOrderMap = {};
        for (const [stageId, ids] of Object.entries(parsed)) {
            if (!isProduccionKanbanStage(stageId) || !Array.isArray(ids)) continue;
            const normalizedIds = dedupeIds(ids.filter((id): id is string => typeof id === 'string'));
            if (normalizedIds.length > 0) next[stageId] = normalizedIds;
        }
        return next;
    } catch {
        return {};
    }
};

/**
 * Guarda el orden manual de UNA etapa en el servidor (API REST).
 * El backend se encarga del broadcast vía WebSocket a todos los clientes.
 * También guarda en localStorage como fallback offline.
 */
export const saveKanbanManualOrderForStage = async (
    etapa: Etapa,
    pedidoIds: string[]
): Promise<void> => {
    // Guardar en el servidor (el broadcast lo hace el backend)
    try {
        await fetch(`/api/kanban/order/${encodeURIComponent(etapa)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ pedidoIds }),
        });
    } catch (error) {
        console.error('Error saving kanban order to server:', error);
    }

    // Fallback local (modo offline temporal)
    if (typeof window === 'undefined') return;
    try {
        const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (pedidoIds.length > 0) {
            current[etapa] = pedidoIds;
        } else {
            delete current[etapa];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
        // Ignorar errores de localStorage.
    }
};

/**
 * @deprecated Usar saveKanbanManualOrderForStage por etapa individual.
 * Se mantiene por compatibilidad con código existente que llama a esta función.
 */
export const saveKanbanManualOrderMap = (map: KanbanManualOrderMap): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        // Ignorar errores de localStorage.
    }
};

export const pruneKanbanManualOrderMap = (
    map: KanbanManualOrderMap,
    existingPedidoIds: Set<string>
): KanbanManualOrderMap => {
    const next: KanbanManualOrderMap = {};

    for (const [stageId, ids] of Object.entries(map)) {
        if (!isProduccionKanbanStage(stageId) || !Array.isArray(ids)) {
            continue;
        }

        const filteredIds = dedupeIds(ids.filter(id => {
            const parsed = parseKanbanDraggableId(id);
            return existingPedidoIds.has(parsed.pedidoId)
                && (parsed.visualStageId == null || parsed.visualStageId === stageId);
        }));
        if (filteredIds.length > 0) {
            next[stageId] = filteredIds;
        }
    }

    return next;
};

export const sortKanbanColumnPedidos = (
    pedidos: Pedido[],
    stageId: Etapa,
    manualOrderMap: KanbanManualOrderMap
): Pedido[] => {
    const orderedIds = manualOrderMap[stageId] || [];

    if (orderedIds.length === 0) {
        return [...pedidos].sort((a, b) => {
            const tA = a.etapaActual !== stageId;
            const tB = b.etapaActual !== stageId;
            if (tA && !tB) return 1;
            if (!tA && tB) return -1;
            return 0;
        });
    }

    const orderIndex = new Map(orderedIds.map((id, index) => [id, index]));
    const getOrderIndex = (pedido: Pedido): number | undefined => {
        return orderIndex.get(getKanbanOrderKey(pedido, stageId)) ?? orderIndex.get(pedido.id);
    };

    return [...pedidos].sort((a, b) => {
        const indexA = getOrderIndex(a);
        const indexB = getOrderIndex(b);

        if (indexA != null && indexB != null) {
            return indexA - indexB;
        }

        if (indexA != null) {
            return -1;
        }

        if (indexB != null) {
            return 1;
        }

        const isTemporalA = a.etapaActual !== stageId;
        const isTemporalB = b.etapaActual !== stageId;

        if (isTemporalA && !isTemporalB) return 1;
        if (!isTemporalA && isTemporalB) return -1;

        return 0;
    });
};

export const mergeVisibleKanbanReorder = (
    fullColumnPedidos: Pedido[],
    visibleColumnPedidos: Pedido[],
    sourceIndex: number,
    destinationIndex: number,
    stageId?: Etapa
): string[] => {
    const getOrderId = (pedido: Pedido) => stageId ? getKanbanOrderKey(pedido, stageId) : pedido.id;
    const fullIds = fullColumnPedidos.map(getOrderId);
    const visibleIds = visibleColumnPedidos.map(getOrderId);
    const reorderedVisibleIds = Array.from(visibleIds);
    const [movedId] = reorderedVisibleIds.splice(sourceIndex, 1);

    if (!movedId) {
        return fullIds;
    }

    reorderedVisibleIds.splice(destinationIndex, 0, movedId);

    const visibleIdSet = new Set(visibleIds);
    let visibleCursor = 0;

    return fullIds.map(id => {
        if (!visibleIdSet.has(id)) {
            return id;
        }

        const nextId = reorderedVisibleIds[visibleCursor];
        visibleCursor += 1;
        return nextId;
    });
};

export const getOrderedKanbanColumnPedidos = (
    columnPedidos: Pedido[],
    orderedIds: string[],
    stageId?: Etapa
): Pedido[] => {
    const pedidosById = new Map<string, Pedido>();
    columnPedidos.forEach(pedido => {
        pedidosById.set(pedido.id, pedido);
        if (stageId) {
            pedidosById.set(getKanbanOrderKey(pedido, stageId), pedido);
        }
    });
    const orderedPedidos = orderedIds
        .map(id => pedidosById.get(id))
        .filter((pedido): pedido is Pedido => Boolean(pedido));

    if (orderedPedidos.length === columnPedidos.length) {
        return orderedPedidos;
    }

    const orderedIdSet = new Set(orderedIds);
    const missingPedidos = columnPedidos.filter(pedido => {
        return !orderedIdSet.has(pedido.id)
            && (!stageId || !orderedIdSet.has(getKanbanOrderKey(pedido, stageId)));
    });
    return [...orderedPedidos, ...missingPedidos];
};
