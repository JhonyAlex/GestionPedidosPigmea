import React, { useState } from 'react';
import { Pedido } from '../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  pedidos: Pedido[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const ExclamationTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  pedidos,
  onConfirm,
  onCancel,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const isConfirmEnabled = confirmText.trim().toUpperCase() === 'ELIMINAR';

  const handleConfirm = async () => {
    if (!isConfirmEnabled || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onConfirm();
      setConfirmText('');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-500 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ExclamationTriangleIcon />
            Confirmar Eliminación Masiva
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-2">
              Estás a punto de <span className="font-bold text-red-600 dark:text-red-400">eliminar permanentemente</span> los siguientes {pedidos.length} pedidos:
            </p>
          </div>

          {/* Lista de pedidos */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
            <ul className="space-y-2">
              {pedidos.map((pedido) => (
                <li key={pedido.id} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {pedido.numeroPedidoCliente}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">-</span>
                  <span className="text-gray-600 dark:text-gray-400">{pedido.cliente}</span>
                  <span className="text-gray-500 dark:text-gray-500 text-xs ml-auto">
                    {pedido.etapaActual}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Confirmación de texto */}
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Para confirmar, escribe <span className="font-mono font-bold text-red-600 dark:text-red-400">ELIMINAR</span> en el campo de abajo:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe ELIMINAR"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white font-mono"
              disabled={isDeleting}
            />
          </div>

          {/* Advertencia final */}
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-800 dark:text-red-300 text-sm font-medium">
              ⚠️ Esta acción no se puede deshacer. Los pedidos y toda su información serán eliminados permanentemente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isDeleting}
            className={`px-6 py-2 rounded-lg font-bold transition-colors duration-200 ${
              isConfirmEnabled && !isDeleting
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar Pedidos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
