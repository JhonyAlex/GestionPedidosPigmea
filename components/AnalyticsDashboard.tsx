import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Etapa, Prioridad } from '../types';
import { DateFilterOption, getDateRange } from '../utils/date';
import DateFilterCombined from './DateFilterCombined';
import { KPICards } from './analytics/KPICards';
import { ProductionTrendsChart } from './analytics/ProductionTrendsChart';
import { MachinePerformanceChart } from './analytics/MachinePerformanceChart';
import { RankingsTable } from './analytics/RankingsTable';
import { useAnalyticsData, AnalyticsFilters } from '../hooks/useAnalyticsData';
import { 
    exportToExcel, 
    exportAllToCSV,
    exportMachinesToCSV,
    exportVendorsToCSV,
    exportClientsToCSV,
    exportStagesToCSV,
    exportTimeSeriesCSV
} from '../utils/exportAnalytics';
import { MAQUINAS_IMPRESION } from '../constants';
import webSocketService from '../services/websocket';

// LocalStorage Keys (separate from planning filters)
const STORAGE_KEY_ANALYTICS_DATE_FILTER = 'analytics_date_filter';
const STORAGE_KEY_ANALYTICS_DATE_FIELD = 'analytics_date_field';
const STORAGE_KEY_ANALYTICS_CUSTOM_DATE_RANGE = 'analytics_custom_date_range';
const STORAGE_KEY_ANALYTICS_STAGES = 'analytics_selected_stages';
const STORAGE_KEY_ANALYTICS_MACHINES = 'analytics_selected_machines';
const STORAGE_KEY_ANALYTICS_PRIORITY = 'analytics_priority_filter';

export const AnalyticsDashboard: React.FC = () => {
    // --- Filter State ---
    const [dateFilter, setDateFilter] = useState<DateFilterOption>(() => {
        return (localStorage.getItem(STORAGE_KEY_ANALYTICS_DATE_FILTER) as DateFilterOption) || 'this-month';
    });

    const [dateField, setDateField] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY_ANALYTICS_DATE_FIELD) || 'nuevaFechaEntrega';
    });

    const [customDateRange, setCustomDateRange] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_ANALYTICS_CUSTOM_DATE_RANGE);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing saved custom date range:', e);
            }
        }
        return {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        };
    });

    const [selectedStages, setSelectedStages] = useState<string[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_ANALYTICS_STAGES);
        return saved ? JSON.parse(saved) : [];
    });

    const allMachineOptions = MAQUINAS_IMPRESION.map(m => m.nombre);
    const [selectedMachines, setSelectedMachines] = useState<string[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_ANALYTICS_MACHINES);
        return saved ? JSON.parse(saved) : [];
    });

    const [selectedPriority, setSelectedPriority] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY_ANALYTICS_PRIORITY) || 'all';
    });

    const [showFilters, setShowFilters] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // --- Persistence Effects ---
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_ANALYTICS_DATE_FILTER, dateFilter);
    }, [dateFilter]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_ANALYTICS_DATE_FIELD, dateField);
    }, [dateField]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_ANALYTICS_CUSTOM_DATE_RANGE, JSON.stringify(customDateRange));
    }, [customDateRange]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_ANALYTICS_STAGES, JSON.stringify(selectedStages));
    }, [selectedStages]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_ANALYTICS_MACHINES, JSON.stringify(selectedMachines));
    }, [selectedMachines]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_ANALYTICS_PRIORITY, selectedPriority);
    }, [selectedPriority]);

    // --- Prepare filters for API ---
    const filters: AnalyticsFilters = React.useMemo(() => {
        const range = dateFilter !== 'all' ? getDateRange(dateFilter) : null;
        
        let startDate: string | undefined;
        let endDate: string | undefined;

        if (dateFilter === 'custom') {
            startDate = customDateRange.start;
            endDate = customDateRange.end;
        } else if (range) {
            startDate = range.start.toISOString().split('T')[0];
            endDate = range.end.toISOString().split('T')[0];
        }

        return {
            dateFilter,
            dateField,
            startDate,
            endDate,
            stages: selectedStages.length > 0 ? selectedStages : undefined,
            machines: selectedMachines.length > 0 ? selectedMachines : undefined,
            priority: selectedPriority !== 'all' ? selectedPriority : undefined
        };
    }, [dateFilter, dateField, customDateRange, selectedStages, selectedMachines, selectedPriority]);

    // --- Fetch Data ---
    const { data, loading, error, refetch } = useAnalyticsData(filters);

    // ---- Real-time refresh (WebSocket) ----
    // Re-fetch analytics when pedidos or vendedores cambian en otros usuarios
    const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleRefresh = useCallback(() => {
        if (refreshTimeout.current) {
            clearTimeout(refreshTimeout.current);
        }
        refreshTimeout.current = setTimeout(() => {
            refetch();
        }, 800); // leve debounce para agrupar múltiples eventos
    }, [refetch]);

    useEffect(() => {
        const unsubscribers: Array<() => void> = [
            webSocketService.subscribeToPedidoCreated(scheduleRefresh),
            webSocketService.subscribeToPedidoUpdated(scheduleRefresh),
            webSocketService.subscribeToPedidoDeleted(scheduleRefresh),
            webSocketService.subscribeToPedidosByVendedorUpdated(scheduleRefresh),
        ];

        // Algunos despliegues todavía emiten eventos directos de vendedor
        if (typeof webSocketService.subscribeToVendedorUpdated === 'function') {
            unsubscribers.push(webSocketService.subscribeToVendedorUpdated(scheduleRefresh));
        }
        if (typeof webSocketService.subscribeToVendedorDeleted === 'function') {
            unsubscribers.push(webSocketService.subscribeToVendedorDeleted(scheduleRefresh));
        }

        return () => {
            unsubscribers.forEach(unsub => unsub && unsub());
            if (refreshTimeout.current) {
                clearTimeout(refreshTimeout.current);
                refreshTimeout.current = null;
            }
        };
    }, [scheduleRefresh]);

    // --- Filter Handlers ---
    const toggleStage = (stage: string) => {
        setSelectedStages(prev =>
            prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
        );
    };

    const toggleMachine = (machine: string) => {
        setSelectedMachines(prev =>
            prev.includes(machine) ? prev.filter(m => m !== machine) : [...prev, machine]
        );
    };

    const clearFilters = () => {
        setSelectedStages([]);
        setSelectedMachines([]);
        setSelectedPriority('all');
        setDateFilter('this-month');
    };

    // --- Export Handlers ---
    const handleExport = (type: string) => {
        if (!data) return;

        switch (type) {
            case 'excel':
                exportToExcel(data);
                break;
            case 'csv-all':
                exportAllToCSV(data);
                break;
            case 'csv-machines':
                exportMachinesToCSV(data);
                break;
            case 'csv-vendors':
                exportVendorsToCSV(data);
                break;
            case 'csv-clients':
                exportClientsToCSV(data);
                break;
            case 'csv-stages':
                exportStagesToCSV(data);
                break;
            case 'csv-trends':
                exportTimeSeriesCSV(data);
                break;
        }

        setShowExportMenu(false);
    };

    const activeFiltersCount = 
        (selectedStages.length > 0 ? 1 : 0) +
        (selectedMachines.length > 0 ? 1 : 0) +
        (selectedPriority !== 'all' ? 1 : 0);

    return (
        <main className="flex-grow p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Informes y Analítica
                    </h1>

                    {/* Refresh Button */}
                    <button
                        onClick={() => refetch()}
                        disabled={loading}
                        className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-gray-600 dark:text-gray-300 rounded-md transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                        title="Actualizar datos"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    {/* Filters Toggle Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md transition-all shadow-sm hover:shadow-md"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filtros
                        {activeFiltersCount > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* Export Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={loading || !data}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Exportar
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                <div className="py-1">
                                    <button
                                        onClick={() => handleExport('excel')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        📊 Excel (Completo)
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv-all')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        📄 CSV (Completo)
                                    </button>
                                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                    <button
                                        onClick={() => handleExport('csv-machines')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        🖨️ CSV Máquinas
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv-vendors')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        👤 CSV Vendedores
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv-clients')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        🏢 CSV Clientes
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv-stages')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        📋 CSV Etapas
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv-trends')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        📈 CSV Tendencias
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Date Filter */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
                    <DateFilterCombined
                        dateField={dateField as any}
                        dateFilter={dateFilter}
                        customDateRange={customDateRange}
                        onDateFieldChange={setDateField}
                        onDateFilterChange={setDateFilter}
                        onCustomDateChange={(e) => setCustomDateRange({ ...customDateRange, [e.target.name]: e.target.value })}
                        align="right"
                    />
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Filtros Avanzados</h3>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Prioridad
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {['all', Prioridad.URGENTE, Prioridad.ALTA, Prioridad.NORMAL, Prioridad.BAJA].map(priority => (
                                <button
                                    key={priority}
                                    onClick={() => setSelectedPriority(priority)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                                        selectedPriority === priority
                                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg scale-105'
                                            : 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    {priority === 'all' ? 'Todas' : priority}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Machine Filters */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            Máquinas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {allMachineOptions.map(machine => (
                                <button
                                    key={machine}
                                    onClick={() => toggleMachine(machine)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                                        selectedMachines.includes(machine)
                                            ? 'bg-blue-600 border-blue-700 text-white shadow-lg scale-105'
                                            : 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    {machine}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stage Filters */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Etapas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(Etapa)
                                .filter(e => e !== Etapa.ARCHIVADO)
                                .map(stage => (
                                    <button
                                        key={stage}
                                        onClick={() => toggleStage(stage)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                                            selectedStages.includes(stage)
                                                ? 'bg-purple-600 border-purple-700 text-white shadow-lg scale-105'
                                                : 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                        {stage.replace(/_/g, ' ')}
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">Error al cargar datos</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            {data && <KPICards summary={data.summary} loading={loading} />}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Production Trends */}
                {data && <ProductionTrendsChart data={data.timeSeries} loading={loading} />}

                {/* Machine Performance */}
                {data && <MachinePerformanceChart data={data.byMachine} loading={loading} />}
            </div>

            {/* Rankings Table */}
            {data && (
                <RankingsTable
                    vendorData={data.topVendors}
                    clientData={data.topClients}
                    stageData={data.byStage}
                    loading={loading}
                />
            )}
        </main>
    );
};
