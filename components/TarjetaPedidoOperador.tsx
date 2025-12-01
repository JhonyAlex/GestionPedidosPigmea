import React from 'react';
import { PedidoConProduccion, Prioridad } from '../types';

interface TarjetaPedidoOperadorProps {
    pedido: PedidoConProduccion;
    onIniciar: () => void;
    disabled?: boolean;
}

export function TarjetaPedidoOperador({ pedido, onIniciar, disabled }: TarjetaPedidoOperadorProps) {
    const getPrioridadColor = (prioridad: Prioridad) => {
        switch (prioridad) {
            case 'Urgente':
                return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700';
            case 'Alta':
                return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700';
            case 'Normal':
                return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700';
            case 'Baja':
                return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700/30 dark:text-gray-200 dark:border-gray-600';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const metrosRestantes = pedido.metrosRestantes || pedido.metros;
    const porcentaje = pedido.porcentajeCompletado || 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
            {/* Header con número de pedido y prioridad */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                        {pedido.numeroPedidoCliente}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-1">
                        {pedido.cliente}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPrioridadColor(pedido.prioridad)}`}>
                    {pedido.prioridad}
                </span>
            </div>

            {/* Información clave del pedido */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Metros</p>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                        {Number(metrosRestantes).toFixed(0)}m
                    </p>
                    {porcentaje > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                            {porcentaje.toFixed(0)}% completado
                        </p>
                    )}
                </div>
                
                {pedido.producto && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Producto</p>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                            {pedido.producto}
                        </p>
                    </div>
                )}
            </div>

            {/* Detalles adicionales */}
            <div className="space-y-2 mb-4">
                {pedido.colores && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">🎨</span>
                        <span className="text-gray-700 dark:text-gray-300">
                            {pedido.colores} {pedido.colores === 1 ? 'color' : 'colores'}
                        </span>
                    </div>
                )}
                
                {pedido.fechaEntrega && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">📅</span>
                        <span className="text-gray-700 dark:text-gray-300">
                            Entrega: {new Date(pedido.fechaEntrega).toLocaleDateString('es-ES')}
                        </span>
                    </div>
                )}

                {pedido.tiempoProduccionPlanificado && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">⏱️</span>
                        <span className="text-gray-700 dark:text-gray-300">
                            Tiempo: {pedido.tiempoProduccionPlanificado}
                        </span>
                    </div>
                )}
            </div>

            {/* Barra de progreso si hay metros producidos */}
            {porcentaje > 0 && (
                <div className="mb-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Observaciones si existen */}
            {pedido.observaciones && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 line-clamp-2">
                        💬 {pedido.observaciones}
                    </p>
                </div>
            )}

            {/* Botón de iniciar operación */}
            <button
                onClick={onIniciar}
                disabled={disabled}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all transform active:scale-95 
                    ${disabled 
                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
            >
                {disabled ? '🔒 Ya tienes una operación activa' : '▶️ Iniciar Operación'}
            </button>
        </div>
    );
}
