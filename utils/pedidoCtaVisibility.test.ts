/**
 * Tests for pedidoCtaVisibility.ts — the pure utility that determines whether
 * a pedido row is in "temporal display" mode, which gates operational CTAs.
 */

import { describe, it, expect } from 'vitest';
import { computeTemporalDisplay } from './pedidoCtaVisibility';
import { Pedido, Etapa, Prioridad } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePedido(overrides: Partial<Pedido> = {}): Pedido {
    return {
        id: 'ped-1',
        numeroPedidoCliente: 'P001',
        cliente: 'Test',
        desarrollo: 'Test Des',
        etapaActual: Etapa.PENDIENTE,
        prioridad: Prioridad.NORMAL,
        metros: 100,
        tiempoProduccionPlanificado: '2h',
        ...overrides,
    } as Pedido;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeTemporalDisplay', () => {
    // --- Non-expanded view ---

    describe('non-expanded view', () => {
        it('returns true when isTemporalDisplayProp is true', () => {
            const ped = makePedido({ etapaActual: Etapa.IMPRESION_WM1 });
            expect(computeTemporalDisplay(ped, false, true)).toBe(true);
        });

        it('returns false when isTemporalDisplayProp is false', () => {
            const ped = makePedido({ etapaActual: Etapa.IMPRESION_WM1 });
            expect(computeTemporalDisplay(ped, false, false)).toBe(false);
        });

        it('returns false when isTemporalDisplayProp is undefined', () => {
            const ped = makePedido({ etapaActual: Etapa.IMPRESION_WM1 });
            expect(computeTemporalDisplay(ped, false, undefined)).toBe(false);
        });
    });

    // --- Expanded view ---

    describe('expanded view', () => {
        it('returns true when _visualStage differs from etapaActual', () => {
            const ped = makePedido({ etapaActual: Etapa.IMPRESION_WM1 });
            (ped as any)._visualStage = Etapa.POST_DNT;
            expect(computeTemporalDisplay(ped, true, undefined)).toBe(true);
        });

        it('returns false when _visualStage equals etapaActual (real row)', () => {
            const ped = makePedido({ etapaActual: Etapa.IMPRESION_WM1 });
            (ped as any)._visualStage = Etapa.IMPRESION_WM1;
            expect(computeTemporalDisplay(ped, true, undefined)).toBe(false);
        });

        it('returns false when _visualStage is undefined', () => {
            const ped = makePedido({ etapaActual: Etapa.IMPRESION_WM1 });
            // No _visualStage set
            expect(computeTemporalDisplay(ped, true, undefined)).toBe(false);
        });

        it('ignores isTemporalDisplayProp in expanded view', () => {
            const ped = makePedido({ etapaActual: Etapa.IMPRESION_WM1 });
            // In expanded view, the prop is irrelevant — only _visualStage matters
            expect(computeTemporalDisplay(ped, true, true)).toBe(false);
            expect(computeTemporalDisplay(ped, true, false)).toBe(false);
        });

        it('returns true for temp visual row with explicit _visualStage', () => {
            const ped = makePedido({ etapaActual: Etapa.POST_DNT });
            (ped as any)._visualStage = Etapa.IMPRESION_WM1;
            expect(computeTemporalDisplay(ped, true, false)).toBe(true);
        });
    });

    // --- Contract: temporal = no CTAs ---

    describe('CTA gating contract', () => {
        it('temporal display blocks operational CTAs (predicate is true → hide)', () => {
            // This test encodes the invariant: when computeTemporalDisplay
            // returns true, PedidoRow MUST hide advance/archive buttons.
            const ped = makePedido({ etapaActual: Etapa.IMPRESION_WM1 });
            (ped as any)._visualStage = Etapa.POST_DNT;

            const isTemporal = computeTemporalDisplay(ped, true, undefined);

            // The contract: isTemporal → hide CTAs
            // PedidoRow implements: {!temporalDisplay && <CTA buttons />}
            expect(isTemporal).toBe(true);
        });

        it('real (non-temporal) display allows CTAs (predicate is false → show)', () => {
            const ped = makePedido({ etapaActual: Etapa.IMPRESION_WM1 });
            (ped as any)._visualStage = Etapa.IMPRESION_WM1;

            const isTemporal = computeTemporalDisplay(ped, true, undefined);

            // The contract: !isTemporal → show CTAs (subject to permissions)
            expect(isTemporal).toBe(false);
        });
    });
});
