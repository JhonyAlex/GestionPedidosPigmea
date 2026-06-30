/**
 * Pure utility for PedidoList temporal-row CTA visibility contract.
 *
 * Extracted so the contract ("temporal rows hide operational CTAs") can be
 * verified in unit tests without rendering the full PedidoList component.
 *
 * Used by PedidoRow and PedidoList.
 */

import type { Pedido } from '../types';

/**
 * Returns true when the row represents a "temporal display" — a pedido instance
 * shown at a visual stage that differs from its real etapaActual (expanded
 * list temporal entry, or filtered-by-list-temporal).
 *
 * When true, PedidoRow must NOT render operational CTAs (advance, archive)
 * because those actions would operate on the real stage, not the visual one.
 */
export function computeTemporalDisplay(
    pedido: Pedido,
    isExpandedView: boolean,
    isTemporalDisplayProp: boolean | undefined,
): boolean {
    if (isExpandedView) {
        const visualStage = (pedido as any)._visualStage;
        return visualStage != null && visualStage !== pedido.etapaActual;
    }
    return isTemporalDisplayProp ?? false;
}
