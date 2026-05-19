import React, { useState } from 'react';
import { Pedido, EstadoCliché } from '../types';

interface BulkClicheUpdateModalProps {
  isOpen: boolean;
  pedidos: Pedido[];
  onConfirm: (clicheDisponible: boolean, estadoCliche?: EstadoCliché) => Promise<void>;
  onCancel: () => void;
}

const BulkClicheUpdateModal: React.FC<BulkClicheUpdateModalProps> = ({
  isOpen,
  pedidos,
  onConfirm,
  onCancel,
}) => {
  const [clicheDisponible, setClicheDisponible] = useState<boolean | ''>('');
  const [estadoCliché, setEstadoCliché] = useState<EstadoCliché | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (clicheDisponible === '' || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onConfirm(clicheDisponible as boolean, estadoCliché || undefined);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setClicheDisponible('');
    setEstadoCliché('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-amber-500 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Actualizar Estado de Cliché</h2>
          <p className="text-sm text-amber-100 mt-1">Actualizar el estado de cliché para {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}.</p>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-2 border-amber-300 dark:border-amber-700">
            <label className="block text-amber-900 dark:text-amber-200 font-semibold mb-3">Cliché Disponible</label>
            <div className="flex gap-4">
              <button
                onClick={() => setClicheDisponible(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  clicheDisponible === true
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-green-400'
                }`}
              >
                ✓ Sí Disponible
              </button>
              <button
                onClick={() => setClicheDisponible(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  clicheDisponible === false
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-red-400'
                }`}
              >
                ✗ No Disponible
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-3">Estado del Cliché</label>
            <select
              value={estadoCliché}
              onChange={(e) => setEstadoCliché(e.target.value as EstadoCliché)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Sin cambiar estado</option>
              {Object.values(EstadoCliché).map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Pedidos afectados</p>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº Pedido</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliché Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">{pedido.numeroPedidoCliente}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{pedido.cliente}</td>
                      <td className="px-4 py-2 text-sm">
                        {pedido.clicheDisponible ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">✓ Disponible</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            ✗ {pedido.estadoCliché || 'No disponible'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded">
            <p className="text-amber-800 dark:text-amber-300 text-sm">
              Esta acción actualizará el estado de cliché de todos los pedidos seleccionados y se registrará en el historial.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={clicheDisponible === '' || isUpdating}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${
              clicheDisponible !== '' && !isUpdating
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUpdating ? 'Actualizando...' : 'Actualizar Cliché'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkClicheUpdateModal;
