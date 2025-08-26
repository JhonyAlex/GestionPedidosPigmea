const Prioridad = {
    URGENTE: 'Urgente',
    ALTA: 'Alta',
    NORMAL: 'Normal',
    BAJA: 'Baja',
};

const TipoImpresion = {
    SUPERFICIE: 'Superficie (SUP)',
    TRANSPARENCIA: 'Transparencia (TTE)',
};

const EstadoCliché = {
    PENDIENTE_CLIENTE: 'Pendiente cliente',
    REPETICION_CAMBIO: 'Repetición/Cambio',
    NUEVO: 'Nuevo',
};

const Etapa = {
    PREPARACION: 'PREPARACION',
    PENDIENTE: 'PENDIENTE',
    IMPRESION_WM1: 'IMPRESION_WM1',
    IMPRESION_GIAVE: 'IMPRESION_GIAVE',
    IMPRESION_WM3: 'IMPRESION_WM3',
    IMPRESION_ANON: 'IMPRESION_ANON',
    POST_LAMINACION_SL2: 'POST_LAMINACION_SL2',
    POST_LAMINACION_NEXUS: 'POST_LAMINACION_NEXUS',
    POST_REBOBINADO_S2DT: 'POST_REBOBINADO_S2DT',
    POST_REBOBINADO_PROSLIT: 'POST_REBOBINADO_PROSLIT',
    POST_PERFORACION_MIC: 'POST_PERFORACION_MIC',
    POST_PERFORACION_MAC: 'POST_PERFORACION_MAC',
    POST_REBOBINADO_TEMAC: 'POST_REBOBINADO_TEMAC',
    COMPLETADO: 'COMPLETADO',
    ARCHIVADO: 'ARCHIVADO',
};

const adminUser = 'Administrador';

// Array vacío para producción - sin datos de ejemplo
const initialPedidos = [];

module.exports = {
    initialPedidos,
    Prioridad,
    TipoImpresion,
    EstadoCliché,
    Etapa,
    adminUser
};
