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

export const isProduccionKanbanStage = (stageId: string): stageId is Etapa => {
    return PRODUCCION_STAGE_SET.has(stageId as Etapa);
};

export const buildKanbanDraggableId = (pedidoId: string, stageId: Etapa): string => {
    return `${pedidoId}${DRAGGABLE_ID_SEPARATOR}${stageId}`;
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

export const loadKanbanManualOrderMap = (): KanbanManualOrderMap => {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return {};
        }

        const next: KanbanManualOrderMap = {};

        for (const [stageId, ids] of Object.entries(parsed)) {
            if (!isProduccionKanbanStage(stageId) || !Array.isArray(ids)) {
                continue;
            }

            const normalizedIds = dedupeIds(ids.filter((id): id is string => typeof id === 'string'));
            if (normalizedIds.length > 0) {
                next[stageId] = normalizedIds;
            }
        }

        return next;
    } catch {
        return {};
    }
};

export const saveKanbanManualOrderMap = (map: KanbanManualOrderMap): void => {
    if (typeof window === 'undefined') {
        return;
    }

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

        const filteredIds = dedupeIds(ids.filter(id => existingPedidoIds.has(id)));
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
        return pedidos;
    }

    const orderIndex = new Map(orderedIds.map((id, index) => [id, index]));

    return [...pedidos].sort((a, b) => {
        const indexA = orderIndex.get(a.id);
        const indexB = orderIndex.get(b.id);

        if (indexA != null && indexB != null) {
            return indexA - indexB;
        }

        if (indexA != null) {
            return -1;
        }

        if (indexB != null) {
            return 1;
        }

        return 0;
    });
};

export const mergeVisibleKanbanReorder = (
    fullColumnPedidos: Pedido[],
    visibleColumnPedidos: Pedido[],
    sourceIndex: number,
    destinationIndex: number
): string[] => {
    const fullIds = fullColumnPedidos.map(pedido => pedido.id);
    const visibleIds = visibleColumnPedidos.map(pedido => pedido.id);
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
    orderedIds: string[]
): Pedido[] => {
    const pedidosById = new Map(columnPedidos.map(pedido => [pedido.id, pedido]));
    const orderedPedidos = orderedIds
        .map(id => pedidosById.get(id))
        .filter((pedido): pedido is Pedido => Boolean(pedido));

    if (orderedPedidos.length === columnPedidos.length) {
        return orderedPedidos;
    }

    const orderedIdSet = new Set(orderedIds);
    const missingPedidos = columnPedidos.filter(pedido => !orderedIdSet.has(pedido.id));
    return [...orderedPedidos, ...missingPedidos];
};