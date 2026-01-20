import React, { useState, useMemo } from 'react';
import { Pedido, Etapa, Prioridad } from '../types';
import { DateFilterOption, getDateRange } from '../utils/date';
import DateFilterCombined from './DateFilterCombined';
import { MAQUINAS_IMPRESION, PREPARACION_SUB_ETAPAS_IDS, ETAPAS } from '../constants';
import { parseTimeToMinutes } from '../utils/kpi';

interface ReportViewProps {
    pedidos: Pedido[];
    onNavigateToPedido?: (pedido: Pedido) => void;
}

// Special filter constants
const STAGE_LISTO_PARA_PRODUCCION = 'LISTO_PARA_PRODUCCION';
const MACHINE_DNT = 'DNT';
const MACHINE_SIN_ASIGNAR = 'SIN_ASIGNAR';

const ReportView: React.FC<ReportViewProps> = ({ pedidos, onNavigateToPedido }) => {
    // --- 1. State Management (Filters) ---
    
    // Stage Filter
    // Default: PREPARACION and LISTO_PARA_PRODUCCION
    const [selectedStages, setSelectedStages] = useState<string[]>([
        Etapa.PREPARACION, 
        STAGE_LISTO_PARA_PRODUCCION
    ]);

    // Machine Filter
    // Default: All machines + DNT + Sin Asignar
    const [selectedMachines, setSelectedMachines] = useState<string[]>([
        ...MAQUINAS_IMPRESION.map(m => m.id),
        MACHINE_DNT,
        MACHINE_SIN_ASIGNAR
    ]);

    // Date Filter
    const [dateField, setDateField] = useState<keyof Pedido>('fechaEntrega');
    const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

    // --- 2. Data Processing Engine ---

    const processedData = useMemo(() => {
        // 1. Filter by Date
        
        let filtered = pedidos;
        let filteredCount = 0;

        if (dateFilter !== 'all') {
             // ... existing date logic ...
             let startDate: Date | null = null;
             let endDate: Date | null = null;

             if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
                 startDate = new Date(customDateRange.start);
                 endDate = new Date(customDateRange.end);
                 endDate.setHours(23, 59, 59, 999);
             } else {
                 const range = getDateRange(dateFilter);
                 if (range) {
                     startDate = range.start;
                     endDate = range.end;
                 }
             }
             
             if (startDate && endDate) {
                 const start = startDate.getTime();
                 const end = endDate.getTime();
                 filtered = filtered.filter(p => {
                     const val = p[dateField];
                     if (!val) return false;
                     const d = new Date(val as string).getTime();
                     return d >= start && d <= end;
                 });
             }
        }
        
        filteredCount = filtered.length;

        // 2. Filter by Stage & Machine + Normalize Data
        const machineGroups: Record<string, { firm: number; variable: number; count: number }> = {};
        const tableRows: any[] = []; // We'll store processed rows for the table

        // Initialize machine groups with 0
        selectedMachines.forEach(m => {
            machineGroups[m] = { firm: 0, variable: 0, count: 0 };
        });

        filtered.forEach(p => {
            // --- Stage Filtering ---
            let matchesStage = false;
            
            // Logic for PREPARACION vs LISTO
            const isPreparacion = p.etapaActual === Etapa.PREPARACION;
            const isListo = isPreparacion && p.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
            
            if (selectedStages.includes(STAGE_LISTO_PARA_PRODUCCION) && isListo) {
                matchesStage = true;
            } else if (selectedStages.includes(Etapa.PREPARACION) && isPreparacion && !isListo) {
                matchesStage = true;
            } else if (selectedStages.includes(p.etapaActual) && !isPreparacion) { // Avoid double counting if PREPARACION selected but it's actually LISTO (handled above)
                 matchesStage = true;
            }

            if (!matchesStage) return;

            // --- Machine Normalization ---
            let normalizedMachine = MACHINE_SIN_ASIGNAR;
            
            const vendedorNombre = p.vendedorNombre?.trim().toUpperCase() || '';
            
            if (vendedorNombre === 'DNT' || vendedorNombre.includes('DNT')) {
                normalizedMachine = MACHINE_DNT;
            } else if (p.maquinaImpresion) {
                // Check if the machine is one of our known machines
                const knownMachine = MAQUINAS_IMPRESION.find(m => m.id === p.maquinaImpresion || m.nombre === p.maquinaImpresion);
                if (knownMachine) {
                    normalizedMachine = knownMachine.id;
                } else {
                     // Keep as is or map to unknown? For now, use the value if it's not empty
                     normalizedMachine = p.maquinaImpresion; 
                }
            }

            // --- Machine Filtering ---
            if (!selectedMachines.includes(normalizedMachine)) return;

            // --- Calculations ---
            // Prioritize tiempoProduccionPlanificado as requested by user, but handle "00:00" or empty
            const planificadoStr = p.tiempoProduccionPlanificado || '00:00';
            let hours = parseTimeToMinutes(planificadoStr) / 60;
            
            // Fallback to decimal if planificado is 0 but decimal exists (edge case)
            if (hours === 0 && p.tiempoProduccionDecimal) {
                hours = p.tiempoProduccionDecimal;
            }

            const isFirm = p.clicheDisponible === true;

            // Update Groups (Accumulators)
            if (machineGroups[normalizedMachine]) {
                if (isFirm) {
                    machineGroups[normalizedMachine].firm += hours;
                } else {
                    machineGroups[normalizedMachine].variable += hours;
                }
                machineGroups[normalizedMachine].count += 1;
            } else {
                // If we found a machine that wasn't in the initial map (e.g. dynamic machine names), add it if selected
                // But we initialized from selectedMachines, so this mostly handles if normalizedMachine is something else selected
                 if (selectedMachines.includes(normalizedMachine)) {
                     machineGroups[normalizedMachine] = { firm: isFirm ? hours : 0, variable: isFirm ? 0 : hours, count: 1 };
                 }
            }

            // Add to Table Rows
            tableRows.push({
                ...p,
                normalizedMachine,
                calculatedHours: hours,
                isFirm,
                isListo
            });
        });

        return { machineGroups, tableRows, filteredCount };

    }, [pedidos, selectedStages, selectedMachines, dateFilter, dateField, customDateRange]);


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

    // Calculate Totals for Footer
    const totalHours = useMemo(() => {
        return processedData.tableRows.reduce((sum, row) => sum + row.calculatedHours, 0);
    }, [processedData.tableRows]);

    return (
        <main className="flex-grow p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Centro de Planificación</h1>
            </div>

            {/* --- Toolbar --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
                
                {/* Stage Filters */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Etapas</h3>
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

                {/* Machine Filters */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Máquinas</h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            ...MAQUINAS_IMPRESION.map(m => ({ id: m.id, label: m.nombre })),
                            { id: MACHINE_DNT, label: 'DNT (Virtual)' },
                            { id: MACHINE_SIN_ASIGNAR, label: 'Sin Asignar' }
                        ].map(machine => (
                            <button
                                key={machine.id}
                                onClick={() => toggleMachine(machine.id)}
                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                    selectedMachines.includes(machine.id)
                                        ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                        : 'bg-gray-50 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                                }`}
                            >
                                {machine.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Filter */}
                <div>
                     <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Rango de Fechas</h3>
                     <DateFilterCombined
                        dateField={dateField}
                        dateFilter={dateFilter}
                        customDateRange={customDateRange}
                        onDateFieldChange={setDateField}
                        onDateFilterChange={setDateFilter}
                        onCustomDateChange={(e) => setCustomDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                     />
                </div>
            </div>

            {/* --- Chart Section --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-96">
                <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Carga de Máquina (Horas)</h2>
                {/* Custom Stacked Bar Chart Implementation */}
                <div className="flex h-64 items-end space-x-8 px-4 pb-4 border-b border-l border-gray-200 dark:border-gray-700">
                    {Object.keys(processedData.machineGroups).map(machineKey => {
                        const data = processedData.machineGroups[machineKey];
                        const total = data.firm + data.variable;
                        
                        // Show if there are orders, even if hours are 0
                        if (data.count === 0 && total === 0) return null;
                        
                        // Scale (simple max based scaling for now, ideally dynamic)
                        // Let's find global max first
                        const maxHours = Math.max(...Object.values(processedData.machineGroups).map(d => d.firm + d.variable), 1);
                        // Ensure min height if there are orders but 0 hours (e.g. 1px or 2%)
                        const minHeight = total === 0 && data.count > 0 ? 2 : 0; 
                        const heightPercent = Math.max((total / maxHours) * 100, minHeight);
                        
                        const firmPercent = total > 0 ? (data.firm / total) * 100 : 0;
                        const variablePercent = total > 0 ? (data.variable / total) * 100 : (data.count > 0 ? 100 : 0); // If 0 hours, make the tiny bar variable color by default?

                        return (
                            <div key={machineKey} className="flex flex-col items-center flex-1 group relative">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded p-2 z-10 w-32 text-center shadow-xl">
                                    <div className="font-bold">{machineKey}</div>
                                    <div>Total: {total.toFixed(1)}h</div>
                                    <div className="text-green-400">Firme: {data.firm.toFixed(1)}h</div>
                                    <div className="text-yellow-400">Var: {data.variable.toFixed(1)}h</div>
                                    <div>Pedidos: {data.count}</div>
                                </div>
                                
                                {/* Bar Container */}
                                <div className="w-full max-w-[60px] flex flex-col-reverse bg-gray-100 dark:bg-gray-700 rounded overflow-hidden relative" style={{ height: `${heightPercent}%` }}>
                                    {/* Firm Load (Bottom) */}
                                    <div style={{ height: `${firmPercent}%` }} className="bg-green-500 w-full transition-all duration-500"></div>
                                    {/* Variable Load (Top) */}
                                    <div style={{ height: `${variablePercent}%` }} className="bg-yellow-400 w-full relative transition-all duration-500">
                                         {/* Striped pattern overlay could go here */}
                                         <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xIDNMMCA0TDMgMkw0IDNMMSAzWiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')]"></div>
                                    </div>
                                    
                                    {/* Zero Hours Indicator */}
                                    {total === 0 && data.count > 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[10px] text-gray-500 font-bold">0h</span>
                                        </div>
                                    )}
                                </div>
                                <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 rotate-0 truncate w-full text-center" title={machineKey}>{machineKey}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- Detail Table --- */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {/* ... existing table code ... */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        {/* ... table content ... */}
                         <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Prioridad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pedido / Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Máquina</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Etapa</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Horas</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entrega</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {processedData.tableRows
                                .sort((a, b) => {
                                    // Sort by Priority (Enum order needs helper or map)
                                    const priorityOrder = { [Prioridad.URGENTE]: 1, [Prioridad.ALTA]: 2, [Prioridad.NORMAL]: 3, [Prioridad.BAJA]: 4 };
                                    const diff = (priorityOrder[a.prioridad] || 99) - (priorityOrder[b.prioridad] || 99);
                                    if (diff !== 0) return diff;
                                    // Then by Date
                                    return new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime();
                                })
                                .map((pedido) => (
                                <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => onNavigateToPedido?.(pedido)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${pedido.prioridad === Prioridad.URGENTE ? 'bg-red-100 text-red-800' : 
                                              pedido.prioridad === Prioridad.ALTA ? 'bg-orange-100 text-orange-800' : 
                                              'bg-green-100 text-green-800'}`}>
                                            {pedido.prioridad}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{pedido.numeroPedidoCliente}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{pedido.cliente}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {pedido.normalizedMachine}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <span title="Cliché" className={`w-3 h-3 rounded-full ${pedido.clicheDisponible ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span title="Material" className={`w-3 h-3 rounded-full ${pedido.materialDisponible ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {pedido.isListo ? 'Listo para Producción' : pedido.etapaActual.replace('IMPRESION_', '').replace('POST_', '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-mono">
                                        {pedido.calculatedHours.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {pedido.fechaEntrega}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {/* Footer Row */}
                        <tfoot className="bg-gray-100 dark:bg-gray-700 font-semibold">
                            <tr>
                                <td colSpan={5} className="px-6 py-3 text-right text-sm text-gray-700 dark:text-gray-200">Total Horas Planificadas:</td>
                                <td className="px-6 py-3 text-right text-sm text-gray-900 dark:text-white font-mono">{totalHours.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Debug Info */}
            <DebugInfo 
                all={pedidos.length} 
                filtered={processedData.filteredCount} 
                rows={processedData.tableRows.length} 
                sample={processedData.tableRows[0]}
                filters={{ selectedStages, selectedMachines, dateFilter }}
            />
        </main>
    );
};

export default ReportView;

// --- Debug Component (Optional) ---
const DebugInfo: React.FC<{ 
    all: number, 
    filtered: number, 
    rows: number, 
    sample: any,
    filters: any
}> = ({ all, filtered, rows, sample, filters }) => (
    <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 text-xs font-mono rounded border border-gray-300 dark:border-gray-600 overflow-auto max-h-60">
        <h4 className="font-bold mb-2 text-red-500">Debug Info (Remove in Prod)</h4>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <p>Total Pedidos: {all}</p>
                <p>Filtered by Date: {filtered}</p>
                <p>Final Rows: {rows}</p>
                <p>Filters: {JSON.stringify(filters, null, 2)}</p>
            </div>
            <div>
                <p>Sample Row (First Match):</p>
                <pre>{JSON.stringify(sample, null, 2)}</pre>
            </div>
        </div>
    </div>
);
