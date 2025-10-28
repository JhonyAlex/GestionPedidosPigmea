import { useState, useMemo, useCallback } from 'react';
import { Pedido, Prioridad, Etapa, DateField, WeekFilter } from '../types';
import { ETAPAS, PRIORIDAD_ORDEN } from '../constants';
import { getDateRange, DateFilterOption } from '../utils/date';
import { getCurrentWeek, isDateInWeek } from '../utils/weekUtils';


export const useFiltrosYOrden = (pedidos: Pedido[]) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ priority: string, stage: string, dateField: DateField }>({ priority: 'all', stage: 'all', dateField: 'fechaCreacion' });
    const [selectedStages, setSelectedStages] = useState<string[]>([]);
    const [antivahoFilter, setAntivahoFilter] = useState<'all' | 'con' | 'sin' | 'hecho'>('all');
    const [preparacionFilter, setPreparacionFilter] = useState<'all' | 'sin-material' | 'sin-cliche' | 'listo'>('all');
    const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
    const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Pedido, direction: 'ascending' | 'descending' }>({ key: 'prioridad', direction: 'ascending' });
    
    // Estado para filtro de semana
    const currentWeek = getCurrentWeek();
    const [weekFilter, setWeekFilter] = useState<WeekFilter>({
        enabled: false,
        year: currentWeek.year,
        week: currentWeek.week,
        dateField: 'fechaEntrega'
    });

    const handleFilterChange = (name: string, value: string) => setFilters(prev => ({ ...prev, [name]: value }));
    const handleDateFilterChange = (value: string) => setDateFilter(value as DateFilterOption);
    const handleAntivahoFilterChange = (value: 'all' | 'con' | 'sin' | 'hecho') => setAntivahoFilter(value);
    const handlePreparacionFilterChange = (value: 'all' | 'sin-material' | 'sin-cliche' | 'listo') => setPreparacionFilter(value);
    const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomDateRange(prev => ({ ...prev, [name]: value }));
    };
    
    // Handlers para filtro de semana
    const handleWeekFilterToggle = useCallback(() => {
        setWeekFilter(prev => ({ ...prev, enabled: !prev.enabled }));
    }, []);
    
    const handleWeekChange = useCallback((year: number, week: number) => {
        setWeekFilter(prev => ({ ...prev, year, week, enabled: true }));
    }, []);
    
    const handleWeekDateFieldChange = useCallback((dateField: DateField) => {
        setWeekFilter(prev => ({ ...prev, dateField }));
    }, []);
    
    const handleSort = useCallback((key: keyof Pedido) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    }, []);

    // Función específica para cambiar la configuración de sorting (útil para reordenamiento manual)
    const updateSortConfig = useCallback((key: keyof Pedido, direction: 'ascending' | 'descending' = 'ascending') => {
        setSortConfig({ key, direction });
    }, []);

    const handleStageToggle = useCallback((stageId: string) => {
        if (stageId === 'all') {
            setSelectedStages([]);
            setFilters(prev => ({ ...prev, stage: 'all' }));
        } else {
            setSelectedStages(prev => {
                const isSelected = prev.includes(stageId);
                const newSelection = isSelected 
                    ? prev.filter(id => id !== stageId)
                    : [...prev, stageId];
                
                // Actualizar también el filtro tradicional para compatibilidad
                if (newSelection.length === 0) {
                    setFilters(prevFilters => ({ ...prevFilters, stage: 'all' }));
                } else if (newSelection.length === 1) {
                    setFilters(prevFilters => ({ ...prevFilters, stage: newSelection[0] }));
                } else {
                    setFilters(prevFilters => ({ ...prevFilters, stage: 'multiple' }));
                }
                
                return newSelection;
            });
        }
    }, []);

    const resetStageFilters = useCallback(() => {
        setSelectedStages([]);
        setFilters(prev => ({ ...prev, stage: 'all' }));
    }, []);

    const resetTraditionalStageFilter = useCallback(() => {
        setFilters(prev => ({ ...prev, stage: 'all' }));
    }, []);

    const processedPedidos = useMemo(() => {
        let dateRange: { start: Date, end: Date } | null = null;
        
        if (dateFilter === 'custom') {
            const createDate = (dateString: string) => {
                if (!dateString) return null;
                const parts = dateString.split('-').map(Number);
                return new Date(parts[0], parts[1] - 1, parts[2]);
            };

            const startDate = createDate(customDateRange.start);
            if (startDate) startDate.setHours(0, 0, 0, 0);
            
            const endDate = createDate(customDateRange.end);
            if (endDate) endDate.setHours(23, 59, 59, 999);
            
            if (startDate || endDate) {
                dateRange = { 
                    start: startDate || new Date(0),
                    end: endDate || new Date(8640000000000000)
                };
            }
        } else {
            dateRange = getDateRange(dateFilter);
        }
        
        const filtered = pedidos.filter(p => {
            const searchTermLower = searchTerm.toLowerCase();
            const searchTermMatch = !searchTermLower || (
                // Campos de identificación y cliente
                p.numeroPedidoCliente.toLowerCase().includes(searchTermLower) ||
                p.numeroRegistro.toLowerCase().includes(searchTermLower) ||
                p.cliente.toLowerCase().includes(searchTermLower) ||
                (p.clienteId && p.clienteId.toLowerCase().includes(searchTermLower)) ||
                (p.numerosCompra && p.numerosCompra.some(numero => numero.toLowerCase().includes(searchTermLower))) ||
                
                // Campos de producción
                p.desarrollo.toLowerCase().includes(searchTermLower) ||
                p.maquinaImpresion.toLowerCase().includes(searchTermLower) ||
                String(p.metros).includes(searchTermLower) ||
                (p.capa && p.capa.toLowerCase().includes(searchTermLower)) ||
                (p.camisa && p.camisa.toLowerCase().includes(searchTermLower)) ||
                p.tipoImpresion.toLowerCase().includes(searchTermLower) ||
                (p.tiempoProduccionPlanificado && p.tiempoProduccionPlanificado.toLowerCase().includes(searchTermLower)) ||
                (p.tiempoTotalProduccion && p.tiempoTotalProduccion.toLowerCase().includes(searchTermLower)) ||
                
                // Campos de etapas y prioridad
                ETAPAS[p.etapaActual].title.toLowerCase().includes(searchTermLower) ||
                (p.subEtapaActual && p.subEtapaActual.toLowerCase().includes(searchTermLower)) ||
                p.prioridad.toLowerCase().includes(searchTermLower) ||
                
                // Campos de fechas (búsqueda parcial)
                p.fechaCreacion.toLowerCase().includes(searchTermLower) ||
                p.fechaEntrega.toLowerCase().includes(searchTermLower) ||
                (p.nuevaFechaEntrega && p.nuevaFechaEntrega.toLowerCase().includes(searchTermLower)) ||
                (p.fechaFinalizacion && p.fechaFinalizacion.toLowerCase().includes(searchTermLower)) ||
                
                // Campos de preparación y cliché
                (p.estadoCliché && p.estadoCliché.toLowerCase().includes(searchTermLower)) ||
                (p.clicheInfoAdicional && p.clicheInfoAdicional.toLowerCase().includes(searchTermLower)) ||
                
                // Observaciones y vendedor
                p.observaciones.toLowerCase().includes(searchTermLower) ||
                (p.vendedor && p.vendedor.toLowerCase().includes(searchTermLower)) ||
                
                // Producto y especificaciones técnicas
                (p.producto && p.producto.toLowerCase().includes(searchTermLower)) ||
                (p.bobinaMadre && String(p.bobinaMadre).includes(searchTermLower)) ||
                (p.bobinaFinal && String(p.bobinaFinal).includes(searchTermLower)) ||
                (p.minAdap && String(p.minAdap).includes(searchTermLower)) ||
                (p.colores && String(p.colores).includes(searchTermLower)) ||
                (p.minColor && String(p.minColor).includes(searchTermLower)) ||
                (p.materialCapasCantidad && String(p.materialCapasCantidad).includes(searchTermLower)) ||
                (p.materialConsumoCantidad && String(p.materialConsumoCantidad).includes(searchTermLower)) ||
                
                // Búsqueda en arrays de material (capas y consumo)
                (p.materialCapas && p.materialCapas.some(capa => 
                    (capa.micras && String(capa.micras).includes(searchTermLower)) ||
                    (capa.densidad && String(capa.densidad).includes(searchTermLower))
                )) ||
                (p.materialConsumo && p.materialConsumo.some(consumo =>
                    (consumo.necesario && String(consumo.necesario).includes(searchTermLower)) ||
                    (consumo.recibido && consumo.recibido.toLowerCase().includes(searchTermLower))
                ))
            );

            const priorityMatch = filters.priority === 'all' || p.prioridad === filters.priority;
            const stageMatch = (selectedStages.length === 0 && filters.stage === 'all') || 
                               selectedStages.includes(p.etapaActual) || 
                               filters.stage === p.etapaActual;
            const dateToFilter = p[filters.dateField];
            const dateMatch = !dateRange || (dateToFilter && new Date(dateToFilter) >= dateRange.start && new Date(dateToFilter) <= dateRange.end);
            const antivahoMatch = antivahoFilter === 'all' || 
                (antivahoFilter === 'con' && p.antivaho === true) || 
                (antivahoFilter === 'sin' && p.antivaho !== true) ||
                (antivahoFilter === 'hecho' && p.antivaho === true && p.antivahoRealizado === true);

            // Filtro de semana (tiene prioridad sobre filtro de fecha normal)
            let weekMatch = true;
            if (weekFilter.enabled) {
                const dateToCheck = p[weekFilter.dateField];
                if (dateToCheck) {
                    weekMatch = isDateInWeek(dateToCheck, weekFilter.year, weekFilter.week);
                } else {
                    weekMatch = false;
                }
            }

            // Filtro de estado de preparación (solo aplica cuando está en etapa PREPARACION)
            let preparacionMatch = true;
            if (p.etapaActual === Etapa.PREPARACION && preparacionFilter !== 'all') {
                const isSinMaterial = !p.materialDisponible;
                const isSinCliche = !!p.materialDisponible && !p.clicheDisponible;
                const isListo = !!p.materialDisponible && !!p.clicheDisponible;
                
                if (preparacionFilter === 'sin-material') {
                    preparacionMatch = isSinMaterial;
                } else if (preparacionFilter === 'sin-cliche') {
                    preparacionMatch = isSinCliche;
                } else if (preparacionFilter === 'listo') {
                    preparacionMatch = isListo;
                }
            }

            // Si el filtro de semana está activo, usar weekMatch en lugar de dateMatch
            const finalDateMatch = weekFilter.enabled ? weekMatch : dateMatch;

            return searchTermMatch && priorityMatch && stageMatch && finalDateMatch && antivahoMatch && preparacionMatch;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;
                
                let comparison = 0;

                switch (sortConfig.key) {
                    case 'prioridad':
                        comparison = PRIORIDAD_ORDEN[aValue as Prioridad] - PRIORIDAD_ORDEN[bValue as Prioridad];
                        if (comparison === 0) {
                            comparison = new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
                        }
                        break;
                    
                    case 'orden':
                        comparison = (a.orden || 0) - (b.orden || 0);
                        break;

                    case 'fechaCreacion':
                    case 'fechaEntrega':
                    case 'nuevaFechaEntrega':
                    case 'fechaFinalizacion':
                        const dateA = aValue ? new Date(aValue as string).getTime() : 0;
                        const dateB = bValue ? new Date(bValue as string).getTime() : 0;
                        comparison = dateA - dateB;
                        break;
                    
                    default:
                        if (typeof aValue === 'number' && typeof bValue === 'number') {
                            comparison = aValue - bValue;
                        } else {
                            comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
                        }
                        break;
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        
        return filtered;

    }, [pedidos, searchTerm, filters, selectedStages, antivahoFilter, preparacionFilter, dateFilter, sortConfig, customDateRange, weekFilter]);

    return {
        processedPedidos,
        searchTerm,
        setSearchTerm,
        filters,
        handleFilterChange,
        selectedStages,
        handleStageToggle,
        resetStageFilters,
        resetTraditionalStageFilter,
        antivahoFilter,
        handleAntivahoFilterChange,
        preparacionFilter,
        handlePreparacionFilterChange,
        dateFilter,
        handleDateFilterChange,
        customDateRange,
        handleCustomDateChange,
        weekFilter,
        handleWeekFilterToggle,
        handleWeekChange,
        handleWeekDateFieldChange,
        sortConfig,
        handleSort,
        updateSortConfig,
    };
};