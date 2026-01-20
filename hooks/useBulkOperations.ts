import { useState, useCallback } from 'react';
import { Pedido } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface UseBulkOperationsReturn {
  selectedIds: string[];
  isSelectionActive: boolean;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
  bulkDelete: (ids: string[]) => Promise<{ success: boolean; deletedCount: number; error?: string }>;
  bulkUpdateDate: (ids: string[], nuevaFechaEntrega: string) => Promise<{ success: boolean; updatedCount: number; error?: string }>;
  bulkUpdateMachine: (ids: string[], maquinaImpresion: string) => Promise<{ success: boolean; updatedCount: number; error?: string }>;
  bulkArchive: (ids: string[], archived?: boolean) => Promise<{ success: boolean; updatedCount: number; error?: string }>;
}

export const useBulkOperations = (): UseBulkOperationsReturn => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSelectionActive = selectedIds.length > 0;

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const bulkDelete = useCallback(async (ids: string[]): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
    try {
      // Obtener usuario del localStorage para enviar en headers
      const userString = localStorage.getItem('pigmea_user');
      const user = userString ? JSON.parse(userString) : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Agregar headers de autenticación si hay usuario
      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-role'] = user.role;
      }
      
      const response = await fetch(`${API_URL}/pedidos/bulk-delete`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ ids }),
        credentials: 'include',
      });

      if (response.status === 401) {
        throw new Error('No autenticado. Por favor, inicia sesión nuevamente.');
      }

      if (response.status === 403) {
        throw new Error('No tienes permisos para realizar esta operación.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error del servidor' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Limpiar selección después de eliminar
      clearSelection();
      
      return {
        success: true,
        deletedCount: data.deletedCount || ids.length,
      };
    } catch (error) {
      console.error('Error en bulkDelete:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }, [clearSelection]);

  const bulkUpdateDate = useCallback(async (
    ids: string[],
    nuevaFechaEntrega: string
  ): Promise<{ success: boolean; updatedCount: number; error?: string }> => {
    try {
      console.log('🔵 bulkUpdateDate - IDs a actualizar:', ids);
      console.log('🔵 bulkUpdateDate - Nueva fecha:', nuevaFechaEntrega);
      console.log('🔵 bulkUpdateDate - Total de IDs:', ids.length);
      
      // Obtener usuario del localStorage para enviar en headers
      const userString = localStorage.getItem('pigmea_user');
      const user = userString ? JSON.parse(userString) : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Agregar headers de autenticación si hay usuario
      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-role'] = user.role;
        console.log('🔵 bulkUpdateDate - Usuario:', user.id, user.role);
      }
      
      console.log('🔵 bulkUpdateDate - Enviando petición...');
      
      const response = await fetch(`${API_URL}/pedidos/bulk-update-date`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ids, nuevaFechaEntrega: String(nuevaFechaEntrega) }),
        credentials: 'include',
      });

      if (response.status === 401) {
        throw new Error('No autenticado. Por favor, inicia sesión nuevamente.');
      }

      if (response.status === 403) {
        throw new Error('No tienes permisos para realizar esta operación.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error del servidor' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const data = await response.json();
      
      console.log('🔵 bulkUpdateDate - Respuesta del servidor:', data);
      
      // Limpiar selección después de actualizar
      clearSelection();
      
      return {
        success: true,
        updatedCount: data.updatedCount || ids.length,
      };
    } catch (error) {
      console.error('Error en bulkUpdateDate:', error);
      return {
        success: false,
        updatedCount: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }, [clearSelection]);

  const bulkUpdateMachine = useCallback(async (
    ids: string[],
    maquinaImpresion: string
  ): Promise<{ success: boolean; updatedCount: number; error?: string }> => {
    try {
      console.log('🏭 bulkUpdateMachine - IDs a actualizar:', ids);
      console.log('🏭 bulkUpdateMachine - Nueva máquina:', maquinaImpresion);
      console.log('🏭 bulkUpdateMachine - Total de IDs:', ids.length);
      
      // Obtener usuario del localStorage para enviar en headers
      const userString = localStorage.getItem('pigmea_user');
      const user = userString ? JSON.parse(userString) : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Agregar headers de autenticación si hay usuario
      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-role'] = user.role;
        console.log('🏭 bulkUpdateMachine - Usuario:', user.id, user.role);
      }
      
      console.log('🏭 bulkUpdateMachine - Enviando petición...');
      
      const response = await fetch(`${API_URL}/pedidos/bulk-update-machine`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ids, maquinaImpresion }),
        credentials: 'include',
      });

      if (response.status === 401) {
        throw new Error('No autenticado. Por favor, inicia sesión nuevamente.');
      }

      if (response.status === 403) {
        throw new Error('No tienes permisos para realizar esta operación.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error del servidor' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const data = await response.json();
      
      console.log('🏭 bulkUpdateMachine - Respuesta del servidor:', data);
      
      // Limpiar selección después de actualizar
      clearSelection();
      
      return {
        success: true,
        updatedCount: data.updatedCount || ids.length,
      };
    } catch (error) {
      console.error('Error en bulkUpdateMachine:', error);
      return {
        success: false,
        updatedCount: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }, [clearSelection]);

  const bulkArchive = useCallback(async (
    ids: string[],
    archived: boolean = true
  ): Promise<{ success: boolean; updatedCount: number; error?: string }> => {
    try {
      console.log('📦 bulkArchive - IDs a archivar:', ids);
      console.log('📦 bulkArchive - Archivar:', archived);
      console.log('📦 bulkArchive - Total de IDs:', ids.length);
      
      // Obtener usuario del localStorage para enviar en headers
      const userString = localStorage.getItem('pigmea_user');
      const user = userString ? JSON.parse(userString) : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Agregar headers de autenticación si hay usuario
      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-role'] = user.role;
        console.log('📦 bulkArchive - Usuario:', user.id, user.role);
      }
      
      console.log('📦 bulkArchive - Enviando petición...');
      
      const response = await fetch(`${API_URL}/pedidos/bulk-archive`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ids, archived }),
        credentials: 'include',
      });

      if (response.status === 401) {
        throw new Error('No autenticado. Por favor, inicia sesión nuevamente.');
      }

      if (response.status === 403) {
        throw new Error('No tienes permisos para realizar esta operación.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error del servidor' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const data = await response.json();
      
      console.log('📦 bulkArchive - Respuesta del servidor:', data);
      
      // Limpiar selección después de archivar
      clearSelection();
      
      return {
        success: true,
        updatedCount: data.updatedCount || ids.length,
      };
    } catch (error) {
      console.error('Error en bulkArchive:', error);
      return {
        success: false,
        updatedCount: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }, [clearSelection]);

  return {
    selectedIds,
    isSelectionActive,
    toggleSelection,
    clearSelection,
    selectAll,
    bulkDelete,
    bulkUpdateDate,
    bulkUpdateMachine,
    bulkArchive,
  };
};
