// =================================================================
// TIPOS PARA EL SISTEMA DE CLIENTES
// =================================================================

export interface Cliente {
  id: string;
  nombre: string;
  razon_social?: string;
  cif: string;
  direccion: string;
  poblacion?: string;
  codigo_postal?: string;
  provincia?: string;
  pais?: string;
  telefono: string;
  email: string;
  persona_contacto?: string;
  observaciones?: string;
  estado: 'activo' | 'inactivo' | 'archivado';
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface ClienteListResponse {
  data: Cliente[];
  total: number;
  pagina: number;
  limite: number;
}

export type ClienteCreateRequest = Omit<Cliente, 'id' | 'estado' | 'fecha_creacion' | 'fecha_actualizacion'>;
export type ClienteUpdateRequest = Partial<ClienteCreateRequest>;

export interface ClienteHistorialResponse {
  data: Array<{
    id: string;
    numero_pedido_cliente: string;
    etapa_actual: string;
    fecha_pedido: string;
    fecha_entrega: string;
    cantidad_piezas: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClienteEstadisticas {
  total_clientes: number;
  clientes_activos: number;
  clientes_inactivos: number;
  clientes_con_pedidos: number;
}

export interface ClienteEstadisticasIndividuales {
  pedidos_en_produccion: number;
  pedidos_completados: number;
  total_pedidos: number;
  ultima_fecha_pedido?: string;
}
