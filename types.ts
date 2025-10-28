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
    vendedor?: string; // Nombre del vendedor asignado
    etapaActual: Etapa;
    subEtapaActual?: string;
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
    clicheDisponible?: boolean;
    estadoCliché?: EstadoCliché;
    clicheInfoAdicional?: string; // Campo adicional para información de cliché (fecha, texto, etc.)
    dtoCompra?: string; // Fecha de Dto Compra (YYYY-MM-DD)
    recepcionCliche?: string; // Fecha de Recepción Cliché (YYYY-MM-DD)
    camisa?: string;
    antivaho?: boolean;
    antivahoRealizado?: boolean;
    anonimo?: boolean;

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

export type ViewType = 'preparacion' | 'clientes' | 'kanban' | 'list' | 'archived' | 'report' | 'permissions-debug';

export type UserRole = 'Administrador' | 'Supervisor' | 'Operador' | 'Visualizador';

export interface AuditEntry {
    id?: number;
    timestamp: string;
    userRole: string; // Nombre del usuario en lugar del rol
    action: string;
    pedidoId?: string;
    details?: any;
}

export type DateField = 'fechaCreacion' | 'fechaEntrega' | 'nuevaFechaEntrega' | 'fechaFinalizacion' | 'dtoCompra' | 'recepcionCliche';

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