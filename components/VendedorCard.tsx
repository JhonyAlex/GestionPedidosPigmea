import React, { useState, useEffect } from 'react';
import { Vendedor } from '../types/vendedor';
import { Icons } from './Icons';
import { formatDateDDMMYYYY } from '../utils/date';

interface VendedorCardProps {
  vendedor: Vendedor;
  onEdit: (vendedor: Vendedor) => void;
  onDelete: (vendedor: Vendedor) => void;
  onClick?: (vendedor: Vendedor) => void;
}

interface VendedorStats {
  pedidos_en_produccion: number;
  pedidos_completados: number;
  total_pedidos: number;
}

const VendedorCard: React.FC<VendedorCardProps> = ({ vendedor, onEdit, onDelete, onClick }) => {
  const [stats, setStats] = useState<VendedorStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetchVendedorStats();
  }, [vendedor.id]);

  const fetchVendedorStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch(`${API_URL}/vendedores/${vendedor.id}/estadisticas`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      
      const data = await response.json();
      setStats({
        pedidos_en_produccion: parseInt(data.pedidos_en_produccion || 0),
        pedidos_completados: parseInt(data.pedidos_completados || 0),
        total_pedidos: parseInt(data.total_pedidos || 0)
      });
    } catch (error) {
      console.error('Error al cargar estadísticas del vendedor:', error);
      setStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const getStatusChipColor = (activo: boolean) => {
    return activo
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // No ejecutar onClick si se clickeó en un botón de acción
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onClick) {
      onClick(vendedor);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(vendedor);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(vendedor);
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={handleCardClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate" title={vendedor.nombre}>
              {vendedor.nombre}
            </h3>
            <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipColor(vendedor.activo)}`}>
              {vendedor.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEditClick}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Editar vendedor"
            >
              <Icons.Edit className="h-5 w-5" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-2 rounded-full text-gray-500 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label="Eliminar vendedor"
            >
              <Icons.Trash className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Indicadores de pedidos */}
        {stats && !isLoadingStats && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.pedidos_en_produccion > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {stats.pedidos_en_produccion} en producción
                </span>
              </div>
            )}
            {stats.pedidos_completados > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/30 rounded-full">
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  {stats.pedidos_completados} completados
                </span>
              </div>
            )}
            {stats.total_pedidos === 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 dark:bg-gray-700/30 rounded-full">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Sin pedidos
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {vendedor.email && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Icons.Email className="h-4 w-4 mr-2 text-gray-400" />
              <a 
                href={`mailto:${vendedor.email}`} 
                className="hover:underline truncate" 
                title={vendedor.email}
                onClick={(e) => e.stopPropagation()}
              >
                {vendedor.email}
              </a>
            </div>
          )}
          {vendedor.telefono && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Icons.Phone className="h-4 w-4 mr-2 text-gray-400" />
              <span>{vendedor.telefono}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
        Creado: {formatDateDDMMYYYY(vendedor.createdAt)}
      </div>
    </div>
  );
};

export default VendedorCard;
