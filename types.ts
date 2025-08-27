export enum Prioridad {
    URGENTE = 'Urgente',
    ALTA = 'Alta',
    NORMAL = 'Normal',
    BAJA = 'Baja',
}

export enum TipoImpresion {
    SUPERFICIE = 'Superficie (SUP)',
    TRANSPARENCIA = 'Transparencia (TTE)',
}

export enum EstadoCliché {
    PENDIENTE_CLIENTE = 'Pendiente cliente',
    REPETICION_CAMBIO = 'Repetición/Cambio',
    NUEVO = 'Nuevo',
}


export enum Etapa {
    PREPARACION = 'PREPARACION',
    PENDIENTE = 'PENDIENTE',

    // Embudo Impresión
    IMPRESION_WM1 = 'IMPRESION_WM1',
    IMPRESION_GIAVE = 'IMPRESION_GIAVE',
    IMPRESION_WM3 = 'IMPRESION_WM3',
    IMPRESION_ANON = 'IMPRESION_ANON',

    // Embudo Post-Impresión
    POST_LAMINACION_SL2 = 'POST_LAMINACION_SL2',
    POST_LAMINACION_NEXUS = 'POST_LAMINACION_NEXUS',
    POST_REBOBINADO_S2DT = 'POST_REBOBINADO_S2DT',
    POST_REBOBINADO_PROSLIT = 'POST_REBOBINADO_PROSLIT',
    POST_PERFORACION_MIC = 'POST_PERFORACION_MIC',
    POST_PERFORACION_MAC = 'POST_PERFORACION_MAC',
    POST_REBOBINADO_TEMAC = 'POST_REBOBINADO_TEMAC',

    COMPLETADO = 'COMPLETADO',
    ARCHIVADO = 'ARCHIVADO',
}


export interface EtapaInfo {
    etapa: Etapa;
    fecha: string; // ISO 8601 date string
}

export interface HistorialEntry {
    timestamp: string; // ISO 8601
    usuario: UserRole;
    accion: string; // e.g., "Creación", "Cambio de Etapa", "Campo Actualizado"
    detalles: string; // e.g., "Etapa movida de 'Preparación' a 'Impresión WM1'" or "Prioridad cambiada de 'Normal' a 'Alta'"
}


export interface Pedido {
    id: string;
    secuenciaPedido: number;
    orden: number;
    numeroRegistro: string; // Internal, system-generated
    numeroPedidoCliente: string; // User-provided
    cliente: string;
    maquinaImpresion: string;
    metros: number | string;
    fechaCreacion: string; // ISO 8601 date string
    fechaEntrega: string; // YYYY-MM-DD
    fechaFinalizacion?: string; // ISO 8601 date string
    etapaActual: Etapa;
    etapasSecuencia: EtapaInfo[];
    prioridad: Prioridad;
    tipoImpresion: TipoImpresion;
    desarrollo: string;
    capa: string;
    tiempoProduccionPlanificado: string; // HH:mm
    tiempoTotalProduccion?: string; // "X días, Y horas"
    secuenciaTrabajo: Etapa[];
    observaciones: string;
    historial: HistorialEntry[];
    // Nuevos campos para la etapa de Preparación
    materialDisponible?: boolean;
    estadoCliché?: EstadoCliché;
    camisa?: string;

    /** El nombre o código del producto final. */
    producto?: string | null;
    /** El número de capas de material que componen el producto. */
    materialCapasCantidad?: 1 | 2 | 3 | 4 | null;
    /** Un array que detalla las propiedades de cada capa de material. */
    materialCapas?: Array<{ micras?: number | null; densidad?: number | null }> | null;
    /** El número de consumibles o materiales adicionales necesarios. */
    materialConsumoCantidad?: 1 | 2 | 3 | 4 | null;
    /** Un array que detalla el consumo de materiales. */
    materialConsumo?: Array<{ necesario?: number | null; recibido?: string | null }> | null;
    /** El diámetro o medida de la bobina madre. */
    bobinaMadre?: number | null;
    /** El diámetro o medida de la bobina final. */
    bobinaFinal?: number | null;
    /** Tiempo de adaptación en minutos. */
    minAdap?: number | null;
    /** El número de colores utilizados en la impresión. */
    colores?: number | null;
    /** Minutos por color. */
    minColor?: number | null;
}

export interface KanbanEtapa {
    id: Etapa;
    title: string;
    color: string;
}

export type ViewType = 'preparacion' | 'kanban' | 'list' | 'archived' | 'report';

export type UserRole = 'Administrador' | 'Operador';

export interface AuditEntry {
    timestamp: string;
    userRole: UserRole;
    action: string;
}

export type DateField = 'fechaCreacion' | 'fechaEntrega' | 'fechaFinalizacion';