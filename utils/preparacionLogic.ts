import { Pedido, EstadoCliché } from '../types';
import { PREPARACION_SUB_ETAPAS_IDS } from '../constants';

type PreparacionSubEtapa = typeof PREPARACION_SUB_ETAPAS_IDS[keyof typeof PREPARACION_SUB_ETAPAS_IDS];

export const determinarEtapaPreparacion = (pedido: Pedido): PreparacionSubEtapa => {
  // Si el pedido ya está 'Listo para Producción', no cambiar su estado
  if (pedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION) {
    return PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
  }

  if (!pedido.materialDisponible) {
    return PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE;
  }

  if (!pedido.clicheDisponible) {
    return PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE;
  }

  switch (pedido.estadoCliché) {
    case EstadoCliché.NUEVO:
      return PREPARACION_SUB_ETAPAS_IDS.CLICHE_NUEVO;
    case EstadoCliché.REPETICION_CAMBIO:
      return PREPARACION_SUB_ETAPAS_IDS.CLICHE_REPETICION;
    case EstadoCliché.PENDIENTE_CLIENTE:
    default:
      return PREPARACION_SUB_ETAPAS_IDS.CLICHE_PENDIENTE;
  }
};
