import { useState, useMemo, useCallback } from 'react';
import { Pedido, Prioridad, Etapa, DateField } from '../types';
import { ETAPAS, PRIORIDAD_ORDEN } from '../constants';
import { getDateRange, DateFilterOption } from '../utils/date';


export const useFiltrosYOrden = (pedidos: Pedido[]) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ priority: string, stage: string, dateField: DateField }>({ priority: 'all', stage: 'all', dateField: 'fechaCreacion' });
    const [selectedStages, setSelectedStages] = useState<string[]>([]);
    const [antivahoFilter, setAntivahoFilter] = useState<'all' | 'con' | 'sin' | 'hecho'>('all');
    const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
    const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Pedido, direction: 'ascending' | 'descending' }>({ key: 'prioridad', direction: 'ascending' });

    const handleFilterChange = (name: string, value: string) => setFilters(prev => ({ ...prev, [name]: value }));
    const handleDateFilterChange = (value: string) => setDateFilter(value as DateFilterOption);
    const handleAntivahoFilterChange = (value: 'all' | 'con' | 'sin' | 'hecho') => setAntivahoFilter(value);
    const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomDateRange(prev => ({ ...prev, [name]: value }));
    };
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
                p.numeroPedidoCliente.toLowerCase().includes(searchTermLower) ||
                p.cliente.toLowerCase().includes(searchTermLower) ||
                p.desarrollo.toLowerCase().includes(searchTermLower) ||
                p.maquinaImpresion.toLowerCase().includes(searchTermLower) ||
                ETAPAS[p.etapaActual].title.toLowerCase().includes(searchTermLower) ||
                p.prioridad.toLowerCase().includes(searchTermLower) ||
                p.tipoImpresion.toLowerCase().includes(searchTermLower) ||
                String(p.metros).includes(searchTermLower) ||
                (p.capa && p.capa.toLowerCase().includes(searchTermLower)) ||
                p.numeroRegistro.toLowerCase().includes(searchTermLower) ||
                (p.camisa && p.camisa.toLowerCase().includes(searchTermLower))
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

            return searchTermMatch && priorityMatch && stageMatch && dateMatch && antivahoMatch;
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

    }, [pedidos, searchTerm, filters, antivahoFilter, dateFilter, sortConfig, customDateRange]);

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
        dateFilter,
        handleDateFilterChange,
        customDateRange,
        handleCustomDateChange,
        sortConfig,
        handleSort,
        updateSortConfig,
    };
};