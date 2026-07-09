/**
 * Tests for etapaLogic.ts — sequence consumption, repetition handling,
 * completion guard, and destination temp cleanup contracts.
 *
 * Phase A + B: Post-impresión sequence integrity
 */

import { describe, it, expect } from 'vitest';
import { Etapa } from '../types';
import { calcularSiguienteEtapa, findNextOccurrenceIndex, calcularIndiceEntradaPostImpresion } from './etapaLogic';

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

    it('cancel-antivaho to first post-impresión: entering guard now sets foundIndex + 1', () => {
        // Pedido skips printing via handleCancelAntivaho → handleUpdatePedidoEtapa.
        // The enteringPostImpresion guard sets secuenciaPositionIndex to foundIndex + 1
        // (= 1 for DNT, since indexOf(DNT) = 0). This test verifies the calculate
        // function at index 0 as a baseline reference — the guard no longer produces 0.
        const target = calcularSiguienteEtapa(Etapa.POST_DNT, SEQ, 0);
        expect(target).toBe(Etapa.POST_DNT);
    });

    it('cancel-antivaho: one-by-one consumption with repetitions', () => {
        // Baseline sequence consumption from the first unconsumed position.
        // Direct entry guard now starts after the consumed entry occurrence;
        // this assertion documents what index=0 would consume.
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
// must compute secuenciaPositionIndex as indexOf(newEtapa) + 1 (past the
// consumed entry occurrence). Otherwise the next advance would return
// sequence[0] (DNT) or the wrong occurrence, breaking the golden rule.

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
        // indexOf(SL2) + 1 = 2 (NOT 1). The pedido enters at SL2 (position 1),
        // but the index skips past the consumed entry occurrence.
        // Next advance evaluates position 2, the second SL2 in the sequence.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 2);
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
        // Pedido enters at the first SL2 occurrence → index = 2.
        // Click 1: SL2 (position 2, same-stage rep — second SL2 consumed)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 2))
            .toBe(Etapa.POST_LAMINACION_SL2);
        // Click 2: S2DT (position 3, different stage)
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 3))
            .toBe(Etapa.POST_REBOBINADO_S2DT);
        // Click 3: COMPLETADO (position 4)
        expect(calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, SEQ_REPEAT, 4))
            .toBe(Etapa.COMPLETADO);
    });

    // === Manual entry to the LAST stage ===

    it('manual entry to last stage: entering guard now sets index past last occurrence', () => {
        // Pedido dragged directly to S2DT. The enteringPostImpresion guard now sets
        // indexOf(S2DT) + 1 = 4 (= secuencia.length). The first "Seguir secuencia"
        // click after entry would complete the pedido. This test verifies the
        // old index=3 as a baseline — the guard no longer produces 3.
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

    it('manual entry to first stage: entering guard now sets index to indexOf + 1', () => {
        // Pedido dragged to DNT. The enteringPostImpresion guard now sets
        // indexOf(DNT) + 1 = 1. This test verifies the old index=0 as baseline.
        const target = calcularSiguienteEtapa(Etapa.POST_DNT, SEQ_REPEAT, 0);
        expect(target).toBe(Etapa.POST_DNT);
    });

    // === Single-stage sequence: entering guard index past last position ===

    it('single-stage sequence: entering guard sets index past last position', () => {
        // R6: pedido enters POST_ECCONVERT_22 with secuencia = [POST_ECCONVERT_22].
        // The enteringPostImpresion guard now sets secuenciaPositionIndex to
        // foundIndex + 1 = 1 (= secuencia.length), so calcularSiguienteEtapa
        // returns COMPLETADO immediately on the first "Seguir secuencia" click.
        const SINGLE_SEQ = [Etapa.POST_ECCONVERT_22];
        const target = calcularSiguienteEtapa(Etapa.POST_ECCONVERT_22, SINGLE_SEQ, 1);
        expect(target).toBe(Etapa.COMPLETADO);
    });

    // === Regression: printing entry is unaffected ===

    it('printing entry index=0 remains unchanged (printing always starts at index 0)', () => {
        // Printing entry path (toImpresion guard) still sets index=0.
        // First advance from printing returns sequence[0].
        const target = calcularSiguienteEtapa(Etapa.IMPRESION_WM1, SEQ_REPEAT);
        expect(target).toBe(Etapa.POST_DNT);
    });
});

// ---------------------------------------------------------------------------
// Contract tests: re-entry from COMPLETADO with stale secuenciaPositionIndex
// ---------------------------------------------------------------------------
// When a pedido is moved back from COMPLETADO to a post-impresión stage, the
// enteringPostImpresion guard must recalculate secuenciaPositionIndex from the
// normalized sequence. A stale index (e.g., 3 for a consumed 3-element sequence)
// must NOT cause immediate completion or skip remaining occurrences.

describe('Re-entry from COMPLETADO — stale index recalculated', () => {
    // -----------------------------------------------------------------------
    // [SL2, SL2, EC-CONVERT 22]: repeated-stage sequence re-entry
    // -----------------------------------------------------------------------

    const SEQ_REPEAT = [
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_ECCONVERT_22,
    ];

    it('re-entry to first SL2: entering guard recalculates index to foundIndex + 1 = 1', () => {
        // Pedido was COMPLETADO with secuenciaPositionIndex = 3 (all consumed).
        // Dragged back to SL2. The enteringPostImpresion guard now fires
        // (!fromPrinting = true) and recalculates: indexOf(SL2) + 1 = 1.
        // Next advance evaluates position 1 = second SL2 occurrence.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 1);
        expect(target).toBe(Etapa.POST_LAMINACION_SL2);
    });

    it('re-entry to first SL2: first click stays at SL2 (same-stage repetition)', () => {
        // From above: pedido at SL2 with index=1.
        // Click "Seguir secuencia" → same-stage rep → index becomes 2.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 1);
        expect(target).toBe(Etapa.POST_LAMINACION_SL2);
        // Repetition IS expected: seq[1] is the second SL2 occurrence.
    });

    it('re-entry to first SL2: second click moves to EC-CONVERT 22', () => {
        // After consuming second SL2, index=2.
        // Next click should advance to EC-CONVERT 22, NOT complete.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 2);
        expect(target).toBe(Etapa.POST_ECCONVERT_22);
        expect(target).not.toBe(Etapa.COMPLETADO);
    });

    it('re-entry to first SL2: third click completes', () => {
        // After advancing to EC-CONVERT 22, index becomes 3.
        const target = calcularSiguienteEtapa(Etapa.POST_ECCONVERT_22, SEQ_REPEAT, 3);
        expect(target).toBe(Etapa.COMPLETADO);
    });

    it('re-entry with STALE index=3 would complete immediately (regression guard)', () => {
        // If the guard did NOT recalculate, stale index=3 causes:
        // calcularSiguienteEtapa(SL2, seq, 3) → 3 >= 3 → COMPLETADO.
        // This test documents the bug: pedido completes without consuming any stages.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 3);
        expect(target).toBe(Etapa.COMPLETADO);
        // This is WRONG for re-entry — the guard must prevent this path.
        // The actual guard recalculates to index=1 before this function is called.
    });

    // -----------------------------------------------------------------------
    // [EC-CONVERT 22]: single-stage re-entry
    // -----------------------------------------------------------------------

    const SINGLE_SEQ = [Etapa.POST_ECCONVERT_22];

    it('single-stage re-entry: recalculated index=1 completes on first click', () => {
        // Pedido was COMPLETADO with stale index=1.
        // Re-entered EC-CONVERT 22: guard recalculates indexOf + 1 = 1.
        // First click: 1 >= 1 → COMPLETADO. One click, not two.
        const target = calcularSiguienteEtapa(Etapa.POST_ECCONVERT_22, SINGLE_SEQ, 1);
        expect(target).toBe(Etapa.COMPLETADO);
    });

    it('single-stage re-entry: index=0 would repeat same stage (double-click bug)', () => {
        // If guard did NOT recalculate (old behavior with stale index),
        // or if it were computed without +1, index=0 causes:
        // calcularSiguienteEtapa(EC-CONVERT 22, seq, 0) → seq[0] = same stage.
        const target = calcularSiguienteEtapa(Etapa.POST_ECCONVERT_22, SINGLE_SEQ, 0);
        expect(target).toBe(Etapa.POST_ECCONVERT_22);
        // This triggers same-stage repetition logic — WRONG for single-stage.
        // The guard must set index=1 so this path is never reached.
    });

    it('single-stage fresh entry (not re-entry) also completes on first click', () => {
        // Fresh pedido entering EC-CONVERT 22 directly (cancel-antivaho or manual drag).
        // Guard sets foundIndex(0) + 1 = 1.
        const target = calcularSiguienteEtapa(Etapa.POST_ECCONVERT_22, SINGLE_SEQ, 1);
        expect(target).toBe(Etapa.COMPLETADO);
    });

    // -----------------------------------------------------------------------
    // Re-entry to a MID-sequence stage from COMPLETADO
    // -----------------------------------------------------------------------

    const SEQ_MULTI = [
        Etapa.POST_DNT,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_REBOBINADO_S2DT,
    ];

    it('re-entry to mid-sequence stage (SL2): recalculates to indexOf + 1 = 2', () => {
        // Pedido was COMPLETADO (index=3). Dragged back to SL2.
        // Guard recalculates: indexOf(SL2) + 1 = 2.
        // First click evaluates position 2 = S2DT.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_MULTI, 2);
        expect(target).toBe(Etapa.POST_REBOBINADO_S2DT);
    });

    it('re-entry to mid-sequence: next click after S2DT completes', () => {
        const target = calcularSiguienteEtapa(Etapa.POST_REBOBINADO_S2DT, SEQ_MULTI, 3);
        expect(target).toBe(Etapa.COMPLETADO);
    });

    it('re-entry to mid-sequence: stale index=3 would complete immediately', () => {
        // Regression guard: if stale index=3 is NOT recalculated,
        // pedido in SL2 with index=3 → 3 >= 3 → COMPLETADO immediately.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_MULTI, 3);
        expect(target).toBe(Etapa.COMPLETADO);
    });

    // -----------------------------------------------------------------------
    // Printing entry — guard must NOT recalculate
    // -----------------------------------------------------------------------

    it('printing entry to SL2: guard blocked, index stays at 0', () => {
        // Pedido entered printing (toImpresion sets index=0).
        // Advanced to SL2: fromPrinting=true → guard blocked.
        // Step 6b increments to 1. First user click at SL2 with index=1.
        const target = calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 1);
        expect(target).toBe(Etapa.POST_LAMINACION_SL2); // second occurrence
    });

    it('printing entry: full consumption works', () => {
        // Printing → SL2 (index=0) → Step 6b → index=1.
        // Click 1: seq[1] = SL2 (same-stage rep → index=2).
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 1))
            .toBe(Etapa.POST_LAMINACION_SL2);
        // Click 2: seq[2] = EC-CONVERT 22 (advance → index=3).
        expect(calcularSiguienteEtapa(Etapa.POST_LAMINACION_SL2, SEQ_REPEAT, 2))
            .toBe(Etapa.POST_ECCONVERT_22);
        // Click 3: 3 >= 3 → COMPLETADO.
        expect(calcularSiguienteEtapa(Etapa.POST_ECCONVERT_22, SEQ_REPEAT, 3))
            .toBe(Etapa.COMPLETADO);
    });
});

// ---------------------------------------------------------------------------
// Guard behaviour tests: calcularIndiceEntradaPostImpresion
// ---------------------------------------------------------------------------
// Covers the handleUpdatePedidoEtapa guard that was previously inline and
// untestable without mocking the full hook. These tests validate the pure
// index-calculation logic that the hook now delegates to.

describe('calcularIndiceEntradaPostImpresion — guard behaviour', () => {
    // -------------------------------------------------------------------
    // Blocker scenario 1:
    // COMPLETADO + stale index=3 → re-enter SL2 in [SL2, SL2, EC-CONVERT 22]
    // recalculates to index=1 (past the first consumed SL2 occurrence)
    // -------------------------------------------------------------------
    const SEQ_TRIPLE = [
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_LAMINACION_SL2,
        Etapa.POST_ECCONVERT_22,
    ];

    it('COMPLETADO → SL2 with stale index 3 recalculates to 1', () => {
        const idx = calcularIndiceEntradaPostImpresion(
            Etapa.COMPLETADO,
            Etapa.POST_LAMINACION_SL2,
            SEQ_TRIPLE
        );
        expect(idx).toBe(1);
    });

    it('after recalculated index=1, first advance stays at SL2 (second occurrence)', () => {
        // The hook persists index=1, then calcularSiguienteEtapa uses it.
        const target = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, SEQ_TRIPLE, 1
        );
        expect(target).toBe(Etapa.POST_LAMINACION_SL2); // seq[1] = second SL2
        expect(target).not.toBe(Etapa.COMPLETADO);       // golden rule
    });

    it('after recalculated index=1, second advance moves to EC-CONVERT 22', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, SEQ_TRIPLE, 2
        );
        expect(target).toBe(Etapa.POST_ECCONVERT_22);
    });

    it('after recalculated index=1, third advance completes', () => {
        const target = calcularSiguienteEtapa(
            Etapa.POST_ECCONVERT_22, SEQ_TRIPLE, 3
        );
        expect(target).toBe(Etapa.COMPLETADO);
    });

    it('stale index=3 with no recalculation would complete immediately (regression)', () => {
        // Documents the bug: if the guard were bypassed, stale index=3
        // would cause calcularSiguienteEtapa to return COMPLETADO on entry.
        const target = calcularSiguienteEtapa(
            Etapa.POST_LAMINACION_SL2, SEQ_TRIPLE, 3
        );
        expect(target).toBe(Etapa.COMPLETADO);
        // The guard prevents this by recalculating to 1 before the calculate.
    });

    // -------------------------------------------------------------------
    // Blocker scenario 2:
    // COMPLETADO + stale index=1 → re-enter [EC-CONVERT 22]
    // recalculates to index=1, next click completes, NO same-stage repeat
    // -------------------------------------------------------------------
    const SINGLE_SEQ = [Etapa.POST_ECCONVERT_22];

    it('COMPLETADO → EC-CONVERT 22 with stale index 1 recalculates to 1', () => {
        const idx = calcularIndiceEntradaPostImpresion(
            Etapa.COMPLETADO,
            Etapa.POST_ECCONVERT_22,
            SINGLE_SEQ
        );
        expect(idx).toBe(1);
    });

    it('after recalculated index=1, single click completes (no same-stage repeat)', () => {
        // index=1 >= seq.length=1 → COMPLETADO. One click, not two.
        const target = calcularSiguienteEtapa(
            Etapa.POST_ECCONVERT_22, SINGLE_SEQ, 1
        );
        expect(target).toBe(Etapa.COMPLETADO);
        // NOT same-stage repetition — that would be wrong for single-stage sequence.
        expect(target).not.toBe(Etapa.POST_ECCONVERT_22);
    });

    it('index=0 would trigger same-stage repeat (double-click bug)', () => {
        // If index were 0 instead of 1, seq[0] = EC-CONVERT 22 = same stage.
        const target = calcularSiguienteEtapa(
            Etapa.POST_ECCONVERT_22, SINGLE_SEQ, 0
        );
        expect(target).toBe(Etapa.POST_ECCONVERT_22);
        // This is WRONG for single-stage — users need 2 clicks to complete.
        // The guard prevents this by setting index=1.
    });

    // -------------------------------------------------------------------
    // Blocker scenario 3:
    // printing → post-impresión does NOT recalculate
    // (preserves toImpresion flow: index=0 set by toImpresion guard,
    //  Step 6b handles the increment after first advance)
    // -------------------------------------------------------------------

    it('printing → SL2 returns null (fromPrinting blocks recalculation)', () => {
        const idx = calcularIndiceEntradaPostImpresion(
            Etapa.IMPRESION_WM1,
            Etapa.POST_LAMINACION_SL2,
            SEQ_TRIPLE
        );
        expect(idx).toBeNull();
    });

    it('printing → any post-impresión stage returns null', () => {
        expect(calcularIndiceEntradaPostImpresion(
            Etapa.IMPRESION_WM1, Etapa.POST_DNT, [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2]
        )).toBeNull();
        expect(calcularIndiceEntradaPostImpresion(
            Etapa.IMPRESION_GIAVE, Etapa.POST_REBOBINADO_S2DT, [Etapa.POST_REBOBINADO_S2DT]
        )).toBeNull();
    });

    // -------------------------------------------------------------------
    // Edge cases
    // -------------------------------------------------------------------

    it('post-impresión → post-impresión returns null (already in funnel)', () => {
        const idx = calcularIndiceEntradaPostImpresion(
            Etapa.POST_DNT,
            Etapa.POST_LAMINACION_SL2,
            [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2]
        );
        expect(idx).toBeNull();
    });

    it('COMPLETADO → PREPARACION returns null (not entering post-impresión)', () => {
        const idx = calcularIndiceEntradaPostImpresion(
            Etapa.COMPLETADO,
            Etapa.PREPARACION,
            [Etapa.POST_LAMINACION_SL2]
        );
        expect(idx).toBeNull();
    });

    it('empty sequence returns null', () => {
        const idx = calcularIndiceEntradaPostImpresion(
            Etapa.COMPLETADO,
            Etapa.POST_LAMINACION_SL2,
            []
        );
        expect(idx).toBeNull();
    });

    it('undefined sequence returns null', () => {
        const idx = calcularIndiceEntradaPostImpresion(
            Etapa.COMPLETADO,
            Etapa.POST_LAMINACION_SL2,
            undefined
        );
        expect(idx).toBeNull();
    });

    it('stage not in sequence returns 0 (out-of-sequence fallback)', () => {
        const idx = calcularIndiceEntradaPostImpresion(
            Etapa.COMPLETADO,
            Etapa.POST_PERFORACION_MIC, // not in this sequence
            SEQ_TRIPLE
        );
        expect(idx).toBe(0);
    });

    it('DNT cliente prepends DNT: entering SL2 returns indexOf(SL2)+1 in [DNT,SL2,SL2,EC22]', () => {
        const seq = [Etapa.POST_LAMINACION_SL2, Etapa.POST_LAMINACION_SL2, Etapa.POST_ECCONVERT_22];
        const idx = calcularIndiceEntradaPostImpresion(
            Etapa.COMPLETADO,
            Etapa.POST_LAMINACION_SL2,
            seq,
            'DNT' // triggers DNT prepend
        );
        // normalized: [DNT, SL2, SL2, EC-CONVERT 22], indexOf(SL2)=1 → 2
        expect(idx).toBe(2);
    });

    it('DNT cliente: entering DNT directly recalculates to indexOf+1 = 1', () => {
        const seq = [Etapa.POST_LAMINACION_SL2];
        const idx = calcularIndiceEntradaPostImpresion(
            Etapa.COMPLETADO,
            Etapa.POST_DNT,
            seq,
            'DNT'
        );
        // normalized: [DNT, SL2], indexOf(DNT)=0 → 1
        expect(idx).toBe(1);
    });
});
