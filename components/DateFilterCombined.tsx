import React, { useState, useRef, useEffect } from 'react';
import { DateFilterOption } from '../utils/date';
import type { Pedido } from '../types';

interface DateFilterCombinedProps {
    dateField: keyof Pedido;
    dateFilter: DateFilterOption;
    customDateRange: { start: string; end: string };
    onDateFieldChange: (field: keyof Pedido) => void;
    onDateFilterChange: (value: DateFilterOption) => void;
    onCustomDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface DateFieldOption {
    value: keyof Pedido;
    label: string;
    icon: string;
}

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const DateFilterCombined: React.FC<DateFilterCombinedProps> = ({
    dateField,
    dateFilter,
    customDateRange,
    onDateFieldChange,
    onDateFilterChange,
    onCustomDateChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const dateFieldOptions: DateFieldOption[] = [
        { value: 'fechaCreacion', label: 'Fecha Creación', icon: '📅' },
        { value: 'fechaEntrega', label: 'Fecha Entrega', icon: '🚚' },
        { value: 'nuevaFechaEntrega', label: 'Nueva F. Entrega', icon: '🔄' },
        { value: 'fechaFinalizacion', label: 'Fecha Finalización', icon: '✅' },
        { value: 'compraCliche', label: 'Compra Cliché', icon: '💰' },
        { value: 'recepcionCliche', label: 'Recepción Cliché', icon: '📦' },
    ];

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

    const currentFieldLabel = dateFieldOptions.find(opt => opt.value === dateField)?.label || 'Fecha';
    const currentFieldIcon = dateFieldOptions.find(opt => opt.value === dateField)?.icon || '📅';
    const currentFilterLabel = dateFilterShortcuts.find(opt => opt.value === dateFilter)?.label || 'Todas';

    const isActive = dateFilter !== 'all';

    const handleFieldSelect = (field: keyof Pedido) => {
        onDateFieldChange(field);
        // No cerrar el panel, permitir seleccionar el atajo inmediatamente
    };

    const handleFilterSelect = (filter: DateFilterOption) => {
        onDateFilterChange(filter);
        if (filter !== 'custom') {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Botón Principal */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2 py-1 text-sm rounded-md transition-all duration-200 border ${
                    isActive
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Filtrar por fecha"
            >
                <div className="flex items-center gap-1">
                    <span className="text-xs">{currentFieldIcon}</span>
                    <span className="text-xs">{currentFilterLabel}</span>
                </div>
                <ChevronDownIcon />
            </button>

            {/* Panel Desplegable */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    {/* Sección de Campo de Fecha */}
                    <div className="p-2.5 border-b border-gray-200 dark:border-gray-700">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                            Campo a filtrar:
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {dateFieldOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => handleFieldSelect(option.value)}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors ${
                                        dateField === option.value
                                            ? 'bg-indigo-600 text-white font-medium'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <span className="text-sm">{option.icon}</span>
                                    <span className="truncate">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sección de Atajos */}
                    <div className="p-2.5">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                            Atajos rápidos:
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {dateFilterShortcuts.map(shortcut => (
                                <button
                                    key={shortcut.value}
                                    onClick={() => handleFilterSelect(shortcut.value)}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors ${
                                        dateFilter === shortcut.value
                                            ? 'bg-blue-600 text-white font-medium'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <span className="text-sm">{shortcut.icon}</span>
                                    <span className="truncate">{shortcut.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sección de Rango Personalizado */}
                    {dateFilter === 'custom' && (
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                                Rango personalizado:
                            </label>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="date"
                                    name="start"
                                    aria-label="Fecha de inicio"
                                    value={customDateRange.start}
                                    onChange={onCustomDateChange}
                                    className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500 dark:text-gray-400 text-xs">→</span>
                                <input
                                    type="date"
                                    name="end"
                                    aria-label="Fecha de fin"
                                    value={customDateRange.end}
                                    onChange={onCustomDateChange}
                                    className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="mt-1.5 flex justify-end">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
