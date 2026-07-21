import React, { useState, useRef, useEffect } from 'react';
import { DateFilterOption } from '../utils/date';
import type { Pedido } from '../types';
import { getWeeksSelectOptions } from '../utils/weekUtils';

export interface DateFieldOption<T extends string = keyof Pedido> {
    value: T;
    label: string;
    icon: string;
}

type BivariantCallback<T> = {
    bivarianceHack: (value: T) => void;
}['bivarianceHack'];

interface DateFilterCombinedProps<T extends string = keyof Pedido> {
    dateField: T;
    dateFilter: DateFilterOption;
    customDateRange: { start: string; end: string };
    onDateFieldChange: BivariantCallback<T>;
    onDateFilterChange: (value: DateFilterOption) => void;
    onCustomDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    align?: 'left' | 'right';
    fieldOptions?: readonly DateFieldOption<T>[];
    selectedWeeks?: string[];
    onWeeksChange?: (weeks: string[]) => void;
}

const DEFAULT_DATE_FIELD_OPTIONS = [
    { value: 'fechaCreacion', label: 'Fecha Creación', icon: '📅' },
    { value: 'fechaEntrega', label: 'Fecha Entrega', icon: '🚚' },
    { value: 'nuevaFechaEntrega', label: 'Nueva F. Entrega', icon: '🔄' },
    { value: 'fechaFinalizacion', label: 'Fecha Finalización', icon: '✅' },
    { value: 'compraCliche', label: 'Compra Cliché', icon: '💰' },
    { value: 'recepcionCliche', label: 'Recepción Cliché', icon: '📦' },
] satisfies readonly DateFieldOption<keyof Pedido>[];

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const DateFilterCombined = <T extends string = keyof Pedido>({
    dateField,
    dateFilter,
    customDateRange,
    onDateFieldChange,
    onDateFilterChange,
    onCustomDateChange,
    align = 'left',
    fieldOptions,
    selectedWeeks = [],
    onWeeksChange = () => {},
}: DateFilterCombinedProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [weeksDropdownOpen, setWeeksDropdownOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const weeksDropdownRef = useRef<HTMLDivElement>(null);

    const dateFieldOptions = (fieldOptions ?? DEFAULT_DATE_FIELD_OPTIONS) as readonly DateFieldOption<T>[];

    const dateFilterShortcuts: { value: DateFilterOption, label: string, icon: string }[] = [
        { value: 'all', label: 'Todas las Fechas', icon: '📊' },
        { value: 'this-week', label: 'Esta Semana', icon: '📅' },
        { value: 'last-week', label: 'Semana Pasada', icon: '◀️' },
        { value: 'next-week', label: 'Próxima Semana', icon: '▶️' },
        { value: 'this-month', label: 'Este Mes', icon: '📆' },
        { value: 'last-month', label: 'Mes Pasado', icon: '◀️' },
        { value: 'next-month', label: 'Próximo Mes', icon: '▶️' },
        { value: 'custom', label: 'Personalizado', icon: '⚙️' },
    ];

    // Cerrar panel al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Cerrar el dropdown de semanas al hacer clic fuera de él
    useEffect(() => {
        const handleClickOutsideWeeks = (event: MouseEvent) => {
            if (weeksDropdownRef.current && !weeksDropdownRef.current.contains(event.target as Node)) {
                setWeeksDropdownOpen(false);
            }
        };

        if (weeksDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutsideWeeks);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutsideWeeks);
        };
    }, [weeksDropdownOpen]);

    const currentFieldLabel = dateFieldOptions.find(opt => opt.value === dateField)?.label || 'Fecha';
    const currentFieldIcon = dateFieldOptions.find(opt => opt.value === dateField)?.icon || '📅';
    
    const currentFilterLabel = selectedWeeks.length > 0
        ? `${selectedWeeks.length} Semana${selectedWeeks.length !== 1 ? 's' : ''}`
        : dateFilterShortcuts.find(opt => opt.value === dateFilter)?.label || 'Todas';

    const isActive = dateFilter !== 'all' || selectedWeeks.length > 0;

    const handleFieldSelect = (field: T) => {
        onDateFieldChange(field);
    };

    const handleFilterSelect = (filter: DateFilterOption) => {
        onDateFilterChange(filter);
        onWeeksChange([]);
        if (filter !== 'custom') {
            setIsOpen(false);
        }
    };

    const getButtonText = () => {
        if (selectedWeeks.length === 0) return 'Seleccionar semanas...';
        if (selectedWeeks.length === 1) return selectedWeeks[0];
        return `${selectedWeeks.length} semanas sel.`;
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Botón Principal */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2 py-1 text-sm rounded-md transition-all duration-200 border ${
                    isActive
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 font-medium'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 font-normal'
                }`}
                title="Filtrar por fecha"
            >
                <span className="text-sm leading-none">{currentFieldIcon}</span>
                <div className="flex flex-col items-start leading-tight min-w-0 font-normal">
                    <span className="text-[9px] opacity-75 leading-none">{currentFieldLabel}</span>
                    <span className="text-[11px] font-medium leading-none mt-0.5">{currentFilterLabel}</span>
                </div>
                <ChevronDownIcon />
            </button>

            {/* Panel Desplegable */}
            {isOpen && (
                <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden`}>
                    {/* Sección de Campo de Fecha */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Campo a filtrar:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {dateFieldOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => handleFieldSelect(option.value)}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                                        dateField === option.value
                                            ? 'bg-indigo-600 text-white font-medium'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <span>{option.icon}</span>
                                    <span className="text-xs">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sección de Atajos */}
                    <div className="p-3">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Atajos rápidos:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {dateFilterShortcuts.map(shortcut => (
                                <button
                                    key={shortcut.value}
                                    onClick={() => handleFilterSelect(shortcut.value)}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                                        dateFilter === shortcut.value && selectedWeeks.length === 0
                                            ? 'bg-blue-600 text-white font-medium'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <span>{shortcut.icon}</span>
                                    <span className="text-xs">{shortcut.label}</span>
                                </button>
                            ))}

                            {/* Selector de Semanas multi-select (col-span-2) */}
                            <div className="col-span-2 mt-2 border-t border-gray-100 dark:border-gray-700 pt-3" ref={weeksDropdownRef}>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                    Semanas de producción:
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setWeeksDropdownOpen(!weeksDropdownOpen);
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <span className="truncate">{getButtonText()}</span>
                                        <svg className="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    
                                    {weeksDropdownOpen && (
                                        <div className="absolute left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto p-2">
                                            <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-200 dark:border-gray-700">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onWeeksChange([]);
                                                    }}
                                                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                >
                                                    Limpiar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setWeeksDropdownOpen(false)}
                                                    className="text-[10px] text-gray-500 dark:text-gray-400 hover:underline font-medium"
                                                >
                                                    Cerrar
                                                </button>
                                            </div>
                                            {getWeeksSelectOptions().map(opt => {
                                                const isChecked = selectedWeeks.includes(opt.value);
                                                return (
                                                    <label key={opt.value} className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => {
                                                                const newWeeks = isChecked
                                                                    ? selectedWeeks.filter(w => w !== opt.value)
                                                                    : [...selectedWeeks, opt.value];
                                                                onWeeksChange(newWeeks);
                                                                if (newWeeks.length > 0) {
                                                                    onDateFilterChange('all');
                                                                }
                                                            }}
                                                            className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{opt.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección de Rango Personalizado */}
                    {dateFilter === 'custom' && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Rango personalizado:
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    name="start"
                                    aria-label="Fecha de inicio"
                                    value={customDateRange.start}
                                    onChange={onCustomDateChange}
                                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500 dark:text-gray-400 font-bold">→</span>
                                <input
                                    type="date"
                                    name="end"
                                    aria-label="Fecha de fin"
                                    value={customDateRange.end}
                                    onChange={onCustomDateChange}
                                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="mt-2 flex justify-end">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DateFilterCombined;
