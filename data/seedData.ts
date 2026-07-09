import { Pedido, Prioridad, Etapa, TipoImpresion } from '../types';

// ---------------------------------------------------------------------------
// IMPORTANT: initialPedidos is ONLY consumed by MockApiClient (mock mode).
// In production (VITE_USE_MOCK_DATA ≠ 'true'), ApiClient is used instead and
// this array is never loaded.
// ---------------------------------------------------------------------------

/** Deterministic test pedido for local mock mode.
 *  Sequence: SL2 → SL2 → EC-CONVERT 22 (exercises repeated-stage sequence bug). */
const testPedidoSL2Repeat: Pedido = {
  id: 'test-seq-sl2-sl2-ec22',
  secuenciaPedido: 1,
  orden: 1,
  numeroRegistro: 'REG-TEST-LOCAL-001',
  numeroPedidoCliente: 'TEST-SL2-SL2-EC22',
  cliente: 'TEST CLIENTE LOCAL',
  maquinaImpresion: 'Windmöller 1',
  metros: 1000,
  fechaCreacion: new Date().toISOString(),
  fechaEntrega: '2026-07-15',
  etapaActual: Etapa.POST_LAMINACION_SL2,
  etapasSecuencia: [{ etapa: Etapa.POST_LAMINACION_SL2, fecha: new Date().toISOString() }],
  prioridad: Prioridad.NORMAL,
  tipoImpresion: TipoImpresion.SUPERFICIE,
  desarrollo: 'TEST',
  capa: '1',
  secuenciaTrabajo: [
    Etapa.POST_LAMINACION_SL2,
    Etapa.POST_LAMINACION_SL2,
    Etapa.POST_ECCONVERT_22,
  ],
  tiempoProduccionPlanificado: '00:00',
  observaciones: 'TEST — LOCAL MOCK MODE — Sequence: SL2 → SL2 → EC-CONVERT 22',
  historial: [{
    timestamp: new Date().toISOString(),
    usuario: 'SYSTEM',
    accion: 'Creación',
    detalles: 'Pedido de prueba para secuencia con repetición SL2 (mock local).'
  }],
  // Initialize secuenciaPositionIndex so position-aware consumption works
  // from the first click. Pedido is already in SL2 (first occurrence consumed
  // by printing), so index starts at 1 (second SL2 occurrence).
  secuenciaPositionIndex: 1,
};

export const initialPedidos: Pedido[] = [testPedidoSL2Repeat];
