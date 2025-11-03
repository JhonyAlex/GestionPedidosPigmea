import { useState, useEffect, useCallback } from 'react';
import { Vendedor, VendedorCreateRequest, VendedorUpdateRequest } from '../types/vendedor';
import { useAuth } from '../contexts/AuthContext';
import webSocketService from '../services/websocket';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function useVendedoresManager() {
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        try {
            setLoading(true);
            setError(null);
            
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
            setVendedores(data);
        } catch (err) {
            console.error('Error fetching vendedores:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
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
            
            // Actualizar la lista local
            setVendedores(prev => [...prev, nuevoVendedor]);
            
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
            
            // Actualizar la lista local
            setVendedores(prev => prev.map(v => v.id === id ? vendedorActualizado : v));
            
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

            // Actualizar la lista local
            setVendedores(prev => prev.filter(v => v.id !== id));
        } catch (err) {
            console.error('Error deleting vendedor:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        }
    }, [getAuthHeaders]);

    // Cargar vendedores al montar el componente
    useEffect(() => {
        fetchVendedores();
    }, [fetchVendedores]);

    // 🔥 Socket.IO: Sincronización en tiempo real para vendedores
    useEffect(() => {
        // Suscribirse a eventos de vendedores
        const unsubscribeCreated = webSocketService.subscribeToVendedorCreated((data: { vendedor: Vendedor; message: string; timestamp: string }) => {
            console.log('🔄 Sincronizando nuevo vendedor:', data.vendedor.nombre);
            
            setVendedores(current => {
                // Verificar si el vendedor ya existe para evitar duplicados
                const exists = current.some(v => v.id === data.vendedor.id);
                if (!exists) {
                    return [...current, data.vendedor];
                }
                return current;
            });
        });

        const unsubscribeUpdated = webSocketService.subscribeToVendedorUpdated((data: { vendedor: Vendedor; message: string; timestamp: string }) => {
            console.log('🔄 Sincronizando vendedor actualizado:', data.vendedor.nombre);
            
            setVendedores(current => 
                current.map(v => v.id === data.vendedor.id ? data.vendedor : v)
            );
        });

        const unsubscribeDeleted = webSocketService.subscribeToVendedorDeleted((data: { vendedorId: string; vendedor?: Vendedor; message: string; timestamp: string }) => {
            console.log('🔄 Sincronizando vendedor eliminado:', data.vendedorId);
            
            if (data.vendedor) {
                // Si el backend devuelve el vendedor, actualizarlo (por si es soft delete)
                setVendedores(current => 
                    current.map(v => v.id === data.vendedorId ? data.vendedor! : v)
                );
            } else {
                // Si no, remover de la lista
                setVendedores(current => current.filter(v => v.id !== data.vendedorId));
            }
        });

        // Cleanup al desmontar
        return () => {
            unsubscribeCreated();
            unsubscribeUpdated();
            unsubscribeDeleted();
        };
    }, []);

    return {
        vendedores,
        loading,
        error,
        fetchVendedores,
        addVendedor,
        updateVendedor,
        deleteVendedor,
    };
}
