import React from 'react';
import { Pedido } from '../types';
import { ETAPAS } from '../constants';

interface GlobalSearchDropdownProps {
    searchTerm: string;
    results: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    onClose: () => void;
    maxResults?: number;
}

const GlobalSearchDropdown: React.FC<GlobalSearchDropdownProps> = ({
    searchTerm,
    results,
    onSelectPedido,
    onClose,
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
            <>
                {/* Overlay de fondo */}
                <div 
                    className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" 
                    onClick={onClose}
                />
                
                {/* Dropdown */}
                <div className="fixed inset-x-4 top-20 z-50 max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl">
                    <div className="px-6 py-4 text-base text-gray-500 dark:text-gray-400 text-center">
                        No se encontraron pedidos
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Overlay de fondo */}
            <div 
                className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" 
                onClick={onClose}
            />
            
            {/* Dropdown */}
            <div className="fixed inset-x-4 top-20 z-50 max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="py-2">
                    {displayResults.map((pedido) => (
                        <button
                            key={pedido.id}
                            onClick={() => onSelectPedido(pedido)}
                            className="w-full px-6 py-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                        >
                            <div className="flex flex-col gap-3">
                                {/* Primera línea: Número de pedido y etapa */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            {pedido.numeroPedidoCliente}
                                        </span>
                                        <span className="text-sm px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                                            {pedido.numeroRegistro}
                                        </span>
                                    </div>
                                    <span 
                                        className={`text-sm px-3 py-1 rounded-full font-semibold text-white whitespace-nowrap ${ETAPAS[pedido.etapaActual]?.color || 'bg-gray-500'}`}
                                    >
                                        {ETAPAS[pedido.etapaActual]?.title || pedido.etapaActual}
                                    </span>
                                </div>

                                {/* Segunda línea: Cliente */}
                                <div className="text-base text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold text-gray-900 dark:text-white">Cliente:</span>{' '}
                                    <span className="text-gray-800 dark:text-gray-200">{pedido.cliente}</span>
                                </div>

                                {/* Tercera línea: Vendedor y Metros */}
                                <div className="flex items-center gap-6 text-base text-gray-600 dark:text-gray-400 flex-wrap">
                                    {pedido.vendedorNombre && (
                                        <div>
                                            <span className="font-semibold text-gray-900 dark:text-white">Vendedor:</span>{' '}
                                            <span className="text-gray-800 dark:text-gray-200">{pedido.vendedorNombre}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-semibold text-gray-900 dark:text-white">Metros:</span>{' '}
                                        <span className="text-gray-800 dark:text-gray-200">{pedido.metros.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Cuarta línea: Fechas */}
                                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                                    {pedido.fechaEntrega && (
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">📅 F. Entrega:</span>
                                            <span>{new Date(pedido.fechaEntrega).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}</span>
                                        </div>
                                    )}
                                    {pedido.nuevaFechaEntrega && (
                                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                                            <span className="font-semibold">🔄 Nueva F. Entrega:</span>
                                            <span>{new Date(pedido.nuevaFechaEntrega).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Mostrar si hay más resultados */}
                {hasMoreResults && (
                    <div className="px-6 py-3 text-sm text-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 font-medium">
                        Mostrando {displayResults.length} de {results.length} resultados
                    </div>
                )}
            </div>
        </>
    );
};

export default GlobalSearchDropdown;
