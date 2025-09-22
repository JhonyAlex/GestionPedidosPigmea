import React from 'react';
import { Cliente } from '../hooks/useClientesManager';
import { Icons } from './Icons';

interface ClienteCardProps {
  cliente: Cliente;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
}

const ClienteCard: React.FC<ClienteCardProps> = ({ cliente, onEdit, onDelete }) => {
  const getStatusChipColor = (status: string) => {
    switch (status) {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
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
              onClick={() => onEdit(cliente)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Editar cliente"
            >
              <Icons.Edit className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(cliente)}
              className="p-2 rounded-full text-gray-500 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label="Eliminar cliente"
            >
              <Icons.Trash className="h-5 w-5" />
            </button>
          </div>
        </div>

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
            <a href={`mailto:${cliente.email}`} className="hover:underline truncate" title={cliente.email}>
              {cliente.email}
            </a>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Icons.Location className="h-4 w-4 mr-2 text-gray-400" />
            <span className="truncate" title={cliente.direccion}>{cliente.direccion}</span>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-2">
        <div className="flex justify-between items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusChipColor(cliente.estado)}`}>
                {cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                ID: {cliente.id.slice(0, 8)}...
            </p>
        </div>
      </div>
    </div>
  );
};

export default ClienteCard;
