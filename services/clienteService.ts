import {
  Cliente,
  ClienteCreateRequest,
  ClienteEstadisticas,
  ClienteHistorialResponse,
  ClienteListResponse,
  ClienteUpdateRequest
} from '../types/cliente';

// =================================================================
// SERVICIO REAL (API)
// =================================================================

const API_URL = import.meta.env.VITE_API_URL || '/api';

function isNetworkError(error: any): boolean {
  return error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('ERR_INTERNET_DISCONNECTED') ||
    (error.name === 'TypeError' && error.message.includes('fetch'));
}

async function apiRetryFetch<T>(endpoint: string, options: RequestInit = {}, maxRetries: number = 3): Promise<T> {
  let lastError: Error;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiFetch<T>(endpoint, options);
    } catch (error) {
      lastError = error as Error;
      if (!isNetworkError(error)) { throw error; }
      if (attempt === maxRetries) { break; }
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Error de red después de ${maxRetries} intentos: ${lastError!.message}`);
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
            } catch (error) { console.warn('Error parsing user from localStorage:', error); }
        }
    }
    return {};
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Error ${response.status}: ${response.statusText}` }));
    const error = new Error(errorData.message || `Error ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }
  if (response.status === 204) { return {} as T; }
  return response.json();
}

class ClienteService {
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

  async obtenerClientes(filtros: { estado?: string; busqueda?: string; pagina?: number; limite?: number } = {}): Promise<ClienteListResponse> {
    const queryString = this.construirFiltrosURL(filtros);
    return apiRetryFetch<ClienteListResponse>(`/clientes${queryString}`);
  }

  async obtenerClientesSimple(): Promise<Cliente[]> {
    // Endpoint específico para obtener lista simple de clientes activos (para selectores)
    return apiRetryFetch<Cliente[]>('/clientes/simple');
  }

  async obtenerClientePorId(id: string): Promise<Cliente> {
    if (!id) throw new Error("El ID del cliente es requerido.");
    return apiRetryFetch<Cliente>(`/clientes/${id}`);
  }

  async crearCliente(data: ClienteCreateRequest): Promise<Cliente> {
    return apiRetryFetch<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(data) });
  }

  async actualizarCliente(id: string, data: ClienteUpdateRequest): Promise<Cliente> {
    return apiRetryFetch<Cliente>(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async eliminarCliente(id: string): Promise<void> {
    try {
      await apiRetryFetch<void>(`/clientes/${id}`, { method: 'DELETE' });
    } catch (error: any) {
      if (error.status === 409) { throw new Error('No se puede archivar el cliente porque tiene pedidos asociados.'); }
      throw error;
    }
  }

  async eliminarClientePermanentemente(id: string, deletePedidos: boolean = false): Promise<void> {
    try {
      const queryString = deletePedidos ? '?deletePedidos=true' : '';
      await apiRetryFetch<void>(`/clientes/${id}/permanent${queryString}`, { method: 'DELETE' });
    } catch (error: any) {
      if (error.status === 409) { 
        throw new Error(error.message || 'No se puede eliminar el cliente porque tiene pedidos activos.'); 
      }
      if (error.status === 404) { 
        throw new Error('Cliente no encontrado.'); 
      }
      throw error;
    }
  }

  async obtenerHistorialPedidos(clienteId: string, filtros: { pagina?: number; limite?: number } = {}): Promise<ClienteHistorialResponse> {
    const queryString = this.construirFiltrosURL(filtros);
    return apiRetryFetch<ClienteHistorialResponse>(`/clientes/${clienteId}/historial${queryString}`);
  }

  async buscarClientes(termino: string): Promise<Cliente[]> {
    if (!termino || termino.length < 2) return Promise.resolve([]);
    const queryString = this.construirFiltrosURL({ busqueda: termino, limite: 10 });
    const response = await apiRetryFetch<ClienteListResponse>(`/clientes${queryString}`);
    return response.data;
  }

  async obtenerEstadisticasGlobales(): Promise<ClienteEstadisticas> {
    return apiRetryFetch<ClienteEstadisticas>(`/clientes/stats`);
  }

  // ✅ Métodos adicionales para estadísticas y pedidos de un cliente específico
  async obtenerEstadisticasCliente(clienteId: string): Promise<any> {
    if (!clienteId) throw new Error("El ID del cliente es requerido.");
    return apiRetryFetch<any>(`/clientes/${clienteId}/estadisticas`);
  }

  async obtenerPedidosCliente(clienteId: string, estado?: string): Promise<any[]> {
    if (!clienteId) throw new Error("El ID del cliente es requerido.");
    const queryString = estado ? `?estado=${estado}` : '';
    return apiRetryFetch<any[]>(`/clientes/${clienteId}/pedidos${queryString}`);
  }
}

export const clienteService = new ClienteService();
