import React, { useState, useEffect, useRef, useMemo } from 'react';

interface SearchableMultiSelectOption {
    id: string;
    label: string;
    isInactive?: boolean;
}

interface SearchableMultiSelectProps {
    selectedIds: string[];
    onToggle: (id: string) => void;
    options: SearchableMultiSelectOption[];
    placeholder?: string;
    icon?: string;
    disabled?: boolean;
    allowSelectAll?: boolean;
    allowUnassigned?: boolean;
    unassignedLabel?: string;
}

/**
 * SearchableMultiSelect - Componente de selector múltiple con búsqueda integrada
 * 
 * Características:
 * - Búsqueda instantánea al escribir
 * - Orden alfabético estricto
 * - Navegación por teclado
 * - Contador de seleccionados
 * - Opción "Todos" y "Sin asignar"
 */
const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
    selectedIds,
    onToggle,
    options,
    placeholder = 'Filtrar',
    icon = '📋',
    disabled = false,
    allowSelectAll = true,
    allowUnassigned = true,
    unassignedLabel = 'Sin asignar'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filtrar y ordenar opciones
    const filteredOptions = useMemo(() => {
        let filtered = options;
        
        // Filtrar por término de búsqueda
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(opt => 
                opt.label.toLowerCase().includes(term)
            );
        }
        
        // Ordenar alfabéticamente (activos primero, luego inactivos)
        return filtered.sort((a, b) => {
            // Primero por estado activo/inactivo
            if (a.isInactive !== b.isInactive) {
                return a.isInactive ? 1 : -1;
            }
            // Luego alfabéticamente
            return a.label.localeCompare(b.label, 'es', { sensitivity: 'base' });
        });
    }, [options, searchTerm]);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Focus en input de búsqueda al abrir
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Botón principal */}
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span>{icon} {placeholder}</span>
                {selectedIds.length > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 dark:bg-indigo-500 rounded-full">
                        {selectedIds.length}
                    </span>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg flex flex-col overflow-hidden">
                    {/* Buscador */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full px-3 py-1.5 pl-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <svg 
                                className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        {searchTerm && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {filteredOptions.length} resultado{filteredOptions.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>

                    {/* Opciones especiales */}
                    {!searchTerm && (
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                            {allowSelectAll && (
                                <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === 0}
                                        onChange={() => onToggle('all')}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Todos</span>
                                </label>
                            )}
                            {allowUnassigned && (
                                <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes('sin_asignar')}
                                        onChange={() => onToggle('sin_asignar')}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 italic">{unassignedLabel}</span>
                                </label>
                            )}
                        </div>
                    )}

                    {/* Lista de opciones */}
                    <div className="p-2 overflow-y-auto max-h-64">
                        {filteredOptions.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400 text-center italic">
                                No se encontraron resultados
                            </div>
                        ) : (
                            filteredOptions.map(option => (
                                <label 
                                    key={option.id} 
                                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(option.id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            onToggle(option.id);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className={`text-sm ${
                                        option.isInactive
                                            ? 'text-gray-500 dark:text-gray-500 italic line-through' 
                                            : 'text-gray-900 dark:text-white'
                                    }`}>
                                        {option.label}
                                        {option.isInactive && ' (Inactivo)'}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableMultiSelect;
