import { Pedido } from '../types';
import { initialPedidos } from '../data/seedData';

// --- CONFIGURACIÓN DE MODO ---
// Cambia a 'false' para usar la API del backend real.
// En 'true', la aplicación usará datos de ejemplo locales.
const MODO_DESARROLLO = true;

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

const API_BASE_URL = '/api';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
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
        console.log("API client initialized.");
        return Promise.resolve();
    }

    public async create(item: Pedido): Promise<Pedido> {
        return apiFetch<Pedido>('/pedidos', {
            method: 'POST',
            body: JSON.stringify(item),
        });
    }

    public async update(item: Pedido): Promise<Pedido> {
        return apiFetch<Pedido>(`/pedidos/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify(item),
        });
    }

    public async delete(id: string): Promise<void> {
        await apiFetch<void>(`/pedidos/${id}`, { method: 'DELETE' });
    }

    public async findById(id: string): Promise<Pedido | undefined> {
        return apiFetch<Pedido>(`/pedidos/${id}`);
    }

    public async getAll(): Promise<Pedido[]> {
        return apiFetch<Pedido[]>('/pedidos');
    }

    public async clear(): Promise<void> {
        await apiFetch<void>('/pedidos/all', { method: 'DELETE' });
    }

    public async bulkInsert(items: Pedido[]): Promise<void> {
        await apiFetch<void>('/pedidos/bulk', {
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
        // Simula la latencia de red
        return new Promise(resolve => setTimeout(() => resolve(data), 200));
    }

    public async init(): Promise<void> {
        console.log("Mock API client initialized.");
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
