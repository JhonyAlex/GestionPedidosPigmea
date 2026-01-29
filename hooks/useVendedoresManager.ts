import { useState, useEffect, useCallback } from 'react';
import { Vendedor, VendedorCreateRequest, VendedorUpdateRequest } from '../types/vendedor';
import { useAuth } from '../contexts/AuthContext';
import webSocketService from '../services/websocket';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// 🔥 SINGLETON: Estado global compartido
let globalVendedores: Vendedor[] = [];
let globalLoading = false;
let globalError: string | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
const stateListeners: Set<() => void> = new Set();

const notifyListeners = () => {
    stateListeners.forEach(listener => listener());
};

const MAX_RECONNECT_ATTEMPTS = 3;

/**
 * Función para actualizar el estado global y notificar a los listeners
 */
const updateGlobalState = (
    updater: (currentVendedores: Vendedor[]) => Vendedor[]
) => {
    globalVendedores = updater(globalVendedores);
    notifyListeners();
};

// Configurar listeners globales de WebSocket (Solo una vez)
let wsListenersSetup = false;

const setupGlobalWebSocketListeners = () => {
    if (wsListenersSetup) return;
    wsListenersSetup = true;

    console.log('🔌 Configurando listeners globales de WebSocket para Vendedores...');

    webSocketService.subscribeToVendedorCreated((data: { vendedor: Vendedor; message: string; timestamp: string }) => {
        console.log('🔄 WS: Nuevo vendedor:', data.vendedor.nombre);
        updateGlobalState(current => {
            if (current.some(v => v.id === data.vendedor.id)) return current;
            return [...current, data.vendedor];
        });
    });

    webSocketService.subscribeToVendedorUpdated((data: { vendedor: Vendedor; message: string; timestamp: string }) => {
        console.log('🔄 WS: Vendedor actualizado:', data.vendedor.nombre);
        updateGlobalState(current =>
            current.map(v => v.id === data.vendedor.id ? data.vendedor : v)
        );
    });

    webSocketService.subscribeToVendedorDeleted((data: { vendedorId: string; vendedor?: Vendedor; message: string; timestamp: string }) => {
        console.log('🔄 WS: Vendedor eliminado:', data.vendedorId);
        updateGlobalState(current => {
            if (data.vendedor) {
                // Soft delete (updated)
                return current.map(v => v.id === data.vendedorId ? data.vendedor! : v);
            } else {
                // Hard delete
                return current.filter(v => v.id !== data.vendedorId);
            }
        });
    });
};

export function useVendedoresManager() {
    const [vendedores, setVendedores] = useState<Vendedor[]>(globalVendedores);
    const [loading, setLoading] = useState(globalLoading);
    const [error, setError] = useState<string | null>(globalError);
    const { user } = useAuth();

    // Helper para obtener headers de autenticación
    const getAuthHeaders = useCallback(() => {
        if (!user?.id) return {};

        const headers: any = {
            'x-user-id': String(user.id),
            'x-user-role': user.role || 'OPERATOR'
        };

        // Enviar también los permisos del usuario
        if (user.permissions && Array.isArray(user.permissions)) {
            headers['x-user-permissions'] = JSON.stringify(user.permissions);
        }

        return headers;
    }, [user]);

    // Función para obtener todos los vendedores
    const fetchVendedores = useCallback(async () => {
        if (globalLoading) return;

        try {
            globalLoading = true;
            setLoading(true);
            notifyListeners(); // Notificar estado de carga
            setError(null);
            globalError = null;

            const response = await fetch(`${API_URL}/vendedores`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Error al obtener vendedores: ${response.statusText}`);
            }

            const data = await response.json();

            // Actualizar estado global
            updateGlobalState(() => data);

        } catch (err) {
            console.error('Error fetching vendedores:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            globalError = errorMessage;
            setError(errorMessage);
        } finally {
            globalLoading = false;
            setLoading(false);
            notifyListeners(); // Notificar fin de carga
        }
    }, [getAuthHeaders]);

    // Función para agregar un nuevo vendedor
    const addVendedor = useCallback(async (vendedorData: VendedorCreateRequest): Promise<Vendedor> => {
        try {
            setError(null);

            const response = await fetch(`${API_URL}/vendedores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
                body: JSON.stringify(vendedorData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al crear vendedor: ${response.statusText}`);
            }

            const nuevoVendedor = await response.json();

            // Actualizar estado global (evitar duplicados si WS ya lo insertó)
            updateGlobalState(current => {
                if (current.some(v => v.id === nuevoVendedor.id)) return current;
                return [...current, nuevoVendedor];
            });

            return nuevoVendedor;
        } catch (err) {
            console.error('Error creating vendedor:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        }
    }, [getAuthHeaders]);

    // Función para actualizar un vendedor existente
    const updateVendedor = useCallback(async (id: string, vendedorData: VendedorUpdateRequest): Promise<Vendedor> => {
        try {
            setError(null);

            const response = await fetch(`${API_URL}/vendedores/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
                body: JSON.stringify(vendedorData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al actualizar vendedor: ${response.statusText}`);
            }

            const vendedorActualizado = await response.json();

            // Actualizar estado global
            updateGlobalState(current =>
                current.map(v => v.id === id ? vendedorActualizado : v)
            );

            return vendedorActualizado;
        } catch (err) {
            console.error('Error updating vendedor:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        }
    }, [getAuthHeaders]);

    // Función para eliminar/desactivar un vendedor
    const deleteVendedor = useCallback(async (id: string): Promise<void> => {
        try {
            setError(null);

            const response = await fetch(`${API_URL}/vendedores/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al eliminar vendedor: ${response.statusText}`);
            }

            // Actualizar estado global
            // Nota: Si el backend hizo soft-delete, el WS enviará el objeto actualizado.
            // Si hizo hard-delete, el WS enviará el ID.
            // Como no sabemos aquí qué pasó exactamente (la respuesta es 204),
            // asumimos hard-delete en local hasta que WS confirme.
            updateGlobalState(current => current.filter(v => v.id !== id));

        } catch (err) {
            console.error('Error deleting vendedor:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        }
    }, [getAuthHeaders]);

    // Inicialización del Singleton y suscripción a cambios
    useEffect(() => {
        // Suscribirse a cambios del estado global
        const onStateChange = () => {
            setVendedores(globalVendedores);
            setLoading(globalLoading);
            setError(globalError);
        };

        stateListeners.add(onStateChange);

        // Inicialización única
        if (!isInitialized && user?.id) {
            isInitialized = true;
            setupGlobalWebSocketListeners(); // Activar listeners WS

            if (!initializationPromise) {
                console.log('🚀 Iniciando carga inicial de vendedores...');
                initializationPromise = fetchVendedores().finally(() => {
                    initializationPromise = null;
                });
            }
        } else {
            // Si ya estaba inicializado, asegurarse de tener los datos más recientes
            // si el array está vacío (por si acaso)
            if (globalVendedores.length === 0 && !globalLoading && !globalError) {
                fetchVendedores();
            } else {
                onStateChange();
            }

            // Asegurar listeners WS activados (idempotente)
            setupGlobalWebSocketListeners();
        }

        return () => {
            stateListeners.delete(onStateChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // 🚀 NUEVO: Función para obtener estadísticas en batch
    const fetchVendedoresStatsBatch = useCallback(async (vendedorIds: string[]): Promise<Record<string, any>> => {
        if (!vendedorIds || vendedorIds.length === 0) {
            return {};
        }

        try {
            const ids = vendedorIds.join(',');
            const response = await fetch(`${API_URL}/vendedores/stats/batch?ids=${ids}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Error al obtener estadísticas: ${response.statusText}`);
            }

            return await response.json();
        } catch (err) {
            console.error('Error fetching vendedores stats batch:', err);
            return {};
        }
    }, [getAuthHeaders]);

    return {
        vendedores,
        loading,
        error,
        fetchVendedores,
        addVendedor,
        updateVendedor,
        deleteVendedor,
        fetchVendedoresStatsBatch, // 🚀 NUEVO
    };
}
