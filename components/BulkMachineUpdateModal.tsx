import React, { useState } from 'react';
import { Pedido } from '../types';
import { MAQUINAS_IMPRESION } from '../constants';

interface BulkMachineUpdateModalProps {
  isOpen: boolean;
  pedidos: Pedido[];
  onConfirm: (nuevaMaquina: string) => Promise<void>;
  onCancel: () => void;
}

const MachineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
  </svg>
);

const BulkMachineUpdateModal: React.FC<BulkMachineUpdateModalProps> = ({
  isOpen,
  pedidos,
  onConfirm,
  onCancel,
}) => {
  const [nuevaMaquina, setNuevaMaquina] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!nuevaMaquina || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onConfirm(nuevaMaquina);
      setNuevaMaquina('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setNuevaMaquina('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-500 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <MachineIcon />
            Actualizar Máquina de Impresión
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
              Actualizar el campo <span className="font-bold text-blue-600 dark:text-blue-400">"Máquina de Impresión"</span> para {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}:
            </p>
          </div>

          {/* Machine Select */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-2 border-blue-300 dark:border-blue-700">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-3 text-lg">
              Nueva Máquina:
            </label>
            <select
              value={nuevaMaquina}
              onChange={(e) => setNuevaMaquina(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
              disabled={isUpdating}
            >
              <option value="">Selecciona una máquina...</option>
              {MAQUINAS_IMPRESION.map((maquina) => (
                <option key={maquina.id} value={maquina.id}>
                  {maquina.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Table */}
          <div className="mb-6">
            <h3 className="text-gray-800 dark:text-gray-200 font-semibold mb-3 text-lg">
              Pedidos que serán actualizados:
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="max-h-80 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nº Pedido
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Máquina Actual
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nueva Máquina
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {pedido.numeroPedidoCliente}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {pedido.cliente}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {pedido.maquinaImpresion || 'Sin asignar'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {nuevaMaquina ? (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {MAQUINAS_IMPRESION.find(m => m.id === nuevaMaquina)?.nombre || nuevaMaquina}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 italic">
                              Selecciona máquina
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Info notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              ℹ️ Esta acción actualizará el campo "Máquina de Impresión" de todos los pedidos seleccionados y se registrará en el historial de cada pedido.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!nuevaMaquina || isUpdating}
            className={`px-6 py-2 rounded-lg font-bold transition-colors duration-200 ${
              nuevaMaquina && !isUpdating
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUpdating ? 'Actualizando...' : 'Actualizar Máquinas'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkMachineUpdateModal;
