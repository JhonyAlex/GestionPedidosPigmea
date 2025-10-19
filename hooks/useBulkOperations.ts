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
      const response = await fetch(`${API_URL}/pedidos/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${API_URL}/pedidos/bulk-update-date`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, nuevaFechaEntrega }),
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

  return {
    selectedIds,
    isSelectionActive,
    toggleSelection,
    clearSelection,
    selectAll,
    bulkDelete,
    bulkUpdateDate,
  };
};
