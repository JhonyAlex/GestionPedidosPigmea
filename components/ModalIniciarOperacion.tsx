import React, { useState } from 'react';
import { PedidoConProduccion } from '../types';
import { formatMetros } from '../utils/date';

interface Maquina {
    id: string;
    nombre: string;
    icon: string;
}

interface ModalIniciarOperacionProps {
    pedido: PedidoConProduccion;
    maquinas: Maquina[];
    onConfirmar: (maquina: string, observaciones?: string) => void;
    onCancelar: () => void;
}

export function ModalIniciarOperacion({ pedido, maquinas, onConfirmar, onCancelar }: ModalIniciarOperacionProps) {
    const [maquinaSeleccionada, setMaquinaSeleccionada] = useState('');
    const [observaciones, setObservaciones] = useState('');

    const handleConfirmar = () => {
        if (!maquinaSeleccionada) {
            alert('Por favor selecciona una máquina');
            return;
        }
        onConfirmar(maquinaSeleccionada, observaciones || undefined);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        ▶️ Iniciar Operación
                    </h2>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-6">
                    {/* Información del pedido */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                            {pedido.numeroPedidoCliente}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">{pedido.cliente}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Metros:</span>
                                <span className="ml-2 font-semibold">{formatMetros(pedido.metros)} m</span>
                            </div>
                            {pedido.producto && (
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Producto:</span>
                                    <span className="ml-2 font-semibold">{pedido.producto}</span>
                                </div>
                            )}
                            {pedido.colores && (
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Colores:</span>
                                    <span className="ml-2 font-semibold">{pedido.colores}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selección de máquina */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Selecciona la Máquina <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {maquinas.map(maquina => (
                                <button
                                    key={maquina.id}
                                    type="button"
                                    onClick={() => setMaquinaSeleccionada(maquina.id)}
                                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                                        maquinaSeleccionada === maquina.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{maquina.icon}</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {maquina.nombre}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Observaciones opcionales */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Observaciones (opcional)
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Agrega cualquier observación relevante..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                </div>

                {/* Footer con botones */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
                    <button
                        onClick={onCancelar}
                        className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 
                            text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmar}
                        disabled={!maquinaSeleccionada}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all transform active:scale-95
                            ${maquinaSeleccionada
                                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        ▶️ Iniciar Operación
                    </button>
                </div>
            </div>
        </div>
    );
}
