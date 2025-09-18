import { Etapa, Prioridad } from '../types';

/**
 * Define el estado de un cliente, que puede ser 'activo' o 'inactivo'.
 */
export type EstadoCliente = 'activo' | 'inactivo';

/**
 * Representa la entidad completa de un Cliente, incluyendo todos los campos de la base de datos
 * y campos calculados opcionales que pueden venir desde la API.
 */
export interface Cliente {
  // Campos de la base de datos
  id: string; // UUID
  nombre: string;
  contactoPrincipal?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  comentarios?: string;
  estado: EstadoCliente;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Campos calculados (opcionales, pueden venir de la API)
  totalPedidos?: number;
  pedidosActivos?: number;
  ultimoPedido?: string; // ISO 8601
}

/**
 * Define la estructura de datos para el formulario de creación y edición de un cliente.
 * Contiene solo los campos que el usuario puede modificar directamente.
 */
export interface ClienteFormData {
  nombre: string;
  contactoPrincipal: string;
  telefono: string;
  email: string;
  direccion: string;
  comentarios: string;
  estado: EstadoCliente;
}

/**
 * Define la estructura para una solicitud de creación de un nuevo cliente.
 * El nombre es el único campo estrictamente requerido para crear un cliente.
 */
export interface ClienteCreateRequest extends Partial<Omit<ClienteFormData, 'nombre' | 'estado'>> {
  nombre: string;
  estado?: EstadoCliente;
}


/**
 * Define la estructura para una solicitud de actualización de un cliente.
 * Todos los campos son opcionales para permitir actualizaciones parciales (PATCH).
 */
export type ClienteUpdateRequest = Partial<ClienteFormData>;

/**
 * Representa la respuesta de la API para una lista paginada de clientes.
 */
export interface ClienteListResponse {
  data: Cliente[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Representa la respuesta de la API para el historial de un cliente específico.
 * Incluye una lista paginada de sus pedidos y un resumen estadístico.
 */
export interface ClienteHistorialResponse {
  pedidos: Array<{
    id: string;
    numeroRegistro: string;
    numeroPedidoCliente: string;
    fechaCreacion: string; // ISO 8601
    fechaEntrega: string; // ISO 8601
    etapaActual: Etapa;
    prioridad: Prioridad;
    metros: number | string;
    estado: 'activo' | 'completado' | 'archivado';
  }>;
  resumen: {
    totalPedidos: number;
    pedidosActivos: number;
    pedidosCompletados: number;
    ultimoPedido?: string; // ISO 8601
  };
  paginacion?: {
    total: number;
    pagina: number;
    limite: number;
    hasMore: boolean;
  };
}

/**
 * Representa la respuesta de la API para las estadísticas de un cliente específico.
 */
export interface ClienteEstadisticas {
  totalPedidos: number;
  pedidosActivos: number;
  pedidosCompletados: number;
  metrosTotal: number;
  ultimoPedido?: string; // ISO 8601
  promedioTiempoProduccion?: string; // Formato "X días, Y horas"
  clienteDesde: string; // ISO 8601
}

/**
 * Representa un problema de integridad de datos detectado en el sistema.
 */
export interface DataIntegrityIssue {
    id: string; // ID único del problema
    type: 'orphaned_pedido' | 'missing_cliente_ref';
    description: string;
    entityId: string; // ID del pedido o cliente afectado
}
