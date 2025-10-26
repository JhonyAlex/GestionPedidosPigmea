import { useState, useEffect, useCallback } from 'react';
import { Vendedor, VendedorCreateRequest, VendedorUpdateRequest } from '../types/vendedor';
import { useAuth } from '../contexts/AuthContext';

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
