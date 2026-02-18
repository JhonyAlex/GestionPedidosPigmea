import React, { useRef, useEffect } from 'react';
import { Vendedor } from '../types/vendedor';

interface VendedorSearchDropdownProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    results: Vendedor[];
    onSelectVendedor: (vendedor: Vendedor) => void;
    onClose: () => void;
    maxResults?: number;
}

const VendedorSearchDropdown: React.FC<VendedorSearchDropdownProps> = ({
    searchTerm,
    onSearchChange,
    results,
    onSelectVendedor,
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
                className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 vendedor-search-dropdown" 
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />
            
            {/* Dropdown */}
            <div 
                className="vendedor-search-dropdown fixed inset-x-4 top-20 z-50 max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl max-h-[calc(100vh-8rem)] flex flex-col"
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
                            placeholder="Buscar comerciales..."
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
                                No se encontraron vendedores
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                Intenta con otro término de búsqueda
                            </p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {displayResults.map((vendedor) => (
                                <button
                                    key={vendedor.id}
                                    onClick={() => onSelectVendedor(vendedor)}
                                    className="w-full px-6 py-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                >
                                    <div className="flex flex-col gap-2">
                                        {/* Nombre del vendedor */}
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                {vendedor.nombre}
                                            </span>
                                            {vendedor.activo === false && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white font-medium">
                                                    Inactivo
                                                </span>
                                            )}
                                            {vendedor.activo === true && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-green-500 text-white font-medium">
                                                    Activo
                                                </span>
                                            )}
                                        </div>

                                        {/* Información adicional */}
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                                            {vendedor.telefono && (
                                                <div className="flex items-center gap-1">
                                                    <span className="font-semibold">📞</span>
                                                    <span>{vendedor.telefono}</span>
                                                </div>
                                            )}
                                            {vendedor.email && (
                                                <div className="flex items-center gap-1">
                                                    <span className="font-semibold">✉️</span>
                                                    <span>{vendedor.email}</span>
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

export default VendedorSearchDropdown;
