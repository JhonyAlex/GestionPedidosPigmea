import React, { useState, useMemo, useEffect } from 'react';
import { Pedido, Etapa, Prioridad } from '../types';
import { DateFilterOption, getDateRange } from '../utils/date';
import { getWeekNumber, getWeekDateRange } from '../utils/weekUtils';
import DateFilterCombined from './DateFilterCombined';
import { MAQUINAS_IMPRESION, PREPARACION_SUB_ETAPAS_IDS, ETAPAS } from '../constants';
import { parseTimeToMinutes } from '../utils/kpi';
import { PlanningTable, WeeklyData } from './PlanningTable';
import { PlanningChart } from './PlanningChart';
// @ts-ignore - jspdf types might be tricky
import { jsPDF } from 'jspdf';
// @ts-ignore - jspdf-autotable types might be tricky
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

/**
 * =============================================================================
 * ReportView - Centro de Planificación
 * =============================================================================
 * 
 * Este componente implementa la lógica de clasificación y cálculo de pedidos
 * según las especificaciones estrictas de CALCULO_REPORTES.md
 * 
 * CLASIFICACIÓN POR PRIORIDAD (orden estricto):
 * 
 * 1. DNT (Máxima prioridad)
 *    - Si vendedorNombre contiene "DNT" → Columna DNT
 * 
 * 2. (ANÓNIMOS - eliminado según spec)
 * 
 * 3. Máquina Asignada
 *    - Si tiene maquinaImpresion conocida (WM1, WM3, GIAVE)
 *    - EXCEPTO si cumple condiciones de PRIORIDAD 4
 * 
 * 4. VARIABLES
 *    - Si estado de cliché es "NUEVO" o "REPETICIÓN CON CAMBIO"
 *    - Y NO tiene horasConfirmadas = true
 *    - Y NO tiene fecha en compraCliche
 *    - O si no tiene máquina asignada
 * 
 * CÁLCULO DE CAPACIDAD LIBRE:
 * LIBRES = 180 - WH1 - WH3 - DNT
 * (GIAVE y VARIABLES no restan capacidad)
 * 
 * =============================================================================
 */

interface ReportViewProps {
    pedidos: Pedido[];
    onNavigateToPedido?: (pedido: Pedido) => void;
    onSelectPedido?: (pedido: Pedido) => void;
    auditLog?: any[]; // Optional for now
    selectedIds?: string[];
    onToggleSelection?: (id: string) => void;
    onSelectAll?: (ids: string[]) => void;
}

// Special filter constants
const STAGE_LISTO_PARA_PRODUCCION = 'LISTO_PARA_PRODUCCION';
const MACHINE_DNT = 'DNT';
const MACHINE_VARIABLES = 'VARIABLES'; // Renamed from "Sin Asignar" per spec
const CAPACITY_BASE = 180; // Fixed capacity base per spec (180 hours/week)

// Storage Keys
const STORAGE_KEY_DATE_FILTER = 'planning_date_filter';
const STORAGE_KEY_DATE_FIELD = 'planning_date_field';
const STORAGE_KEY_STAGES = 'planning_selected_stages';
const STORAGE_KEY_MACHINES = 'planning_selected_machines';

const ReportView: React.FC<ReportViewProps> = ({ 
    pedidos, 
    onNavigateToPedido, 
    onSelectPedido,
    selectedIds,
    onToggleSelection,
    onSelectAll
}) => {
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

    const allMachineOptions = ['Windmöller 1', 'Windmöller 3', 'GIAVE', 'DNT', 'VARIABLES'];
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

        // ============================================================================
        // FILTRADO INICIAL DE PEDIDOS (según CALCULO_REPORTES.md)
        // Se incluyen pedidos de todas las etapas EXCEPTO Archivados
        // Se filtran por rango de fechas según el campo seleccionado
        // ============================================================================
        const filteredPedidos = pedidos.filter(p => {
            // 1. Excluir archivados
            if (p.etapaActual === Etapa.ARCHIVADO) return false;

            // 2. Stage Filtering
            const isPreparacion = p.etapaActual === Etapa.PREPARACION;
            const isListo = isPreparacion && p.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
            
            let stageMatch = false;
            if (selectedStages.includes(STAGE_LISTO_PARA_PRODUCCION) && isListo) stageMatch = true;
            else if (selectedStages.includes(Etapa.PREPARACION) && isPreparacion && !isListo) stageMatch = true;
            else if (selectedStages.includes(p.etapaActual) && !isPreparacion) stageMatch = true;

            if (!stageMatch) return false;

            // 3. Date Filtering
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
            // Determine Week based on selected date field
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

            // ============================================================================
            // CLASSIFICATION LOGIC - Following CALCULO_REPORTES.md Strict Priority Order
            // ============================================================================
            let machineCategory = MACHINE_VARIABLES; // Default fallback
            const vendedorNombre = p.vendedorNombre?.trim().toUpperCase() || '';
            const maquinaImp = p.maquinaImpresion?.trim() || '';

            // --- PRIORIDAD 1: DNT (MÁXIMA PRIORIDAD) ---
            // Si el nombre del vendedor contiene "DNT", va a columna DNT sin importar la máquina
            if (vendedorNombre.includes('DNT')) {
                machineCategory = MACHINE_DNT;
            }
            // --- PRIORIDAD 3: Máquina Asignada (Identificada) ---
            // Si no es DNT, verificar si tiene máquina asignada conocida
            else if (maquinaImp) {
                const knownMachine = MAQUINAS_IMPRESION.find(m => m.id === maquinaImp || m.nombre === maquinaImp);
                if (knownMachine) {
                    // --- PRIORIDAD 4: VARIABLES ---
                    // SOLO si cumple TODAS estas condiciones, va a VARIABLES:
                    // 1. Estado de cliché es "NUEVO" o "REPETICION CON CAMBIO"
                    // 2. NO tiene "horasConfirmadas" = true
                    // 3. NO tiene fecha en "compraCliche"
                    const esEstadoVariable = p.estadoCliché === 'NUEVO' || p.estadoCliché === 'REPETICIÓN CON CAMBIO';
                    const noTieneHorasConfirmadas = !p.horasConfirmadas;
                    const noTieneCompraCliché = !p.compraCliche;

                    if (esEstadoVariable && noTieneHorasConfirmadas && noTieneCompraCliché) {
                        machineCategory = MACHINE_VARIABLES;
                    } else {
                        // Si tiene máquina y NO cumple condiciones de VARIABLE, va a su máquina
                        machineCategory = knownMachine.nombre;
                    }
                } else {
                    // Máquina no reconocida, usar el valor tal cual
                    machineCategory = maquinaImp;
                }
            }
            // Si no tiene vendedor DNT, ni máquina asignada → VARIABLES
            else {
                machineCategory = MACHINE_VARIABLES;
            }

            // ONLY process if machine is in selected machines
            if (selectedMachines.includes(machineCategory)) {
                // ============================================================================
                // CÁLCULO DE TIEMPO DE PRODUCCIÓN (según CALCULO_REPORTES.md)
                // 1. Intentar leer tiempoProduccionPlanificado (formato "HH:MM")
                // 2. Si no existe o es 0, usar tiempoProduccionDecimal
                // 3. Si ambos faltan, asumir 0 horas
                // ============================================================================
                let hours = 0;
                
                const planificadoStr = p.tiempoProduccionPlanificado || '00:00';
                hours = parseTimeToMinutes(planificadoStr) / 60;
                
                // Fallback: Si planificado es 0 o vacío, usar decimal
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
        // Fórmula según CALCULO_REPORTES.md: LIBRES = 180 - WH1 - WH3 - DNT
        sortedWeeks.forEach(group => {
            group.totalCapacity = CAPACITY_BASE;
            
            const wh1 = group.machines['Windmöller 1'] || 0;
            const wh3 = group.machines['Windmöller 3'] || 0;
            const dnt = group.machines['DNT'] || 0;
            
            // Fórmula: 180 - WH1 - WH3 - DNT
            // GIAVE y VARIABLES NO restan capacidad
            group.freeCapacity = CAPACITY_BASE - wh1 - wh3 - dnt;
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

    const handleExportPDF = async () => {
        const doc = new jsPDF();

        // --- Header ---
        doc.setFontSize(18);
        doc.text('Informe de Planificación - PIGMEA', 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 28);
        doc.text(`Filtro: ${dateFilter === 'all' ? 'Todos' : dateFilter}`, 14, 33);

        let startY = 40;

        // --- Chart Capture ---
        const chartElement = document.getElementById('planning-chart-container');
        if (chartElement) {
            try {
                const canvas = await html2canvas(chartElement, {
                    scale: 2, // Improve quality
                    useCORS: true,
                    logging: false
                });
                
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 180; // A4 width is ~210mm, leaving margins
                const pageHeight = 295; 
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Add Image
                doc.addImage(imgData, 'PNG', 15, startY, imgWidth, imgHeight);
                startY += imgHeight + 10; // Move Y down for table
            } catch (error) {
                console.error("Error capturing chart for PDF", error);
                doc.text('(Error al generar gráfico)', 14, startY);
                startY += 10;
            }
        }

        // --- Table Data Preparation ---
        const tableColumn = [
            'Semana', 
            'Fechas', 
            ...processedData.machineKeys, 
            'Total Carga', 
            'Capacidad', 
            'Libres'
        ];

        const tableRows = processedData.weeklyData.map(row => {
            const machineValues = processedData.machineKeys.map(key => 
                (row.machines[key] || 0).toFixed(1)
            );
            
            return [
                row.label,
                row.dateRange,
                ...machineValues,
                row.totalLoad.toFixed(1),
                row.totalCapacity.toFixed(0),
                row.freeCapacity.toFixed(1)
            ];
        });

        // --- Generate Table ---
        // @ts-ignore - jspdf-autotable types might conflict with jspdf instance
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] }, // Blue-ish
            margin: { top: 20 }
        });

        // --- Footer / Save ---
        doc.save(`planificacion_pigmea_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <main className="flex-grow p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Centro de Planificación</h1>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exportar PDF
                    </button>
                </div>
                
                {/* Date Filter */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
                    <DateFilterCombined
                        dateField={dateField}
                        dateFilter={dateFilter}
                        customDateRange={customDateRange}
                        onDateFieldChange={setDateField}
                        onDateFilterChange={setDateFilter}
                        onCustomDateChange={(e) => setCustomDateRange({ ...customDateRange, [e.target.name]: e.target.value })}
                        align="right"
                    />
                </div>
            </div>

            {/* --- Toolbar --- */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
                
                {/* Machine Filters */}
                <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        Máquinas / Categorías
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {allMachineOptions.map(machine => {
                            const machineColors: Record<string, { active: string; inactive: string }> = {
                                'Windmöller 1': { active: 'bg-blue-100 border-blue-600 text-blue-800 shadow-sm', inactive: 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50' },
                                'Windmöller 3': { active: 'bg-red-100 border-red-600 text-red-800 shadow-sm', inactive: 'bg-white border-red-300 text-red-600 hover:bg-red-50' },
                                'GIAVE': { active: 'bg-orange-100 border-orange-600 text-orange-800 shadow-sm', inactive: 'bg-white border-orange-300 text-orange-600 hover:bg-orange-50' },
                                'DNT': { active: 'bg-green-100 border-green-600 text-green-800 shadow-sm', inactive: 'bg-white border-green-300 text-green-600 hover:bg-green-50' },
                                'VARIABLES': { active: 'bg-purple-100 border-purple-600 text-purple-800 shadow-sm', inactive: 'bg-white border-purple-300 text-purple-600 hover:bg-purple-50' },
                            };
                            const colors = machineColors[machine] || { active: 'bg-gray-100 border-gray-600 text-gray-800', inactive: 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50' };
                            return (
                                <button
                                    key={machine}
                                    onClick={() => toggleMachine(machine)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                                        selectedMachines.includes(machine) ? colors.active : colors.inactive
                                    }`}
                                >
                                    {machine}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Stage Filters */}
                <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Etapas del Proceso
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: Etapa.PREPARACION, label: 'Preparación', color: 'amber' },
                            { id: STAGE_LISTO_PARA_PRODUCCION, label: 'Listo para Producción', color: 'emerald' },
                            { id: Etapa.IMPRESION_WM1, label: 'Impresión', color: 'cyan' },
                            { id: Etapa.COMPLETADO, label: 'Completados', color: 'teal' },
                            ...Object.values(Etapa)
                                .filter(e => e !== Etapa.PREPARACION && e !== Etapa.PENDIENTE && e !== Etapa.COMPLETADO && e !== Etapa.ARCHIVADO && e !== Etapa.IMPRESION_WM1)
                                .map(e => ({ id: e, label: e.replace('IMPRESION_', '').replace('POST_', '').replace('_', ' '), color: 'slate' }))
                        ].map(stage => {
                            const stageColors: Record<string, { active: string; inactive: string }> = {
                                'amber': { active: 'bg-amber-100 border-amber-600 text-amber-900 shadow-sm', inactive: 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50' },
                                'emerald': { active: 'bg-emerald-100 border-emerald-600 text-emerald-900 shadow-sm', inactive: 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50' },
                                'cyan': { active: 'bg-cyan-100 border-cyan-600 text-cyan-900 shadow-sm', inactive: 'bg-white border-cyan-300 text-cyan-700 hover:bg-cyan-50' },
                                'teal': { active: 'bg-teal-100 border-teal-600 text-teal-900 shadow-sm', inactive: 'bg-white border-teal-300 text-teal-700 hover:bg-teal-50' },
                                'slate': { active: 'bg-slate-100 border-slate-600 text-slate-900 shadow-sm', inactive: 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' },
                            };
                            const colors = stageColors[stage.color] || stageColors['slate'];
                            return (
                                <button
                                    key={stage.id}
                                    onClick={() => toggleStage(stage.id)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                                        selectedStages.includes(stage.id) ? colors.active : colors.inactive
                                    }`}
                                >
                                    {stage.label}
                                </button>
                            );
                        })}
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
            <div id="planning-chart-container">
                <PlanningChart 
                    data={processedData.weeklyData} 
                    machineKeys={processedData.machineKeys} 
                    onBarClick={handleBarClick}
                />
            </div>

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
                                    {onSelectAll && (
                                        <th scope="col" className="px-6 py-3 text-center w-10">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                checked={selectedPedidos.length > 0 && selectedPedidos.every(p => selectedIds?.includes(p.id))}
                                                onChange={() => onSelectAll(selectedPedidos.map(p => p.id))}
                                            />
                                        </th>
                                    )}
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
                                                className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group ${selectedIds?.includes(pedido.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                onClick={() => {
                                                    if (onSelectPedido) {
                                                        onSelectPedido(pedido);
                                                    } else if (onNavigateToPedido) {
                                                        onNavigateToPedido(pedido);
                                                    }
                                                }}
                                            >
                                                {onToggleSelection && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                            checked={selectedIds?.includes(pedido.id) || false}
                                                            onChange={() => onToggleSelection(pedido.id)}
                                                        />
                                                    </td>
                                                )}
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
                                        <td colSpan={onSelectAll ? 8 : 7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                                            No hay pedidos asignados a esta categoría.
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
