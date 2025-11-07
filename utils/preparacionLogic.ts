import { Pedido } from '../types';
import { PREPARACION_SUB_ETAPAS_IDS } from '../constants';

type PreparacionSubEtapa = typeof PREPARACION_SUB_ETAPAS_IDS[keyof typeof PREPARACION_SUB_ETAPAS_IDS];

export const determinarEtapaPreparacion = (pedido: Pedido): PreparacionSubEtapa => {
  // Si el pedido ya está 'Listo para Producción', no cambiar su estado
  if (pedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION) {
    return PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
  }

  // Si no se ha iniciado la gestión (ambos campos son null/undefined)
  // NO mover automáticamente, mantener donde está
  if (pedido.materialDisponible == null && pedido.clicheDisponible == null) {
    const currentSubEtapa = pedido.subEtapaActual as PreparacionSubEtapa;
    if (currentSubEtapa && Object.values(PREPARACION_SUB_ETAPAS_IDS).includes(currentSubEtapa as any)) {
      return currentSubEtapa;
    }
    return PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA;
  }

  // PRIORIDAD 1: Si el material NO está disponible → Material No Disponible
  // (sin importar el estado del cliché, incluso si ambos son false)
  if (pedido.materialDisponible === false) {
    return PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE;
  }

  // PRIORIDAD 2: Si el material SÍ está disponible pero el cliché NO → Cliché no disponible
  if (pedido.materialDisponible === true && pedido.clicheDisponible === false) {
    return PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE;
  }

  // CASO ESPECIAL: Si ambos están disponibles, NO mover automáticamente
  // El pedido se queda donde está para que el usuario use el botón "Listo para Producción"
  if (pedido.materialDisponible === true && pedido.clicheDisponible === true) {
    // Mantener la subetapa actual si es válida, sino ir a "Sin Gestión Iniciada"
    const currentSubEtapa = pedido.subEtapaActual as PreparacionSubEtapa;
    if (currentSubEtapa && Object.values(PREPARACION_SUB_ETAPAS_IDS).includes(currentSubEtapa as any)) {
      return currentSubEtapa;
    }
    return PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA;
  }

  // Fallback: Si no coincide con ningún caso, mantener donde está o ir a inicio
  const currentSubEtapa = pedido.subEtapaActual as PreparacionSubEtapa;
  if (currentSubEtapa && Object.values(PREPARACION_SUB_ETAPAS_IDS).includes(currentSubEtapa as any)) {
    return currentSubEtapa;
  }
  return PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA;
};
