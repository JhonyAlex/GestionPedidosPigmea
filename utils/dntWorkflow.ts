import { KANBAN_FUNNELS } from '../constants';
import { Etapa } from '../types';

export const normalizeClienteName = (cliente?: string | null): string =>
    (cliente || '').trim().toUpperCase();

export const isDntCliente = (cliente?: string | null): boolean =>
    normalizeClienteName(cliente) === 'DNT';

export const isValidPostImpresionStage = (etapa: Etapa): boolean =>
    KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapa);

export const sanitizePostImpresionSequence = (sequence: Etapa[] | undefined): Etapa[] => {
    const uniqueStages: Etapa[] = [];

    (sequence || []).forEach((etapa) => {
        if (!isValidPostImpresionStage(etapa) || uniqueStages.includes(etapa)) {
            return;
        }

        uniqueStages.push(etapa);
    });

    return uniqueStages;
};

export const normalizePostImpresionSequence = (
    sequence: Etapa[] | undefined,
    cliente?: string | null
): Etapa[] => {
    const uniqueStages = sanitizePostImpresionSequence(sequence).filter((etapa) => etapa !== Etapa.POST_DNT);

    if (isDntCliente(cliente)) {
        return [Etapa.POST_DNT, ...uniqueStages];
    }

    return uniqueStages;
};

export const areStageSequencesEqual = (left: Etapa[] | undefined, right: Etapa[] | undefined): boolean => {
    const leftSequence = left || [];
    const rightSequence = right || [];

    if (leftSequence.length !== rightSequence.length) {
        return false;
    }

    return leftSequence.every((stage, index) => stage === rightSequence[index]);
};