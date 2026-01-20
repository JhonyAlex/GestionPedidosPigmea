import React, { useState, useMemo, useEffect } from 'react';
import { Pedido, Etapa, Prioridad } from '../types';
import { DateFilterOption, getDateRange } from '../utils/date';
import { getWeekNumber, getWeekDateRange } from '../utils/weekUtils';
import DateFilterCombined from './DateFilterCombined';
import { MAQUINAS_IMPRESION, PREPARACION_SUB_ETAPAS_IDS, ETAPAS } from '../constants';
import { parseTimeToMinutes } from '../utils/kpi';
import { PlanningTable, WeeklyData } from './PlanningTable';
import { PlanningChart } from './PlanningChart';

interface ReportViewProps {
    pedidos: Pedido[];
    onNavigateToPedido?: (pedido: Pedido) => void;
}

// Special filter constants
const STAGE_LISTO_PARA_PRODUCCION = 'LISTO_PARA_PRODUCCION';
const MACHINE_DNT = 'DNT';
const MACHINE_SIN_ASIGNAR = 'Sin Asignar';
const CAPACITY_PER_WEEK = 120; // Assuming 120 hours capacity per week per machine

// Storage Keys
const STORAGE_KEY_DATE_FILTER = 'planning_date_filter';
const STORAGE_KEY_DATE_FIELD = 'planning_date_field';
const STORAGE_KEY_STAGES = 'planning_selected_stages';
const STORAGE_KEY_MACHINES = 'planning_selected_machines';

const ReportView: React.FC<ReportViewProps> = ({ pedidos, onNavigateToPedido }) => {
    // --- 1. State Management (Filters) ---

    // Load initial states from localStorage
    const [dateFilter, setDateFilter] = useState<DateFilterOption>(() => {
        return (localStorage.getItem(STORAGE_KEY_DATE_FILTER) as DateFilterOption) || 'next-week';
    });

    const [dateField, setDateField] = useState<keyof Pedido>(() => {
        return (localStorage.getItem(STORAGE_KEY_DATE_FIELD) as keyof Pedido) || 'nuevaFechaEntrega';
    });

    const [customDateRange, setCustomDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [selectedStages, setSelectedStages] = useState<string[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_STAGES);
        return saved ? JSON.parse(saved) : [Etapa.PREPARACION, STAGE_LISTO_PARA_PRODUCCION];
    });

    const allMachineOptions = ['Windmöller 1', 'Windmöller 3', 'GIAVE', 'DNT', 'Sin Asignar', 'ANON'];
    const [selectedMachines, setSelectedMachines] = useState<string[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_MACHINES);
        return saved ? JSON.parse(saved) : allMachineOptions;
    });

    const [selectedChartFilter, setSelectedChartFilter] = useState<{ weekLabel: string, machine: string } | null>(null);

    // --- Persistence Effects ---
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_DATE_FILTER, dateFilter);
    }, [dateFilter]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_DATE_FIELD, dateField);
    }, [dateField]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_STAGES, JSON.stringify(selectedStages));
    }, [selectedStages]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_MACHINES, JSON.stringify(selectedMachines));
    }, [selectedMachines]);


    // --- 2. Data Processing Engine ---

    const processedData = useMemo(() => {
        const weeklyGroups: Record<string, WeeklyData> = {};
        const machineKeysSet = new Set<string>();

        // Pre-initialize ONLY selected machines
        selectedMachines.forEach(m => machineKeysSet.add(m));

        // Get Date Range for Filtering
        const dateRange = getDateRange(dateFilter);
        // Handle custom range if needed (not fully implemented in utils yet for 'custom' string return, but let's assume standard logic)
        let filterStart: Date | null = null;
        let filterEnd: Date | null = null;

        if (dateFilter === 'custom') {
            filterStart = new Date(customDateRange.start);
            filterEnd = new Date(customDateRange.end);
            filterEnd.setHours(23, 59, 59, 999);
        } else if (dateRange) {
            filterStart = dateRange.start;
            filterEnd = dateRange.end;
        }

        // Filter orders
        const filteredPedidos = pedidos.filter(p => {
            // 1. Stage Filtering
            const isPreparacion = p.etapaActual === Etapa.PREPARACION;
            const isListo = isPreparacion && p.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
            
            let stageMatch = false;
            if (selectedStages.includes(STAGE_LISTO_PARA_PRODUCCION) && isListo) stageMatch = true;
            else if (selectedStages.includes(Etapa.PREPARACION) && isPreparacion && !isListo) stageMatch = true;
            else if (selectedStages.includes(p.etapaActual) && !isPreparacion) stageMatch = true;

            if (!stageMatch) return false;

            // 2. Date Filtering
            if (dateFilter !== 'all') {
                const dateVal = p[dateField];
                if (!dateVal) return false; // If filtering by date and date is missing, exclude it
                const pDate = new Date(dateVal as string);
                if (isNaN(pDate.getTime())) return false;

                if (filterStart && pDate < filterStart) return false;
                if (filterEnd && pDate > filterEnd) return false;
            }

            return true;
        });

        filteredPedidos.forEach(p => {
            // Determine Week based on Delivery Date (or the selected date field?)
            // Usually planning is grouped by Delivery Date regardless of the filter, OR grouped by the filtered date.
            // Let's group by the selected dateField to match the view context
            const dateStr = p[dateField] as string || p.fechaEntrega || p.fechaCreacion; 
            if (!dateStr) return;

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return;

            const weekNum = getWeekNumber(date);
            const year = date.getFullYear();
            
            // Generate grouping key (YYYY-WW)
            const weekKey = `${year}-${weekNum.toString().padStart(2, '0')}`;

            // Initialize week group if not exists
            if (!weeklyGroups[weekKey]) {
                const { start, end } = getWeekDateRange(year, weekNum);
                const startStr = start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                const endStr = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                
                weeklyGroups[weekKey] = {
                    week: weekNum,
                    year: year,
                    label: `SEMANA ${weekNum} (${year})`,
                    dateRange: `${startStr} al ${endStr}`,
                    machines: {},
                    machinePedidos: {},
                    totalCapacity: 0,
                    totalLoad: 0,
                    freeCapacity: 0
                };
                // Initialize selected machines with 0
                selectedMachines.forEach(key => {
                    weeklyGroups[weekKey].machines[key] = 0;
                });
            }

            // Determine Machine Category
            let machineCategory = MACHINE_SIN_ASIGNAR;
            const vendedorNombre = p.vendedorNombre?.trim().toUpperCase() || '';
            const maquinaImp = p.maquinaImpresion?.trim() || '';

            // Prioritize DNT check (Vendor or Machine)
            if (vendedorNombre.includes('DNT') || maquinaImp.toUpperCase().includes('DNT')) {
                machineCategory = MACHINE_DNT;
            } else if (p.anonimo) {
                machineCategory = 'ANON';
            } else if (maquinaImp) {
                // Check if known machine
                const knownMachine = MAQUINAS_IMPRESION.find(m => m.id === maquinaImp || m.nombre === maquinaImp);
                if (knownMachine) {
                    machineCategory = knownMachine.nombre; // Use Name for display
                } else {
                    machineCategory = maquinaImp; // Use as is if not in list but defined
                }
            } else {
                // If empty machine, it goes to "Sin Asignar" (Pedidos VARIABLES)
                machineCategory = MACHINE_SIN_ASIGNAR;
            }

            // ONLY process if machine is in selected machines
            if (selectedMachines.includes(machineCategory)) {
                // Calculate Hours
                const planificadoStr = p.tiempoProduccionPlanificado || '00:00';
                let hours = parseTimeToMinutes(planificadoStr) / 60;
                // Fallback to decimal if planificado is 0/empty but decimal exists
                if ((!hours || hours === 0) && p.tiempoProduccionDecimal) {
                    hours = p.tiempoProduccionDecimal;
                }

                // Add to Group
                if (!weeklyGroups[weekKey].machines[machineCategory]) {
                    weeklyGroups[weekKey].machines[machineCategory] = 0;
                }
                weeklyGroups[weekKey].machines[machineCategory] += hours;

                // Ensure machinePedidos structure exists and push order
                if (!weeklyGroups[weekKey].machinePedidos) {
                    weeklyGroups[weekKey].machinePedidos = {};
                }
                if (!weeklyGroups[weekKey].machinePedidos![machineCategory]) {
                    weeklyGroups[weekKey].machinePedidos![machineCategory] = [];
                }
                weeklyGroups[weekKey].machinePedidos![machineCategory].push(p);

                weeklyGroups[weekKey].totalLoad += hours;
            }
        });

        // Convert to Array and Sort by Week
        const sortedWeeks = Object.values(weeklyGroups).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.week - b.week;
        });

        // Calculate Free Capacity
        // New Formula requested: 180 - WH1 - WH3 - DNT = Libres
        const FIXED_CAPACITY_BASE = 180;

        sortedWeeks.forEach(group => {
            group.totalCapacity = FIXED_CAPACITY_BASE;
            
            const wh1 = group.machines['Windmöller 1'] || 0;
            const wh3 = group.machines['Windmöller 3'] || 0;
            const dnt = group.machines['DNT'] || 0;
            
            // Formula: 180 - WH1 - WH3 - DNT
            group.freeCapacity = FIXED_CAPACITY_BASE - wh1 - wh3 - dnt;
        });

        return {
            weeklyData: sortedWeeks,
            machineKeys: selectedMachines // Use selected machines as keys for columns
        };

    }, [pedidos, selectedStages, selectedMachines, dateFilter, dateField, customDateRange]);

    // Derived state for details table
    const selectedPedidos = useMemo(() => {
        if (!selectedChartFilter) return [];
        const week = processedData.weeklyData.find(w => w.label === selectedChartFilter.weekLabel);
        return week?.machinePedidos?.[selectedChartFilter.machine] || [];
    }, [processedData, selectedChartFilter]);


    // --- 3. Render Helpers ---

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

    const handleBarClick = (weekLabel: string, machineKey: string) => {
        setSelectedChartFilter({
            weekLabel,
            machine: machineKey
        });

        setTimeout(() => {
            const element = document.getElementById('planning-details-table');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    return (
        <main className="flex-grow p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Centro de Planificación</h1>
                
                {/* Date Filter */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
                    <DateFilterCombined
                        dateField={dateField}
                        dateFilter={dateFilter}
                        customDateRange={customDateRange}
                        onDateFieldChange={setDateField}
                        onDateFilterChange={setDateFilter}
                        onCustomDateChange={(e) => setCustomDateRange({ ...customDateRange, [e.target.name]: e.target.value })}
                    />
                </div>
            </div>

            {/* --- Toolbar --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-6">
                
                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Machine Filters */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Máquinas</h3>
                        <div className="flex flex-wrap gap-2">
                            {allMachineOptions.map(machine => (
                                <button
                                    key={machine}
                                    onClick={() => toggleMachine(machine)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                        selectedMachines.includes(machine)
                                            ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            : 'bg-gray-50 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                                    }`}
                                >
                                    {machine}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stage Filters */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Etapas</h3>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: Etapa.PREPARACION, label: 'Preparación' },
                                { id: STAGE_LISTO_PARA_PRODUCCION, label: 'Listo para Producción' },
                                { id: Etapa.IMPRESION_WM1, label: 'Impresión' }, 
                                ...Object.values(Etapa)
                                    .filter(e => e !== Etapa.PREPARACION && e !== Etapa.PENDIENTE && e !== Etapa.COMPLETADO && e !== Etapa.ARCHIVADO && e !== Etapa.IMPRESION_WM1)
                                    .map(e => ({ id: e, label: e.replace('IMPRESION_', '').replace('POST_', '') }))
                            ].map(stage => (
                                <button
                                    key={stage.id}
                                    onClick={() => toggleStage(stage.id)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                        selectedStages.includes(stage.id)
                                            ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                                            : 'bg-gray-50 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                                    }`}
                                >
                                    {stage.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Planning Table --- */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-4">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Planificación Semanal</h2>
                <PlanningTable 
                    data={processedData.weeklyData} 
                    machineKeys={processedData.machineKeys} 
                />
            </div>

            {/* --- Planning Chart --- */}
            <PlanningChart 
                data={processedData.weeklyData} 
                machineKeys={processedData.machineKeys} 
                onBarClick={handleBarClick}
            />

            {/* --- Details Table (Filtered) --- */}
            {selectedChartFilter && (
                <div id="planning-details-table" className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-4 mt-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
                            Detalle: {selectedChartFilter.machine} - {selectedChartFilter.weekLabel}
                            <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                {selectedPedidos.length} pedidos
                            </span>
                        </h3>
                        <button 
                            onClick={() => setSelectedChartFilter(null)}
                            className="text-gray-500 hover:text-red-500 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Cerrar detalle"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pedido</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Entrega</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metros</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiempo (h)</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {selectedPedidos.length > 0 ? (
                                    selectedPedidos.map((pedido) => {
                                        // Calculate hours for display
                                        let hours = 0;
                                        if (pedido.tiempoProduccionPlanificado) {
                                            hours = parseTimeToMinutes(pedido.tiempoProduccionPlanificado) / 60;
                                        } else if (pedido.tiempoProduccionDecimal) {
                                            hours = pedido.tiempoProduccionDecimal;
                                        }
                                        
                                        return (
                                            <tr 
                                                key={pedido.id} 
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                                                onClick={() => onNavigateToPedido && onNavigateToPedido(pedido)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                    {pedido.numeroPedidoCliente}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {pedido.cliente}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {pedido.producto || pedido.descripcion || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {pedido.nuevaFechaEntrega || pedido.fechaEntrega}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                                                    {Number(pedido.metros).toLocaleString()} m
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900 dark:text-white">
                                                    {hours.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <span className="text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Ver →
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                                            No hay pedidos asignados a este bloque.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </main>
    );
};

export default ReportView;
