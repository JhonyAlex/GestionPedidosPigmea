import React from 'react';
import { Pedido } from '../types';
import { ETAPAS } from '../constants';

interface GlobalSearchDropdownProps {
    searchTerm: string;
    results: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    maxResults?: number;
}

const GlobalSearchDropdown: React.FC<GlobalSearchDropdownProps> = ({
    searchTerm,
    results,
    onSelectPedido,
    maxResults = 10
}) => {
    // No mostrar dropdown si no hay término de búsqueda
    if (!searchTerm || searchTerm.trim().length === 0) {
        return null;
    }

    // Limitar resultados
    const displayResults = results.slice(0, maxResults);
    const hasMoreResults = results.length > maxResults;

    if (displayResults.length === 0) {
        return (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No se encontraron pedidos
                </div>
            </div>
        );
    }

    return (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-96 overflow-y-auto">
            <div className="py-1">
                {displayResults.map((pedido) => (
                    <button
                        key={pedido.id}
                        onClick={() => onSelectPedido(pedido)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                        <div className="flex flex-col gap-1">
                            {/* Primera línea: Número de pedido y etapa */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {pedido.numeroPedidoCliente}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                        {pedido.numeroRegistro}
                                    </span>
                                </div>
                                <span 
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium text-white ${ETAPAS[pedido.etapaActual]?.color || 'bg-gray-500'}`}
                                >
                                    {ETAPAS[pedido.etapaActual]?.title || pedido.etapaActual}
                                </span>
                            </div>

                            {/* Segunda línea: Cliente */}
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Cliente:</span> {pedido.cliente}
                            </div>

                            {/* Tercera línea: Vendedor y Metros */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                {pedido.vendedorNombre && (
                                    <div>
                                        <span className="font-medium">Vendedor:</span> {pedido.vendedorNombre}
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium">Metros:</span> {pedido.metros.toLocaleString()}
                                </div>
                            </div>

                            {/* Cuarta línea: Fechas */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                                {pedido.fechaEntrega && (
                                    <div>
                                        <span className="font-medium">F. Entrega:</span>{' '}
                                        {new Date(pedido.fechaEntrega).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </div>
                                )}
                                {pedido.nuevaFechaEntrega && (
                                    <div className="text-orange-600 dark:text-orange-400">
                                        <span className="font-medium">Nueva F. Entrega:</span>{' '}
                                        {new Date(pedido.nuevaFechaEntrega).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Mostrar si hay más resultados */}
            {hasMoreResults && (
                <div className="px-4 py-2 text-xs text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    Mostrando {displayResults.length} de {results.length} resultados
                </div>
            )}
        </div>
    );
};

export default GlobalSearchDropdown;
