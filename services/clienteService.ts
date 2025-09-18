import {
  Cliente,
  ClienteCreateRequest,
  ClienteEstadisticas,
  ClienteHistorialResponse,
  ClienteListResponse,
  ClienteUpdateRequest
} from '../types/cliente';

// =================================================================
// HELPERS DE COMUNICACIÓN API (Basado en services/storage.ts)
// =================================================================

const isDevelopment = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isDevelopment ? 'http://localhost:8080/api' : '/api';

/**
 * Comprueba si un error es de red.
 * @param error - El error a comprobar.
 * @returns `true` si es un error de red.
 */
function isNetworkError(error: any): boolean {
  return error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('ERR_INTERNET_DISCONNECTED') ||
    (error.name === 'TypeError' && error.message.includes('fetch'));
}

/**
 * Realiza una petición fetch a la API con reintentos automáticos para errores de red.
 * @param endpoint - El endpoint de la API al que llamar.
 * @param options - Opciones de la petición fetch.
 * @param maxRetries - Número máximo de reintentos.
 * @returns La respuesta de la API.
 */
async function apiRetryFetch<T>(endpoint: string, options: RequestInit = {}, maxRetries: number = 3): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiFetch<T>(endpoint, options);
    } catch (error) {
      lastError = error as Error;

      if (!isNetworkError(error)) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      const delay = Math.pow(2, attempt) * 1000;
      console.log(`🔄 Reintentando llamada API en ${delay}ms (intento ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Error de red después de ${maxRetries} intentos: ${lastError.message}`);
}

/**
 * Realiza una petición fetch a la API, añadiendo cabeceras de autenticación.
 * @param endpoint - El endpoint de la API.
 * @param options - Opciones de la petición fetch.
 * @returns La respuesta de la API.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const getAuthHeaders = (): Record<string, string> => {
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('pigmea_user');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            const headers: any = {
              'x-user-id': String(user.id),
              'x-user-role': user.role || 'OPERATOR'
            };
            if (user.permissions && Array.isArray(user.permissions)) {
              headers['x-user-permissions'] = JSON.stringify(user.permissions);
            }
            return headers;
          } catch (error) {
            console.warn('Error parsing user from localStorage:', error);
          }
        }
      }
      return {};
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error ${response.status}: ${response.statusText}` }));
      // Lanzar un error que incluya el status para poder manejarlo
      const error = new Error(errorData.message || `Error ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    console.error(`Error en la llamada a la API (${endpoint}):`, error);
    throw error;
  }
}

// =================================================================
// SERVICIO DE CLIENTES
// =================================================================

class ClienteService {

  /**
   * Construye una cadena de consulta URL a partir de un objeto de filtros.
   * @param filtros - Objeto con los filtros a aplicar.
   * @returns Una cadena de consulta URL.
   */
  private construirFiltrosURL(filtros: Record<string, any>): string {
    const params = new URLSearchParams();
    for (const key in filtros) {
      if (filtros[key] !== undefined && filtros[key] !== null && filtros[key] !== '') {
        params.append(key, String(filtros[key]));
      }
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Obtiene una lista paginada de clientes, con filtros opcionales.
   * @param filtros - Opciones de filtrado y paginación.
   * @returns Una promesa que se resuelve con la lista de clientes y metadatos de paginación.
   */
  async obtenerClientes(filtros: { estado?: string; busqueda?: string; pagina?: number; limite?: number } = {}): Promise<ClienteListResponse> {
    const queryString = this.construirFiltrosURL(filtros);
    return apiRetryFetch<ClienteListResponse>(`/clientes${queryString}`);
  }

  /**
   * Obtiene un cliente específico por su ID.
   * @param id - El ID del cliente.
   * @returns Una promesa que se resuelve con los datos del cliente.
   */
  async obtenerClientePorId(id: string): Promise<Cliente> {
    if (!id) throw new Error("El ID del cliente es requerido.");
    return apiRetryFetch<Cliente>(`/clientes/${id}`);
  }

  /**
   * Crea un nuevo cliente.
   * @param data - Los datos del cliente a crear.
   * @returns Una promesa que se resuelve con el cliente recién creado.
   */
  async crearCliente(data: ClienteCreateRequest): Promise<Cliente> {
    return apiRetryFetch<Cliente>('/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Actualiza un cliente existente.
   * @param id - El ID del cliente a actualizar.
   * @param data - Los datos a actualizar (parcial).
   * @returns Una promesa que se resuelve con el cliente actualizado.
   */
  async actualizarCliente(id: string, data: ClienteUpdateRequest): Promise<Cliente> {
    return apiRetryFetch<Cliente>(`/clientes/${id}`, {
      method: 'PATCH', // Usamos PATCH para actualizaciones parciales
      body: JSON.stringify(data),
    });
  }

  /**
   * Elimina un cliente por su ID.
   * Lanza un error específico si el cliente no se puede eliminar porque tiene pedidos asociados.
   * @param id - El ID del cliente a eliminar.
   */
  async eliminarCliente(id: string): Promise<void> {
    try {
      await apiRetryFetch<void>(`/clientes/${id}`, { method: 'DELETE' });
    } catch (error: any) {
      if (error.status === 409) {
        throw new Error('No se puede eliminar el cliente porque tiene pedidos asociados.');
      }
      throw error;
    }
  }

  /**
   * Obtiene el historial de pedidos de un cliente.
   * @param clienteId - El ID del cliente.
   * @param filtros - Filtros opcionales de paginación.
   * @returns El historial de pedidos del cliente.
   */
  async obtenerHistorialPedidos(clienteId: string, filtros: { pagina?: number; limite?: number } = {}): Promise<ClienteHistorialResponse> {
    const queryString = this.construirFiltrosURL(filtros);
    return apiRetryFetch<ClienteHistorialResponse>(`/clientes/${clienteId}/pedidos${queryString}`);
  }

  /**
   * Busca clientes por un término de búsqueda (para autocompletado, etc.).
   * @param termino - El término de búsqueda.
   * @returns Una lista de clientes que coinciden con el término.
   */
  async buscarClientes(termino: string): Promise<Cliente[]> {
    if (!termino || termino.length < 2) return Promise.resolve([]);
    const queryString = this.construirFiltrosURL({ busqueda: termino, limite: 10 });
    const response = await apiRetryFetch<ClienteListResponse>(`/clientes${queryString}`);
    return response.data;
  }

  /**
   * Obtiene las estadísticas para un cliente específico.
   * @param clienteId - El ID del cliente.
   * @returns Las estadísticas del cliente.
   */
  async obtenerEstadisticasCliente(clienteId: string): Promise<ClienteEstadisticas> {
    return apiRetryFetch<ClienteEstadisticas>(`/clientes/${clienteId}/estadisticas`);
  }

  /**
   * (Placeholder) Verifica la integridad de los datos de clientes y pedidos.
   * @returns Una lista de problemas de integridad detectados.
   */
  async checkDataIntegrity(): Promise<{ issues: any[] }> {
    console.warn("checkDataIntegrity no está implementado en el backend. Devolviendo datos de ejemplo.");
    // En una implementación real, esto llamaría a un endpoint como GET /api/clientes/data-integrity
    return Promise.resolve({ issues: [
        { id: '1', type: 'orphaned_pedido', description: "Pedido 'P001' tiene un cliente 'Cliente Fantasma' que no existe.", entityId: 'P001' }
    ] });
  }

  /**
   * (Placeholder) Intenta reparar un problema de integridad de datos específico.
   * @param issueId - El ID del problema a reparar.
   */
  async repairDataIssue(issueId: string): Promise<void> {
    console.warn(`repairDataIssue no está implementado en el backend. Simulando reparación para ${issueId}.`);
    // En una implementación real, esto llamaría a un endpoint como POST /api/clientes/data-integrity/repair
    return Promise.resolve();
  }
}

// Exportar una única instancia del servicio para ser usada en toda la app.
export const clienteService = new ClienteService();
