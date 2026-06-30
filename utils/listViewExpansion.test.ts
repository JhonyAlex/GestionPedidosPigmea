/**
 * Tests for listViewExpansion.ts — the pure utility that builds the expanded
 * pedido list for PRODUCTION stages (used by List view and PDF export).
 *
 * Coverage targets:
 *  1. List ordering aligned with Production for temporaries
 *  2. Temporary row expansion (multiple temp instances produce multiple rows)
 *  3. PDF data contract: _isTemporal flag set correctly
 *
 * Note: PENDIENTE, COMPLETADO, and other non-production stages are handled
 * separately by the caller (App.tsx) — this utility only handles
 * productionKanbanStages.
 */

import { describe, it, expect } from 'vitest';
import {
    buildExpandedPedidoList,
    interleaveExpandedList,
    preparePdfRows,
    ExpandedPedido,
    BuildExpandedListOptions,
} from './listViewExpansion';
import { Pedido, Etapa, Prioridad } from '../types';
import { sortKanbanColumnPedidos } from './kanbanManualOrder';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePedido(overrides: Partial<Pedido> = {}): Pedido {
    return {
        id: 'ped-1',
        numeroPedidoCliente: 'P001',
        cliente: 'Cliente Test',
        desarrollo: 'Des Test',
        etapaActual: Etapa.PENDIENTE,
        prioridad: Prioridad.NORMAL,
        metros: 100,
        tiempoProduccionPlanificado: '2h 30m',
        ...overrides,
    } as Pedido;
}

function noopSort(
    pedidos: Pedido[],
    _stageId: Etapa,
    _map: Partial<Record<Etapa, string[]>>,
): Pedido[] {
    return [...pedidos];
}

function defaultOptions(
    overrides: Partial<BuildExpandedListOptions> = {},
): BuildExpandedListOptions {
    return {
        activePedidos: [],
        listasTemporalesMap: {},
        kanbanManualOrderMap: {},
        productionKanbanStages: [
            Etapa.IMPRESION_WM1,
            Etapa.POST_DNT,
        ],
        selectedStages: [],
        stageFilter: 'all',
        sortKanbanColumnPedidos: noopSort,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// 1. Temporary row expansion
// ---------------------------------------------------------------------------

describe('temporary row expansion', () => {
    it('creates one row per real + each temp instance in a production stage', () => {
        const ped = makePedido({
            id: 'p1',
            etapaActual: Etapa.IMPRESION_WM1,
            numeroPedidoCliente: 'TMP-1',
        });
        const opts = defaultOptions({
            activePedidos: [ped],
            listasTemporalesMap: { 'p1': [Etapa.IMPRESION_WM1, Etapa.IMPRESION_WM1] },
        });

        const result = buildExpandedPedidoList(opts);

        // 1 real + 2 temp = 3 rows in the same stage
        const wm1Rows = result.filter(r => r._visualStage === Etapa.IMPRESION_WM1);
        expect(wm1Rows).toHaveLength(3);
    });

    it('assigns unique _visualKey per instance', () => {
        const ped = makePedido({
            id: 'p1',
            etapaActual: Etapa.IMPRESION_WM1,
        });
        const opts = defaultOptions({
            activePedidos: [ped],
            listasTemporalesMap: { 'p1': [Etapa.IMPRESION_WM1] },
        });

        const result = buildExpandedPedidoList(opts);
        const keys = result.map(r => r._visualKey);

        expect(keys).toContain('real:p1:IMPRESION_WM1');
        expect(keys).toContain('temp:p1:IMPRESION_WM1:1');
        // All keys unique
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('assigns _kanbanInstanceIndex 0 to real, 1+ to temp instances', () => {
        const ped = makePedido({
            id: 'p1',
            etapaActual: Etapa.IMPRESION_WM1,
        });
        const opts = defaultOptions({
            activePedidos: [ped],
            listasTemporalesMap: { 'p1': [Etapa.IMPRESION_WM1, Etapa.IMPRESION_WM1] },
        });

        const result = buildExpandedPedidoList(opts);
        const wm1Rows = result.filter(r => r._visualStage === Etapa.IMPRESION_WM1);

        const indices = wm1Rows.map(r => r._kanbanInstanceIndex).sort();
        expect(indices).toEqual([0, 1, 2]);
    });

    it('a pedido can appear in multiple stages (real + temps across stages)', () => {
        const ped = makePedido({
            id: 'p1',
            etapaActual: Etapa.IMPRESION_WM1,
        });
        const opts = defaultOptions({
            activePedidos: [ped],
            listasTemporalesMap: {
                'p1': [Etapa.POST_DNT, Etapa.POST_DNT],
            },
        });

        const result = buildExpandedPedidoList(opts);

        // 1 real in IMPRESION_WM1 + 2 temp in POST_DNT = 3 total
        expect(result).toHaveLength(3);
        expect(result.filter(r => r._visualStage === Etapa.IMPRESION_WM1)).toHaveLength(1);
        expect(result.filter(r => r._visualStage === Etapa.POST_DNT)).toHaveLength(2);
    });

    it('temporal rows have _visualStage different from etapaActual', () => {
        const ped = makePedido({
            id: 'p1',
            etapaActual: Etapa.IMPRESION_WM1,
        });
        const opts = defaultOptions({
            activePedidos: [ped],
            listasTemporalesMap: { 'p1': [Etapa.POST_DNT] },
        });

        const result = buildExpandedPedidoList(opts);
        const tempRow = result.find(r => r._visualKey.startsWith('temp:'));

        expect(tempRow).toBeDefined();
        expect(tempRow!._visualStage).toBe(Etapa.POST_DNT);
        expect(tempRow!.etapaActual).toBe(Etapa.IMPRESION_WM1);
    });
});

// ---------------------------------------------------------------------------
// 2. List ordering aligned with Production for temporaries
// ---------------------------------------------------------------------------

describe('list ordering aligned with Production', () => {
    it('respects kanbanManualOrderMap for production stages', () => {
        const pedA = makePedido({ id: 'a', etapaActual: Etapa.IMPRESION_WM1, numeroPedidoCliente: 'A' });
        const pedB = makePedido({ id: 'b', etapaActual: Etapa.IMPRESION_WM1, numeroPedidoCliente: 'B' });
        const pedC = makePedido({ id: 'c', etapaActual: Etapa.IMPRESION_WM1, numeroPedidoCliente: 'C' });

        // Manual order: C, A, B
        const manualOrderMap = {
            [Etapa.IMPRESION_WM1]: ['c', 'a', 'b'],
        };

        const opts = defaultOptions({
            activePedidos: [pedA, pedB, pedC],
            kanbanManualOrderMap: manualOrderMap,
            sortKanbanColumnPedidos,
        });

        const result = buildExpandedPedidoList(opts);
        const wm1Rows = result.filter(r => r._visualStage === Etapa.IMPRESION_WM1);

        expect(wm1Rows.map(r => r.id)).toEqual(['c', 'a', 'b']);
    });

    it('real pedidos appear before temp pedidos in same stage when no manual order', () => {
        const real = makePedido({
            id: 'r1',
            etapaActual: Etapa.IMPRESION_WM1,
            numeroPedidoCliente: 'R-1',
        });
        const other = makePedido({
            id: 't-host',
            etapaActual: Etapa.POST_DNT,
            numeroPedidoCliente: 'T-1',
        });
        const opts = defaultOptions({
            activePedidos: [other, real],
            listasTemporalesMap: { 't-host': [Etapa.IMPRESION_WM1] },
            sortKanbanColumnPedidos,
        });

        const result = buildExpandedPedidoList(opts);
        const wm1Rows = result.filter(r => r._visualStage === Etapa.IMPRESION_WM1);

        // Real should be first, then temp
        const realIdx = wm1Rows.findIndex(r => r._visualKey.startsWith('real:'));
        const tempIdx = wm1Rows.findIndex(r => r._visualKey.startsWith('temp:'));
        expect(realIdx).toBeLessThan(tempIdx);
    });
});

// ---------------------------------------------------------------------------
// 3. PDF data contract: _isTemporal marks temp rows
// ---------------------------------------------------------------------------

describe('PDF data contract', () => {
    it('marks temporary rows with _isTemporal: true', () => {
        const ped = makePedido({
            id: 'p1',
            etapaActual: Etapa.IMPRESION_WM1,
        });
        const opts = defaultOptions({
            activePedidos: [ped],
            listasTemporalesMap: { 'p1': [Etapa.POST_DNT] },
        });

        const expanded = buildExpandedPedidoList(opts);
        const pdfRows = preparePdfRows(expanded);

        const tempRow = pdfRows.find(r => r._isTemporal);
        const realRow = pdfRows.find(r => !r._isTemporal);

        expect(tempRow).toBeDefined();
        expect(realRow).toBeDefined();
        expect(tempRow!._isTemporal).toBe(true);
        expect(realRow!._isTemporal).toBe(false);
    });

    it('sets etapaActual to _visualStage on temp rows for correct PDF subtitle', () => {
        const ped = makePedido({
            id: 'p1',
            etapaActual: Etapa.IMPRESION_WM1,
        });
        const opts = defaultOptions({
            activePedidos: [ped],
            listasTemporalesMap: { 'p1': [Etapa.POST_DNT] },
        });

        const expanded = buildExpandedPedidoList(opts);
        const pdfRows = preparePdfRows(expanded);
        const tempRow = pdfRows.find(r => r._isTemporal);

        expect(tempRow).toBeDefined();
        expect(tempRow!.etapaActual).toBe(Etapa.POST_DNT);
    });

    it('real rows keep original etapaActual', () => {
        const ped = makePedido({
            id: 'p1',
            etapaActual: Etapa.IMPRESION_WM1,
        });
        const opts = defaultOptions({
            activePedidos: [ped],
            listasTemporalesMap: { 'p1': [Etapa.POST_DNT] },
        });

        const expanded = buildExpandedPedidoList(opts);
        const pdfRows = preparePdfRows(expanded);
        const realRow = pdfRows.find(r => !r._isTemporal && ((r as any)._visualKey || '').startsWith('real:'));

        expect(realRow).toBeDefined();
        expect(realRow!.etapaActual).toBe(Etapa.IMPRESION_WM1);
    });
});

// ---------------------------------------------------------------------------
// 4. Filter behavior
// ---------------------------------------------------------------------------

describe('filter behavior', () => {
    it('respects selectedStages filter', () => {
        const ped = makePedido({ id: 'p1', etapaActual: Etapa.IMPRESION_WM1 });
        const opts = defaultOptions({
            activePedidos: [ped],
            selectedStages: [Etapa.POST_DNT],
            stageFilter: 'all',
        });

        const result = buildExpandedPedidoList(opts);

        // Only POST_DNT stage rows (none match)
        // Wait — the pedido is in IMPRESION_WM1. With POST_DNT filter,
        // it wouldn't show unless it has temp in POST_DNT.
        // But even if no rows are in the filtered stages, the function
        // should still not include IMPRESION_WM1 rows.
        expect(result.filter(r => r._visualStage === Etapa.IMPRESION_WM1)).toHaveLength(0);
    });

    it('includes temp rows when their visual stage matches the filter', () => {
        const ped = makePedido({
            id: 'p1',
            etapaActual: Etapa.IMPRESION_WM1,
        });
        const opts = defaultOptions({
            activePedidos: [ped],
            listasTemporalesMap: { 'p1': [Etapa.POST_DNT] },
            selectedStages: [Etapa.POST_DNT],
            stageFilter: 'all',
        });

        const result = buildExpandedPedidoList(opts);

        // Only POST_DNT stage rows visible
        expect(result).toHaveLength(1);
        expect(result[0]._visualStage).toBe(Etapa.POST_DNT);
        expect(result[0]._visualKey).toBe('temp:p1:POST_DNT:1');
    });
});

// ---------------------------------------------------------------------------
// 5. Interleaving: non-production + production ordering contract
// ---------------------------------------------------------------------------

describe('interleaving — non-production ordering contract', () => {
    const PROD = new Set<Etapa>([Etapa.IMPRESION_WM1, Etapa.POST_DNT]);

    function ped(id: string, etapa: Etapa, overrides: Partial<Pedido> = {}): Pedido {
        return makePedido({ id, etapaActual: etapa, numeroPedidoCliente: id, ...overrides });
    }

    function expRow(id: string, visualStage: Etapa, visualKey: string, realEtapa?: Etapa): ExpandedPedido {
        return {
            ...ped(id, realEtapa ?? visualStage),
            _visualStage: visualStage,
            _visualKey: visualKey,
            _kanbanInstanceIndex: visualKey.startsWith('temp:') ? 1 : 0,
        };
    }

    it('non-production pedidos keep their relative order (not relocated)', () => {
        // activePedidos: [pendA, pendB] — no production pedidos at all
        const active = [ped('a', Etapa.PENDIENTE), ped('b', Etapa.COMPLETADO)];
        const expanded: ExpandedPedido[] = [];
        const nonProdIds = new Set(['a', 'b']);

        const result = interleaveExpandedList(active, expanded, nonProdIds, PROD);

        expect(result.map(r => r.id)).toEqual(['a', 'b']);
    });

    it('non-production pedidos stay before production block when they were before in original order', () => {
        // activePedidos: [pendA, prodB, prodC]
        const pendA = ped('a', Etapa.PENDIENTE);
        const prodB = ped('b', Etapa.IMPRESION_WM1);
        const prodC = ped('c', Etapa.POST_DNT);
        const active = [pendA, prodB, prodC];

        const expanded = [
            expRow('b', Etapa.IMPRESION_WM1, 'real:b:IMPRESION_WM1'),
            expRow('c', Etapa.POST_DNT, 'real:c:POST_DNT'),
        ];
        const nonProdIds = new Set(['a']);

        const result = interleaveExpandedList(active, expanded, nonProdIds, PROD);

        // pendA first, then production block
        expect(result[0].id).toBe('a');
        expect(result[0]._visualStage).toBeUndefined();
        expect(result[1].id).toBe('b');
        expect(result[1]._visualStage).toBe(Etapa.IMPRESION_WM1);
        expect(result[2].id).toBe('c');
        expect(result[2]._visualStage).toBe(Etapa.POST_DNT);
    });

    it('non-production pedidos stay after production block when they were after in original order', () => {
        // activePedidos: [prodB, prodC, pendA]
        const prodB = ped('b', Etapa.IMPRESION_WM1);
        const prodC = ped('c', Etapa.POST_DNT);
        const pendA = ped('a', Etapa.PENDIENTE);
        const active = [prodB, prodC, pendA];

        const expanded = [
            expRow('b', Etapa.IMPRESION_WM1, 'real:b:IMPRESION_WM1'),
            expRow('c', Etapa.POST_DNT, 'real:c:POST_DNT'),
        ];
        const nonProdIds = new Set(['a']);

        const result = interleaveExpandedList(active, expanded, nonProdIds, PROD);

        // Production block first, then pendA
        expect(result[0].id).toBe('b');
        expect(result[1].id).toBe('c');
        expect(result[2].id).toBe('a');
    });

    it('non-production pedido stays between production pedidos (slots contract)', () => {
        // activePedidos: [prodB, pendA, prodC] — pendA is between two production pedidos.
        // SLOTS CONTRACT: pendA must remain between B and C expanded rows, NOT
        // pushed after the entire production block.
        const prodB = ped('b', Etapa.IMPRESION_WM1);
        const pendA = ped('a', Etapa.PENDIENTE);
        const prodC = ped('c', Etapa.POST_DNT);
        const active = [prodB, pendA, prodC];

        const expanded = [
            expRow('b', Etapa.IMPRESION_WM1, 'real:b:IMPRESION_WM1'),
            expRow('c', Etapa.POST_DNT, 'real:c:POST_DNT'),
        ];
        const nonProdIds = new Set(['a']);

        const result = interleaveExpandedList(active, expanded, nonProdIds, PROD);

        // pendA stays in its base-list slot between B and C
        expect(result).toHaveLength(3);
        expect(result[0].id).toBe('b');
        expect(result[0]._visualStage).toBe(Etapa.IMPRESION_WM1);
        expect(result[1].id).toBe('a');
        expect(result[1]._visualStage).toBeUndefined();
        expect(result[2].id).toBe('c');
        expect(result[2]._visualStage).toBe(Etapa.POST_DNT);
    });

    it('filtered-out non-production pedidos are excluded', () => {
        // activePedidos has pendA and pendB, but only pendA passed the filter
        const active = [ped('a', Etapa.PENDIENTE), ped('b', Etapa.COMPLETADO)];
        const expanded: ExpandedPedido[] = [];
        const nonProdIds = new Set(['a']); // 'b' was filtered out

        const result = interleaveExpandedList(active, expanded, nonProdIds, PROD);

        expect(result.map(r => r.id)).toEqual(['a']);
    });

    it('expanded block is appended when no production pedido triggers insertion', () => {
        // Only non-production pedidos in activePedidos, but they have temps in
        // production stages → expanded is non-empty.
        const active = [ped('a', Etapa.PENDIENTE)];
        const expanded = [
            expRow('a', Etapa.IMPRESION_WM1, 'temp:a:IMPRESION_WM1:1', Etapa.PENDIENTE),
        ];
        const nonProdIds = new Set<string>(); // 'a' excluded (only matches via temp-visibility)

        const result = interleaveExpandedList(active, expanded, nonProdIds, PROD);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('a');
        expect(result[0]._visualStage).toBe(Etapa.IMPRESION_WM1);
        expect(result[0]._visualKey).toBe('temp:a:IMPRESION_WM1:1');
    });

    it('production expanded rows emitted per pedido in base-list order (stage-grouped base)', () => {
        // Realistic base order: grouped by stage (all WM1 pedidos before POST).
        const active = [
            ped('b', Etapa.IMPRESION_WM1),
            ped('d', Etapa.IMPRESION_WM1),
            ped('c', Etapa.POST_DNT),
        ];
        const expanded = [
            expRow('b', Etapa.IMPRESION_WM1, 'real:b:IMPRESION_WM1'),
            expRow('d', Etapa.IMPRESION_WM1, 'real:d:IMPRESION_WM1'),
            expRow('c', Etapa.POST_DNT, 'real:c:POST_DNT'),
        ];
        const nonProdIds = new Set<string>();

        const result = interleaveExpandedList(active, expanded, nonProdIds, PROD);

        // All expanded entries appear exactly once, in stage-grouped order
        expect(result).toHaveLength(3);
        expect(result.map(r => r.id)).toEqual(['b', 'd', 'c']);
    });

    it('PDF contract: temporaries in expanded block receive correct _visualStage', () => {
        // This tests the end-to-end contract: interleaving + preparePdfRows
        const active = [ped('a', Etapa.PENDIENTE)];
        const expanded = [
            expRow('a', Etapa.IMPRESION_WM1, 'temp:a:IMPRESION_WM1:1', Etapa.PENDIENTE),
        ];
        const nonProdIds = new Set<string>();

        const interleaved = interleaveExpandedList(active, expanded, nonProdIds, PROD);
        const pdfRows = preparePdfRows(interleaved);

        expect(pdfRows).toHaveLength(1);
        expect(pdfRows[0]._isTemporal).toBe(true);
        expect(pdfRows[0].etapaActual).toBe(Etapa.IMPRESION_WM1);
    });

    // -----------------------------------------------------------------------
    // New: slots contract — multiple non-production pedidos between production
    // -----------------------------------------------------------------------

    it('multiple non-production pedidos keep relative order between production pedidos', () => {
        // base: [prodB, pendA, pendD, prodC] — two non-prod between two prod
        const prodB = ped('b', Etapa.IMPRESION_WM1);
        const pendA = ped('a', Etapa.PENDIENTE);
        const pendD = ped('d', Etapa.COMPLETADO);
        const prodC = ped('c', Etapa.POST_DNT);
        const active = [prodB, pendA, pendD, prodC];

        const expanded = [
            expRow('b', Etapa.IMPRESION_WM1, 'real:b:IMPRESION_WM1'),
            expRow('c', Etapa.POST_DNT, 'real:c:POST_DNT'),
        ];
        const nonProdIds = new Set(['a', 'd']);

        const result = interleaveExpandedList(active, expanded, nonProdIds, PROD);

        expect(result).toHaveLength(4);
        expect(result[0].id).toBe('b');
        expect(result[1].id).toBe('a');
        expect(result[2].id).toBe('d');
        expect(result[3].id).toBe('c');
    });

    it('non-production pedido with expanded temps replaces original (no duplication)', () => {
        // pendX has etapaActual=PENDIENTE but a temp in IMPRESION_WM1.
        // The expanded temp row SUPERSEDES the original slot entry.
        const pendX = ped('x', Etapa.PENDIENTE);
        const active = [pendX];

        const expanded = [
            expRow('x', Etapa.IMPRESION_WM1, 'temp:x:IMPRESION_WM1:1', Etapa.PENDIENTE),
        ];
        // pendX passes the non-production filter (filterAll mode)
        const nonProdIds = new Set(['x']);

        const result = interleaveExpandedList(active, expanded, nonProdIds, PROD);

        // Only the expanded temp row — no duplicate original
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('x');
        expect(result[0]._visualStage).toBe(Etapa.IMPRESION_WM1);
        expect(result[0]._visualKey).toBe('temp:x:IMPRESION_WM1:1');
    });

    it('mixed: production, non-production, then production with temps', () => {
        // base: [prodA_WM1, pendB, prodC_POST] where prodC has a temp in WM1.
        // Expanded has A_WM1, C_temp_WM1, C_POST.
        const prodA = ped('a', Etapa.IMPRESION_WM1);
        const pendB = ped('b', Etapa.PENDIENTE);
        const prodC = ped('c', Etapa.POST_DNT);
        const active = [prodA, pendB, prodC];

        const expanded = [
            expRow('a', Etapa.IMPRESION_WM1, 'real:a:IMPRESION_WM1'),
            expRow('c', Etapa.IMPRESION_WM1, 'temp:c:IMPRESION_WM1:1', Etapa.POST_DNT),
            expRow('c', Etapa.POST_DNT, 'real:c:POST_DNT'),
        ];
        const nonProdIds = new Set(['b']);

        const result = interleaveExpandedList(active, expanded, nonProdIds, PROD);

        // pendB stays between A rows and C rows (slots contract)
        expect(result).toHaveLength(4);
        expect(result[0].id).toBe('a');
        expect(result[0]._visualStage).toBe(Etapa.IMPRESION_WM1);
        expect(result[0]._visualKey).toBe('real:a:IMPRESION_WM1');
        expect(result[1].id).toBe('b');
        expect(result[1]._visualStage).toBeUndefined();
        expect(result[2].id).toBe('c');
        expect(result[2]._visualStage).toBe(Etapa.IMPRESION_WM1);
        expect(result[2]._visualKey).toBe('temp:c:IMPRESION_WM1:1');
        expect(result[3].id).toBe('c');
        expect(result[3]._visualStage).toBe(Etapa.POST_DNT);
        expect(result[3]._visualKey).toBe('real:c:POST_DNT');
    });
});

// ---------------------------------------------------------------------------
// 6. Temporal visibility contract (PedidoList / PDF renderer)
// ---------------------------------------------------------------------------

describe('temporal visibility contract', () => {
    function ped(id: string, etapa: Etapa, overrides: Partial<Pedido> = {}): Pedido {
        return makePedido({ id, etapaActual: etapa, numeroPedidoCliente: id, ...overrides });
    }

    it('preparePdfRows marks temp rows with _isTemporal: true and correct etapaActual', () => {
        const real = ped('r', Etapa.IMPRESION_WM1);
        const expanded: ExpandedPedido[] = [
            { ...real, _visualStage: Etapa.IMPRESION_WM1, _visualKey: 'real:r:IMPRESION_WM1', _kanbanInstanceIndex: 0 },
            { ...ped('t', Etapa.POST_DNT), _visualStage: Etapa.IMPRESION_WM1, _visualKey: 'temp:t:IMPRESION_WM1:1', _kanbanInstanceIndex: 1 },
        ];

        const pdfRows = preparePdfRows(expanded);

        // Real row
        expect(pdfRows[0]._isTemporal).toBe(false);
        expect(pdfRows[0].etapaActual).toBe(Etapa.IMPRESION_WM1);

        // Temp row: _isTemporal true, etapaActual overridden to visualStage
        expect(pdfRows[1]._isTemporal).toBe(true);
        expect(pdfRows[1].etapaActual).toBe(Etapa.IMPRESION_WM1);
    });

    it('PDF row keeps temporal flag and visual etapa for renderer decisions', () => {
        const pedido = ped('p', Etapa.IMPRESION_WM1, { observaciones: 'Nota importante' });
        const expanded: ExpandedPedido[] = [
            {
                ...pedido,
                _visualStage: Etapa.POST_DNT,
                _visualKey: 'temp:p:POST_DNT:1',
                _kanbanInstanceIndex: 1,
            },
        ];

        const pdfRows = preparePdfRows(expanded);

        expect(pdfRows[0]._isTemporal).toBe(true);
        expect(pdfRows[0].etapaActual).toBe(Etapa.POST_DNT);
    });

    it('temp rows have _visualStage different from original etapaActual', () => {
        // A temp row for a pedido whose real stage is POST_DNT but appears
        // in IMPRESION_WM1 as a temp entry.
        const pedido = ped('p', Etapa.POST_DNT);
        const expanded: ExpandedPedido[] = [
            {
                ...pedido,
                _visualStage: Etapa.IMPRESION_WM1,
                _visualKey: 'temp:p:IMPRESION_WM1:1',
                _kanbanInstanceIndex: 1,
            },
        ];

        // Before preparePdfRows
        expect(expanded[0]._visualStage).toBe(Etapa.IMPRESION_WM1);
        expect(expanded[0].etapaActual).toBe(Etapa.POST_DNT);

        const pdfRows = preparePdfRows(expanded);

        // After preparePdfRows: etapaActual is set to _visualStage for PDF rendering
        expect(pdfRows[0]._isTemporal).toBe(true);
        expect(pdfRows[0].etapaActual).toBe(Etapa.IMPRESION_WM1);
    });

    describe('PDF subset and order contract', () => {
        function ped(id: string, etapa: Etapa, overrides: Partial<Pedido> = {}): Pedido {
            return makePedido({ id, etapaActual: etapa, numeroPedidoCliente: id, ...overrides });
        }

        it('preserves the exact order computed by buildExpandedPedidoList', () => {
            // Setup: 3 pedidos in WM1, one with 2 temps, manual order: C, A, B
            const pedA = ped('a', Etapa.IMPRESION_WM1);
            const pedB = ped('b', Etapa.IMPRESION_WM1);
            const pedC = ped('c', Etapa.IMPRESION_WM1);
            const opts = defaultOptions({
                activePedidos: [pedA, pedB, pedC],
                listasTemporalesMap: { 'a': [Etapa.IMPRESION_WM1, Etapa.IMPRESION_WM1] },
                kanbanManualOrderMap: { [Etapa.IMPRESION_WM1]: ['c', 'a', 'b'] },
                sortKanbanColumnPedidos,
            });

            const expanded = buildExpandedPedidoList(opts);
            const pdfRows = preparePdfRows(expanded);

            // The PDF rows MUST preserve the exact order from expanded list
            expect(pdfRows).toHaveLength(5); // 3 real + 2 temp
            expect(pdfRows.map(r => r.id)).toEqual(expanded.map(r => r.id));
            expect(pdfRows.map(r => (r as any)._visualKey)).toEqual(expanded.map(r => r._visualKey));
        });

        it('subset: selectedStages filter is respected in PDF data', () => {
            const pedA = ped('a', Etapa.IMPRESION_WM1);
            const pedB = ped('b', Etapa.POST_DNT);
            const opts = defaultOptions({
                activePedidos: [pedA, pedB],
                selectedStages: [Etapa.IMPRESION_WM1],
                stageFilter: 'all',
                sortKanbanColumnPedidos,
            });

            const expanded = buildExpandedPedidoList(opts);
            const pdfRows = preparePdfRows(expanded);

            // Only IMPRESION_WM1 rows in the subset
            expect(pdfRows).toHaveLength(1);
            expect(pdfRows[0].id).toBe('a');
            expect(pdfRows[0].etapaActual).toBe(Etapa.IMPRESION_WM1);
        });

        it('PDF row count matches visible subset, not full pedido count', () => {
            const real = ped('r', Etapa.IMPRESION_WM1);
            const withTemps = ped('t', Etapa.POST_DNT);
            const opts = defaultOptions({
                activePedidos: [real, withTemps],
                listasTemporalesMap: { 't': [Etapa.IMPRESION_WM1, Etapa.IMPRESION_WM1] },
                selectedStages: [Etapa.IMPRESION_WM1],
                stageFilter: 'all',
                sortKanbanColumnPedidos,
            });

            const expanded = buildExpandedPedidoList(opts);
            const pdfRows = preparePdfRows(expanded);

            // 1 real (r) + 2 temps (t) = 3 PDF rows
            expect(pdfRows).toHaveLength(3);
        });
    });

    describe('temporal PDF metadata contract', () => {
        it('_isTemporal flag remains the source of truth for renderer-specific handling', () => {
            const ped = makePedido({
                id: 'p1',
                etapaActual: Etapa.IMPRESION_WM1,
                observaciones: 'Nota de prueba',
            });
            const opts = defaultOptions({
                activePedidos: [ped],
                listasTemporalesMap: { 'p1': [Etapa.POST_DNT] },
            });

            const expanded = buildExpandedPedidoList(opts);
            const pdfRows = preparePdfRows(expanded);

            const tempRow = pdfRows.find(r => r._isTemporal);
            const realRow = pdfRows.find(r => !r._isTemporal);

            expect(tempRow!._isTemporal).toBe(true);
            expect(realRow!._isTemporal).toBe(false);

            expect(tempRow!.observaciones).toBe('Nota de prueba');
            expect(realRow!.observaciones).toBe('Nota de prueba');
        });

        it('renderer contract: temp rows preserve plain observations content', () => {
            const ped = makePedido({
                id: 'p1',
                etapaActual: Etapa.IMPRESION_WM1,
                observaciones: 'Urgente',
            });
            const opts = defaultOptions({
                activePedidos: [ped],
                listasTemporalesMap: { 'p1': [Etapa.POST_DNT] },
            });

            const expanded = buildExpandedPedidoList(opts);
            const pdfRows = preparePdfRows(expanded);

            for (const row of pdfRows) {
                const obsRapidas = row.observacionesRapidas
                    ? row.observacionesRapidas.split(' | ').filter(Boolean).join(' • ')
                    : '';
                const obsNormal = row.observaciones || '';
                const obsBase = [obsRapidas, obsNormal].filter(Boolean).join('\n') || '-';
                expect(obsBase).toBe('Urgente');
            }
        });
    });
});
