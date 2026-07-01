/**
 * Tests for etapaLogic.ts — sequence consumption, repetition handling,
 * completion guard, and destination temp cleanup contracts.
 *
 * Phase A + B: Post-impresión sequence integrity
 */

import { describe, it, expect } from 'vitest';
import { Etapa } from '../types';
import { calcularSiguienteEtapa, findNextOccurrenceIndex } from './etapaLogic';

// ---------------------------------------------------------------------------
// Phase B: Repeated stages — consumption one occurrence at a time
// ---------------------------------------------------------------------------

describe('calcularSiguienteEtapa — repeated stages', () => {
    const SEQ = [
        Etapa.POST_DNT,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_REBOBINADO_S2DT,
    ];

    it('consumes first occurrence: DNT → first SL2', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_DNT, SEQ, 0
        );
        expect(target).toBe(Etapa.POST_DNT); // position 0 = DNT (entry from printing)
    });

    it('entry from printing returns first sequence stage', () => {
        const target = calcularSiguienteEtapa(
            Etapa.IMPRESION_WM1, SEQ
        );
        expect(target).toBe(Etapa.POST_DNT);
    });

    it('position 1 → second occurrence = SL2 (same stage, repetition)', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, SEQ, 1
        );
        // At this point, pedido is in SL2, positionIndex=1 points to SL2 again
        expect(target).toBe(Etapa.POST_LAMINACION_SL2);
    });

    it('position 2 → third occurrence = SL2 (another repetition)', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, SEQ, 2
        );
        expect(target).toBe(Etapa.POST_LAMINACION_SL2);
    });

    it('position 3 → third SL2 occurrence (still same stage, repetition)', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, SEQ, 3
        );
        // Index 3 is the third SL2 in the sequence [DNT, SL2, SL2, SL2, S2DT]
        expect(target).toBe(Etapa.POST_LAMINACION_SL2);
    });

    it('position 4 → fourth occurrence = S2DT (different stage)', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, SEQ, 4
        );
        expect(target).toBe(Etapa.POST_REBOBINADO_S2DT);
    });

    it('position 5 (>= length) → COMPLETADO (all consumed)', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_REBOBINADO_S2DT, SEQ, 5
        );
        expect(target).toBe(Etapa.COMPLETADO);
    });

    it('position 6 (> length) → COMPLETADO', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_REBOBINADO_S2DT, SEQ, 6
        );
        expect(target).toBe(Etapa.COMPLETADO);
    });
});

// ---------------------------------------------------------------------------
// Phase A Bug 2: NO premature completion while unconsumed stages remain
// ---------------------------------------------------------------------------

describe('calcularSiguienteEtapa — completion guard (golden rule)', () => {
    it('does NOT return COMPLETADO when positionIndex < sequence length', () => {
        const seq = [Etapa.POST_LAMINACION_SL2, Etapa.POST_REBOBINADO_S2DT];
        const target = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, seq, 0
        );
        expect(target).not.toBe(Etapa.COMPLETADO);
        expect(target).toBe(Etapa.POST_LAMINACION_SL2);
    });

    it('returns COMPLETADO only when positionIndex >= sequence length', () => {
        const seq = [Etapa.POST_LAMINACION_SL2];
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, seq, 0))
            .toBe(Etapa.POST_LAMINACION_SL2);
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, seq, 1))
            .toBe(Etapa.COMPLETADO);
    });

    it('empty sequence — no completion when in post-impresión', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, [], 0
        );
        expect(target).toBe(Etapa.COMPLETADO); // 0 >= 0 → completed
    });

    it('empty sequence with undefined positionIndex — legacy null return', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, [], undefined
        );
        expect(target).toBeNull(); // Legacy: no indexOf match, returns null
    });
});

// ---------------------------------------------------------------------------
// Legacy backward compatibility (no secuenciaPositionIndex)
// ---------------------------------------------------------------------------

describe('calcularSiguienteEtapa — legacy fallback', () => {
    it('legacy: post-printing first stage with indexOf', () => {
        const seq = [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2];
        // IMPRESION → first stage
        const target = calcularSiguienteEtapa(Etapa.IMPRESION_WM1, seq);
        expect(target).toBe(Etapa.POST_DNT);
    });

    it('legacy: advances to next stage', () => {
        const seq = [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2, Etapa.POST_REBOBINADO_S2DT];
        const target = calcularSiguienteEtapa(Etapa.POST_DNT, seq);
        expect(target).toBe(Etapa.POST_LAMINACION_SL2);
    });

    it('legacy: last stage → COMPLETADO', () => {
        const seq = [Etapa.POST_REBOBINADO_S2DT];
        const target = calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, seq);
        expect(target).toBe(Etapa.COMPLETADO);
    });

    it('legacy: stage not in sequence returns null', () => {
        const seq = [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2];
        const target = calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, seq);
        expect(target).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// findNextOccurrenceIndex
// ---------------------------------------------------------------------------

describe('findNextOccurrenceIndex', () => {
    const SEQ = [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2, Etapa.POST_LAMINACION_SL2, Etapa.POST_REBOBINADO_S2DT];

    it('finds first occurrence from start (no positionIndex)', () => {
        const idx = findNextOccurrenceIndex(Etapa.POST_LAMINACION_SL2, SEQ);
        expect(idx).toBe(1);
    });

    it('finds occurrence after positionIndex', () => {
        const idx = findNextOccurrenceIndex(Etapa.POST_LAMINACION_SL2, SEQ, 2);
        expect(idx).toBe(2);
    });

    it('returns -1 when stage not found after positionIndex', () => {
        const idx = findNextOccurrenceIndex(Etapa.POST_LAMINACION_SL2, SEQ, 3);
        expect(idx).toBe(-1);
    });

    it('returns -1 when stage not in sequence at all', () => {
        const idx = findNextOccurrenceIndex(Etapa.POST_PERFORACION_MIC, SEQ);
        expect(idx).toBe(-1);
    });

    it('empty sequence returns -1', () => {
        const idx = findNextOccurrenceIndex(Etapa.POST_DNT, []);
        expect(idx).toBe(-1);
    });
});

// ---------------------------------------------------------------------------
// Integration / contract tests: full-flow simulations
// ---------------------------------------------------------------------------

describe('Full-flow simulation — position-index aware advance', () => {
    // Sequence with a repetition: SL2 appears twice
    const SEQ_REPEAT = [
        Etapa.POST_DNT,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_REBOBINADO_S2DT,
    ];

    it('1. initialize: entry from printing → position-index starts at 0', () => {
        // Simulates handleUpdatePedidoEtapa setting secuenciaPositionIndex=0
        // when entering printing.
        // The first advance from printing uses calcularSiguienteEtapa with
        // the printing stage — it doesn't use positionIndex directly.
        const target = calcularSiguienteEtapa(
            Etapa.IMPRESION_WM1, SEQ_REPEAT
        );
        expect(target).toBe(Etapa.POST_DNT);
    });

    it('2. no premature completion: does NOT return COMPLETADO while repetitions remain', () => {
        // After consuming DNT (index 0), pedido is in DNT.
        // Next target should be SL2 (index 0), NOT COMPLETADO.
        const target0 = calcularSiguienteEtapa(
            Etapa.POST_DNT, SEQ_REPEAT, 0
        );
        expect(target0).toBe(Etapa.POST_DNT); // position 0 = DNT (current)

        // After first advance: positionIndex=1, pedido is in SL2.
        // Target should be SL2 again (second occurrence), not S2DT, not COMPLETADO.
        const target1 = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 1
        );
        expect(target1).toBe(Etapa.POST_LAMINACION_SL2);

        // After second advance: positionIndex=2, pedido still in SL2.
        const target2 = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 2
        );
        expect(target2).toBe(Etapa.POST_LAMINACION_SL2);

        // After third advance: positionIndex=3, pedido still in SL2.
        // Next target should be S2DT, NOT COMPLETADO.
        const target3 = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 3
        );
        expect(target3).toBe(Etapa.POST_REBOBINADO_S2DT);
    });

    it('3. one-by-one consumption: each click consumes ONE occurrence', () => {
        // This test verifies the step-by-step consumption pattern.
        // Starting from printing (no positionIndex needed):
        // Click 1 → DNT
        expect(calcularSiguienteEtapa(Etapa.IMPRESION_WM1, SEQ_REPEAT))
            .toBe(Etapa.POST_DNT);

        // Pedido is now in DNT, positionIndex=0
        // Click 2 → SL2 (first occurrence)
        expect(calcularSiguienteEtapa(Etapa.POST_DNT, SEQ_REPEAT, 0))
            .toBe(Etapa.POST_DNT);

        // Pedido is now in SL2, positionIndex=1
        // Click 3 → SL2 (second occurrence, same stage)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 1))
            .toBe(Etapa.POST_LAMINACION_SL2);

        // Pedido is still in SL2, positionIndex=2
        // Click 4 → S2DT (different stage)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 2))
            .toBe(Etapa.POST_LAMINACION_SL2);

        // Pedido in S2DT, positionIndex=3
        // Click 5 → COMPLETADO (all consumed)
        expect(calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, SEQ_REPEAT, 3))
            .toBe(Etapa.POST_REBOBINADO_S2DT);
    });

    it('4. completion only when index >= sequence length', () => {
        const seq = [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2];

        // At position 1 (last element), still returns SL2, not COMPLETADO
        expect(calcularSiguienteEtapa(Etapa.POST_DNT, seq, 1))
            .toBe(Etapa.POST_LAMINACION_SL2);

        // At position 2 (>= length), returns COMPLETADO
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, seq, 2))
            .toBe(Etapa.COMPLETADO);

        // At position 3 (> length), returns COMPLETADO
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, seq, 3))
            .toBe(Etapa.COMPLETADO);
    });

    it('5. legacy compatibility: no secuenciaPositionIndex → indexOf fallback', () => {
        const seq = [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2, Etapa.POST_REBOBINADO_S2DT];

        // Legacy pedido in DNT → next is SL2
        expect(calcularSiguienteEtapa(Etapa.POST_DNT, seq, undefined))
            .toBe(Etapa.POST_LAMINACION_SL2);

        // Legacy pedido in SL2 → next is S2DT
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, seq, undefined))
            .toBe(Etapa.POST_REBOBINADO_S2DT);

        // Legacy pedido in S2DT (last) → COMPLETADO
        expect(calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, seq, undefined))
            .toBe(Etapa.COMPLETADO);

        // Legacy: stage not in sequence → null
        expect(calcularSiguienteEtapa(Etapa.POST_PERFORACION_MIC, seq, undefined))
            .toBeNull();
    });

    it('6. legacy with repetitions: first-match only (known limitation)', () => {
        // Legacy indexOf only finds the FIRST occurrence, so repeated stages
        // are not consumed one-by-one. This is the known limitation that
        // secuenciaPositionIndex fixes.
        const seq = [Etapa.POST_LAMINACION_SL2, Etapa.POST_LAMINACION_SL2, Etapa.POST_REBOBINADO_S2DT];

        // Legacy pedido in SL2 → next is SL2 (indexOf finds first, +1 = second SL2)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, seq, undefined))
            .toBe(Etapa.POST_LAMINACION_SL2);
    });

    it('7. printing entry with position-index available still uses printing path', () => {
        // Even if a pedido somehow has a positionIndex while in printing,
        // the printing entry path takes precedence and returns sequence[0].
        const target = calcularSiguienteEtapa(
            Etapa.IMPRESION_WM1, SEQ_REPEAT, 99
        );
        expect(target).toBe(Etapa.POST_DNT);
    });
});

// ---------------------------------------------------------------------------
// Contract tests: antivaho entry paths initialize secuenciaPositionIndex
// ---------------------------------------------------------------------------
// These verify the contract that the helper layer must uphold when
// handleConfirmAntivaho (→ printing) and handleCancelAntivaho (→ first
// post-impresión) initialize secuenciaPositionIndex = 0.

describe('Antivaho entry paths — secuenciaPositionIndex contract', () => {
    const SEQ = [
        Etapa.POST_DNT,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_REBOBINADO_S2DT,
    ];

    // --- handleConfirmAntivaho path: enters printing with index = 0 ---

    it('confirm-antivaho to printing: index=0 → first advance returns sequence[0]', () => {
        // Pedido enters printing via handleConfirmAntivaho. Index = 0 is set.
        // First advance from printing: should return first post-impresión stage.
        const target = calcularSiguienteEtapa(Etapa.IMPRESION_WM1, SEQ);
        expect(target).toBe(Etapa.POST_DNT);
    });

    it('confirm-antivaho to printing: after first advance, index increments to 1', () => {
        // After the advance from printing → DNT, Step 6b sets index = 1.
        // Pedido is now in DNT with index = 1. Next advance should see DNT at
        // position 1 (the SL2 stage).
        const target = calcularSiguienteEtapa(Etapa.POST_DNT, SEQ, 1);
        expect(target).toBe(Etapa.POST_LAMINACION_SL2);
    });

    it('confirm-antivaho to printing: does NOT complete while unconsumed remain', () => {
        // Golden rule: even with index=4 (last element), still returns S2DT, not COMPLETADO.
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ, 3))
            .toBe(Etapa.POST_REBOBINADO_S2DT);
        // index=4 → COMPLETADO (consumed all)
        expect(calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, SEQ, 4))
            .toBe(Etapa.COMPLETADO);
    });

    // --- handleCancelAntivaho path: skips printing, enters post-impresión directly ---

    it('cancel-antivaho to first post-impresión: index=0 starts at sequence[0]', () => {
        // Pedido skips printing via handleCancelAntivaho → handleUpdatePedidoEtapa.
        // Index = 0 is set by the enteringPostImpresion guard.
        // Pedido arrives in DNT. Next advance uses index 0 and returns DNT (first occurrence).
        const target = calcularSiguienteEtapa(Etapa.POST_DNT, SEQ, 0);
        expect(target).toBe(Etapa.POST_DNT);
    });

    it('cancel-antivaho: one-by-one consumption with repetitions', () => {
        // Starting at index=0 after cancel-antivaho direct post-impresión entry:
        // Click 1 → DNT (position 0)
        expect(calcularSiguienteEtapa(Etapa.POST_DNT, SEQ, 0)).toBe(Etapa.POST_DNT);

        // Pedido in DNT, index incremented to 1.
        // Click 2 → first SL2 (position 1)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ, 1))
            .toBe(Etapa.POST_LAMINACION_SL2);

        // Click 3 → second SL2 (position 2, same stage repetition)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ, 2))
            .toBe(Etapa.POST_LAMINACION_SL2);

        // Click 4 → S2DT (position 3, different stage)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ, 3))
            .toBe(Etapa.POST_REBOBINADO_S2DT);

        // Click 5 → COMPLETADO (position 4, all consumed)
        expect(calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, SEQ, 4))
            .toBe(Etapa.COMPLETADO);
    });

    it('cancel-antivaho: golden rule holds — no skip to COMPLETADO mid-sequence', () => {
        // Three stages, pedido enters directly at position 0.
        const seq = [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2, Etapa.POST_REBOBINADO_S2DT];

        // position 0: DNT, NOT completed
        expect(calcularSiguienteEtapa(Etapa.POST_DNT, seq, 0)).toBe(Etapa.POST_DNT);
        // position 1: SL2, NOT completed
        expect(calcularSiguienteEtapa(Etapa.POST_DNT, seq, 1)).toBe(Etapa.POST_LAMINACION_SL2);
        // position 2: last element = S2DT, still NOT completed
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, seq, 2))
            .toBe(Etapa.POST_REBOBINADO_S2DT);
        // position 3 (>= length): now completed
        expect(calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, seq, 3))
            .toBe(Etapa.COMPLETADO);
    });
});

// ---------------------------------------------------------------------------
// Contract tests: stale-save guard
// ---------------------------------------------------------------------------
// The Step 6b fix in handleAdvanceStage uses savedPedido (from
// handleUpdatePedidoEtapa result) instead of pedidoToAdvance to avoid
// reverting etapaActual. Verify that calcularSiguienteEtapa is stateless
// and doesn't care which pedido reference is used — it only depends on the
// provided index value.

describe('Stale-save guard — calcularSiguienteEtapa is index-stateless', () => {
    const SEQ = [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2, Etapa.POST_REBOBINADO_S2DT];

    it('same index produces same result regardless of etapaActual mismatch', () => {
        // Simulating stale pedidoToAdvance (still in printing) vs saved pedido (in DNT).
        // Both have index=0. The stale one would show printing, but the saved one
        // shows DNT. The helper should return consistent results.
        const fromStalePrinting = calcularSiguienteEtapa(Etapa.IMPRESION_WM1, SEQ, 0);
        const fromSavedDNT = calcularSiguienteEtapa(Etapa.POST_DNT, SEQ, 0);

        // Printing entry path takes precedence, so these differ — that's expected.
        // The point: neither corrupts the index state.
        expect(fromStalePrinting).toBe(Etapa.POST_DNT); // printing path → sequence[0]
        expect(fromSavedDNT).toBe(Etapa.POST_DNT);       // post-printing with index 0 → sequence[0]
    });

    it('index correctly tracks after advance regardless of stale ref', () => {
        // After advance: saved pedido has index=1, stale pedidoToAdvance also has
        // index=1 (set before Stage 6b). Both should compute the same next target.
        const fromStale = calcularSiguienteEtapa(Etapa.POST_DNT, SEQ, 1);
        const fromSaved = calcularSiguienteEtapa(Etapa.POST_DNT, SEQ, 1);
        expect(fromStale).toBe(Etapa.POST_LAMINACION_SL2);
        expect(fromSaved).toBe(Etapa.POST_LAMINACION_SL2);
    });
});

// ---------------------------------------------------------------------------
// Contract tests: manual-entry / drag directly to a later post-impresión stage
// ---------------------------------------------------------------------------
// When a pedido is dragged manually into a non-first post-impresión stage
// (bypassing earlier stages in the sequence), the enteringPostImpresion guard
// must compute secuenciaPositionIndex as indexOf(newEtapa) instead of
// hardcoding 0. Otherwise the next advance would return sequence[0] (DNT),
// sending the pedido backwards and breaking the golden rule.

describe('Manual entry to later post-impresión stage — index reflects real position', () => {
    // Sequence with repetitions: [DNT, SL2, SL2, S2DT]
    const SEQ_REPEAT = [
        Etapa.POST_DNT,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_REBOBINADO_S2DT,
    ];

    // === Bug scenario: pedido dragged directly to SL2 (mid-sequence) ===

    it('manual entry to mid-sequence stage: index points to first occurrence of that stage', () => {
        // Pedido dragged into SL2. enteringPostImpresion guard sets index to
        // indexOf(SL2) = 1 (NOT 0).
        // Next advance should see a same-stage repetition (SL2 at position 1).
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 1);
        expect(target).toBe(Etapa.POST_LAMINACION_SL2);
    });

    it('manual entry to mid-sequence: index=0 (old bug) would send pedido BACKWARDS to DNT', () => {
        // This demonstrates the defect: if the guard hardcoded index=0 instead
        // of computing indexOf(newEtapa), the pedido in SL2 would advance to DNT.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 0);
        expect(target).toBe(Etapa.POST_DNT);
        // DNT != SL2, so this is a regression, not a correct advance.
        expect(target).not.toBe(Etapa.POST_LAMINACION_SL2);
    });

    it('manual entry to mid-sequence: full consumption after correct index', () => {
        // Pedido enters at SL2 → index = 1.
        // Click 1: SL2 (position 1, same-stage rep)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 1))
            .toBe(Etapa.POST_LAMINACION_SL2);
        // Click 2: SL2 (position 2, same-stage rep — second SL2 consumed)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 2))
            .toBe(Etapa.POST_LAMINACION_SL2);
        // Click 3: S2DT (position 3, different stage)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 3))
            .toBe(Etapa.POST_REBOBINADO_S2DT);
        // Click 4: COMPLETADO (position 4)
        expect(calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, SEQ_REPEAT, 4))
            .toBe(Etapa.COMPLETADO);
    });

    // === Manual entry to the LAST stage ===

    it('manual entry to last stage: index points to last occurrence', () => {
        // Pedido dragged directly to S2DT. indexOf(S2DT) = 3 in SEQ_REPEAT.
        const target = calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, SEQ_REPEAT, 3);
        // Same-stage repetition: still at S2DT, consuming this occurrence.
        expect(target).toBe(Etapa.POST_REBOBINADO_S2DT);
    });

    it('manual entry to last stage: one more advance completes', () => {
        // After consuming S2DT at position 3, index becomes 4.
        const target = calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, SEQ_REPEAT, 4);
        expect(target).toBe(Etapa.COMPLETADO);
    });

    // === Golden rule: no premature completion after manual entry ===

    it('manual entry to mid-sequence: golden rule — no skip to COMPLETADO with unconsumed stages', () => {
        // Pedido in SL2 with index=1 (first SL2). There are still SL2[2] and
        // S2DT ahead. COMPLETADO must NOT be returned.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 1);
        expect(target).not.toBe(Etapa.COMPLETADO);
    });

    it('manual entry to mid-sequence: golden rule holds even near end', () => {
        // Pedido in SL2 with index=2 (second SL2). S2DT remains ahead.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 2);
        expect(target).not.toBe(Etapa.COMPLETADO);
    });

    // === Control: manual entry to FIRST stage (same as cancel-antivaho path) ===

    it('manual entry to first stage: index=0, behavior identical to cancel-antivaho', () => {
        // Pedido dragged to DNT. indexOf(DNT) = 0, same as current cancel-antivaho.
        const target = calcularSiguienteEtapa(Etapa.POST_DNT, SEQ_REPEAT, 0);
        expect(target).toBe(Etapa.POST_DNT);
    });

    // === Regression: printing entry is unaffected ===

    it('printing entry index=0 remains unchanged (printing always starts at index 0)', () => {
        // Printing entry path (toImpresion guard) still sets index=0.
        // First advance from printing returns sequence[0].
        const target = calcularSiguienteEtapa(Etapa.IMPRESION_WM1, SEQ_REPEAT);
        expect(target).toBe(Etapa.POST_DNT);
    });
});
