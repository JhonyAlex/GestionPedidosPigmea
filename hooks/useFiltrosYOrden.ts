import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Pedido, Prioridad, Etapa, DateField, WeekFilter, EstadoCliché } from '../types';
import { ETAPAS } from '../constants';
import { getDateRange, DateFilterOption } from '../utils/date';
import { getCurrentWeek, isDateInWeek } from '../utils/weekUtils';
import { useDebounce } from './useDebounce';
import { normalizeSearchValue, pedidoMatchesSearch } from '../utils/search';

// Clave para localStorage
const FILTERS_STORAGE_KEY = 'gestionPedidos_userFilters';

// Interfaz para los filtros persistidos
interface PersistedFilters {
    searchTerm: string;
    filters: { priority: string; stage: string; dateField: DateField };
    selectedStages: string[];
    selectedVendedores: string[];
    selectedClientes: string[];
    selectedMaquinas: string[];
    antivahoFilter: 'all' | 'con' | 'sin' | 'hecho';
    preparacionFilter: 'all' | 'sin-material' | 'sin-cliche' | 'listo';
    estadoClicheFilter: EstadoCliché | 'all';
    anonimoFilter: 'all' | 'si' | 'no';
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

    // 🚀 Aplicar debounce al término de búsqueda para mejorar performance
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [filters, setFilters] = useState<{ priority: string, stage: string, dateField: DateField }>(
        savedFilters.filters || { priority: 'all', stage: 'all', dateField: 'fechaCreacion' }
    );
    const [selectedStages, setSelectedStages] = useState<string[]>(savedFilters.selectedStages || []);
    const [selectedVendedores, setSelectedVendedores] = useState<string[]>(savedFilters.selectedVendedores || []);
    const [selectedClientes, setSelectedClientes] = useState<string[]>(savedFilters.selectedClientes || []);
    const [selectedMaquinas, setSelectedMaquinas] = useState<string[]>(savedFilters.selectedMaquinas || []);
    const [antivahoFilter, setAntivahoFilter] = useState<'all' | 'con' | 'sin' | 'hecho'>(
        savedFilters.antivahoFilter || 'all'
    );
    const [preparacionFilter, setPreparacionFilter] = useState<'all' | 'sin-material' | 'sin-cliche' | 'listo'>(
        savedFilters.preparacionFilter || 'all'
    );
    const [estadoClicheFilter, setEstadoClicheFilter] = useState<EstadoCliché | 'all'>(
        savedFilters.estadoClicheFilter || 'all'
    );
    const [anonimoFilter, setAnonimoFilter] = useState<'all' | 'si' | 'no'>(
        savedFilters.anonimoFilter || 'all'
    );
    const [dateFilter, setDateFilter] = useState<DateFilterOption>(savedFilters.dateFilter || 'all');
    const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string }>(
        savedFilters.customDateRange || { start: '', end: '' }
    );
    const [sortConfig, setSortConfig] = useState<{ key: keyof Pedido, direction: 'ascending' | 'descending' }>(() => {
        const saved = savedFilters.sortConfig;
        // Migrar sortConfig legacy: si el usuario tenía ordenar por 'prioridad', cambiar a 'posicionEnEtapa'
        if (saved && saved.key === 'prioridad') {
            return { key: 'posicionEnEtapa' as keyof Pedido, direction: 'ascending' as const };
        }
        return saved || { key: 'posicionEnEtapa' as keyof Pedido, direction: 'ascending' as const };
    });

    // Estado para filtro de semana
    const [weekFilter, setWeekFilter] = useState<WeekFilter>(
        savedFilters.weekFilter || {
            enabled: false,
            year: currentWeek.year,
            week: currentWeek.week,
            dateField: 'fechaEntrega'
        }
    );

    // 🔄 No validar automáticamente - dejar que los handlers manejen la lógica
    // El problema de "pegado" no es por IDs inválidos, sino por referencias perdidas

    // Efecto para guardar filtros en localStorage cada vez que cambien
    useEffect(() => {
        const filtersToSave: PersistedFilters = {
            searchTerm,
            filters,
            selectedStages,
            selectedVendedores,
            selectedClientes,
            selectedMaquinas,
            antivahoFilter,
            preparacionFilter,
            estadoClicheFilter,
            anonimoFilter,
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
        selectedVendedores,
        selectedClientes,
        selectedMaquinas,
        antivahoFilter,
        preparacionFilter,
        estadoClicheFilter,
        anonimoFilter,
        dateFilter,
        customDateRange,
        weekFilter,
        sortConfig
    ]);

    const handleFilterChange = (name: string, value: string) => setFilters(prev => ({ ...prev, [name]: value }));
    const handleDateFilterChange = (value: string) => {
        setDateFilter(value as DateFilterOption);
        // Si se activa un filtro de fecha, desactivar el filtro de semana
        if (value !== 'all') {
            setWeekFilter(prev => ({ ...prev, enabled: false }));
        }
    };
    const handleAntivahoFilterChange = (value: 'all' | 'con' | 'sin' | 'hecho') => setAntivahoFilter(value);
    const handlePreparacionFilterChange = (value: 'all' | 'sin-material' | 'sin-cliche' | 'listo') => setPreparacionFilter(value);
    const handleEstadoClicheFilterChange = (value: EstadoCliché | 'all') => setEstadoClicheFilter(value);
    const handleAnonimoFilterChange = (value: 'all' | 'si' | 'no') => setAnonimoFilter(value);
    const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomDateRange(prev => ({ ...prev, [name]: value }));
    };

    // Handlers para filtro de semana
    const handleWeekFilterToggle = useCallback(() => {
        setWeekFilter(prev => {
            const newEnabled = !prev.enabled;
            // Si se activa el filtro de semana, resetear el filtro de fecha a 'all'
            if (newEnabled) {
                setDateFilter('all');
            }
            return { ...prev, enabled: newEnabled };
        });
    }, []);

    const handleWeekChange = useCallback((year: number, week: number) => {
        setWeekFilter(prev => ({ ...prev, year, week, enabled: true }));
        // Al cambiar la semana, desactivar el filtro de fecha
        setDateFilter('all');
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

    const handleVendedorToggle = useCallback((vendedorId: string) => {
        if (vendedorId === 'all') {
            setSelectedVendedores([]);
        } else {
            setSelectedVendedores(prev => {
                const isSelected = prev.includes(vendedorId);
                return isSelected
                    ? prev.filter(id => id !== vendedorId)
                    : [...prev, vendedorId];
            });
        }
    }, []);

    const handleClienteToggle = useCallback((clienteId: string) => {
        if (clienteId === 'all') {
            setSelectedClientes([]);
        } else {
            setSelectedClientes(prev => {
                const isSelected = prev.includes(clienteId);
                return isSelected
                    ? prev.filter(id => id !== clienteId)
                    : [...prev, clienteId];
            });
        }
    }, []);

    const handleMaquinaToggle = useCallback((maquinaId: string) => {
        if (maquinaId === 'all') {
            setSelectedMaquinas([]);
        } else {
            setSelectedMaquinas(prev => {
                const isSelected = prev.includes(maquinaId);
                return isSelected
                    ? prev.filter(id => id !== maquinaId)
                    : [...prev, maquinaId];
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
        setSelectedVendedores([]);
        setSelectedClientes([]);
        setSelectedMaquinas([]);
        setAntivahoFilter('all');
        setPreparacionFilter('all');
        setEstadoClicheFilter('all');
        setAnonimoFilter('all');
        setDateFilter('all');
        setCustomDateRange({ start: '', end: '' });
        setWeekFilter({
            enabled: false,
            year: currentWeek.year,
            week: currentWeek.week,
            dateField: 'fechaEntrega'
        });
        setSortConfig({ key: 'posicionEnEtapa' as keyof Pedido, direction: 'ascending' });

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
            // 🚀 Usar término con debounce para mejor performance
            const normalizedSearchTerm = normalizeSearchValue(debouncedSearchTerm);
            const searchTermMatch = !normalizedSearchTerm || pedidoMatchesSearch(p, normalizedSearchTerm);

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

            // Filtro de Anónimo
            const anonimoMatch = anonimoFilter === 'all' ||
                (anonimoFilter === 'si' && p.anonimo === true) ||
                (anonimoFilter === 'no' && p.anonimo !== true);

            // Filtro de Vendedores (multi-select)
            const vendedorMatch = selectedVendedores.length === 0 ||
                selectedVendedores.includes(p.vendedorId || '') ||
                (selectedVendedores.includes('sin_asignar') && !p.vendedorId);

            // Filtro de Clientes (multi-select)
            const clienteMatch = selectedClientes.length === 0 ||
                selectedClientes.includes(p.clienteId || '') ||
                (selectedClientes.includes('sin_asignar') && !p.clienteId);

            // Filtro de Máquinas (multi-select)
            const maquinaMatch = selectedMaquinas.length === 0 ||
                selectedMaquinas.includes(p.maquinaImpresion || '') ||
                (selectedMaquinas.includes('sin_maquina') && !p.maquinaImpresion);

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
                const isSinCliche = !p.clicheDisponible; // Sin cliché, sin importar el material
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

            return searchTermMatch && priorityMatch && stageMatch && finalDateMatch && antivahoMatch && preparacionMatch && estadoClicheMatch && anonimoMatch && vendedorMatch && clienteMatch && maquinaMatch;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;

                let comparison = 0;

                switch (sortConfig.key) {
                    case 'posicionEnEtapa':
                        // Ordenar por posición manual dentro de la etapa (Kanban)
                        // Pedidos con posición definida se ordenan por ella
                        // Pedidos sin posición (legacy) usan FIFO por timestamp de entrada a la etapa
                        const posA = a.posicionEnEtapa;
                        const posB = b.posicionEnEtapa;

                        if (posA != null && posB != null) {
                            // Ambos tienen posición: comparar directamente
                            comparison = posA - posB;
                        } else if (posA != null && posB == null) {
                            // Solo A tiene posición: B es legacy, va primero (es más antiguo)
                            comparison = 1;
                        } else if (posA == null && posB != null) {
                            // Solo B tiene posición: A es legacy, va primero (es más antiguo)
                            comparison = -1;
                        } else {
                            // Ninguno tiene posición: FIFO por timestamp de entrada a la etapa
                            const getStageEntryTime = (p: Pedido) => {
                                if (p.etapaActual === Etapa.PREPARACION && p.subEtapaActual && p.subEtapasSecuencia) {
                                    const subEntry = p.subEtapasSecuencia.find(e => e.subEtapa === p.subEtapaActual);
                                    if (subEntry) {
                                        return new Date(subEntry.fecha).getTime();
                                    }
                                }
                                const entry = p.etapasSecuencia?.find(e => e.etapa === p.etapaActual);
                                return entry ? new Date(entry.fecha).getTime() : (p.fechaCreacion ? new Date(p.fechaCreacion).getTime() : 0);
                            };
                            comparison = getStageEntryTime(a) - getStageEntryTime(b);
                        }
                        break;

                    case 'prioridad':
                        // Sort por prioridad puro (sin efecto en el orden por defecto)
                        // Solo se activa si el usuario selecciona manualment ordenar por prioridad
                        const getStageEntryTimePrio = (p: Pedido) => {
                            if (p.etapaActual === Etapa.PREPARACION && p.subEtapaActual && p.subEtapasSecuencia) {
                                const subEntry = p.subEtapasSecuencia.find(e => e.subEtapa === p.subEtapaActual);
                                if (subEntry) {
                                    return new Date(subEntry.fecha).getTime();
                                }
                            }
                            const entry = p.etapasSecuencia?.find(e => e.etapa === p.etapaActual);
                            return entry ? new Date(entry.fecha).getTime() : (p.fechaCreacion ? new Date(p.fechaCreacion).getTime() : 0);
                        };
                        comparison = getStageEntryTimePrio(a) - getStageEntryTimePrio(b);
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

    }, [pedidos, debouncedSearchTerm, filters, selectedStages, selectedVendedores, selectedClientes, selectedMaquinas, antivahoFilter, preparacionFilter, estadoClicheFilter, anonimoFilter, dateFilter, sortConfig, customDateRange, weekFilter]);

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
        selectedVendedores,
        handleVendedorToggle,
        selectedClientes,
        handleClienteToggle,
        selectedMaquinas,
        handleMaquinaToggle,
        antivahoFilter,
        handleAntivahoFilterChange,
        preparacionFilter,
        handlePreparacionFilterChange,
        estadoClicheFilter,
        handleEstadoClicheFilterChange,
        anonimoFilter,
        handleAnonimoFilterChange,
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