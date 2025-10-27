import React, { useState, useEffect } from 'react';
import { Cliente } from '../hooks/useClientesManager';
import { Icons } from './Icons';

interface ClienteCardProps {
  cliente: Cliente;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
  onClick?: (cliente: Cliente) => void;
}

interface ClienteStats {
  pedidos_en_produccion: number;
  pedidos_completados: number;
  total_pedidos: number;
}

const ClienteCard: React.FC<ClienteCardProps> = ({ cliente, onEdit, onDelete, onClick }) => {
  const [stats, setStats] = useState<ClienteStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    fetchClienteStats();
  }, [cliente.id]);

  const fetchClienteStats = async () => {
    setIsLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('ClienteCard: no hay token de autenticación, omitiendo carga de estadísticas.');
        setStats(null);
        return;
      }
      const response = await fetch(`/api/clientes/${cliente.id}/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 401) {
        console.warn('ClienteCard: acceso no autorizado a /estadisticas. Verifica la sesión del usuario.');
        setStats(null);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setStats({
          pedidos_en_produccion: parseInt(data.pedidos_en_produccion || 0),
          pedidos_completados: parseInt(data.pedidos_completados || 0),
          total_pedidos: parseInt(data.total_pedidos || 0)
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas del cliente:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

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
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={handleCardClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate" title={cliente.nombre}>
              {cliente.nombre}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.razon_social || cliente.cif}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEditClick}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Editar cliente"
            >
              <Icons.Edit className="h-5 w-5" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-2 rounded-full text-gray-500 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label="Eliminar cliente"
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
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Icons.Contact className="h-4 w-4 mr-2 text-gray-400" />
            <span>{cliente.persona_contacto || 'No especificado'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Icons.Phone className="h-4 w-4 mr-2 text-gray-400" />
            <span>{cliente.telefono}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Icons.Email className="h-4 w-4 mr-2 text-gray-400" />
            <a 
              href={`mailto:${cliente.email}`} 
              className="hover:underline truncate" 
              title={cliente.email}
              onClick={(e) => e.stopPropagation()}
            >
              {cliente.email}
            </a>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Icons.Location className="h-4 w-4 mr-2 text-gray-400" />
            <span className="truncate" title={cliente.direccion}>{cliente.direccion}</span>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
        <div className="flex justify-between items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusChipColor(cliente.estado)}`}>
                {cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
            </span>
            <div className="flex items-center gap-2">
              {onClick && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Ver detalles →
                </span>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {cliente.id.slice(0, 8)}...
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteCard;
