import { Pedido } from '../types';
import { PREPARACION_SUB_ETAPAS_IDS } from '../constants';

type PreparacionSubEtapa = typeof PREPARACION_SUB_ETAPAS_IDS[keyof typeof PREPARACION_SUB_ETAPAS_IDS];

export const determinarEtapaPreparacion = (pedido: Pedido): PreparacionSubEtapa => {
  // 🚨 REGLA PRIORITARIA: Si está en "SIN GESTION INICIADA", NUNCA cambiar automáticamente
  // El usuario tiene control total y debe mover manualmente el pedido cuando lo desee
  if (pedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA) {
    return PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA;
  }

  // REGLA 1: Si no se ha iniciado la gestión (ambos campos son null/undefined)
  // Mantener donde está - esta es la "zona de control total del usuario"
  if (pedido.materialDisponible == null && pedido.clicheDisponible == null) {
    const currentSubEtapa = pedido.subEtapaActual as PreparacionSubEtapa;
    if (currentSubEtapa && Object.values(PREPARACION_SUB_ETAPAS_IDS).includes(currentSubEtapa as any)) {
      return currentSubEtapa;
    }
    return PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA;
  }

  // PRIORIDAD 1: Si el material NO está disponible → Material No Disponible
  // (Prioridad máxima - sin importar el estado del cliché, incluso si ambos son false)
  if (pedido.materialDisponible === false) {
    return PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE;
  }

  // PRIORIDAD 2: Si el material SÍ está disponible pero el cliché NO → Cliché no disponible
  if (pedido.materialDisponible === true && pedido.clicheDisponible === false) {
    return PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE;
  }

  // PRIORIDAD 3: Si ambos están disponibles → MOVER AUTOMÁTICAMENTE a Listo para Producción
  // ✅ NUEVO COMPORTAMIENTO: Movimiento automático cuando ambos son true
  if (pedido.materialDisponible === true && pedido.clicheDisponible === true) {
    return PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
  }

  // CASO ESPECIAL: Material disponible pero cliché undefined
  // Mantener en posición actual (zona de "Sin Gestión Iniciada")
  if (pedido.materialDisponible === true && pedido.clicheDisponible == null) {
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
