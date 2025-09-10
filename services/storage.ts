import { Pedido } from '../types';
import { initialPedidos } from '../data/seedData';

// --- CONFIGURACIÓN DE MODO ---
// Cambia a 'false' para usar la API del backend real.
// En 'true', la aplicación usará datos de ejemplo locales.
const MODO_DESARROLLO = false;

// --- INTERFAZ COMÚN ---
export interface DataStore<T extends { id: string }> {
  init(): Promise<void>;
  create(item: T): Promise<T>;
  update(item: T): Promise<T>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  clear(): Promise<void>;
  bulkInsert(items: T[]): Promise<void>;
}

// --- MODO DE PRODUCCIÓN (API REAL) ---

// Detectar entorno y configurar URL base
const isDevelopment = typeof window !== 'undefined' && 
                     (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isDevelopment ? 'http://localhost:8080/api' : '/api';

// Función para detectar errores de red
function isNetworkError(error: any): boolean {
    return error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('ERR_INTERNET_DISCONNECTED') ||
           error.name === 'TypeError' && error.message.includes('fetch');
}

// Función con reintentos automáticos para errores de red
async function apiRetryFetch<T>(endpoint: string, options: RequestInit = {}, maxRetries: number = 3): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await apiFetch<T>(endpoint, options);
        } catch (error) {
            lastError = error as Error;
            
            // Si no es error de red, fallar inmediatamente
            if (!isNetworkError(error)) {
                throw error;
            }
            
            // Si es el último intento, fallar
            if (attempt === maxRetries) {
                break;
            }
            
            // Esperar antes del siguiente intento (backoff exponencial)
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            console.log(`🔄 Reintentando llamada API en ${delay}ms (intento ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw new Error(`Error de red después de ${maxRetries} intentos: ${lastError.message}`);
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
        // Obtener información del usuario autenticado desde localStorage
        const getAuthHeaders = () => {
            if (typeof window !== 'undefined') {
                const savedUser = localStorage.getItem('pigmea_user');
                if (savedUser) {
                    try {
                        const user = JSON.parse(savedUser);
                        return {
                            'x-user-id': String(user.id),
                            'x-user-role': user.role || 'OPERATOR'
                        };
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
                ...getAuthHeaders(), // Añadir headers de autenticación automáticamente
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido en la API' }));
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        // Handle 204 No Content from DELETE
        if (response.status === 204) {
            return {} as T;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        }

        return {} as T; // Return an empty object if no JSON body
    } catch (error) {
        console.error(`Error en la llamada a la API (${endpoint}):`, error);
        throw new Error((error as Error).message || 'Error desconocido en la API');
    }
}

class ApiClient implements DataStore<Pedido> {
    public async init(): Promise<void> {
        return Promise.resolve();
    }

    public async create(item: Pedido): Promise<Pedido> {
        return apiRetryFetch<Pedido>('/pedidos', {
            method: 'POST',
            body: JSON.stringify(item),
        });
    }

    public async update(item: Pedido): Promise<Pedido> {
        return apiRetryFetch<Pedido>(`/pedidos/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify(item),
        });
    }

    public async delete(id: string): Promise<void> {
        await apiRetryFetch<void>(`/pedidos/${id}`, { method: 'DELETE' });
    }

    public async findById(id: string): Promise<Pedido | undefined> {
        return apiRetryFetch<Pedido>(`/pedidos/${id}`);
    }

    public async getAll(): Promise<Pedido[]> {
        return apiRetryFetch<Pedido[]>('/pedidos');
    }

    public async clear(): Promise<void> {
        // Primero, obtenemos todos los pedidos existentes.
        const pedidos = await this.getAll();
        // Luego, creamos una promesa para cada operación de eliminación.
        const deletePromises = pedidos.map(p => this.delete(p.id));
        // Esperamos a que todas las promesas de eliminación se completen.
        await Promise.all(deletePromises);
    }

    public async bulkInsert(items: Pedido[]): Promise<void> {
        await apiRetryFetch<void>('/pedidos/bulk', {
            method: 'POST',
            body: JSON.stringify(items),
        });
    }
}

// --- MODO DE DESARROLLO (DATOS MOCK) ---
class MockApiClient implements DataStore<Pedido> {
    private pedidos: Pedido[] = [];

    constructor() {
        // Clonar los datos iniciales para evitar mutaciones directas del objeto importado
        this.pedidos = JSON.parse(JSON.stringify(initialPedidos));
    }

    private async simulateDelay<T>(data: T): Promise<T> {
        // Latencia reducida para mejorar la experiencia de drag and drop
        return new Promise(resolve => setTimeout(() => resolve(data), 50));
    }

    public async init(): Promise<void> {
        return this.simulateDelay(undefined);
    }

    public async create(item: Pedido): Promise<Pedido> {
        this.pedidos.unshift(item); // Añade al principio
        return this.simulateDelay(item);
    }

    public async update(item: Pedido): Promise<Pedido> {
        const index = this.pedidos.findIndex(p => p.id === item.id);
        if (index !== -1) {
            this.pedidos[index] = item;
            return this.simulateDelay(item);
        }
        throw new Error("Pedido no encontrado para actualizar.");
    }

    public async delete(id: string): Promise<void> {
        this.pedidos = this.pedidos.filter(p => p.id !== id);
        return this.simulateDelay(undefined);
    }

    public async findById(id: string): Promise<Pedido | undefined> {
        const pedido = this.pedidos.find(p => p.id === id);
        return this.simulateDelay(pedido);
    }

    public async getAll(): Promise<Pedido[]> {
        return this.simulateDelay([...this.pedidos].sort((a, b) => b.secuenciaPedido - a.secuenciaPedido)); // Devuelve una copia ordenada
    }

    public async clear(): Promise<void> {
        this.pedidos = [];
        return this.simulateDelay(undefined);
    }

    public async bulkInsert(items: Pedido[]): Promise<void> {
        this.pedidos = JSON.parse(JSON.stringify(items));
        return this.simulateDelay(undefined);
    }
}

// --- EXPORTACIÓN CONDICIONAL ---
// Exportamos una única instancia para ser usada en toda la app
export const store = MODO_DESARROLLO ? new MockApiClient() : new ApiClient();
