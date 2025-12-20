import React, { useState } from 'react';
import { Cliente } from '../hooks/useClientesManager';
import { Icons } from './Icons';

interface ClienteCardProps {
  cliente: Cliente;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
  onClick?: (cliente: Cliente) => void;
  stats?: ClienteStats | null; // 🚀 NUEVO: Recibir stats como prop
  isLoadingStats?: boolean; // 🚀 NUEVO: Estado de carga externo
}

interface ClienteStats {
  pedidos_en_produccion: number;
  pedidos_completados: number;
  total_pedidos: number;
}

const ClienteCard: React.FC<ClienteCardProps> = ({ 
  cliente, 
  onEdit, 
  onDelete, 
  onClick, 
  stats: externalStats, 
  isLoadingStats: externalLoading 
}) => {
  // ⚠️ Ya no necesitamos estado local ni useEffect para stats
  const stats = externalStats || null;
  const isLoadingStats = externalLoading || false;

  const getStatusChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'activo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactivo':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'archivado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // No ejecutar onClick si se clickeó en un botón de acción
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onClick) {
      onClick(cliente);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(cliente);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(cliente);
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      {/* Header con nombre y botones de acción */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-3">
          {/* Avatar/Icono del cliente */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          
          {/* Nombre y razón social */}
          <div className="flex-grow min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1" title={cliente.nombre}>
              {cliente.nombre}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={cliente.razon_social || cliente.cif}>
              {cliente.razon_social || cliente.cif}
            </p>
          </div>
          
          {/* Botones de acción - siempre visibles */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <button
              onClick={handleEditClick}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Editar cliente"
              title="Editar cliente"
            >
              <Icons.Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Eliminar cliente"
              title="Eliminar cliente"
            >
              <Icons.Trash className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas de pedidos */}
      {stats && !isLoadingStats && (
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {stats.pedidos_en_produccion > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {stats.pedidos_en_produccion} en producción
                </span>
              </div>
            )}
            {stats.pedidos_completados > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Icons.Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                  {stats.pedidos_completados} completados
                </span>
              </div>
            )}
            {stats.total_pedidos === 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Sin pedidos registrados
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información de contacto */}
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Icons.Contact className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Persona de contacto</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={cliente.persona_contacto || 'No especificado'}>
              {cliente.persona_contacto || 'No especificado'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Icons.Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Teléfono</p>
            <a 
              href={`tel:${cliente.telefono}`}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
              onClick={(e) => e.stopPropagation()}
              title={cliente.telefono}
            >
              {cliente.telefono}
            </a>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Icons.Email className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
            <a 
              href={`mailto:${cliente.email}`} 
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block" 
              title={cliente.email}
              onClick={(e) => e.stopPropagation()}
            >
              {cliente.email}
            </a>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Icons.Location className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Dirección</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2" title={cliente.direccion}>
              {cliente.direccion}
            </p>
          </div>
        </div>
      </div>

      {/* Footer con estado e ID */}
      <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getStatusChipColor(cliente.estado)}`}>
            {cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
          </span>
          <div className="flex items-center gap-3">
            {onClick && (
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                Ver detalles
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              #{cliente.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteCard;
