/**
 * Tests for dntWorkflow.ts — duplicate-preservation contract (Phase B).
 */

import { describe, it, expect } from 'vitest';
import { Etapa } from '../types';
import { sanitizePostImpresionSequence, normalizePostImpresionSequence } from './dntWorkflow';

// ---------------------------------------------------------------------------
// sanitizePostImpresionSequence — duplicates ARE preserved (Phase B)
// ---------------------------------------------------------------------------

describe('sanitizePostImpresionSequence — duplicates preserved', () => {
    it('preserves repeated stages in order', () => {
        const seq = [
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_SL2,
        ];
        const result = sanitizePostImpresionSequence(seq);
        expect(result).toEqual([
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_SL2,
        ]);
    });

    it('preserves interleaved duplicates', () => {
        const seq = [
            Etapa.POST_DNT,
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_DNT,
            Etapa.POST_LAMINACION_SL2,
        ];
        const result = sanitizePostImpresionSequence(seq);
        // All 4 entries preserved in order
        expect(result).toHaveLength(4);
        expect(result).toEqual(seq);
    });

    it('filters invalid (non-post-impresión) stages', () => {
        const seq = [
            Etapa.POST_DNT,
            Etapa.IMPRESION_WM1,       // invalid — not post-impresión
            Etapa.PREPARACION,           // invalid
            Etapa.POST_LAMINACION_SL2,
            Etapa.COMPLETADO,            // invalid
        ];
        const result = sanitizePostImpresionSequence(seq);
        expect(result).toEqual([
            Etapa.POST_DNT,
            Etapa.POST_LAMINACION_SL2,
        ]);
    });

    it('empty array returns empty', () => {
        expect(sanitizePostImpresionSequence([])).toEqual([]);
    });

    it('undefined returns empty', () => {
        expect(sanitizePostImpresionSequence(undefined)).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// normalizePostImpresionSequence — DNT handling + duplicates preserved
// ---------------------------------------------------------------------------

describe('normalizePostImpresionSequence', () => {
    it('DNT client: prepends POST_DNT and preserves duplicates', () => {
        const seq = [
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_REBOBINADO_S2DT,
        ];
        const result = normalizePostImpresionSequence(seq, 'DNT');
        expect(result).toEqual([
            Etapa.POST_DNT,             // prepended
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_SL2,  // duplicate preserved
            Etapa.POST_REBOBINADO_S2DT,
        ]);
    });

    it('DNT client: strips explicitly-added POST_DNT (already auto-added)', () => {
        const seq = [Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2, Etapa.POST_DNT];
        const result = normalizePostImpresionSequence(seq, 'DNT');
        // The sanitize step removes all POST_DNT entries, then normalize prepends one.
        expect(result).toEqual([Etapa.POST_DNT, Etapa.POST_LAMINACION_SL2]);
    });

    it('non-DNT client: preserves duplicates, no POST_DNT prepend', () => {
        const seq = [
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_LAMINACION_SL2,
            Etapa.POST_REBOBINADO_S2DT,
        ];
        const result = normalizePostImpresionSequence(seq, 'CLIENTE_NORMAL');
        expect(result).toEqual(seq);
    });
});
