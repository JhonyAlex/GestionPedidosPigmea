import React, { useState, useMemo, useEffect } from 'react';
import { Pedido, Etapa, Prioridad } from '../types';
import { DateFilterOption, getDateRange, formatMetros, formatDecimalHoursToHHMM } from '../utils/date';
import { getWeekNumber, getWeekDateRange } from '../utils/weekUtils';
import DateFilterCombined from './DateFilterCombined';
import { MAQUINAS_IMPRESION, PREPARACION_SUB_ETAPAS_IDS, ETAPAS } from '../constants';
import { parseTimeToMinutes } from '../utils/kpi';
import { PlanningTable, WeeklyData } from './PlanningTable';
import { PlanningChart } from './PlanningChart';
import CustomAnalysisModal from './CustomAnalysisModal';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { useClientesManager } from '../hooks/useClientesManager';
import { useVendedoresManager } from '../hooks/useVendedoresManager';
// @ts-ignore - jspdf types might be tricky
import { jsPDF } from 'jspdf';
// @ts-ignore - jspdf-autotable types might be tricky
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { generateProductionAnalysis, saveAnalysisToCache, getAnalysisFromCache, clearAnalysisCache } from '../utils/aiAnalysis';
import { io, Socket } from 'socket.io-client';
import InfoTooltip from './InfoTooltip';
import ClientOrderFilter from './ClientOrderFilter';

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
 *    - Si vendedorNombre O cliente contiene "DNT" → Columna DNT
 *    - Esta regla invalida todas las demás (máquina, variables, etc.)
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
 *    - Y NO tiene clicheDisponible = true
 *    - O si no tiene máquina asignada
 * 
 * CÁLCULO DE CAPACIDAD LIBRE:
 * LIBRES = 190 - WH1 - WH3 - DNT
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
const CAPACITY_BASE = 190; // Fixed capacity base per spec (190 hours/week)

// Storage Keys
const STORAGE_KEY_DATE_FILTER = 'planning_date_filter';
const STORAGE_KEY_DATE_FIELD = 'planning_date_field';
const STORAGE_KEY_STAGES = 'planning_selected_stages';
const STORAGE_KEY_MACHINES = 'planning_selected_machines';
const STORAGE_KEY_CUSTOM_DATE_RANGE = 'planning_custom_date_range';

const ReportView: React.FC<ReportViewProps> = ({
    pedidos,
    onNavigateToPedido,
    onSelectPedido,
    selectedIds,
    onToggleSelection,
    onSelectAll
}) => {
    // --- Tab State ---
    const [activeTab, setActiveTab] = useState<'planning' | 'analytics'>('planning');

    // 🔥 NUEVA FUNCIONALIDAD: Sincronización en tiempo real de clientes y vendedores
    const { clientes } = useClientesManager();
    const { vendedores } = useVendedoresManager();

    // Crear mapas de clientes y vendedores para búsqueda rápida por ID
    const clientesMap = useMemo(() => {
        const map = new Map<string, string>();
        clientes.forEach(c => map.set(c.id, c.nombre));
        return map;
    }, [clientes]);

    const vendedoresMap = useMemo(() => {
        const map = new Map<string, string>();
        vendedores.forEach(v => map.set(v.id, v.nombre));
        return map;
    }, [vendedores]);

    // Enriquecer pedidos con nombres actualizados de clientes y vendedores
    const enrichedPedidos = useMemo(() => {
        return pedidos.map(pedido => {
            const updatedPedido = { ...pedido };

            // Actualizar nombre del cliente si hay un clienteId
            if (pedido.clienteId && clientesMap.has(pedido.clienteId)) {
                const nombreActualizado = clientesMap.get(pedido.clienteId)!;
                if (updatedPedido.cliente !== nombreActualizado) {
                    updatedPedido.cliente = nombreActualizado;
                }
            }

            // Actualizar nombre del vendedor si hay un vendedorId
            if (pedido.vendedorId && vendedoresMap.has(pedido.vendedorId)) {
                const nombreActualizado = vendedoresMap.get(pedido.vendedorId)!;
                if (updatedPedido.vendedorNombre !== nombreActualizado) {
                    updatedPedido.vendedorNombre = nombreActualizado;
                }
            }

            return updatedPedido;
        });
    }, [pedidos, clientesMap, vendedoresMap]);

    // --- 1. State Management (Filters) ---

    // Load initial states from localStorage
    const [dateFilter, setDateFilter] = useState<DateFilterOption>(() => {
        return (localStorage.getItem(STORAGE_KEY_DATE_FILTER) as DateFilterOption) || 'next-week';
    });

    const [dateField, setDateField] = useState<keyof Pedido>(() => {
        return (localStorage.getItem(STORAGE_KEY_DATE_FIELD) as keyof Pedido) || 'nuevaFechaEntrega';
    });

    const [customDateRange, setCustomDateRange] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_DATE_RANGE);
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
        const saved = localStorage.getItem(STORAGE_KEY_STAGES);
        return saved ? JSON.parse(saved) : [Etapa.PREPARACION, STAGE_LISTO_PARA_PRODUCCION];
    });

    const allMachineOptions = ['Windmöller 1', 'Windmöller 3', 'GIAVE', 'DNT', 'VARIABLES'];
    const [selectedMachines, setSelectedMachines] = useState<string[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_MACHINES);
        return saved ? JSON.parse(saved) : allMachineOptions;
    });

    const [selectedChartFilter, setSelectedChartFilter] = useState<{ weekLabel: string, machine: string } | null>(null);

    // Sorting State for Details Table
    type SortColumn = 'pedido' | 'cliente' | 'descripcion' | 'fecha' | 'metros' | 'tiempo';
    type SortDirection = 'asc' | 'desc';
    const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // AI Analysis State
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Custom Instructions State
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customInstructions, setCustomInstructions] = useState<string>('');
    const [isSavingInstructions, setIsSavingInstructions] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    // Detectar cambios en filtros y limpiar análisis automáticamente
    useEffect(() => {
        // Si hay un análisis visible, limpiarlo cuando cambian los filtros
        if (showAnalysis || aiAnalysis) {
            console.log('🔄 Filtros cambiaron, limpiando análisis anterior');
            setShowAnalysis(false);
            setAiAnalysis(null);
            setAnalysisError(null);
            // Limpiar cache para forzar regeneración con datos actuales
            clearAnalysisCache();
        }
    }, [dateFilter, dateField, customDateRange, selectedStages, selectedMachines]);

    // Detectar cambios en instrucciones personalizadas y limpiar análisis
    useEffect(() => {
        // Limpiar análisis cuando cambian las instrucciones personalizadas
        if (aiAnalysis) {
            console.log('📝 Instrucciones personalizadas cambiaron, limpiando análisis anterior');
            setShowAnalysis(false);
            setAiAnalysis(null);
            setAnalysisError(null);
            // Limpiar cache para permitir regeneración con nuevas instrucciones
            clearAnalysisCache();
        }
    }, [customInstructions]);

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

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_CUSTOM_DATE_RANGE, JSON.stringify(customDateRange));
    }, [customDateRange]);

    // --- Cargar instrucciones personalizadas y configurar Socket.IO ---
    useEffect(() => {
        // Cargar instrucciones
        const loadInstructions = async () => {
            try {
                const response = await fetch('/api/analysis/instructions');
                const data = await response.json();
                setCustomInstructions(data.instructions || '');
            } catch (error) {
                console.error('Error loading custom instructions:', error);
            }
        };
        loadInstructions();

        // Configurar Socket.IO para sincronización en tiempo real
        const API_BASE = process.env.NODE_ENV === 'production'
            ? window.location.origin
            : 'http://localhost:8080';

        const socketInstance = io(API_BASE, {
            transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
            console.log('🔌 Conectado a Socket.IO para instrucciones de análisis');
        });

        socketInstance.on('analysis-instructions-updated', (data: { instructions: string }) => {
            console.log('📡 Instrucciones actualizadas desde otro usuario');
            setCustomInstructions(data.instructions);
            // Limpiar análisis actual si está visible
            if (showAnalysis) {
                setShowAnalysis(false);
                setAiAnalysis(null);
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);


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
        const filteredPedidos = enrichedPedidos.filter(p => {
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

                // Calcular lunes a viernes SOLO para visualización
                // (los cálculos siguen usando la semana completa lunes-domingo)
                const monday = new Date(start);
                const friday = new Date(start);
                friday.setDate(monday.getDate() + 4); // Lunes + 4 días = Viernes

                const mondayStr = monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                const fridayStr = friday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

                weeklyGroups[weekKey] = {
                    week: weekNum,
                    year: year,
                    label: `SEMANA ${weekNum} (${year})`,
                    dateRange: `${mondayStr} al ${fridayStr}`, // Mostrar lunes a viernes
                    weekStartDate: new Date(start), // Fecha real de inicio para ordenamiento cronológico
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
            const clienteNombre = p.cliente?.trim().toUpperCase() || '';
            const maquinaImp = p.maquinaImpresion?.trim() || '';

            // --- PRIORIDAD 1: DNT (MÁXIMA PRIORIDAD) ---
            // Si el nombre del vendedor O del cliente contiene "DNT", va a columna DNT sin importar la máquina
            if (vendedorNombre.includes('DNT') || clienteNombre.includes('DNT')) {
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
                    // 4. NO tiene "clicheDisponible" = true
                    const esEstadoVariable = p.estadoCliché === 'NUEVO' || p.estadoCliché === 'REPETICIÓN CON CAMBIO';
                    const noTieneHorasConfirmadas = !p.horasConfirmadas;
                    const noTieneCompraCliché = !p.compraCliche;
                    const noTieneClicheDisponible = !p.clicheDisponible;

                    if (esEstadoVariable && noTieneHorasConfirmadas && noTieneCompraCliché && noTieneClicheDisponible) {
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

        // Convert to Array and Sort by Week Start Date (chronological order)
        const sortedWeeks = Object.values(weeklyGroups).sort((a, b) => {
            return a.weekStartDate.getTime() - b.weekStartDate.getTime();
        });

        // Calculate Free Capacity
        // Fórmula según CALCULO_REPORTES.md: LIBRES = 190 - WH1 - WH3 - DNT
        sortedWeeks.forEach(group => {
            group.totalCapacity = CAPACITY_BASE;

            const wh1 = group.machines['Windmöller 1'] || 0;
            const wh3 = group.machines['Windmöller 3'] || 0;
            const dnt = group.machines['DNT'] || 0;

            // Fórmula: 190 - WH1 - WH3 - DNT
            // GIAVE y VARIABLES NO restan capacidad
            group.freeCapacity = CAPACITY_BASE - wh1 - wh3 - dnt;
        });

        return {
            weeklyData: sortedWeeks,
            machineKeys: selectedMachines.filter(m =>
                ['Windmöller 1', 'Windmöller 3', 'GIAVE', 'DNT', 'VARIABLES'].includes(m)
            ) // Filtrar solo máquinas permitidas, excluir ANON y Sin Asignar
        };

    }, [enrichedPedidos, selectedStages, selectedMachines, dateFilter, dateField, customDateRange]);

    // Derived state for details table with sorting
    const selectedPedidos = useMemo(() => {
        if (!selectedChartFilter) return [];
        const week = processedData.weeklyData.find(w => w.label === selectedChartFilter.weekLabel);
        let pedidos = week?.machinePedidos?.[selectedChartFilter.machine] || [];

        // Apply sorting if a column is selected
        if (sortColumn) {
            pedidos = [...pedidos].sort((a, b) => {
                let compareResult = 0;

                switch (sortColumn) {
                    case 'pedido':
                        compareResult = (a.numeroPedidoCliente || '').localeCompare(b.numeroPedidoCliente || '');
                        break;
                    case 'cliente':
                        compareResult = (a.cliente || '').localeCompare(b.cliente || '');
                        break;
                    case 'descripcion':
                        const descA = a.producto || a.descripcion || '';
                        const descB = b.producto || b.descripcion || '';
                        compareResult = descA.localeCompare(descB);
                        break;
                    case 'fecha':
                        const dateA = new Date(a.nuevaFechaEntrega || a.fechaEntrega || 0);
                        const dateB = new Date(b.nuevaFechaEntrega || b.fechaEntrega || 0);
                        compareResult = dateA.getTime() - dateB.getTime();
                        break;
                    case 'metros':
                        compareResult = (Number(a.metros) || 0) - (Number(b.metros) || 0);
                        break;
                    case 'tiempo':
                        // Calculate hours for comparison
                        let hoursA = 0;
                        if (a.tiempoProduccionPlanificado) {
                            hoursA = parseTimeToMinutes(a.tiempoProduccionPlanificado) / 60;
                        } else if (a.tiempoProduccionDecimal) {
                            hoursA = a.tiempoProduccionDecimal;
                        }

                        let hoursB = 0;
                        if (b.tiempoProduccionPlanificado) {
                            hoursB = parseTimeToMinutes(b.tiempoProduccionPlanificado) / 60;
                        } else if (b.tiempoProduccionDecimal) {
                            hoursB = b.tiempoProduccionDecimal;
                        }

                        compareResult = hoursA - hoursB;
                        break;
                }

                return sortDirection === 'asc' ? compareResult : -compareResult;
            });
        }

        return pedidos;
    }, [processedData, selectedChartFilter, sortColumn, sortDirection]);


    // --- 3. AI Analysis Functions ---

    const handleGenerateAnalysis = async () => {
        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
            const request = {
                weeklyData: processedData.weeklyData,
                machineKeys: processedData.machineKeys,
                dateFilter,
                selectedStages,
                selectedMachines,
                customDateRange
            };

            // Intentar obtener del cache primero
            const cached = await getAnalysisFromCache(request);
            if (cached) {
                setAiAnalysis(cached);
                setShowAnalysis(true);
                setIsAnalyzing(false);
                return;
            }

            // Generar nuevo análisis
            const analysis = await generateProductionAnalysis(request);
            setAiAnalysis(analysis);
            setShowAnalysis(true);

            // Guardar en cache
            await saveAnalysisToCache(request, analysis);

        } catch (error) {
            console.error('Error generating analysis:', error);
            setAnalysisError(error instanceof Error ? error.message : 'Error desconocido');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveInstructions = async (instructions: string) => {
        setIsSavingInstructions(true);
        try {
            const savedUser = localStorage.getItem('pigmea_user');
            const user = savedUser ? JSON.parse(savedUser) : null;

            const response = await fetch('/api/analysis/instructions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user?.id || '',
                    'x-user-role': user?.role || 'OPERATOR'
                },
                body: JSON.stringify({ instructions })
            });

            if (!response.ok) {
                throw new Error('Error al guardar instrucciones');
            }

            setCustomInstructions(instructions);
            setShowCustomModal(false);

            // Limpiar análisis actual para forzar regeneración
            setShowAnalysis(false);
            setAiAnalysis(null);

        } catch (error) {
            console.error('Error saving instructions:', error);
            alert('Error al guardar instrucciones personalizadas');
        } finally {
            setIsSavingInstructions(false);
        }
    };


    // --- 4. Render Helpers ---

    // Función para formatear fechas de yyyy-mm-dd a dd-mm-yyyy
    const formatDateToDDMMYYYY = (dateString: string | undefined): string => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Si no es válida, devolver original

            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();

            return `${day}-${month}-${year}`;
        } catch (error) {
            return dateString; // En caso de error, devolver original
        }
    };

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

        // Reset sorting when changing filter
        setSortColumn(null);
        setSortDirection('asc');

        setTimeout(() => {
            const element = document.getElementById('planning-details-table');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    // Handler for column header clicks
    const handleColumnSort = (column: SortColumn) => {
        if (sortColumn === column) {
            // Toggle direction if same column
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // New column, default to ascending
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Render sort indicator
    const renderSortIndicator = (column: SortColumn) => {
        if (sortColumn !== column) {
            return (
                <svg className="w-4 h-4 ml-1 text-gray-400 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }

        return sortDirection === 'asc' ? (
            <svg className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    // Función helper para procesar formato Markdown en texto
    const parseMarkdownText = (text: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        // Regex para encontrar **texto** (negrita)
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;

        while ((match = boldRegex.exec(text)) !== null) {
            // Agregar texto antes del match
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            // Agregar texto en negrita
            parts.push(<strong key={`bold-${match.index}`} className="font-semibold text-gray-900 dark:text-white">{match[1]}</strong>);
            lastIndex = match.index + match[0].length;
        }

        // Agregar texto restante
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : [text];
    };

    // Función para renderizar el análisis con mejor formato
    const renderAnalysis = (text: string) => {
        // Dividir por líneas
        const lines = text.split('\n');
        const elements: React.ReactElement[] = [];
        let currentSection: string[] = [];
        let sectionIndex = 0;

        const flushSection = () => {
            if (currentSection.length > 0) {
                elements.push(
                    <div key={`section-${sectionIndex++}`} className="mb-4">
                        {currentSection.map((line, idx) => {
                            // Headers (texto que termina en :)
                            if (line.trim().endsWith(':') && line.trim().length < 50) {
                                return (
                                    <h4 key={idx} className="font-bold text-indigo-800 dark:text-indigo-300 text-base mb-2 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-indigo-600 rounded"></span>
                                        {line.replace(':', '')}
                                    </h4>
                                );
                            }
                            // Bullets (líneas que empiezan con • o -)
                            else if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('→')) {
                                const icon = line.trim().startsWith('→') ? '→' : line.trim().startsWith('⚠️') ? '⚠️' : '✓';
                                const content = line.replace(/^[•\-→⚠️]\s*/, '').trim();
                                const isWarning = line.includes('⚠️') || content.toLowerCase().includes('urgente') || content.toLowerCase().includes('crítico');
                                const isPositive = line.includes('✅') || content.toLowerCase().includes('oportunidad') || content.toLowerCase().includes('disponible');

                                return (
                                    <div key={idx} className={`flex items-start gap-2 mb-2 pl-2 py-1.5 rounded ${isWarning ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400' :
                                        isPositive ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-400' :
                                            'bg-gray-50 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600'
                                        }`}>
                                        <span className={`text-lg flex-shrink-0 ${isWarning ? 'text-amber-600' :
                                            isPositive ? 'text-green-600' :
                                                'text-purple-500'
                                            }`}>
                                            {icon}
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{parseMarkdownText(content)}</span>
                                    </div>
                                );
                            }
                            // Números al inicio (1., 2., etc)
                            else if (/^\d+\./.test(line.trim())) {
                                const [num, ...rest] = line.split('.');
                                return (
                                    <div key={idx} className="flex items-start gap-3 mb-2">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 text-white text-xs font-bold flex items-center justify-center">
                                            {num}
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{parseMarkdownText(rest.join('.').trim())}</span>
                                    </div>
                                );
                            }
                            // Texto normal
                            else if (line.trim()) {
                                return (
                                    <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                                        {parseMarkdownText(line)}
                                    </p>
                                );
                            }
                            return null;
                        })}
                    </div>
                );
                currentSection = [];
            }
        };

        lines.forEach((line) => {
            if (line.trim() === '') {
                flushSection();
            } else {
                currentSection.push(line);
            }
        });
        flushSection();

        return elements;
    };

    const handleExportPDF = async () => {
        const doc = new jsPDF();

        // --- Header ---
        doc.setFontSize(24);
        doc.text('Informe de Planificación - PIGMEA', 10, 20);

        doc.setFontSize(13);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 10, 30);
        doc.text(`Filtro: ${dateFilter === 'all' ? 'Todos' : dateFilter}`, 10, 36);

        let startY = 45;

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
                const imgWidth = 190; // A4 width is ~210mm, leaving margins
                const pageHeight = 295;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Add Image
                doc.addImage(imgData, 'PNG', 10, startY, imgWidth, imgHeight);
                startY += imgHeight + 10; // Move Y down for table
            } catch (error) {
                console.error("Error capturing chart for PDF", error);
                doc.text('(Error al generar gráfico)', 10, startY);
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
                formatDecimalHoursToHHMM(row.machines[key])
            );

            return [
                row.label,
                row.dateRange,
                ...machineValues,
                formatDecimalHoursToHHMM(row.totalLoad),
                formatDecimalHoursToHHMM(row.totalCapacity),
                formatDecimalHoursToHHMM(row.freeCapacity)
            ];
        });

        // --- Generate Table ---
        // @ts-ignore - jspdf-autotable types might conflict with jspdf instance
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            styles: { fontSize: 11 },
            headStyles: { fillColor: [66, 139, 202] }, // Blue-ish
            margin: { top: 20, left: 10, right: 10 }
        });

        // --- Footer / Save ---
        doc.save(`planificacion_pigmea_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <main className="flex-grow p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-1 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('planning')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium text-sm transition-all ${activeTab === 'planning'
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Centro de Planificación
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium text-sm transition-all ${activeTab === 'analytics'
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Informes y Analítica
                    </button>
                </div>
            </div>

            {/* Conditional Content Based on Active Tab */}
            {activeTab === 'analytics' ? (
                <AnalyticsDashboard />
            ) : (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Centro de Planificación</h1>

                            {/* Custom Instructions Button */}
                            <button
                                onClick={() => setShowCustomModal(true)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md transition-all shadow-sm hover:shadow-md group"
                                title="Personalizar instrucciones de análisis"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="hidden sm:inline">Personalizar</span>
                                {customInstructions && (
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
                                )}
                            </button>

                            {/* AI Analysis Button - Discreto */}
                            <button
                                onClick={handleGenerateAnalysis}
                                disabled={isAnalyzing || processedData.weeklyData.length === 0}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white text-xs font-medium rounded-md transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                title="Generar análisis gerencial con IA"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analizando...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        Análisis IA
                                    </>
                                )}
                            </button>

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

                    {/* --- AI Analysis Panel (Collapsible) --- */}
                    {showAnalysis && (aiAnalysis || analysisError) && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850 rounded-lg shadow-md border border-purple-200 dark:border-purple-900 overflow-hidden animate-fade-in">
                            <div className="flex items-start justify-between p-4 border-b border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-gray-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Análisis Gerencial</h3>
                                            <InfoTooltip
                                                content="Este análisis es generado por IA utilizando los datos filtrados de planificación semanal, incluyendo carga de trabajo por máquina, capacidad disponible y pedidos programados. El análisis considera las instrucciones personalizadas configuradas."
                                                position="right"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Generado con IA • {new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAnalysis(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                    title="Cerrar análisis"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                {analysisError ? (
                                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-red-800 dark:text-red-300">Error al generar análisis</p>
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{analysisError}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {renderAnalysis(aiAnalysis || '')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- Client Order Filter --- */}
                    <ClientOrderFilter
                        pedidos={enrichedPedidos}
                        clientes={clientes}
                        onSelectPedido={onSelectPedido}
                        onNavigateToPedido={onNavigateToPedido}
                    />

                    {/* --- Toolbar --- */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">

                        {/* Machine Filters */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                                Máquinas / Categorías
                                <InfoTooltip
                                    content="Los pedidos se clasifican automáticamente según: 1) DNT (clientes/vendedores con 'DNT' en el nombre), 2) Máquina asignada (WM1, WM3, GIAVE), 3) VARIABLES (pedidos con clichés nuevos o cambios sin confirmar horas). Selecciona las categorías que deseas visualizar."
                                    position="right"
                                />
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {allMachineOptions.map(machine => {
                                    const machineColors: Record<string, { active: string; inactive: string }> = {
                                        'Windmöller 1': { active: 'bg-blue-900 border-blue-950 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'Windmöller 3': { active: 'bg-red-900 border-red-950 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'GIAVE': { active: 'bg-orange-900 border-orange-950 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'DNT': { active: 'bg-green-900 border-green-950 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'VARIABLES': { active: 'bg-purple-900 border-purple-950 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                    };
                                    const colors = machineColors[machine] || { active: 'bg-gray-500 border-gray-600 text-white shadow-lg', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' };
                                    return (
                                        <button
                                            key={machine}
                                            onClick={() => toggleMachine(machine)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${selectedMachines.includes(machine) ? colors.active : colors.inactive
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
                                <InfoTooltip
                                    content="Filtra los pedidos por su etapa actual en el flujo de producción. Los pedidos en 'Listo para Producción' son aquellos en Preparación que han completado todos los requisitos. Excluye automáticamente pedidos archivados."
                                    position="right"
                                />
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    // Etapas Pre-Producción
                                    { id: Etapa.PREPARACION, label: 'Preparación', color: 'amber' },
                                    { id: STAGE_LISTO_PARA_PRODUCCION, label: 'Listo para Producción', color: 'emerald' },

                                    // Etapas de Impresión
                                    { id: Etapa.IMPRESION_WM1, label: 'Windmöller 1', color: 'cyan' },
                                    { id: Etapa.IMPRESION_WM3, label: 'Windmöller 3', color: 'cyan' },
                                    { id: Etapa.IMPRESION_GIAVE, label: 'GIAVE', color: 'cyan' },

                                    // Etapas Post-Impresión - Laminación
                                    { id: Etapa.POST_LAMINACION_SL2, label: 'Laminación SL2', color: 'indigo' },
                                    { id: Etapa.POST_LAMINACION_NEXUS, label: 'Laminación NEXUS', color: 'indigo' },

                                    // Etapas Post-Impresión - Ec-convert
                                    { id: Etapa.POST_ECCONVERT_21, label: 'Ec-convert 21', color: 'gray' },
                                    { id: Etapa.POST_ECCONVERT_22, label: 'Ec-convert 22', color: 'gray' },

                                    // Etapas Post-Impresión - Rebobinado
                                    { id: Etapa.POST_REBOBINADO_S2DT, label: 'Rebobinado S2DT', color: 'purple' },
                                    { id: Etapa.POST_REBOBINADO_PROSLIT, label: 'Rebobinado PROSLIT', color: 'purple' },
                                    { id: Etapa.POST_REBOBINADO_TEMAC, label: 'Rebobinado TEMAC', color: 'purple' },

                                    // Etapas Post-Impresión - Perforación
                                    { id: Etapa.POST_PERFORACION_MIC, label: 'Perforación MIC', color: 'pink' },
                                    { id: Etapa.POST_PERFORACION_MAC, label: 'Perforación MAC', color: 'pink' },

                                    // Estado Final
                                    { id: Etapa.COMPLETADO, label: 'Completados', color: 'green' },
                                ].map(stage => {
                                    const stageColors: Record<string, { active: string; inactive: string }> = {
                                        'amber': { active: 'bg-amber-500 border-amber-600 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'emerald': { active: 'bg-emerald-500 border-emerald-600 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'cyan': { active: 'bg-cyan-500 border-cyan-600 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'indigo': { active: 'bg-indigo-500 border-indigo-600 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'purple': { active: 'bg-purple-500 border-purple-600 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'pink': { active: 'bg-pink-500 border-pink-600 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'gray': { active: 'bg-gray-600 border-gray-700 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                        'green': { active: 'bg-green-500 border-green-600 text-white shadow-lg scale-105', inactive: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 hover:opacity-75' },
                                    };
                                    const colors = stageColors[stage.color] || stageColors['cyan'];
                                    return (
                                        <button
                                            key={stage.id}
                                            onClick={() => toggleStage(stage.id)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${selectedStages.includes(stage.id) ? colors.active : colors.inactive
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
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Planificación Semanal</h2>
                            <InfoTooltip
                                content="Tabla de planificación organizada por semanas. Muestra la carga de trabajo en horas para cada máquina/categoría. CAPACIDAD LIBRE = 190h - WM1 - WM3 - DNT. Las categorías GIAVE y VARIABLES no restan capacidad."
                                position="right"
                            />
                        </div>
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
                                    <InfoTooltip
                                        content="Lista detallada de todos los pedidos asignados a esta máquina/categoría en la semana seleccionada. El tiempo mostrado es el planificado, o en su defecto, el tiempo de producción calculado. Haz clic en las columnas para ordenar."
                                        position="bottom"
                                    />
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
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                                onClick={() => handleColumnSort('pedido')}
                                            >
                                                <div className="flex items-center">
                                                    Pedido
                                                    {renderSortIndicator('pedido')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                                onClick={() => handleColumnSort('cliente')}
                                            >
                                                <div className="flex items-center">
                                                    Cliente
                                                    {renderSortIndicator('cliente')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                                onClick={() => handleColumnSort('descripcion')}
                                            >
                                                <div className="flex items-center">
                                                    Descripción
                                                    {renderSortIndicator('descripcion')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                                onClick={() => handleColumnSort('fecha')}
                                            >
                                                <div className="flex items-center">
                                                    Fecha Entrega
                                                    {renderSortIndicator('fecha')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                                onClick={() => handleColumnSort('metros')}
                                            >
                                                <div className="flex items-center justify-end">
                                                    Metros
                                                    {renderSortIndicator('metros')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                                onClick={() => handleColumnSort('tiempo')}
                                            >
                                                <div className="flex items-center justify-end">
                                                    Tiempo (hh:mm)
                                                    {renderSortIndicator('tiempo')}
                                                </div>
                                            </th>
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
                                                            {formatDateToDDMMYYYY(pedido.nuevaFechaEntrega || pedido.fechaEntrega)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                                                            {formatMetros(pedido.metros)} m
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900 dark:text-white">
                                                            {formatDecimalHoursToHHMM(hours)}
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

                    {/* Custom Analysis Instructions Modal */}
                    <CustomAnalysisModal
                        isOpen={showCustomModal}
                        onClose={() => setShowCustomModal(false)}
                        currentInstructions={customInstructions}
                        onSave={handleSaveInstructions}
                        isSaving={isSavingInstructions}
                    />
                </>
            )}
        </main>
    );
};

export default ReportView;
