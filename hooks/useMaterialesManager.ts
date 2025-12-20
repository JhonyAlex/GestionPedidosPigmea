import { useState, useEffect, useCallback } from 'react';
import { Material, MaterialCreateRequest, MaterialUpdateRequest } from '../types/material';
import { useAuth } from '../contexts/AuthContext';
import webSocketService from '../services/websocket';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// 🔥 SINGLETON: Estado global compartido para evitar múltiples fetches
let globalMateriales: Material[] = [];
let globalLoading = false;
let globalError: string | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null; // ← Promesa compartida
const stateListeners: Set<() => void> = new Set();

const notifyListeners = () => {
    stateListeners.forEach(listener => listener());
};

export function useMaterialesManager() {
    const [materiales, setMateriales] = useState<Material[]>(globalMateriales);
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

    // Función para obtener todos los materiales
    const fetchMateriales = useCallback(async () => {
        // Si ya se está cargando, no hacer otra petición
        if (globalLoading) {
            console.log('⏳ Fetch de materiales ya en progreso, saltando...');
            return;
        }

        try {
            globalLoading = true;
            setLoading(true);
            setError(null);
            globalError = null;
            
            const response = await fetch(`${API_URL}/materiales`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Error al obtener materiales: ${response.statusText}`);
            }

            const data = await response.json();
            globalMateriales = data;
            setMateriales(data);
            notifyListeners();
        } catch (err) {
            console.error('Error fetching materiales:', err);
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            globalError = errorMsg;
            setError(errorMsg);
        } finally {
            globalLoading = false;
            setLoading(false);
        }
    }, [getAuthHeaders]);

    // Función para agregar un nuevo material
    const addMaterial = useCallback(async (materialData: MaterialCreateRequest): Promise<Material> => {
        try {
            setError(null);
            globalError = null;
            
            const response = await fetch(`${API_URL}/materiales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...materialData,
                    pendienteRecibir: materialData.pendienteRecibir !== undefined ? materialData.pendienteRecibir : true,
                    pendienteGestion: materialData.pendienteGestion !== undefined ? materialData.pendienteGestion : true
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al crear material: ${response.statusText}`);
            }

            const nuevoMaterial = await response.json();
            
            // Actualizar estado global
            globalMateriales = [...globalMateriales, nuevoMaterial];
            setMateriales(globalMateriales);
            notifyListeners();
            
            return nuevoMaterial;
        } catch (err) {
            console.error('Error creating material:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            globalError = errorMessage;
            setError(errorMessage);
            throw err;
        }
    }, [getAuthHeaders]);

    // Función para actualizar un material existente
    const updateMaterial = useCallback(async (id: number, materialData: MaterialUpdateRequest): Promise<Material> => {
        try {
            setError(null);
            
            // 🔄 LÓGICA DE TRANSICIÓN FRONTEND
            const payload: MaterialUpdateRequest = { ...materialData };
            
            // Regla: Si se marca como "Material Recibido", forzar "Gestionado"
            if (payload.pendienteRecibir === false) {
                payload.pendienteGestion = false;
            }
            
            const response = await fetch(`${API_URL}/materiales/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al actualizar material: ${response.statusText}`);
            }

            const materialActualizado = await response.json();
            
            // Actualizar estado global
            globalMateriales = globalMateriales.map(m => m.id === id ? materialActualizado : m);
            setMateriales(globalMateriales);
            notifyListeners();
            
            return materialActualizado;
        } catch (err) {
            console.error('Error updating material:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        }
    }, [getAuthHeaders]);

    // Función para eliminar un material
    const deleteMaterial = useCallback(async (id: number): Promise<void> => {
        try {
            setError(null);
            
            const response = await fetch(`${API_URL}/materiales/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al eliminar material: ${response.statusText}`);
            }

            // Actualizar estado global
            globalMateriales = globalMateriales.filter(m => m.id !== id);
            setMateriales(globalMateriales);
            notifyListeners();
        } catch (err) {
            console.error('Error deleting material:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        }
    }, [getAuthHeaders]);

    // Función para obtener materiales de un pedido específico
    const getMaterialesByPedidoId = useCallback(async (pedidoId: string): Promise<Material[]> => {
        try {
            setError(null);
            
            const response = await fetch(`${API_URL}/pedidos/${pedidoId}/materiales`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Error al obtener materiales del pedido: ${response.statusText}`);
            }

            return await response.json();
        } catch (err) {
            console.error(`Error fetching materiales for pedido ${pedidoId}:`, err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        }
    }, [getAuthHeaders]);

    // Función para asignar material a pedido
    const assignMaterialToPedido = useCallback(async (pedidoId: string, materialId: number): Promise<void> => {
        try {
            setError(null);
            
            const response = await fetch(`${API_URL}/pedidos/${pedidoId}/materiales/${materialId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al asignar material: ${response.statusText}`);
            }
        } catch (err) {
            console.error('Error assigning material to pedido:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        }
    }, [getAuthHeaders]);

    // Función para desasignar material de pedido
    const unassignMaterialFromPedido = useCallback(async (pedidoId: string, materialId: number): Promise<void> => {
        try {
            setError(null);
            
            const response = await fetch(`${API_URL}/pedidos/${pedidoId}/materiales/${materialId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al desasignar material: ${response.statusText}`);
            }
        } catch (err) {
            console.error('Error unassigning material from pedido:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            throw err;
        }
    }, [getAuthHeaders]);

    // Cargar materiales al montar el componente (SOLO UNA VEZ GLOBALMENTE)
    useEffect(() => {
        // Registrar listener para actualizaciones de estado
        const updateState = () => {
            setMateriales(globalMateriales);
            setLoading(globalLoading);
            setError(globalError);
        };
        
        stateListeners.add(updateState);
        
        // Solo hacer fetch si no se ha inicializado
        if (!isInitialized && user?.id) {
            isInitialized = true;
            
            // Crear promesa de inicialización si no existe
            if (!initializationPromise) {
                console.log('🚀 Iniciando carga de materiales (singleton)...');
                initializationPromise = fetchMateriales().finally(() => {
                    // Limpiar la promesa después de completar
                    initializationPromise = null;
                });
            } else {
                console.log('⏳ Ya hay una carga de materiales en progreso, esperando...');
            }
        } else {
            // Si ya está inicializado, solo actualizar el estado local
            updateState();
        }
        
        return () => {
            stateListeners.delete(updateState);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]); // Solo re-ejecutar si cambia el usuario

    // 🔥 Socket.IO: Sincronización en tiempo real para materiales
    useEffect(() => {
        // Suscribirse a eventos de materiales
        const handleMaterialCreated = (newMaterial: Material) => {
            console.log('🔄 Sincronizando nuevo material:', newMaterial.numero);
            
            setMateriales(current => {
                // Verificar si el material ya existe para evitar duplicados
                const exists = current.some(m => m.id === newMaterial.id);
                if (!exists) {
                    return [...current, newMaterial];
                }
                return current;
            });
        };

        const handleMaterialUpdated = (updatedMaterial: Material) => {
            console.log('🔄 Sincronizando material actualizado:', updatedMaterial.numero);
            
            setMateriales(current => 
                current.map(m => m.id === updatedMaterial.id ? updatedMaterial : m)
            );
        };

        const handleMaterialDeleted = (data: { materialId: number }) => {
            console.log('🔄 Sincronizando material eliminado:', data.materialId);
            
            setMateriales(current => current.filter(m => m.id !== data.materialId));
        };

        // Suscribirse a eventos Socket.IO
        const socket = webSocketService.getSocket();
        socket.on('material-created', handleMaterialCreated);
        socket.on('material-updated', handleMaterialUpdated);
        socket.on('material-deleted', handleMaterialDeleted);

        // Cleanup al desmontar
        return () => {
            socket.off('material-created', handleMaterialCreated);
            socket.off('material-updated', handleMaterialUpdated);
            socket.off('material-deleted', handleMaterialDeleted);
        };
    }, []);

    return {
        materiales,
        loading,
        error,
        fetchMateriales,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        getMaterialesByPedidoId,
        assignMaterialToPedido,
        unassignMaterialFromPedido,
    };
}
