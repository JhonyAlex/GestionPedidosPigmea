import React, { useState } from 'react';
import { Pedido } from '../types';
import { formatDateDDMMYYYY } from '../utils/date';

interface BulkDateUpdateModalProps {
  isOpen: boolean;
  pedidos: Pedido[];
  onConfirm: (nuevaFecha: string) => Promise<void>;
  onCancel: () => void;
}

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" />
  </svg>
);

const BulkDateUpdateModal: React.FC<BulkDateUpdateModalProps> = ({
  isOpen,
  pedidos,
  onConfirm,
  onCancel,
}) => {
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!nuevaFecha || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onConfirm(nuevaFecha);
      setNuevaFecha('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setNuevaFecha('');
    onCancel();
  };

  // Obtener la fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-500 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <CalendarIcon />
            Actualizar Nueva Fecha de Entrega
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
              Actualizar el campo <span className="font-bold text-blue-600 dark:text-blue-400">"Nueva Fecha Entrega"</span> para {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}:
            </p>
          </div>

          {/* Date Picker */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-2 border-blue-300 dark:border-blue-700">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-3 text-lg">
              Nueva Fecha de Entrega:
            </label>
            <input
              type="date"
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              min={today}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
              disabled={isUpdating}
            />
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
                        Fecha Actual
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nueva Fecha
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
                          {pedido.nuevaFechaEntrega ? formatDateDDMMYYYY(pedido.nuevaFechaEntrega) : formatDateDDMMYYYY(pedido.fechaEntrega)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {nuevaFecha ? (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {formatDateDDMMYYYY(nuevaFecha)}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 italic">
                              Selecciona fecha
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
              ℹ️ Esta acción actualizará el campo "Nueva Fecha Entrega" de todos los pedidos seleccionados y se registrará en el historial de cada pedido.
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
            disabled={!nuevaFecha || isUpdating}
            className={`px-6 py-2 rounded-lg font-bold transition-colors duration-200 ${
              nuevaFecha && !isUpdating
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUpdating ? 'Actualizando...' : 'Actualizar Fechas'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDateUpdateModal;
