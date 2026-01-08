import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useObservacionesTemplates, ObservacionTemplate } from '../hooks/useObservacionesTemplates';

interface ObservacionesAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const MAX_CHARS = 100;

/**
 * Componente de autocompletado para observaciones rápidas.
 * Permite seleccionar templates guardados o escribir nuevos (se guardan automáticamente).
 * Los templates seleccionados se muestran como "etiquetas" encima del textarea.
 */
const ObservacionesAutocomplete: React.FC<ObservacionesAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'Escribe una observación rápida...',
    disabled = false,
    className = '',
}) => {
    const [inputValue, setInputValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        templates,
        searchResults,
        searchTerm,
        setSearchTerm,
        isSearching,
        saveTemplate,
        deleteTemplate,
    } = useObservacionesTemplates();

    // Determinar qué templates mostrar (búsqueda o todos)
    const displayTemplates = searchTerm.length > 0 ? searchResults : templates.slice(0, 8);

    // Longitud actual del input
    const charCount = inputValue.length;
    const isOverLimit = charCount > MAX_CHARS;

    // Sincronizar tags con el valor externo al montar
    useEffect(() => {
        // Si hay un valor inicial, parsearlo como tags separados por " | "
        if (value && selectedTags.length === 0) {
            const existingTags = value.split(' | ').filter(t => t.trim().length > 0);
            if (existingTags.length > 0) {
                setSelectedTags(existingTags);
            }
        }
    }, []); // Solo al montar

    // Notificar cambios al componente padre
    const updateParentValue = useCallback((tags: string[]) => {
        const combined = tags.join(' | ');
        onChange(combined);
    }, [onChange]);

    // Manejar cambio en el input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setSearchTerm(newValue);
        setShowDropdown(true);
        setHighlightedIndex(-1);
    };

    // Seleccionar un template existente
    const handleSelectTemplate = async (template: ObservacionTemplate) => {
        // Evitar duplicados
        if (selectedTags.includes(template.text)) {
            setInputValue('');
            setSearchTerm('');
            setShowDropdown(false);
            return;
        }

        const newTags = [...selectedTags, template.text];
        setSelectedTags(newTags);
        updateParentValue(newTags);
        
        // Incrementar el contador de uso del template
        await saveTemplate(template.text);
        
        // Limpiar input
        setInputValue('');
        setSearchTerm('');
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    // Añadir un nuevo tag (texto personalizado)
    const handleAddCustomTag = async () => {
        const trimmedValue = inputValue.trim();
        
        if (trimmedValue.length === 0 || trimmedValue.length > MAX_CHARS) {
            return;
        }

        // Evitar duplicados
        if (selectedTags.includes(trimmedValue)) {
            setInputValue('');
            setSearchTerm('');
            setShowDropdown(false);
            return;
        }

        const newTags = [...selectedTags, trimmedValue];
        setSelectedTags(newTags);
        updateParentValue(newTags);
        
        // Guardar como template para uso futuro (auto-aprendizaje)
        await saveTemplate(trimmedValue);
        
        // Limpiar input
        setInputValue('');
        setSearchTerm('');
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    // Eliminar un tag seleccionado
    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = selectedTags.filter(tag => tag !== tagToRemove);
        setSelectedTags(newTags);
        updateParentValue(newTags);
    };

    // Eliminar un template de la base de datos
    const handleDeleteTemplate = async (e: React.MouseEvent, template: ObservacionTemplate) => {
        e.stopPropagation();
        e.preventDefault();
        
        const confirmed = window.confirm(`¿Eliminar la plantilla "${template.text}"?`);
        if (confirmed) {
            await deleteTemplate(template.id);
        }
    };

    // Manejar teclas especiales
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            setShowDropdown(false);
            setHighlightedIndex(-1);
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Si hay un item resaltado, seleccionarlo
            if (highlightedIndex >= 0 && highlightedIndex < displayTemplates.length) {
                handleSelectTemplate(displayTemplates[highlightedIndex]);
            } else if (inputValue.trim().length > 0 && !isOverLimit) {
                // Si no hay item resaltado pero hay texto, añadirlo como nuevo tag
                handleAddCustomTag();
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!showDropdown) {
                setShowDropdown(true);
            }
            setHighlightedIndex(prev => 
                prev < displayTemplates.length - 1 ? prev + 1 : 0
            );
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => 
                prev > 0 ? prev - 1 : displayTemplates.length - 1
            );
            return;
        }

        if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
            // Eliminar el último tag si el input está vacío
            const newTags = selectedTags.slice(0, -1);
            setSelectedTags(newTags);
            updateParentValue(newTags);
        }
    };

    // Manejar blur (guardar al perder foco)
    const handleBlur = (e: React.FocusEvent) => {
        // Verificar si el foco se fue a un elemento del dropdown
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (containerRef.current?.contains(relatedTarget)) {
            return;
        }

        // Si hay texto en el input, guardarlo como tag
        if (inputValue.trim().length > 0 && !isOverLimit) {
            handleAddCustomTag();
        }

        // Cerrar dropdown después de un pequeño delay
        setTimeout(() => {
            setShowDropdown(false);
        }, 150);
    };

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Tags seleccionados */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedTags.map((tag, index) => (
                        <span
                            key={`${tag}-${index}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-full border border-blue-200 dark:border-blue-700"
                        >
                            <span className="max-w-[200px] truncate">{tag}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-0.5 p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                    title="Quitar"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {/* Input de búsqueda/creación */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={handleBlur}
                    placeholder={selectedTags.length > 0 ? 'Añadir otra observación...' : placeholder}
                    disabled={disabled}
                    className={`w-full bg-gray-200 dark:bg-gray-700 border rounded-lg p-2.5 pr-16 text-sm
                        focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50
                        ${isOverLimit 
                            ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                />
                
                {/* Contador de caracteres */}
                <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium
                    ${isOverLimit 
                        ? 'text-red-500 dark:text-red-400' 
                        : charCount > MAX_CHARS * 0.8 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-gray-400 dark:text-gray-500'
                    }`}
                >
                    {charCount}/{MAX_CHARS}
                </div>
            </div>

            {/* Advertencia de límite */}
            {isOverLimit && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    ⚠️ Máximo {MAX_CHARS} caracteres
                </p>
            )}

            {/* Dropdown de sugerencias */}
            {showDropdown && !disabled && (inputValue.length > 0 || templates.length > 0) && (
                <div 
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                    {/* Mensaje de carga */}
                    {isSearching && (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Buscando...
                        </div>
                    )}

                    {/* Templates existentes */}
                    {!isSearching && displayTemplates.length > 0 && (
                        <>
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                {searchTerm ? 'Coincidencias' : 'Usados frecuentemente'}
                            </div>
                            {displayTemplates.map((template, index) => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleSelectTemplate(template)}
                                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-2 transition-colors
                                        ${highlightedIndex === index 
                                            ? 'bg-blue-50 dark:bg-blue-900/30' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }
                                        ${selectedTags.includes(template.text) ? 'opacity-50' : ''}
                                    `}
                                >
                                    <span className="flex-1 truncate text-gray-800 dark:text-gray-200">
                                        {template.text}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {template.usageCount}x
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteTemplate(e, template)}
                                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                            title="Eliminar plantilla"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}

                    {/* Opción para añadir texto personalizado */}
                    {!isSearching && inputValue.trim().length > 0 && !isOverLimit && (
                        <button
                            type="button"
                            onClick={handleAddCustomTag}
                            className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 transition-colors
                                ${highlightedIndex === -1 && displayTemplates.length === 0 
                                    ? 'bg-blue-50 dark:bg-blue-900/30' 
                                    : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                                }`}
                        >
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-green-700 dark:text-green-300">
                                Añadir: "<span className="font-medium">{inputValue.trim()}</span>"
                            </span>
                        </button>
                    )}

                    {/* Estado vacío */}
                    {!isSearching && displayTemplates.length === 0 && inputValue.trim().length === 0 && (
                        <div className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                            <p>Escribe para buscar o crear una observación rápida</p>
                        </div>
                    )}

                    {/* Sin resultados de búsqueda */}
                    {!isSearching && searchTerm.length > 0 && searchResults.length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            No hay plantillas guardadas con ese texto
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ObservacionesAutocomplete;
