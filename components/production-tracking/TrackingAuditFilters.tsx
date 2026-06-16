import React from 'react';
import DateFilterCombined, { DateFieldOption } from '../DateFilterCombined';
import { DateFilterOption } from '../../utils/date';
import { ETAPAS } from '../../constants';
import { Etapa } from '../../types';

interface TrackingAuditFiltersProps {
    searchValue: string;
    onSearchValueChange: (value: string) => void;
    stageValue: string;
    onStageValueChange: (value: string) => void;
    dateField: 'timestamp';
    dateFilter: DateFilterOption;
    customDateRange: { start: string; end: string };
    onDateFieldChange: (field: 'timestamp') => void;
    onDateFilterChange: (value: DateFilterOption) => void;
    onCustomDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
    canExport: boolean;
    onExport?: () => void;
    exportDisabledReason?: string;
    isLoading: boolean;
}

const PRODUCTION_STAGES: Etapa[] = [
    Etapa.IMPRESION_WM1,
    Etapa.IMPRESION_GIAVE,
    Etapa.IMPRESION_WM3,
    Etapa.POST_DNT,
    Etapa.POST_LAMINACION_SL2,
    Etapa.POST_LAMINACION_NEXUS,
    Etapa.POST_LAMINACION_SL2_EVO,
    Etapa.POST_ECCONVERT_21,
    Etapa.POST_ECCONVERT_22,
    Etapa.POST_REBOBINADO_S2DT,
    Etapa.POST_REBOBINADO_PROSLIT,
    Etapa.POST_PERFORACION_MIC,
    Etapa.POST_PERFORACION_MAC,
    Etapa.POST_PERFORACION_MAC2,
    Etapa.COMPLETADO,
    Etapa.ARCHIVADO,
];

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const DATE_FIELD_OPTIONS: readonly DateFieldOption<'timestamp'>[] = [
    { value: 'timestamp', label: 'Fecha de registro', icon: '🕒' },
];

const TrackingAuditFilters: React.FC<TrackingAuditFiltersProps> = ({
    searchValue,
    onSearchValueChange,
    stageValue,
    onStageValueChange,
    dateField,
    dateFilter,
    customDateRange,
    onDateFieldChange,
    onDateFilterChange,
    onCustomDateChange,
    onClearFilters,
    hasActiveFilters,
    canExport,
    onExport,
    exportDisabledReason,
    isLoading,
}) => {
    const exportDisabled = !canExport || !onExport;

    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/70">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4 flex-1">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filtros del historial</h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            La búsqueda y los rangos se consultan en el servidor para mantener el historial escalable.
                        </p>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_220px_auto]">
                        <label className="block">
                            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Buscar por pedido, cliente o detalle
                            </span>
                            <div className="relative">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(event) => onSearchValueChange(event.target.value)}
                                    placeholder="Buscar en el historial..."
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Etapa de producción
                            </span>
                            <select
                                value={stageValue}
                                onChange={(event) => onStageValueChange(event.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                            >
                                <option value="">Todas las etapas</option>
                                {PRODUCTION_STAGES.map((stage) => (
                                    <option key={stage} value={stage}>
                                        {ETAPAS[stage]?.title ?? stage}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="min-w-[220px]">
                            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Rango de registro
                            </span>
                            <DateFilterCombined<'timestamp'>
                                dateField={dateField}
                                dateFilter={dateFilter}
                                customDateRange={customDateRange}
                                onDateFieldChange={onDateFieldChange}
                                onDateFilterChange={onDateFilterChange}
                                onCustomDateChange={onCustomDateChange}
                                fieldOptions={DATE_FIELD_OPTIONS}
                                align="left"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 lg:min-w-[180px]">
                    <button
                        type="button"
                        onClick={onExport}
                        disabled={exportDisabled}
                        title={exportDisabled ? exportDisabledReason : 'Exportar historial visible'}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400/70 disabled:text-white/90"
                    >
                        Exportar PDF
                    </button>
                    <button
                        type="button"
                        onClick={onClearFilters}
                        disabled={!hasActiveFilters}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        Limpiar filtros
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isLoading ? 'Actualizando resultados...' : 'Los resultados reflejan solo la página visible del historial.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TrackingAuditFilters;
