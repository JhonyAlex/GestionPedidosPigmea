import React, { useState } from 'react';
import { Pedido } from '../types';

interface BulkArchiveConfirmationModalProps {
  isOpen: boolean;
  pedidos: Pedido[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const ArchiveBoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
);

const BulkArchiveConfirmationModal: React.FC<BulkArchiveConfirmationModalProps> = ({
  isOpen,
  pedidos,
  onConfirm,
  onCancel,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  if (!isOpen) return null;

  const isConfirmEnabled = confirmText.trim().toUpperCase() === 'ARCHIVAR';

  const handleConfirm = async () => {
    if (!isConfirmEnabled || isArchiving) return;
    
    setIsArchiving(true);
    try {
      await onConfirm();
      setConfirmText('');
    } finally {
      setIsArchiving(false);
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
        <div className="bg-purple-500 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ArchiveBoxIcon />
            Confirmar Archivo Masivo
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-2">
              Estás a punto de <span className="font-bold text-purple-600 dark:text-purple-400">archivar</span> los siguientes {pedidos.length} pedidos:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Los pedidos archivados no aparecerán en las vistas principales pero podrás consultarlos en la sección de archivados.
            </p>
          </div>

          {/* Lista de pedidos */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
            <ul className="space-y-2">
              {pedidos.map((pedido) => (
                <li key={pedido.id} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></span>
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
              Para confirmar, escribe <span className="font-mono font-bold text-purple-600 dark:text-purple-400">ARCHIVAR</span> en el campo de abajo:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe ARCHIVAR"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white font-mono"
              disabled={isArchiving}
              autoFocus
            />
          </div>

          {/* Advertencia final */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 mb-6">
            <p className="text-sm text-purple-800 dark:text-purple-300">
              <strong>Nota:</strong> Esta acción se puede revertir. Puedes desarchivar los pedidos desde la vista de archivados si es necesario.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isArchiving}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isArchiving}
            className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isArchiving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Archivando...
              </>
            ) : (
              <>Archivar {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkArchiveConfirmationModal;
