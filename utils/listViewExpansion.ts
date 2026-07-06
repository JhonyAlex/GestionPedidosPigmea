/**
 * Pure utility for building the expanded pedido list used in List view and PDF export.
 *
 * Extracted from App.tsx so it can be tested independently of React hooks.
 *
 * Handles ONLY production stages (as defined by productionKanbanStages).
 * Each pedido appears once per real + temporary production stage instance,
 * sorted by kanban manual order, concatenated in production stage sequence.
 *
 * Non-production pedidos (PENDIENTE, COMPLETADO, etc.) are NOT handled here —
 * they must be concatenated by the caller in the desired sort order.
 *
 * Expanded entries carry _visualStage, _visualKey, and _kanbanInstanceIndex
 * metadata so downstream consumers (PedidoList, PDF) can distinguish real vs
 * temporary rows and render the correct visual stage label.
 */

import { Pedido, Etapa } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExpandedPedido extends Pedido {
    _visualStage: Etapa;
    _visualKey: string;
    _kanbanInstanceIndex: number;
}

export interface BuildExpandedListOptions {
    activePedidos: Pedido[];
    listasTemporalesMap: Record<string, Etapa[]>;
    kanbanManualOrderMap: Partial<Record<Etapa, string[]>>;
    productionKanbanStages: Etapa[];
    selectedStages: string[];
    stageFilter: string;
    sortKanbanColumnPedidos: (
        pedidos: Pedido[],
        stageId: Etapa,
        manualOrderMap: Partial<Record<Etapa, string[]>>,
    ) => Pedido[];
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function buildExpandedPedidoList(opts: BuildExpandedListOptions): ExpandedPedido[] {
    const {
        activePedidos,
        listasTemporalesMap,
        kanbanManualOrderMap,
        productionKanbanStages,
        selectedStages,
        stageFilter,
        sortKanbanColumnPedidos,
    } = opts;

    const result: ExpandedPedido[] = [];

    // Determine which production stages are visible
    const isFiltered =
        selectedStages.length > 0 || (stageFilter !== 'all' && stageFilter !== 'multiple');

    const effectiveStages = isFiltered
        ? productionKanbanStages.filter(s => selectedStages.includes(s) || stageFilter === s)
        : productionKanbanStages;

    for (const etapaId of effectiveStages) {
        const columnEntries: (Pedido & {
            _kanbanInstanceIndex: number;
            _kanbanVisualKey: string;
        })[] = [];

        // Production stage: expand real + temporary instances
        for (const pedido of activePedidos) {
            const isReal = pedido.etapaActual === etapaId;
            const temps = listasTemporalesMap[pedido.id] || [];

            if (isReal) {
                const entry = { ...pedido } as any;
                entry._kanbanInstanceIndex = 0;
                entry._kanbanVisualKey = `real:${pedido.id}:${etapaId}`;
                columnEntries.push(entry);
            }

            let tempCount = 0;
            for (const tempEtapa of temps) {
                if (tempEtapa === etapaId) {
                    tempCount++;
                    const entry = { ...pedido } as any;
                    entry._kanbanInstanceIndex = tempCount;
                    entry._kanbanVisualKey = `temp:${pedido.id}:${etapaId}:${tempCount}`;
                    columnEntries.push(entry);
                }
            }
        }

        // Sort by kanban manual order (Production view order)
        const sorted = sortKanbanColumnPedidos(
            columnEntries as any[],
            etapaId,
            kanbanManualOrderMap,
        );

        for (const entry of sorted) {
            (entry as any)._visualStage = etapaId;
            (entry as any)._visualKey = (entry as any)._kanbanVisualKey;
            result.push(entry as any as ExpandedPedido);
        }
    }

    return result;
}

// ---------------------------------------------------------------------------
// Interleaving: merge non-production pedidos with the expanded production block
// ---------------------------------------------------------------------------

/**
 * Interleave non-production pedidos with the expanded production block.
 *
 * SLOTS CONTRACT (preserve base-order slots, fill production slots with
 * expanded flow):
 * - Think of `activePedidos` as a sequence of slots. Each slot is either a
 *   "production slot" or a "non-production slot".
 * - Non-production slots keep their original pedido at the exact same
 *   relative position they occupy in the base list.
 * - Production slots are filled with the pedido's expanded rows (real +
 *   temp instances), extracted from the already-ordered `expanded` list.
 * - If a non-production pedido also has expanded rows (temp-visibility),
 *   the expanded rows REPLACE the original slot entry (no duplication).
 * - Any expanded rows not consumed during the walk (pedido not present in
 *   activePedidos) are appended at the end.
 */
export function interleaveExpandedList(
    activePedidos: Pedido[],
    expanded: ExpandedPedido[],
    nonProductionIds: Set<string>,
    productionStages: Set<Etapa>,
): ExpandedPedido[] {
    // Build pedidoId → expanded rows (preserving expanded order per pedido).
    const expandedByPedido = new Map<string, ExpandedPedido[]>();
    for (const row of expanded) {
        const rows = expandedByPedido.get(row.id);
        if (rows) {
            rows.push(row);
        } else {
            expandedByPedido.set(row.id, [row]);
        }
    }

    const result: ExpandedPedido[] = [];
    const emittedExpandedFor = new Set<string>();

    // Map each pedido ID to its first position in activePedidos so we can
    // interleave non-production pedidos at their correct relative positions.
    const activeOrder = new Map<string, number>();
    activePedidos.forEach((p, i) => {
        if (!activeOrder.has(p.id)) activeOrder.set(p.id, i);
    });

    // Non-production pedidos in activePedidos order.
    const nonProdPedidos = activePedidos.filter(p => nonProductionIds.has(p.id));
    let nonProdCursor = 0;

    // Walk expanded rows in their natural stage+kanban order instead of
    // grouping all rows for a pedido into a single block.  This preserves
    // the same order the user sees in the Production Kanban view.
    for (const row of expanded) {
        const rowActiveOrder = activeOrder.get(row.id) ?? Infinity;

        // Emit any non-production pedidos whose activePedidos position
        // is before this expanded row.
        while (nonProdCursor < nonProdPedidos.length) {
            const np = nonProdPedidos[nonProdCursor];
            const npOrder = activeOrder.get(np.id) ?? Infinity;

            // If this non-production pedido has its own expanded rows,
            // those rows will be emitted at their natural positions inside
            // the expanded walk — skip the bare pedido to avoid duplicates.
            if (expandedByPedido.has(np.id)) {
                nonProdCursor++;
                continue;
            }

            if (npOrder < rowActiveOrder) {
                result.push(np as unknown as ExpandedPedido);
                nonProdCursor++;
            } else {
                break;
            }
        }

        result.push(row);
        emittedExpandedFor.add(row.id);
    }

    // Append any remaining non-production pedidos that appear after the
    // last expanded row in activePedidos order.
    while (nonProdCursor < nonProdPedidos.length) {
        const np = nonProdPedidos[nonProdCursor];
        if (!expandedByPedido.has(np.id)) {
            result.push(np as unknown as ExpandedPedido);
        }
        nonProdCursor++;
    }

    // Edge case: expanded rows whose pedido was never consumed by the walk
    // (e.g. a non-prod pedido not in activePedidos but appearing via temp).
    for (const row of expanded) {
        if (!emittedExpandedFor.has(row.id)) {
            result.push(row);
            emittedExpandedFor.add(row.id);
        }
    }

    return result;
}

// ---------------------------------------------------------------------------
// PDF data contract helpers (used by generatePedidosPDF)
// ---------------------------------------------------------------------------

/**
 * Normalize an expanded pedido for PDF export: for temporary entries, set
 * etapaActual to the visual stage so PDF subtitle/next-stage/stage display
 * all reflect the visual context. `_isTemporal` remains available as metadata
 * for renderer decisions, without injecting PDF-only markers into observations.
 */
export interface PdfRow extends Pedido {
    _isTemporal: boolean;
}

export function preparePdfRows(expandedPedidos: ExpandedPedido[]): PdfRow[] {
    return expandedPedidos.map(p => {
        const visualStage = (p as any)._visualStage as Etapa | undefined;
        const instanceIndex = (p as any)._kanbanInstanceIndex as number | undefined;
        const isTemporal =
            visualStage != null && (visualStage !== p.etapaActual || (instanceIndex || 0) > 0);
        if (isTemporal) {
            return {
                ...p,
                etapaActual: visualStage,
                _isTemporal: true,
            } as any;
        }
        return { ...p, _isTemporal: false } as any;
    });
}
