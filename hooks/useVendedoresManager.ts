import { useState, useEffect, useCallback } from 'react';
import { Vendedor, VendedorCreateRequest, VendedorUpdateRequest } from '../types/vendedor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useVendedoresManager() {
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Función para obtener todos los vendedores
    const fetchVendedores = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${API_URL}/api/vendedores`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
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
    }, []);

    // Función para agregar un nuevo vendedor
    const addVendedor = useCallback(async (vendedorData: VendedorCreateRequest): Promise<Vendedor> => {
        try {
            setError(null);
            
            const response = await fetch(`${API_URL}/api/vendedores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
    }, []);

    // Función para actualizar un vendedor existente
    const updateVendedor = useCallback(async (id: string, vendedorData: VendedorUpdateRequest): Promise<Vendedor> => {
        try {
            setError(null);
            
            const response = await fetch(`${API_URL}/api/vendedores/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
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
    }, []);

    // Función para eliminar/desactivar un vendedor
    const deleteVendedor = useCallback(async (id: string): Promise<void> => {
        try {
            setError(null);
            
            const response = await fetch(`${API_URL}/api/vendedores/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
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
    }, []);

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
