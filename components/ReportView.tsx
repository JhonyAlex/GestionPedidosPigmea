import React, { useState, useMemo } from 'react';
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

const ReportView: React.FC<ReportViewProps> = ({ pedidos, onNavigateToPedido }) => {
    // --- 1. State Management (Filters) ---
    
    // Stage Filter
    // Default: PREPARACION and LISTO_PARA_PRODUCCION
    const [selectedStages, setSelectedStages] = useState<string[]>([
        Etapa.PREPARACION, 
        STAGE_LISTO_PARA_PRODUCCION
    ]);

    // --- 2. Data Processing Engine ---

    const processedData = useMemo(() => {
        const weeklyGroups: Record<string, WeeklyData> = {};
        const machineKeysSet = new Set<string>();

        // Pre-initialize machines we want to ensure appear
        ['Windmöller 1', 'Windmöller 3', 'GIAVE', 'DNT', 'Sin Asignar', 'ANON'].forEach(m => machineKeysSet.add(m));

        // Get current week to start showing data from (or filter based)
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentWeek = getWeekNumber(today);

        // Filter orders first by stage
        const filteredPedidos = pedidos.filter(p => {
            // Stage Filtering
            const isPreparacion = p.etapaActual === Etapa.PREPARACION;
            const isListo = isPreparacion && p.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
            
            if (selectedStages.includes(STAGE_LISTO_PARA_PRODUCCION) && isListo) return true;
            if (selectedStages.includes(Etapa.PREPARACION) && isPreparacion && !isListo) return true;
            if (selectedStages.includes(p.etapaActual) && !isPreparacion) return true;
            return false;
        });

        filteredPedidos.forEach(p => {
            // Determine Week based on Delivery Date
            const dateStr = p.fechaEntrega || p.fechaCreacion; // Fallback to creation date if no delivery date
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
                    totalCapacity: 0,
                    totalLoad: 0,
                    freeCapacity: 0
                };
                // Initialize machines with 0
                machineKeysSet.forEach(key => {
                    weeklyGroups[weekKey].machines[key] = 0;
                });
            }

            // Determine Machine Category
            let machineCategory = MACHINE_SIN_ASIGNAR;
            const vendedorNombre = p.vendedorNombre?.trim().toUpperCase() || '';
            const maquinaImp = p.maquinaImpresion?.trim() || '';

            if (p.anonimo) {
                machineCategory = 'ANON';
            } else if (vendedorNombre.includes('DNT') || maquinaImp.toUpperCase().includes('DNT')) {
                machineCategory = MACHINE_DNT;
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

            // Add to known keys
            machineKeysSet.add(machineCategory);

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
            weeklyGroups[weekKey].totalLoad += hours;
        });

        // Convert to Array and Sort by Week
        const sortedWeeks = Object.values(weeklyGroups).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.week - b.week;
        });

        // Filter to show only future weeks (optional, or make it configurable)
        // For now, show all that have data
        
        // Calculate Free Capacity
        // Capacity = Number of Active Physical Machines * Capacity Per Machine
        // Active Physical Machines: WH1, WH3, GIAVE (DNT usually doesn't count towards factory capacity)
        const physicalMachines = ['Windmöller 1', 'Windmöller 3', 'GIAVE'];
        const totalWeeklyCapacity = physicalMachines.length * CAPACITY_PER_WEEK;

        sortedWeeks.forEach(group => {
            group.totalCapacity = totalWeeklyCapacity;
            
            // Calculate load only for physical machines? Or all?
            // "LIBRES" usually means factory capacity. DNT is external.
            // So we sum WH1 + WH3 + GIAVE + Sin Asignar (assuming unassigned will end up on a physical machine)
            // We EXCLUDE DNT from the load used for capacity calculation.
            let loadForCapacity = 0;
            Object.keys(group.machines).forEach(key => {
                if (key !== MACHINE_DNT) {
                    loadForCapacity += group.machines[key];
                }
            });
            
            group.freeCapacity = totalWeeklyCapacity - loadForCapacity;
        });

        return {
            weeklyData: sortedWeeks,
            machineKeys: Array.from(machineKeysSet)
        };

    }, [pedidos, selectedStages]);


    // --- 3. Render Helpers ---

    const toggleStage = (stage: string) => {
        setSelectedStages(prev => 
            prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
        );
    };

    return (
        <main className="flex-grow p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Centro de Planificación</h1>
            </div>

            {/* --- Toolbar --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
                
                {/* Stage Filters */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Etapas a Incluir</h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: Etapa.PREPARACION, label: 'Preparación (En Proceso)' },
                            { id: STAGE_LISTO_PARA_PRODUCCION, label: 'Listo para Producción' },
                            // Add other relevant stages commonly used in planning
                            { id: Etapa.IMPRESION_WM1, label: 'Impresión' }, // Simplified for UI? Or show all?
                            // For now let's show the specific ones requested + generic ones
                             ...Object.values(Etapa).filter(e => e !== Etapa.PREPARACION && e !== Etapa.PENDIENTE && e !== Etapa.COMPLETADO && e !== Etapa.ARCHIVADO).map(e => ({ id: e, label: e.replace('IMPRESION_', '').replace('POST_', '') }))
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
            />

        </main>
    );
};

export default ReportView;
