/**
 * Component-level tests for PedidoList — temporal rows don't show operational CTAs.
 *
 * Uses @testing-library/react to properly run React effects (isMounted state).
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PedidoList from './PedidoList';
import { Pedido, Etapa, Prioridad, UserRole } from '../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../hooks/usePermissions', () => ({
    usePermissions: () => ({
        canMovePedidos: () => true,
        canArchivePedidos: () => true,
        canAccess: () => true,
        canViewSection: () => true,
        canViewPedidos: () => true,
        canViewClientes: () => true,
        canViewVendedores: () => true,
        canViewPreparacion: () => true,
        canViewListoProduccion: () => true,
        canViewReportes: () => true,
        canViewAuditoria: () => true,
        canManageUsers: () => true,
        canManageConfig: () => true,
        canViewAudit: () => true,
        canCreatePedidos: () => true,
        canEditPedidos: () => true,
        canDeletePedidos: () => true,
        canViewUsers: () => true,
        canCreateUsers: () => true,
        canEditUsers: () => true,
        canDeleteUsers: () => true,
        canManagePermissions: () => true,
        canViewKPI: () => true,
        canExportReports: () => true,
        canEditConfig: () => true,
        canViewSystemHealth: () => true,
        canAccessMaintenance: () => true,
        canViewReports: () => true,
        canViewConfig: () => true,
        canAccessAdmin: () => true,
        isAdmin: () => true,
        isSupervisor: () => true,
        isVisualizador: () => false,
        getUserPermissions: () => [],
        user: null,
    }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// SVG path markers from the CTA icons — found in the rendered HTML.
// ArchiveBoxIcon (used for archivable pedidos: COMPLETADO / PREPARACION)
const ARCHIVE_BOX_PATH =
    'm20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z';

// ArrowRightCircleIcon (advance CTA) — path marker
const ADVANCE_ARROW_PATH =
    'M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';

// UnarchiveBoxIcon
const UNARCHIVE_PATH =
    'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z';

function makePedido(overrides: Partial<Pedido> = {}): Pedido {
    return {
        id: 'p1',
        numeroPedidoCliente: 'P001',
        cliente: 'Test Client',
        desarrollo: 'Test Des',
        etapaActual: Etapa.PENDIENTE,
        prioridad: Prioridad.NORMAL,
        metros: 100,
        tiempoProduccionPlanificado: '2h',
        fechaEntrega: '2025-12-31',
        capa: '1',
        camisa: '12',
        secuenciaTrabajo: [],
        ...overrides,
    } as unknown as Pedido;
}

const noop = () => {};

const defaultProps = {
    pedidos: [] as Pedido[],
    onSelectPedido: noop,
    onArchiveToggle: noop,
    isArchivedView: false,
    currentUserRole: 'Administrador' as UserRole,
    onAdvanceStage: noop,
    sortConfig: { key: 'numeroPedidoCliente' as keyof Pedido, direction: 'ascending' as const },
    onSort: noop,
    highlightedPedidoId: null,
};

/**
 * Returns true if the rendered HTML contains any known CTA SVG path marker
 * (archive, unarchive, or advance arrow). Used to assert CTA visibility.
 */
function hasAnyCtaInRow(row: HTMLElement): boolean {
    const html = row.innerHTML;
    return (
        html.includes(ARCHIVE_BOX_PATH) ||
        html.includes(UNARCHIVE_PATH) ||
        html.includes(ADVANCE_ARROW_PATH)
    );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PedidoList — temporal rows hide operational CTAs', () => {
    // --- Non-expanded view: temporal via listasTemporalesMap + selectedStages ---

    it('temporal rows hide CTA buttons (non-expanded)', () => {
        // Pedido in IMPRESION_WM1, but filtered by POST_DNT stages with a temp list
        const ped = makePedido({
            id: 'tmp-1',
            etapaActual: Etapa.IMPRESION_WM1,
            numeroPedidoCliente: 'T001',
        });

        render(
            React.createElement(PedidoList, {
                ...defaultProps,
                pedidos: [ped],
                listasTemporalesMap: { 'tmp-1': [Etapa.POST_DNT] },
                selectedStages: [Etapa.POST_DNT],
            }),
        );

        expect(screen.getByText('T001')).toBeDefined();

        const row = screen.getByText('T001').closest('tr')!;
        expect(hasAnyCtaInRow(row)).toBe(false);
    });

    it('real (non-temporal) rows show CTA buttons (non-expanded)', () => {
        // COMPLETADO pedido reliably shows archive CTA
        const ped = makePedido({
            id: 'real-1',
            etapaActual: Etapa.COMPLETADO,
            numeroPedidoCliente: 'R001',
        });

        render(
            React.createElement(PedidoList, {
                ...defaultProps,
                pedidos: [ped],
                selectedStages: [],
            }),
        );

        expect(screen.getByText('R001')).toBeDefined();

        const row = screen.getByText('R001').closest('tr')!;
        expect(hasAnyCtaInRow(row)).toBe(true);
    });

    it('temporal rows hide CTA buttons (expanded view)', () => {
        const ped = makePedido({
            id: 'exp-1',
            etapaActual: Etapa.IMPRESION_WM1,
            numeroPedidoCliente: 'E001',
        });
        (ped as any)._visualStage = Etapa.POST_DNT;
        (ped as any)._visualKey = 'temp:exp-1:POST_DNT:1';
        (ped as any)._kanbanInstanceIndex = 1;

        render(
            React.createElement(PedidoList, {
                ...defaultProps,
                pedidos: [ped],
                isExpandedView: true,
            }),
        );

        expect(screen.getByText('E001')).toBeDefined();

        const row = screen.getByText('E001').closest('tr')!;
        expect(hasAnyCtaInRow(row)).toBe(false);
    });

    it('real (non-temporal) rows show CTA buttons (expanded view)', () => {
        // COMPLETADO pedido with matching _visualStage
        const ped = makePedido({
            id: 'exp-real',
            etapaActual: Etapa.COMPLETADO,
            numeroPedidoCliente: 'ER001',
        });
        (ped as any)._visualStage = Etapa.COMPLETADO;
        (ped as any)._visualKey = 'real:exp-real:COMPLETADO';
        (ped as any)._kanbanInstanceIndex = 0;

        render(
            React.createElement(PedidoList, {
                ...defaultProps,
                pedidos: [ped],
                isExpandedView: true,
            }),
        );

        expect(screen.getByText('ER001')).toBeDefined();

        const row = screen.getByText('ER001').closest('tr')!;
        expect(hasAnyCtaInRow(row)).toBe(true);
    });

    it('mixed: only temporal rows hide CTAs, real rows show them', () => {
        const real = makePedido({
            id: 'r1',
            etapaActual: Etapa.COMPLETADO,
            numeroPedidoCliente: 'REAL-1',
        });
        const temp = makePedido({
            id: 't1',
            etapaActual: Etapa.POST_DNT,
            numeroPedidoCliente: 'TEMP-1',
        });

        render(
            React.createElement(PedidoList, {
                ...defaultProps,
                pedidos: [real, temp],
                listasTemporalesMap: { 't1': [Etapa.IMPRESION_WM1] },
                selectedStages: [Etapa.IMPRESION_WM1],
            }),
        );

        // Both rows appear in DOM
        expect(screen.getByText('REAL-1')).toBeDefined();
        expect(screen.getByText('TEMP-1')).toBeDefined();

        // Real row has CTAs
        const realRow = screen.getByText('REAL-1').closest('tr')!;
        expect(hasAnyCtaInRow(realRow)).toBe(true);

        // Temporal row has NO CTAs
        const tempRow = screen.getByText('TEMP-1').closest('tr')!;
        expect(hasAnyCtaInRow(tempRow)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Expanded View Selection Behavior — contracts for:
//  1. row selection when same pedido appears multiple times
//  2. select-all with duplicate/expanded rows
//  3. decorative headers in expanded view (no sort)
// ---------------------------------------------------------------------------

function makeExpandedPedido(
    id: string,
    numero: string,
    etapaActual: Etapa,
    visualStage: Etapa,
    visualKey: string,
    overrides: Partial<Pedido> = {}
): Pedido {
    const ped = makePedido({ id, numeroPedidoCliente: numero, etapaActual, ...overrides });
    (ped as any)._visualStage = visualStage;
    (ped as any)._visualKey = visualKey;
    return ped;
}

describe('PedidoList — expanded view selection behavior', () => {
    // Shared mock for select-all in row-toggle tests (checkbox column needs it)
    const selectAllNoop = vi.fn();
    const toggleNoop = vi.fn();

    // ===================================================================
    // 1. SAME PEDIDO APPEARS MULTIPLE TIMES (duplicate visual rows)
    // ===================================================================

    describe('same pedido with multiple visual rows', () => {
        it('fires parent toggle when first visual row is selected', () => {
            const onToggle = vi.fn();
            const real = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_DNT, 'real:p1:POST_DNT');
            const temp = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_LAMINACION_NEXUS, 'temp:p1:POST_LAMINACION_NEXUS:0');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [real, temp],
                    isExpandedView: true,
                    selectedIds: [],
                    onToggleSelection: onToggle,
                    onSelectAll: selectAllNoop,
                }),
            );

            const cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
            expect(cbs.length).toBe(3); // select-all + 2 rows

            // Toggle first visual row → parent must be notified
            fireEvent.click(cbs[1]);
            expect(onToggle).toHaveBeenCalledTimes(1);
            expect(onToggle).toHaveBeenCalledWith('p1');
        });

        it('does NOT re-notify parent when second visual row of same pedido is toggled', () => {
            const onToggle = vi.fn();
            const real = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_DNT, 'real:p1:POST_DNT');
            const temp = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_LAMINACION_NEXUS, 'temp:p1:POST_LAMINACION_NEXUS:0');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [real, temp],
                    isExpandedView: true,
                    selectedIds: [],
                    onToggleSelection: onToggle,
                    onSelectAll: selectAllNoop,
                }),
            );

            const cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

            // Row 1 → parent notified
            fireEvent.click(cbs[1]);
            expect(onToggle).toHaveBeenCalledTimes(1);

            // Row 2 (same pedido) → parent NOT re-notified
            fireEvent.click(cbs[2]);
            expect(onToggle).toHaveBeenCalledTimes(1);
        });

        it('keeps pedido in parent when one of multiple selected rows is deselected', () => {
            const onToggle = vi.fn();
            const real = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_DNT, 'real:p1:POST_DNT');
            const temp = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_LAMINACION_NEXUS, 'temp:p1:POST_LAMINACION_NEXUS:0');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [real, temp],
                    isExpandedView: true,
                    selectedIds: [],
                    onToggleSelection: onToggle,
                    onSelectAll: selectAllNoop,
                }),
            );

            const cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

            // Select both rows
            fireEvent.click(cbs[1]);
            fireEvent.click(cbs[2]);
            // At this point parent has p1 selected from the first row toggle
            onToggle.mockClear();

            // Deselect first row — pedido stays in parent (second row still selected)
            fireEvent.click(cbs[1]);
            expect(onToggle).not.toHaveBeenCalled();
        });

        it('removes pedido from parent when last visual row is deselected', () => {
            const onToggle = vi.fn();
            const real = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_DNT, 'real:p1:POST_DNT');
            const temp = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_LAMINACION_NEXUS, 'temp:p1:POST_LAMINACION_NEXUS:0');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [real, temp],
                    isExpandedView: true,
                    selectedIds: [],
                    onToggleSelection: onToggle,
                    onSelectAll: selectAllNoop,
                }),
            );

            const cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

            // Select both rows
            fireEvent.click(cbs[1]);
            fireEvent.click(cbs[2]);
            onToggle.mockClear();

            // Deselect first row (second still holds p1 in parent)
            fireEvent.click(cbs[1]);
            expect(onToggle).not.toHaveBeenCalled();

            // Deselect second row — last visual row gone, parent must be notified
            fireEvent.click(cbs[2]);
            expect(onToggle).toHaveBeenCalledTimes(1);
            expect(onToggle).toHaveBeenCalledWith('p1');
        });

        it('single-instance pedido toggles normally (same as non-expanded)', () => {
            const onToggle = vi.fn();
            const ped = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_DNT, 'real:p1:POST_DNT');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [ped],
                    isExpandedView: true,
                    selectedIds: [],
                    onToggleSelection: onToggle,
                    onSelectAll: selectAllNoop,
                }),
            );

            const cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
            fireEvent.click(cbs[1]);
            expect(onToggle).toHaveBeenCalledWith('p1');
        });
    });

    // ===================================================================
    // 2. SELECT-ALL WITH DUPLICATE / EXPANDED ROWS
    // ===================================================================

    describe('select-all with duplicate/expanded rows', () => {
        it('sends UNIQUE pedido IDs to parent (no duplicates from multi-row pedidos)', () => {
            const onSelectAll = vi.fn();
            // p1 → 2 visual rows, p2 → 1 visual row
            const p1real = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_DNT, 'real:p1:POST_DNT');
            const p1temp = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_LAMINACION_NEXUS, 'temp:p1:POST_LAMINACION_NEXUS:0');
            const p2 = makeExpandedPedido('p2', 'D002', Etapa.COMPLETADO, Etapa.COMPLETADO, 'real:p2:COMPLETADO');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [p1real, p1temp, p2],
                    isExpandedView: true,
                    selectedIds: [],
                    onToggleSelection: toggleNoop,
                    onSelectAll,
                }),
            );

            const cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
            fireEvent.click(cbs[0]); // select-all checkbox

            expect(onSelectAll).toHaveBeenCalledTimes(1);
            const ids: string[] = onSelectAll.mock.calls[0][0];
            expect(ids).toHaveLength(2);
            expect(ids).toContain('p1');
            expect(ids).toContain('p2');
        });

        it('clears selection when select-all is toggled off', () => {
            const onSelectAll = vi.fn();
            const ped = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_DNT, 'real:p1:POST_DNT');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [ped],
                    isExpandedView: true,
                    selectedIds: [],
                    onToggleSelection: toggleNoop,
                    onSelectAll,
                }),
            );

            const cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

            // Select all
            fireEvent.click(cbs[0]);
            expect(onSelectAll).toHaveBeenCalledWith(['p1']);
            onSelectAll.mockClear();

            // Toggle off — re-render has allSelected=true, so clearing fires with []
            fireEvent.click(cbs[0]);
            expect(onSelectAll).toHaveBeenCalledWith([]);
        });

        it('select-all checkbox reflects all-visual-rows-selected state', () => {
            const ped1 = makeExpandedPedido('p1', 'D001', Etapa.POST_DNT, Etapa.POST_DNT, 'real:p1:POST_DNT');
            const ped2 = makeExpandedPedido('p2', 'D002', Etapa.COMPLETADO, Etapa.COMPLETADO, 'real:p2:COMPLETADO');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [ped1, ped2],
                    isExpandedView: true,
                    selectedIds: [],
                    onToggleSelection: toggleNoop,
                    onSelectAll: selectAllNoop,
                }),
            );

            let cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
            expect(cbs[0].checked).toBe(false);

            // Select row 1
            fireEvent.click(cbs[1]);
            cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
            expect(cbs[0].checked).toBe(false); // not all yet

            // Select row 2
            fireEvent.click(cbs[2]);
            cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
            expect(cbs[0].checked).toBe(true); // all selected

            // Deselect row 1
            fireEvent.click(cbs[1]);
            cbs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
            expect(cbs[0].checked).toBe(false); // not all
        });
    });

    // ===================================================================
    // 3. DECORATIVE HEADERS IN EXPANDED VIEW (no sort)
    // ===================================================================

    describe('decorative headers in expanded view', () => {
        // Column order in PedidoList (without onSelectAll): 12 sortable th + Acciones th
        // Positions 0-11 are sortable, 12 is Acciones.

        it('renders headers as plain text (no buttons) in expanded view', () => {
            const ped = makeExpandedPedido('p1', 'E001', Etapa.IMPRESION_WM1, Etapa.IMPRESION_WM1, 'real:p1:IMPRESION_WM1');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [ped],
                    isExpandedView: true,
                }),
            );

            // First sortable th (col 0) = N° Pedido — must be plain text, no <button>
            const th = container.querySelectorAll('thead th')[0];
            expect(th).toBeTruthy();
            expect(th.textContent).toContain('N° Pedido');
            expect(th.querySelector('button')).toBeNull();
        });

        it('no sortable header contains a button in expanded view', () => {
            const ped = makeExpandedPedido('p1', 'E001', Etapa.IMPRESION_WM1, Etapa.IMPRESION_WM1, 'real:p1:IMPRESION_WM1');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [ped],
                    isExpandedView: true,
                }),
            );

            const ths = container.querySelectorAll('thead th');
            // 12 sortable headers (indices 0-11), 13th is Acciones
            expect(ths.length).toBeGreaterThanOrEqual(12);
            for (let i = 0; i < 12; i++) {
                expect(ths[i].querySelector('button')).toBeNull();
            }
        });

        it('does not call onSort when clicking any header in expanded view', () => {
            const onSort = vi.fn();
            const ped = makeExpandedPedido('p1', 'E001', Etapa.IMPRESION_WM1, Etapa.IMPRESION_WM1, 'real:p1:IMPRESION_WM1');

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [ped],
                    isExpandedView: true,
                    onSort,
                }),
            );

            const ths = container.querySelectorAll('thead th');
            // Click several headers — plain th, no button, but onSort must NOT fire
            fireEvent.click(ths[0]); // N° Pedido
            fireEvent.click(ths[1]); // Cliente
            fireEvent.click(ths[8]); // Metros

            expect(onSort).not.toHaveBeenCalled();
        });

        it('non-expanded headers ARE interactive buttons (control test)', () => {
            const onSort = vi.fn();
            const ped = makePedido({ id: 'p1', numeroPedidoCliente: 'N001' });

            const { container } = render(
                React.createElement(PedidoList, {
                    ...defaultProps,
                    pedidos: [ped],
                    onSort,
                }),
            );

            const ths = container.querySelectorAll('thead th');
            // First sortable column = N° Pedido — must have a <button>
            const button = ths[0].querySelector('button');
            expect(button).toBeTruthy();

            fireEvent.click(button!);
            expect(onSort).toHaveBeenCalledTimes(1);
            expect(onSort).toHaveBeenCalledWith('numeroPedidoCliente');
        });
    });
});
