import { Etapa } from '../types';
import { KANBAN_FUNNELS } from '../constants';
import { normalizePostImpresionSequence, sanitizePostImpresionSequence } from './dntWorkflow';

/**
 * Computes the next target stage based on secuenciaPositionIndex.
 *
 * When secuenciaPositionIndex is provided (new pedidos), it directly indexes into
 * the normalized sequence. When undefined (legacy pedidos), falls back to the
 * old indexOf-based behaviour for backward compatibility.
 *
 * Golden rule: NEVER skip to COMPLETADO while unconsumed stages remain.
 * Repeated machines are consumed one occurrence at a time.
 */
export const calcularSiguienteEtapa = (
    etapaActual: Etapa,
    secuenciaTrabajo: Etapa[] | undefined,
    secuenciaPositionIndex?: number,
    cliente?: string
): Etapa | null => {
    const normalizedSequence = cliente
        ? normalizePostImpresionSequence(secuenciaTrabajo, cliente)
        : sanitizePostImpresionSequence(secuenciaTrabajo);
    const isPrinting = KANBAN_FUNNELS.IMPRESION.stages.includes(etapaActual);
    const isPostPrinting = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapaActual);

    if (isPrinting && normalizedSequence.length > 0) {
        // Entry from printing: always the first stage of the sequence.
        return normalizedSequence[0];
    }

    if (isPostPrinting) {
        if (secuenciaPositionIndex != null && secuenciaPositionIndex >= 0) {
            // New behaviour: position-index-aware consumption.
            if (secuenciaPositionIndex >= normalizedSequence.length) {
                // All defined stages consumed — only then is completion allowed.
                return Etapa.COMPLETADO;
            }
            return normalizedSequence[secuenciaPositionIndex];
        }

        // Legacy fallback: first-match indexOf (does NOT handle repetitions).
        const currentIndex = normalizedSequence.indexOf(etapaActual);
        if (currentIndex > -1 && currentIndex < normalizedSequence.length - 1) {
            return normalizedSequence[currentIndex + 1];
        } else if (currentIndex > -1 && currentIndex === normalizedSequence.length - 1) {
            return Etapa.COMPLETADO;
        }
    }

    return null;
};

/**
 * Returns the index within the normalized sequence of the NEXT unconsumed
 * occurrence of etapaActual. When etapaActual repeats in the sequence,
 * this finds the occurrence AFTER any already-consumed ones (based on
 * secuenciaPositionIndex). If the stage is no longer in the remaining
 * suffix, returns -1.
 */
export const findNextOccurrenceIndex = (
    etapaActual: Etapa,
    normalizedSequence: Etapa[],
    secuenciaPositionIndex?: number
): number => {
    if (normalizedSequence.length === 0) return -1;

    const startFrom = secuenciaPositionIndex != null && secuenciaPositionIndex >= 0
        ? secuenciaPositionIndex
        : 0;

    for (let i = startFrom; i < normalizedSequence.length; i++) {
        if (normalizedSequence[i] === etapaActual) {
            return i;
        }
    }
    return -1;
};

/**
 * Determina si un pedido está fuera de la secuencia definida
 */
export const estaFueraDeSecuencia = (
    etapaActual: Etapa,
    secuenciaTrabajo: Etapa[] | undefined,
    cliente?: string
): boolean => {
    const normalizedSequence = cliente
        ? normalizePostImpresionSequence(secuenciaTrabajo, cliente)
        : sanitizePostImpresionSequence(secuenciaTrabajo);
    // Si no hay secuencia definida, no puede estar fuera de secuencia
    if (normalizedSequence.length === 0) {
        return false;
    }

    // Si está en impresión, siempre puede seguir la secuencia
    if (KANBAN_FUNNELS.IMPRESION.stages.includes(etapaActual)) {
        return false;
    }

    // Si está en post-impresión pero no está en la secuencia, está fuera de secuencia
    if (KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapaActual)) {
        return !normalizedSequence.includes(etapaActual);
    }

    return false;
};

/**
 * Replaces the first stage in `sequence` that belongs to the same process group
 * as `newStage` with `newStage`. Returns a new array (does not mutate input).
 * If no matching stage is found, returns the original sequence.
 */
export const replaceFirstStageInProcessGroup = (
    sequence: Etapa[],
    newStage: Etapa,
    processGroupForStage: Partial<Record<Etapa, string>>,
    processGroupStages: Record<string, Etapa[]>
): Etapa[] => {
    const group = processGroupForStage[newStage];
    if (!group) return sequence;

    const groupStages = processGroupStages[group];
    if (!groupStages || groupStages.length === 0) return sequence;

    const replaceIndex = sequence.findIndex(s => groupStages.includes(s));
    if (replaceIndex === -1) return sequence;
    if (sequence[replaceIndex] === newStage) return sequence; // Already the correct stage

    const updated = [...sequence];
    updated[replaceIndex] = newStage;
    return updated;
};

export const puedeAvanzarSecuencia = (
    etapaActual: Etapa,
    secuenciaTrabajo: Etapa[] | undefined,
    antivaho: boolean = false,
    antivahoRealizado: boolean = false,
    cliente?: string
): boolean => {
    const normalizedSequence = cliente
        ? normalizePostImpresionSequence(secuenciaTrabajo, cliente)
        : sanitizePostImpresionSequence(secuenciaTrabajo);
    // Si está en preparación y tiene material, puede enviar a impresión
    if (etapaActual === Etapa.PREPARACION) {
        return false; // Se maneja desde PreparacionView
    }

    // Si está en impresión y tiene secuencia, puede continuar
    if (KANBAN_FUNNELS.IMPRESION.stages.includes(etapaActual) && normalizedSequence.length > 0) {
        return true;
    }

    // Si está en post-impresión, siempre puede intentar continuar
    if (KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapaActual)) {
        // Para pedidos con antivaho no realizado, siempre puede continuar
        if (antivaho && !antivahoRealizado) {
            return true;
        }

        // Si tiene secuencia definida, puede continuar (incluso si está fuera de secuencia)
        if (normalizedSequence.length > 0) {
            return true;
        }
    }

    return false;
};

/**
 * Calcula el secuenciaPositionIndex al entrar a post-impresión desde una etapa
 * que no es de post-impresión (ej. COMPLETADO, PREPARACION, o entrada manual).
 *
 * Cuándo recalcula:
 *  - nuevaEtapa pertenece a post-impresión Y etapaActual NO pertenece a post-impresión
 *  - Y NO viene de impresión (fromPrinting bloquea — el path toImpresion ya setea index=0)
 *
 * Retorna:
 *  - `foundIndex + 1` para posicionar el índice PASADO la ocurrencia de entrada
 *    (ej. indexOf(SL2)=0 → retorna 1, así el primer click de avance evalúa seq[1])
 *  - `0` si la etapa no está en la secuencia (out-of-sequence fallback)
 *  - `null` si no debe recalcularse (viene de impresión, ya está en post-impresión,
 *    nuevaEtapa no es post-impresión, o secuencia vacía/undefined)
 */
export const calcularIndiceEntradaPostImpresion = (
    etapaActual: Etapa,
    nuevaEtapa: Etapa,
    secuenciaTrabajo: Etapa[] | undefined,
    cliente?: string
): number | null => {
    const fromPostImpresion = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapaActual);
    const fromPrinting = KANBAN_FUNNELS.IMPRESION.stages.includes(etapaActual);
    const enteringPostImpresion = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(nuevaEtapa)
        && !fromPostImpresion;

    if (!enteringPostImpresion || !secuenciaTrabajo || secuenciaTrabajo.length === 0 || fromPrinting) {
        return null;
    }

    const normalizedSeq = normalizePostImpresionSequence(secuenciaTrabajo, cliente);
    const foundIndex = normalizedSeq.indexOf(nuevaEtapa);
    return foundIndex >= 0 ? foundIndex + 1 : 0;
};
