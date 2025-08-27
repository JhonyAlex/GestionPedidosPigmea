import { Pedido, EstadoCliché } from '../types';
import { PREPARACION_SUB_ETAPAS_IDS } from '../constants';

/**
 * Determina la sub-etapa correcta para un pedido en fase de Preparación
 * basándose en la disponibilidad de material y cliché.
 * @param pedido El pedido a evaluar.
 * @returns El ID de la sub-etapa de preparación correspondiente.
 */
export const determinarSubEtapaPreparacion = (pedido: Partial<Pedido>): string => {
    // Regla 1: Si el material no está disponible, esta es la etapa prioritaria.
    if (!pedido.materialDisponible) {
        return PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE;
    }

    // Regla 2: Si el material está disponible pero el cliché no, va a "Cliché no disponible".
    if (pedido.materialDisponible && !pedido.clicheDisponible) {
        return PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE;
    }

    // Regla 3: Si ambos están disponibles, se usa la lógica existente para el estado del cliché.
    if (pedido.materialDisponible && pedido.clicheDisponible) {
        switch (pedido.estadoCliché) {
            case EstadoCliché.REPETICION_CAMBIO:
                return PREPARACION_SUB_ETAPAS_IDS.CLICHE_REPETICION;
            case EstadoCliché.NUEVO:
                return PREPARACION_SUB_ETAPAS_IDS.CLICHE_NUEVO;
            case EstadoCliché.PENDIENTE_CLIENTE:
            default:
                return PREPARACION_SUB_ETAPAS_IDS.CLICHE_PENDIENTE;
        }
    }

    // Fallback por si alguna condición no se cumple, aunque la lógica anterior cubre todos los casos.
    return PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE;
};
