import { describe, it, expect } from 'vitest';
import { Etapa, Pedido } from '../types';
import {
    sortKanbanColumnPedidos,
    pruneKanbanManualOrderMap,
    buildKanbanDraggableId,
} from './kanbanManualOrder';

describe('kanbanManualOrder - Senior Architect verification tests', () => {
    const stageId = Etapa.POST_ECCONVERT_22;

    const createMockPedido = (id: string, etapaActual: Etapa): Pedido => ({
        id,
        numeroPedidoCliente: `PED-${id}`,
        cliente: `Cliente ${id}`,
        etapaActual,
        prioridad: 'MEDIA' as any,
        historial: [],
    } as Pedido);

    it('should sort cards strictly by exact draggableId match when exact IDs exist', () => {
        const p1 = createMockPedido('p1', stageId);
        const p2 = createMockPedido('p2', stageId);

        const manualMap = {
            [stageId]: [
                buildKanbanDraggableId('p2', stageId),
                buildKanbanDraggableId('p1', stageId),
            ],
        };

        const sorted = sortKanbanColumnPedidos([p1, p2], stageId, manualMap);
        expect(sorted.map(p => p.id)).toEqual(['p2', 'p1']);
    });

    it('should retain slot position via parsed pedidoId fallback when a temp card becomes real (ghost ID scenario)', () => {
        const p1 = createMockPedido('p1', stageId); // Now real in POST_ECCONVERT_22
        const p2 = createMockPedido('p2', stageId); // Real in POST_ECCONVERT_22

        // DB still has the old temporal draggable ID for p1 (with instanceIndex 1)
        const manualMap = {
            [stageId]: [
                buildKanbanDraggableId('p1', stageId, 1), // Old temp draggable ID
                buildKanbanDraggableId('p2', stageId),
            ],
        };

        const sorted = sortKanbanColumnPedidos([p1, p2], stageId, manualMap);
        expect(sorted.map(p => p.id)).toEqual(['p1', 'p2']);
    });

    it('should normalize ghost IDs and prune invalid stages in pruneKanbanManualOrderMap', () => {
        const p1 = createMockPedido('p1', stageId); // Real in POST_ECCONVERT_22
        const p2 = createMockPedido('p2', Etapa.IMPRESION_WM1); // Real in IMPRESION, no longer in ECCONVERT

        const pedidoMap = new Map([
            ['p1', p1],
            ['p2', p2],
        ]);
        const listasTemporalesMap: Record<string, Etapa[]> = {
            p1: [],
            p2: [], // p2 temp stage was removed
        };

        const rawMap = {
            [stageId]: [
                buildKanbanDraggableId('p1', stageId, 1), // Ghost temp ID for p1 (now real)
                buildKanbanDraggableId('p2', stageId, 1), // Ghost temp ID for p2 (no longer in stage)
            ],
        };

        const pruned = pruneKanbanManualOrderMap(rawMap, pedidoMap, listasTemporalesMap);

        // p1's ghost ID should be normalized to real ID; p2's ID should be removed
        expect(pruned[stageId]).toEqual([buildKanbanDraggableId('p1', stageId)]);
    });
});
