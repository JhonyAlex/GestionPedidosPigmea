import { useState, useMemo, useCallback, useEffect } from 'react';
import { Pedido, Prioridad, Etapa, DateField, WeekFilter, EstadoCliché } from '../types';
import { ETAPAS, PRIORIDAD_ORDEN } from '../constants';
import { getDateRange, DateFilterOption } from '../utils/date';
import { getCurrentWeek, isDateInWeek } from '../utils/weekUtils';

// Clave para localStorage
const FILTERS_STORAGE_KEY = 'gestionPedidos_userFilters';

// Interfaz para los filtros persistidos
interface PersistedFilters {
    searchTerm: string;
    filters: { priority: string; stage: string; dateField: DateField };
    selectedStages: string[];
    antivahoFilter: 'all' | 'con' | 'sin' | 'hecho';
    preparacionFilter: 'all' | 'sin-material' | 'sin-cliche' | 'listo';
    estadoClicheFilter: EstadoCliché | 'all';
    dateFilter: DateFilterOption;
    customDateRange: { start: string; end: string };
    weekFilter: WeekFilter;
    sortConfig: { key: keyof Pedido; direction: 'ascending' | 'descending' };
}

// Función para cargar filtros desde localStorage
const loadFiltersFromStorage = (): Partial<PersistedFilters> => {
    try {
        const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error al cargar filtros desde localStorage:', error);
    }
    return {};
};

// Función para guardar filtros en localStorage
const saveFiltersToStorage = (filters: PersistedFilters) => {
    try {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
        console.error('Error al guardar filtros en localStorage:', error);
    }
};


export const useFiltrosYOrden = (pedidos: Pedido[]) => {
    // Cargar filtros guardados
    const savedFilters = loadFiltersFromStorage();
    const currentWeek = getCurrentWeek();
    
    const [searchTerm, setSearchTerm] = useState(savedFilters.searchTerm || '');
    const [filters, setFilters] = useState<{ priority: string, stage: string, dateField: DateField }>(
        savedFilters.filters || { priority: 'all', stage: 'all', dateField: 'fechaCreacion' }
    );
    const [selectedStages, setSelectedStages] = useState<string[]>(savedFilters.selectedStages || []);
    const [antivahoFilter, setAntivahoFilter] = useState<'all' | 'con' | 'sin' | 'hecho'>(
        savedFilters.antivahoFilter || 'all'
    );
    const [preparacionFilter, setPreparacionFilter] = useState<'all' | 'sin-material' | 'sin-cliche' | 'listo'>(
        savedFilters.preparacionFilter || 'all'
    );
    const [estadoClicheFilter, setEstadoClicheFilter] = useState<EstadoCliché | 'all'>(
        savedFilters.estadoClicheFilter || 'all'
    );
    const [dateFilter, setDateFilter] = useState<DateFilterOption>(savedFilters.dateFilter || 'all');
    const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string }>(
        savedFilters.customDateRange || { start: '', end: '' }
    );
    const [sortConfig, setSortConfig] = useState<{ key: keyof Pedido, direction: 'ascending' | 'descending' }>(
        savedFilters.sortConfig || { key: 'prioridad', direction: 'ascending' }
    );
    
    // Estado para filtro de semana
    const [weekFilter, setWeekFilter] = useState<WeekFilter>(
        savedFilters.weekFilter || {
            enabled: false,
            year: currentWeek.year,
            week: currentWeek.week,
            dateField: 'fechaEntrega'
        }
    );

    // Efecto para guardar filtros en localStorage cada vez que cambien
    useEffect(() => {
        const filtersToSave: PersistedFilters = {
            searchTerm,
            filters,
            selectedStages,
            antivahoFilter,
            preparacionFilter,
            estadoClicheFilter,
            dateFilter,
            customDateRange,
            weekFilter,
            sortConfig
        };
        saveFiltersToStorage(filtersToSave);
    }, [
        searchTerm,
        filters,
        selectedStages,
        antivahoFilter,
        preparacionFilter,
        estadoClicheFilter,
        dateFilter,
        customDateRange,
        weekFilter,
        sortConfig
    ]);

    const handleFilterChange = (name: string, value: string) => setFilters(prev => ({ ...prev, [name]: value }));
    const handleDateFilterChange = (value: string) => setDateFilter(value as DateFilterOption);
    const handleAntivahoFilterChange = (value: 'all' | 'con' | 'sin' | 'hecho') => setAntivahoFilter(value);
    const handlePreparacionFilterChange = (value: 'all' | 'sin-material' | 'sin-cliche' | 'listo') => setPreparacionFilter(value);
    const handleEstadoClicheFilterChange = (value: EstadoCliché | 'all') => setEstadoClicheFilter(value);
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

    // Función para resetear todos los filtros a valores por defecto
    const resetAllFilters = useCallback(() => {
        const currentWeek = getCurrentWeek();
        setSearchTerm('');
        setFilters({ priority: 'all', stage: 'all', dateField: 'fechaCreacion' });
        setSelectedStages([]);
        setAntivahoFilter('all');
        setPreparacionFilter('all');
        setEstadoClicheFilter('all');
        setDateFilter('all');
        setCustomDateRange({ start: '', end: '' });
        setWeekFilter({
            enabled: false,
            year: currentWeek.year,
            week: currentWeek.week,
            dateField: 'fechaEntrega'
        });
        setSortConfig({ key: 'prioridad', direction: 'ascending' });
        
        // Limpiar localStorage
        try {
            localStorage.removeItem(FILTERS_STORAGE_KEY);
        } catch (error) {
            console.error('Error al limpiar filtros de localStorage:', error);
        }
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
                
                // Observaciones (vendedor se busca por vendedorNombre ahora)
                p.observaciones.toLowerCase().includes(searchTermLower) ||
                (p.vendedorNombre && p.vendedorNombre.toLowerCase().includes(searchTermLower)) ||
                
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
                    (consumo.recibido && String(consumo.recibido).toLowerCase().includes(searchTermLower))
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

            // Filtro de Estado de Cliché
            const estadoClicheMatch = estadoClicheFilter === 'all' || p.estadoCliché === estadoClicheFilter;

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

            return searchTermMatch && priorityMatch && stageMatch && finalDateMatch && antivahoMatch && preparacionMatch && estadoClicheMatch;
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
                            const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
                            const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
                            comparison = dateA - dateB;
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

    }, [pedidos, searchTerm, filters, selectedStages, antivahoFilter, preparacionFilter, estadoClicheFilter, dateFilter, sortConfig, customDateRange, weekFilter]);

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
        estadoClicheFilter,
        handleEstadoClicheFilterChange,
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
        resetAllFilters,
    };
};