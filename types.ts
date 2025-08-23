export enum Prioridad {
    URGENTE = 'Urgente',
    ALTA = 'Alta',
    NORMAL = 'Normal',
    BAJA = 'Baja',
}

export enum Etapa {
    PENDIENTE = 'PENDIENTE',
    IMPRESION = 'IMPRESION',
    LAMINADO = 'LAMINADO',
    CORTE = 'CORTE',
    ENTREGA = 'ENTREGA',
    COMPLETADO = 'COMPLETADO',
    ARCHIVADO = 'ARCHIVADO',
}

export interface EtapaInfo {
    etapa: Etapa;
    fecha: string; // ISO 8601 date string
}

export interface Pedido {
    id: string;
    secuenciaPedido: number;
    numeroPedido: string;
    cliente: string;
    maquinaImpresion: string;
    metros: number;
    fecha: string; // YYYY-MM-DD
    etapaActual: Etapa;
    etapasSecuencia: EtapaInfo[];
    prioridad: Prioridad;
    tipoImpresion: string;
    tiempoProduccionPlanificado: string; // HH:mm
    observaciones: string;
}

export interface KanbanEtapa {
    id: Etapa;
    title: string;
    color: string;
}

export type ViewType = 'kanban' | 'list' | 'archived' | 'report';

export type UserRole = 'Administrador' | 'Operador';

export interface AuditEntry {
    timestamp: string;
    userRole: UserRole;
    action: string;
}
