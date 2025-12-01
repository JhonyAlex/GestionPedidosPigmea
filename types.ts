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
    PENDIENTE_CLIENTE = 'REPETICIÓN',
    REPETICION_CAMBIO = 'REPETICIÓN CON CAMBIO',
    NUEVO = 'NUEVO',
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
    usuario: string; // Nombre del usuario (displayName o username)
    accion: string; // e.g., "Creación", "Cambio de Etapa", "Campo Actualizado"
    detalles: string; // e.g., "Etapa movida de 'Preparación' a 'Impresión WM1'" or "Prioridad cambiada de 'Normal' a 'Alta'"
}


export interface Pedido {
    id: string;
    secuenciaPedido: number;
    orden: number;
    numeroRegistro: string; // Internal, system-generated
    numeroPedidoCliente: string; // User-provided
    numerosCompra?: string[]; // Array de números de compra (uno por cada material de consumo)
    cliente: string;
    clienteId?: string; // ✅ ID del cliente en la tabla de clientes
    maquinaImpresion: string;
    metros: number | string;
    fechaCreacion: string; // ISO 8601 date string
    fechaEntrega: string; // YYYY-MM-DD
    nuevaFechaEntrega?: string; // YYYY-MM-DD
    fechaFinalizacion?: string; // ISO 8601 date string
    vendedorId?: string; // UUID del vendedor asignado
    vendedorNombre?: string; // Nombre del vendedor (para mostrar sin cargar todo el objeto)
    etapaActual: Etapa;
    subEtapaActual?: string;
    etapasSecuencia: EtapaInfo[];
    prioridad: Prioridad;
    tipoImpresion: TipoImpresion;
    desarrollo: string;
    capa: string;
    tiempoProduccionDecimal?: number | null; // ✅ NUEVO: Tiempo en formato decimal (ej: 1.5 = 1h 30m)
    tiempoProduccionPlanificado: string; // HH:mm (calculado automáticamente desde tiempoProduccionDecimal)
    tiempoTotalProduccion?: string; // "X días, Y horas"
    secuenciaTrabajo: Etapa[];
    observaciones: string;
    historial: HistorialEntry[];
    // Nuevos campos para la etapa de Preparación
    materialDisponible?: boolean;
    clicheDisponible?: boolean;
    estadoCliché?: EstadoCliché;
    clicheInfoAdicional?: string; // Campo adicional para información de cliché (fecha, texto, etc.)
    compraCliche?: string; // Fecha de Compra Cliché (YYYY-MM-DD)
    recepcionCliche?: string; // Fecha de Recepción Cliché (YYYY-MM-DD)
    camisa?: string;
    antivaho?: boolean;
    antivahoRealizado?: boolean;
    microperforado?: boolean;
    macroperforado?: boolean;
    anonimo?: boolean;
    anonimoPostImpresion?: string; // Opción de post-impresión para pedidos anónimos

    /** El nombre o código del producto final. */
    producto?: string | null;
    /** El número de capas de material que componen el producto. @deprecated Use materialConsumoCantidad instead */
    materialCapasCantidad?: 1 | 2 | 3 | 4 | null;
    /** Un array que detalla las propiedades de cada capa de material. @deprecated Data merged into materialConsumo */
    materialCapas?: Array<{ micras?: number | null; densidad?: number | null }> | null;
    /** El número de consumibles o materiales adicionales necesarios. */
    materialConsumoCantidad?: 1 | 2 | 3 | 4 | null;
    /** Un array que detalla el consumo de materiales, incluyendo micras y densidad. */
    materialConsumo?: Array<{ 
        necesario?: number | null; 
        recibido?: boolean | null;
        micras?: number | null;
        densidad?: number | null;
    }> | null;
    /** Observaciones específicas sobre el material de suministro */
    observacionesMaterial?: string;
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

export type ViewType = 'preparacion' | 'listoProduccion' | 'clientes' | 'vendedores' | 'kanban' | 'list' | 'archived' | 'report' | 'permissions-debug' | 'operador';

export type UserRole = 'Administrador' | 'Supervisor' | 'Operador' | 'Visualizador';

export interface AuditEntry {
    id?: number;
    timestamp: string;
    userRole: string; // Nombre del usuario en lugar del rol
    action: string;
    pedidoId?: string;
    details?: any;
}

export type DateField = 'fechaCreacion' | 'fechaEntrega' | 'nuevaFechaEntrega' | 'fechaFinalizacion' | 'compraCliche' | 'recepcionCliche';

// Tipos para filtro de semana
export interface WeekFilter {
    enabled: boolean;
    year: number;
    week: number;
    dateField: DateField;
}

// === TIPOS DE AUTENTICACIÓN ===

export interface User {
    id: string;
    username: string;
    role: UserRole;
    displayName: string;
    createdAt?: string;
    lastLogin?: string;
    permissions?: Permission[];
}

// === TIPOS DE PERMISOS ===

export interface Permission {
    id: string;
    name: string;
    description?: string;
    category: PermissionCategory;
    enabled: boolean;
    grantedBy?: string;     // ID del usuario que otorgó el permiso
    grantedAt?: string;     // Fecha en que se otorgó el permiso
    lastUpdated?: string;   // Última actualización del permiso
    forRole?: UserRole;     // Rol para el cual este permiso es por defecto
}

export interface RolePermissions {
    role: UserRole;
    permissions: Permission[];
}

export type PermissionCategory = 
    | 'pedidos'
    | 'clientes'
    | 'usuarios'
    | 'reportes'
    | 'configuracion'
    | 'auditoria'
    | 'sistema';

export interface PermissionConfig {
    categories: {
        [K in PermissionCategory]: {
            name: string;
            description: string;
            permissions: Omit<Permission, 'enabled'>[];
        };
    };
}

export interface UserPermissions {
    userId: string;
    permissions: string[]; // Array de IDs de permisos
    customPermissions?: Permission[]; // Permisos personalizados para este usuario
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    role?: UserRole;
    displayName?: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    message: string;
    error?: string;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isSyncingPermissions?: boolean;
    login: (username: string, password: string) => Promise<AuthResponse>;
    register: (userData: RegisterRequest) => Promise<AuthResponse>;
    logout: () => void;
    updateUserPermissions?: (permissions: Permission[]) => Promise<boolean>;
}

// === NOTIFICACIONES ===

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export type NotificationCategory = 'pedido' | 'cliente' | 'vendedor' | 'sistema' | 'usuario';

export interface NotificationMetadata {
    cliente?: string;
    prioridad?: Prioridad;
    etapaActual?: Etapa;
    etapaAnterior?: Etapa;
    cambios?: string[];
    [key: string]: any; // Permite campos adicionales
}

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string; // ISO 8601
    read: boolean;
    pedidoId?: string;
    metadata?: NotificationMetadata;
    userId?: string; // null = notificación global para todos
    createdAt?: string; // Timestamp de creación en BD
    category?: NotificationCategory;
}

export interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    refreshNotifications: () => Promise<void>;
}
// === OPERACIONES DE PRODUCCIÓN ===

export type EstadoOperacion = 'en_progreso' | 'pausada' | 'completada' | 'cancelada';
export type CalidadProduccion = 'ok' | 'defectuoso' | 'merma';
export type TipoObservacion = 'normal' | 'problema' | 'alerta' | 'nota_calidad';

export interface OperacionProduccion {
    id: string;
    pedidoId: string;
    operadorId: string;
    operadorNombre: string;
    maquina: string;
    etapa: Etapa;
    estado: EstadoOperacion;
    fechaInicio: string;
    fechaFin?: string;
    tiempoTotalSegundos: number;
    tiempoPausadoSegundos: number;
    metrosProducidos: number;
    metrosObjetivo?: number;
    observaciones?: string;
    motivoPausa?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface PausaOperacion {
    id: string;
    operacionId: string;
    fechaInicioPausa: string;
    fechaFinPausa?: string;
    duracionSegundos?: number;
    motivo?: string;
    createdAt: string;
}

export interface MetrajeProduccion {
    id: string;
    operacionId: string;
    pedidoId: string;
    metrosRegistrados: number;
    metrosAcumulados: number;
    observaciones?: string;
    calidad: CalidadProduccion;
    registradoPor: string;
    registradoNombre: string;
    fechaRegistro: string;
}

export interface ObservacionProduccion {
    id: string;
    operacionId: string;
    pedidoId: string;
    observacion: string;
    tipo: TipoObservacion;
    creadoPor: string;
    creadoNombre: string;
    fechaCreacion: string;
}

export interface OperacionActivaCompleta extends OperacionProduccion {
    numeroPedidoCliente: string;
    cliente: string;
    metrosTotalesPedido: number;
    producto?: string;
    colores?: number;
    prioridad: Prioridad;
    fechaEntrega: string;
    observacionesPedido?: string;
    segundosDesdeInicio: number;
    tiempoTranscurridoFormateado: string;
    eficiencia?: number;
}

export interface EstadisticasOperador {
    operadorId: string;
    operadorNombre: string;
    totalOperaciones: number;
    operacionesCompletadas: number;
    operacionesEnProgreso: number;
    operacionesPausadas: number;
    metrosProducidosHoy: number;
    tiempoTrabajadoSegundos: number;
    tiempoPromedioOperacion: number;
}

export interface IniciarOperacionInput {
    pedidoId: string;
    maquina: string;
    metrosObjetivo?: number;
    observaciones?: string;
}

export interface CompletarOperacionInput {
    operacionId: string;
    metrosProducidos: number;
    observaciones?: string;
    calidad?: CalidadProduccion;
}

export interface PausarOperacionInput {
    operacionId: string;
    motivo?: string;
}

export interface OperacionResponse {
    success: boolean;
    operacion?: OperacionProduccion;
    message?: string;
    error?: string;
}

export interface PedidoConProduccion extends Pedido {
    operadorActualId?: string;
    operadorActualNombre?: string;
    operacionEnCursoId?: string;
    metrosProducidos?: number;
    metrosRestantes?: number;
    porcentajeCompletado?: number;
    tiempoRealProduccionSegundos?: number;
}
