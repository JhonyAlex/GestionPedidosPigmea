import React, { useState } from 'react';
import { OperacionActivaCompleta } from '../types';

interface ModalCompletarOperacionProps {
    operacion: OperacionActivaCompleta;
    onConfirmar: (metrosProducidos: number, observaciones?: string) => void;
    onCancelar: () => void;
}

export function ModalCompletarOperacion({ operacion, onConfirmar, onCancelar }: ModalCompletarOperacionProps) {
    const [metrosProducidos, setMetrosProducidos] = useState(
        String(operacion.metrosObjetivo || operacion.metrosTotalesPedido)
    );
    const [observaciones, setObservaciones] = useState('');
    const [error, setError] = useState('');

    const handleConfirmar = () => {
        const metros = parseFloat(metrosProducidos);
        
        if (isNaN(metros) || metros <= 0) {
            setError('Por favor ingresa una cantidad válida de metros');
            return;
        }

        if (metros > operacion.metrosTotalesPedido) {
            setError(`No puedes producir más de ${operacion.metrosTotalesPedido}m`);
            return;
        }

        onConfirmar(metros, observaciones || undefined);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        ✅ Completar Operación
                    </h2>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-6">
                    {/* Resumen de la operación */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                            {operacion.numeroPedidoCliente}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{operacion.cliente}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Máquina:</span>
                                <span className="ml-2 font-semibold">{operacion.maquina}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Tiempo:</span>
                                <span className="ml-2 font-semibold">{operacion.tiempoTranscurridoFormateado}</span>
                            </div>
                        </div>
                    </div>

                    {/* Input de metros producidos */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Metros Producidos <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={metrosProducidos}
                                onChange={(e) => {
                                    setMetrosProducidos(e.target.value);
                                    setError('');
                                }}
                                step="0.01"
                                min="0"
                                max={operacion.metrosTotalesPedido}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg 
                                    focus:ring-2 focus:ring-green-500 focus:border-transparent
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold"
                                placeholder="0.00"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                                m
                            </span>
                        </div>
                        {error && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                        )}
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Total del pedido: <strong>{operacion.metrosTotalesPedido}m</strong>
                        </p>
                    </div>

                    {/* Cálculo rápido de metros restantes */}
                    {metrosProducidos && !isNaN(parseFloat(metrosProducidos)) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">Metros restantes después de esta operación:</span>
                                <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                                    {Math.max(0, operacion.metrosTotalesPedido - parseFloat(metrosProducidos)).toFixed(2)}m
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Observaciones opcionales */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Observaciones (opcional)
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Agrega observaciones sobre la calidad, problemas encontrados, etc..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                focus:ring-2 focus:ring-green-500 focus:border-transparent
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>

                    {/* Advertencia si no completó todos los metros */}
                    {metrosProducidos && parseFloat(metrosProducidos) < operacion.metrosTotalesPedido && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
                                <div>
                                    <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                                        Producción parcial
                                    </p>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        El pedido quedará disponible para continuar la producción más tarde.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
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
                        disabled={!metrosProducidos || parseFloat(metrosProducidos) <= 0}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all transform active:scale-95
                            ${metrosProducidos && parseFloat(metrosProducidos) > 0
                                ? 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        ✅ Completar Operación
                    </button>
                </div>
            </div>
        </div>
    );
}
