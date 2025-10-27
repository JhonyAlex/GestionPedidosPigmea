import React, { useState, useMemo } from 'react';
import { DateField, WeekFilter as WeekFilterType } from '../types';
import { getWeeksOfYear, getCurrentWeek, getWeekDateRange } from '../utils/weekUtils';

interface WeekFilterProps {
    weekFilter: WeekFilterType;
    onToggle: () => void;
    onWeekChange: (year: number, week: number) => void;
    onDateFieldChange: (dateField: DateField) => void;
}

const WeekFilter: React.FC<WeekFilterProps> = ({
    weekFilter,
    onToggle,
    onWeekChange,
    onDateFieldChange
}) => {
    const currentWeek = getCurrentWeek();
    const [selectedYear, setSelectedYear] = useState(weekFilter.year);
    
    // Generar años (año actual y 1 anterior/posterior)
    const years = useMemo(() => {
        const current = new Date().getFullYear();
        return [current - 1, current, current + 1];
    }, []);

    // Obtener semanas del año seleccionado
    const weeks = useMemo(() => {
        return getWeeksOfYear(selectedYear);
    }, [selectedYear]);

    // Información de la semana actual seleccionada
    const currentWeekInfo = useMemo(() => {
        if (!weekFilter.enabled) return null;
        const { start, end } = getWeekDateRange(weekFilter.year, weekFilter.week);
        const formatDate = (date: Date) => {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };
        return `${formatDate(start)} - ${formatDate(end)}`;
    }, [weekFilter]);

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        // Automáticamente seleccionar la semana 1 del nuevo año
        onWeekChange(year, 1);
    };

    const handleWeekSelect = (week: number) => {
        onWeekChange(selectedYear, week);
    };

    const handleQuickSelect = (type: 'current' | 'next' | 'previous') => {
        const current = getCurrentWeek();
        switch (type) {
            case 'current':
                onWeekChange(current.year, current.week);
                setSelectedYear(current.year);
                break;
            case 'next':
                const nextWeek = current.week + 1;
                const nextYear = nextWeek > 52 ? current.year + 1 : current.year;
                const finalNextWeek = nextWeek > 52 ? 1 : nextWeek;
                onWeekChange(nextYear, finalNextWeek);
                setSelectedYear(nextYear);
                break;
            case 'previous':
                const prevWeek = current.week - 1;
                const prevYear = prevWeek < 1 ? current.year - 1 : current.year;
                const finalPrevWeek = prevWeek < 1 ? 52 : prevWeek;
                onWeekChange(prevYear, finalPrevWeek);
                setSelectedYear(prevYear);
                break;
        }
    };

    const dateFieldLabels: Record<DateField, string> = {
        fechaCreacion: 'Fecha Creación',
        fechaEntrega: 'Fecha Entrega',
        nuevaFechaEntrega: 'Nueva Fecha',
        fechaFinalizacion: 'Fecha Finalización'
    };

    return (
        <div className="relative">
            {/* Botón principal de activación */}
            <button
                onClick={onToggle}
                className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                    weekFilter.enabled
                        ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {weekFilter.enabled ? (
                    <span>
                        📅 Semana {weekFilter.week}/{weekFilter.year}
                        <span className="ml-2 text-xs opacity-80">({dateFieldLabels[weekFilter.dateField]})</span>
                    </span>
                ) : (
                    'Filtrar por Semana'
                )}
            </button>

            {/* Panel desplegable cuando está activo */}
            {weekFilter.enabled && (
                <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl z-50 p-4 min-w-[400px]">
                    {/* Información de la semana actual */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <div className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                            Semana {weekFilter.week} del {weekFilter.year}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                            {currentWeekInfo}
                        </div>
                    </div>

                    {/* Botones de acceso rápido */}
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={() => handleQuickSelect('previous')}
                            className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                        >
                            ← Semana Anterior
                        </button>
                        <button
                            onClick={() => handleQuickSelect('current')}
                            className="flex-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md transition-colors font-medium"
                        >
                            Semana Actual
                        </button>
                        <button
                            onClick={() => handleQuickSelect('next')}
                            className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                        >
                            Semana Siguiente →
                        </button>
                    </div>

                    {/* Selector de campo de fecha */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Filtrar por:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(dateFieldLabels) as DateField[]).map((field) => (
                                <button
                                    key={field}
                                    onClick={() => onDateFieldChange(field)}
                                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                        weekFilter.dateField === field
                                            ? 'bg-blue-600 text-white font-medium'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {dateFieldLabels[field]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selector de año */}
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Año:
                        </label>
                        <div className="flex gap-2">
                            {years.map(year => (
                                <button
                                    key={year}
                                    onClick={() => handleYearChange(year)}
                                    className={`flex-1 px-3 py-2 rounded-md transition-colors ${
                                        selectedYear === year
                                            ? 'bg-blue-600 text-white font-medium'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selector de semana */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Semana:
                        </label>
                        <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-1">
                            {weeks.map(({ week, dateRange }) => (
                                <button
                                    key={week}
                                    onClick={() => handleWeekSelect(week)}
                                    title={dateRange}
                                    className={`px-2 py-1 text-sm rounded transition-colors ${
                                        weekFilter.year === selectedYear && weekFilter.week === week
                                            ? 'bg-blue-600 text-white font-bold'
                                            : week === currentWeek.week && selectedYear === currentWeek.year
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {week}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Botón para desactivar filtro */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <button
                            onClick={onToggle}
                            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
                        >
                            Desactivar Filtro de Semana
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeekFilter;
