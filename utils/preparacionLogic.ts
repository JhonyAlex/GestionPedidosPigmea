import { Pedido } from '../types';
import { PREPARACION_SUB_ETAPAS_IDS } from '../constants';

type PreparacionSubEtapa = typeof PREPARACION_SUB_ETAPAS_IDS[keyof typeof PREPARACION_SUB_ETAPAS_IDS];

export const determinarEtapaPreparacion = (pedido: Pedido): PreparacionSubEtapa => {
  // Si el pedido ya está 'Listo para Producción', no cambiar su estado
  if (pedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION) {
    return PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
  }

  // Si no se ha iniciado la gestión (ambos campos son null/undefined)
  if (pedido.materialDisponible == null && pedido.clicheDisponible == null) {
    return PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA;
  }

  if (!pedido.materialDisponible) {
    return PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE;
  }

  if (!pedido.clicheDisponible) {
    return PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE;
  }

  // Si ambos están disponibles, por defecto vuelve a "Listo para Producción"
  return PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
};
