import React, { useState, useEffect, useRef, useMemo } from 'react';

interface SearchableSelectOption {
    id: string;
    label: string;
    disabled?: boolean;
    isInactive?: boolean;
}

interface SearchableSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    allowCreate?: boolean;
    createLabel?: string;
    onCreateNew?: () => void;
    emptyLabel?: string;
    name?: string;
    showActiveOnly?: boolean;
}

/**
 * SearchableSelect - Componente de selector con búsqueda integrada
 * 
 * Características:
 * - Búsqueda instantánea al escribir
 * - Orden alfabético estricto
 * - Navegación por teclado (presionar letra para saltar)
 * - Soporte para opciones inactivas
 * - Opción de crear nuevo elemento
 */
const SearchableSelect: React.FC<SearchableSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Seleccione una opción',
    disabled = false,
    required = false,
    className = '',
    allowCreate = false,
    createLabel = '-- Crear nuevo --',
    onCreateNew,
    emptyLabel = 'Sin opciones disponibles',
    name,
    showActiveOnly = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [lastKeyPress, setLastKeyPress] = useState<{ key: string; time: number } | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filtrar y ordenar opciones
    const filteredOptions = useMemo(() => {
        let filtered = options;
        
        // Filtrar por estado activo si está habilitado
        if (showActiveOnly) {
            filtered = filtered.filter(opt => !opt.isInactive);
        }
        
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
    }, [options, searchTerm, showActiveOnly]);

    // Obtener label de la opción seleccionada
    const selectedOption = options.find(opt => opt.id === value);
    const displayValue = selectedOption?.label || placeholder;

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

    // Scroll automático al elemento resaltado
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [highlightedIndex]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
            setHighlightedIndex(-1);
        }
    };

    const handleSelect = (optionId: string) => {
        onChange(optionId);
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
    };

    const handleCreateNew = () => {
        if (onCreateNew) {
            onCreateNew();
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    // Navegación por teclado
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => 
                    prev < filteredOptions.length - 1 + (allowCreate ? 1 : 0) ? prev + 1 : prev
                );
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    if (highlightedIndex === filteredOptions.length && allowCreate) {
                        handleCreateNew();
                    } else if (highlightedIndex < filteredOptions.length) {
                        const option = filteredOptions[highlightedIndex];
                        if (!option.disabled) {
                            handleSelect(option.id);
                        }
                    }
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchTerm('');
                break;
                
            default:
                // Navegación por letra (saltar a primera opción que empiece con esa letra)
                if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    const now = Date.now();
                    const key = e.key.toLowerCase();
                    
                    // Si es la misma tecla en menos de 500ms, buscar la siguiente coincidencia
                    let startIndex = 0;
                    if (lastKeyPress && lastKeyPress.key === key && now - lastKeyPress.time < 500) {
                        startIndex = highlightedIndex + 1;
                    }
                    
                    setLastKeyPress({ key, time: now });
                    
                    // Buscar opción que empiece con la letra
                    const matchIndex = filteredOptions.findIndex((opt, idx) => 
                        idx >= startIndex && opt.label.toLowerCase().startsWith(key)
                    );
                    
                    if (matchIndex !== -1) {
                        setHighlightedIndex(matchIndex);
                    } else {
                        // Si no encuentra desde startIndex, buscar desde el inicio
                        const fallbackIndex = filteredOptions.findIndex(opt => 
                            opt.label.toLowerCase().startsWith(key)
                        );
                        if (fallbackIndex !== -1) {
                            setHighlightedIndex(fallbackIndex);
                        }
                    }
                }
                break;
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Select Button */}
            <button
                type="button"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    disabled
                        ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                } ${!selectedOption && required ? 'border-red-300 dark:border-red-700' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    {displayValue}
                    {selectedOption?.isInactive && <span className="ml-2 text-xs text-gray-500 italic">(Inactivo)</span>}
                </span>
                <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setHighlightedIndex(0);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Buscar..."
                                className="w-full px-3 py-2 pl-9 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <svg 
                                className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" 
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

                    {/* Options List */}
                    <div ref={listRef} className="overflow-y-auto max-h-64" role="listbox">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center italic">
                                {searchTerm ? 'No se encontraron resultados' : emptyLabel}
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => !option.disabled && handleSelect(option.id)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    disabled={option.disabled}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                        highlightedIndex === index
                                            ? 'bg-blue-50 dark:bg-blue-900/30'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    } ${
                                        option.id === value
                                            ? 'bg-blue-100 dark:bg-blue-900/50 font-medium'
                                            : ''
                                    } ${
                                        option.disabled
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'cursor-pointer'
                                    } ${
                                        option.isInactive
                                            ? 'text-gray-500 dark:text-gray-500 italic'
                                            : 'text-gray-900 dark:text-white'
                                    }`}
                                    role="option"
                                    aria-selected={option.id === value}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>
                                            {option.label}
                                            {option.isInactive && <span className="ml-2 text-xs">(Inactivo)</span>}
                                        </span>
                                        {option.id === value && (
                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                        
                        {/* Opción de Crear Nuevo */}
                        {allowCreate && onCreateNew && (
                            <button
                                type="button"
                                onClick={handleCreateNew}
                                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 border-t border-gray-200 dark:border-gray-700 transition-colors ${
                                    highlightedIndex === filteredOptions.length
                                        ? 'bg-blue-50 dark:bg-blue-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    {createLabel}
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            {/* Hidden input para compatibilidad con forms */}
            {name && (
                <input type="hidden" name={name} value={value} />
            )}
        </div>
    );
};

export default SearchableSelect;
