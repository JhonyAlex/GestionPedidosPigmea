import React from 'react';
import { Edit, Trash2, Eye, User, Phone, Mail } from 'lucide-react';
import { Cliente } from '../../types/cliente';
import { useCliente } from '../../contexts/ClienteContext';

interface ClienteCardProps {
  cliente: Cliente;
  onSelect: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
}

const ClienteCard: React.FC<ClienteCardProps> = ({ cliente, onSelect, onEdit, onDelete }) => {
  const { hasPermission } = useCliente();

  const statusColor = cliente.estado === 'activo' ? 'border-green-500' : 'border-red-500';
  const statusBgColor = cliente.estado === 'activo' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(cliente);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(cliente);
  };

  return (
    <div
      onClick={() => onSelect(cliente)}
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border-l-4 ${statusColor}`}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">{cliente.nombre}</h3>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBgColor}`}>
          {cliente.estado}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        {cliente.contactoPrincipal && (
          <div className="flex items-center">
            <User size={14} className="mr-2 flex-shrink-0" />
            <span>{cliente.contactoPrincipal}</span>
          </div>
        )}
        {cliente.telefono && (
          <div className="flex items-center">
            <Phone size={14} className="mr-2 flex-shrink-0" />
            <span>{cliente.telefono}</span>
          </div>
        )}
        {cliente.email && (
          <div className="flex items-center">
            <Mail size={14} className="mr-2 flex-shrink-0" />
            <span className="truncate">{cliente.email}</span>
          </div>
        )}
      </div>

      <div className="flex justify-end items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 space-x-2">
        <button
          onClick={() => onSelect(cliente)}
          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          title="Ver Detalles"
        >
          <Eye size={18} />
        </button>
        {hasPermission('clientes.edit') && (
          <button
            onClick={handleEdit}
            className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
            title="Editar Cliente"
          >
            <Edit size={18} />
          </button>
        )}
        {hasPermission('clientes.delete') && (
          <button
            onClick={handleDelete}
            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            title="Eliminar Cliente"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ClienteCard;
