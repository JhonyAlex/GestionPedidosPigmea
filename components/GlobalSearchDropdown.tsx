import React, { useRef, useEffect } from 'react';
import { Pedido } from '../types';
import { ETAPAS } from '../constants';

interface GlobalSearchDropdownProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    results: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    onClose: () => void;
    maxResults?: number;
}

const GlobalSearchDropdown: React.FC<GlobalSearchDropdownProps> = ({
    searchTerm,
    onSearchChange,
    results,
    onSelectPedido,
    onClose,
    maxResults = 10
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus en el input cuando se abre
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // No mostrar dropdown si no hay término de búsqueda
    if (!searchTerm || searchTerm.trim().length === 0) {
        return null;
    }

    // Limitar resultados
    const displayResults = results.slice(0, maxResults);
    const hasMoreResults = results.length > maxResults;

    return (
        <>
            {/* Overlay de fondo */}
            <div 
                className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 global-search-dropdown" 
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />
            
            {/* Dropdown */}
            <div 
                className="global-search-dropdown fixed inset-x-4 top-20 z-50 max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl max-h-[calc(100vh-8rem)] flex flex-col"
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                {/* Header con campo de búsqueda */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 px-6 py-4 z-10">
                    <div className="flex items-center gap-3">
                        {/* Icono de búsqueda */}
                        <svg 
                            className="w-5 h-5 text-gray-400 dark:text-gray-500" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        
                        {/* Input de búsqueda */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Buscar pedidos..."
                            className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    onClose();
                                }
                            }}
                        />
                        
                        {/* Botón cerrar */}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            title="Cerrar (Esc)"
                        >
                            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                        
                        {/* Badge de resultados */}
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                            {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
                        </span>
                    </div>
                </div>

                {/* Contenedor de resultados con scroll */}
                <div className="overflow-y-auto flex-1">
                    {displayResults.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="text-gray-400 dark:text-gray-500 mb-2">
                                <svg className="w-16 h-16 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <p className="text-base text-gray-500 dark:text-gray-400">
                                No se encontraron pedidos
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                Intenta con otro término de búsqueda
                            </p>
                        </div>
                    ) : (
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
                    )}
                </div>

                {/* Footer con información de resultados */}
                {displayResults.length > 0 && hasMoreResults && (
                    <div className="sticky bottom-0 px-6 py-3 text-sm text-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 font-medium">
                        Mostrando {displayResults.length} de {results.length} resultados
                    </div>
                )}
            </div>
        </>
    );
};

export default GlobalSearchDropdown;
