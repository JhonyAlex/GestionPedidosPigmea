
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Pedido, Etapa, ViewType, UserRole, AuditEntry, Prioridad, EstadoCliché, HistorialEntry } from './types';
import { KANBAN_FUNNELS, ETAPAS, PRIORIDAD_ORDEN, PREPARACION_SUB_ETAPAS_IDS } from './constants';
import { initialPedidos } from './data/seedData';
import { getDateRange, DateFilterOption } from './utils/date';
import { calculateTotalProductionTime, generatePedidosPDF } from './utils/kpi';
import { IndexedDBStore } from './services/storage';
import KanbanColumn from './components/KanbanColumn';
import PedidoModal from './components/PedidoModal';
import AddPedidoModal from './components/AddPedidoModal';
import Header from './components/Header';
import PedidoList from './components/PedidoList';
import ReportView from './components/ReportView';
import ThemeSwitcher from './components/ThemeSwitcher';
import CompletedPedidosList from './components/CompletedPedidosList';
import PreparacionView from './components/PreparacionView';
import EnviarAImpresionModal from './components/EnviarAImpresionModal';


type DateField = 'fechaCreacion' | 'fechaEntrega' | 'fechaFinalizacion';

const App: React.FC = () => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [store, setStore] = useState<IndexedDBStore<Pedido> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [view, setView] = useState<ViewType>('preparacion');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ priority: string, stage: string, dateField: DateField }>({ priority: 'all', stage: 'all', dateField: 'fechaCreacion' });
    const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
    const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Pedido, direction: 'ascending' | 'descending' }>({ key: 'prioridad', direction: 'ascending' });
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Administrador');
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [pedidoToSend, setPedidoToSend] = useState<Pedido | null>(null);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && localStorage.theme) {
            return localStorage.theme as 'light' | 'dark';
        }
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const initStore = async () => {
            setIsLoading(true);
            const pedidoStore = new IndexedDBStore<Pedido>('GestorPedidosDB', 'pedidos');
            await pedidoStore.init();
            setStore(pedidoStore);
    
            let currentPedidos = await pedidoStore.getAll();
            if (currentPedidos.length === 0) {
                console.log("No data found in IndexedDB, populating with seed data.");
                await pedidoStore.bulkInsert(initialPedidos);
                currentPedidos = await pedidoStore.getAll();
            }
            setPedidos(currentPedidos);
            setIsLoading(false);
        };
        initStore().catch(console.error);
    }, []);
    
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const logAction = useCallback((action: string) => {
        setAuditLog(prevLog => {
            const newEntry = { timestamp: new Date().toISOString(), userRole: currentUserRole, action };
            // Here you might persist the audit log to localStorage or its own store
            return [newEntry, ...prevLog];
        });
    }, [currentUserRole]);

    const generarEntradaHistorial = useCallback((usuario: UserRole, accion: string, detalles: string): HistorialEntry => ({
        timestamp: new Date().toISOString(),
        usuario,
        accion,
        detalles
    }), []);


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
                String(p.capa).includes(searchTermLower) ||
                p.numeroRegistro.toLowerCase().includes(searchTermLower)
            );

            const priorityMatch = filters.priority === 'all' || p.prioridad === filters.priority;
            const stageMatch = filters.stage === 'all' || p.etapaActual === filters.stage;
            const dateToFilter = p[filters.dateField];
            const dateMatch = !dateRange || (dateToFilter && new Date(dateToFilter) >= dateRange.start && new Date(dateToFilter) <= dateRange.end);

            return searchTermMatch && priorityMatch && stageMatch && dateMatch;
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

    }, [pedidos, searchTerm, filters, dateFilter, sortConfig, customDateRange]);

    const preparacionPedidos = useMemo(() => processedPedidos.filter(p => p.etapaActual === Etapa.PREPARACION), [processedPedidos]);
    const activePedidos = useMemo(() => processedPedidos.filter(p => p.etapaActual !== Etapa.ARCHIVADO && p.etapaActual !== Etapa.PREPARACION), [processedPedidos]);
    const archivedPedidos = useMemo(() => processedPedidos.filter(p => p.etapaActual === Etapa.ARCHIVADO), [processedPedidos]);

    const handleDragEnd = useCallback(async (result: DropResult) => {
        if (!store) return;
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
        
        // Handle reordering in the list view (session only)
        if (destination.droppableId === 'pedido-list' && source.droppableId === 'pedido-list') {
            // 1. Get the list that was actually rendered and dragged. This is `activePedidos`.
            const currentActivePedidos = processedPedidos.filter(p => p.etapaActual !== Etapa.ARCHIVADO && p.etapaActual !== Etapa.PREPARACION);

            // 2. Perform the reorder operation on this list.
            const reorderedActivePedidos = Array.from(currentActivePedidos);
            const [removed] = reorderedActivePedidos.splice(source.index, 1);
            reorderedActivePedidos.splice(destination.index, 0, removed);

            // 3. Create a map of the new order for only the reordered items.
            const newOrderMap = new Map(reorderedActivePedidos.map((p, index) => [p.id, index]));
            const maxActiveOrder = reorderedActivePedidos.length;

            // 4. Update the 'orden' property on the main 'pedidos' array state.
            const newFullPedidosList = pedidos.map(p => {
                const newOrder = newOrderMap.get(p.id);
                if (newOrder !== undefined) {
                    // This item was in the active list and was reordered.
                    return { ...p, orden: newOrder };
                } else {
                    // This item was not in the active list. Give it a high order number
                    // to push it after the manually sorted items, while preserving its relative order
                    // to other non-visible items.
                    return { ...p, orden: (p.orden || 0) + maxActiveOrder };
                }
            });

            // 5. Update state and set sort config to use the new 'orden' property.
            setPedidos(newFullPedidosList);
            setSortConfig({ key: 'orden', direction: 'ascending' });
            logAction('Pedidos reordenados manualmente en la vista de lista.');
            return;
        }


        const movedPedido = pedidos.find(p => p.id === draggableId);
        if (!movedPedido) return;

        if (source.droppableId.startsWith('PREP_') && destination.droppableId.startsWith('PREP_')) {
            const destId = destination.droppableId.replace('PREP_', '');
            let updatedPedido = { ...movedPedido, historial: [...movedPedido.historial] };
            let logDetails = '';

            if (destId === PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE) {
                if (updatedPedido.materialDisponible) {
                    updatedPedido.materialDisponible = false;
                    logDetails = 'Cambiado a "Material No Disponible"';
                }
            } else {
                if (!updatedPedido.materialDisponible) {
                    updatedPedido.materialDisponible = true;
                     logDetails = 'Cambiado a "Material Disponible"';
                }
                if (destId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_PENDIENTE && updatedPedido.estadoCliché !== EstadoCliché.PENDIENTE_CLIENTE) {
                    updatedPedido.estadoCliché = EstadoCliché.PENDIENTE_CLIENTE;
                } else if (destId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_REPETICION && updatedPedido.estadoCliché !== EstadoCliché.REPETICION_CAMBIO) {
                    updatedPedido.estadoCliché = EstadoCliché.REPETICION_CAMBIO;
                } else if (destId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_NUEVO && updatedPedido.estadoCliché !== EstadoCliché.NUEVO) {
                    updatedPedido.estadoCliché = EstadoCliché.NUEVO;
                }
            }
            const historialEntry = generarEntradaHistorial(currentUserRole, 'Actualización en Preparación', logDetails || 'Movido en vista de preparación');
            updatedPedido.historial.push(historialEntry);

            await store.update(updatedPedido);
            setPedidos(prev => prev.map(p => p.id === draggableId ? updatedPedido : p));
            logAction(`Pedido ${movedPedido.numeroPedidoCliente} actualizado en Preparación.`);
            return;
        }

        const newEtapa = destination.droppableId as Etapa;
        const oldEtapa = source.droppableId as Etapa;
        const historialEntry = generarEntradaHistorial(currentUserRole, 'Cambio de Etapa', `Movido de '${ETAPAS[oldEtapa].title}' a '${ETAPAS[newEtapa].title}'.`);
        
        const isMovingToCompleted = newEtapa === Etapa.COMPLETADO;
        const wasCompleted = oldEtapa === Etapa.COMPLETADO;
        const fechaFinalizacion = isMovingToCompleted ? new Date().toISOString() : (wasCompleted && newEtapa !== Etapa.COMPLETADO ? undefined : movedPedido.fechaFinalizacion);

        const updatedPedido = { 
            ...movedPedido,
            etapaActual: newEtapa,
            etapasSecuencia: [...movedPedido.etapasSecuencia, { etapa: newEtapa, fecha: new Date().toISOString() }],
            historial: [...movedPedido.historial, historialEntry],
            fechaFinalizacion,
            tiempoTotalProduccion: fechaFinalizacion ? calculateTotalProductionTime(movedPedido.fechaCreacion, fechaFinalizacion) : undefined
        };
        await store.update(updatedPedido);
        setPedidos(prev => prev.map(p => p.id === draggableId ? updatedPedido : p));
        logAction(`Pedido ${movedPedido.numeroPedidoCliente} movido (manual) de ${ETAPAS[oldEtapa].title} a ${ETAPAS[newEtapa].title}.`);

    }, [pedidos, store, currentUserRole, generarEntradaHistorial, logAction, processedPedidos]);
    
    const handleAdvanceStage = async (pedidoToAdvance: Pedido) => {
        if (!store) return;
        const { etapaActual, secuenciaTrabajo, numeroPedidoCliente } = pedidoToAdvance;
        let newEtapa: Etapa | null = null;
    
        const isPrinting = KANBAN_FUNNELS.IMPRESION.stages.includes(etapaActual);
        const isPostPrinting = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapaActual);
    
        if (isPrinting && secuenciaTrabajo && secuenciaTrabajo.length > 0) {
            newEtapa = secuenciaTrabajo[0];
        } else if (isPostPrinting && secuenciaTrabajo) {
            const currentIndex = secuenciaTrabajo.indexOf(etapaActual);
            if (currentIndex > -1 && currentIndex < secuenciaTrabajo.length - 1) {
                newEtapa = secuenciaTrabajo[currentIndex + 1];
            } else if (currentIndex === secuenciaTrabajo.length - 1) {
                newEtapa = Etapa.COMPLETADO;
            }
        }
    
        if (newEtapa) {
            const finalNewEtapa: Etapa = newEtapa;
            const historialEntry = generarEntradaHistorial(currentUserRole, 'Avance de Etapa', `Avanzado de '${ETAPAS[etapaActual].title}' a '${ETAPAS[finalNewEtapa].title}'.`);
            const isMovingToCompleted = String(finalNewEtapa) === String(Etapa.COMPLETADO);
            const fechaFinalizacion = isMovingToCompleted ? new Date().toISOString() : pedidoToAdvance.fechaFinalizacion;
            
            const updatedPedido = {
                ...pedidoToAdvance,
                etapaActual: finalNewEtapa,
                etapasSecuencia: [...pedidoToAdvance.etapasSecuencia, { etapa: finalNewEtapa, fecha: new Date().toISOString() }],
                historial: [...pedidoToAdvance.historial, historialEntry],
                fechaFinalizacion,
                tiempoTotalProduccion: fechaFinalizacion ? calculateTotalProductionTime(pedidoToAdvance.fechaCreacion, fechaFinalizacion) : undefined
            };

            await store.update(updatedPedido);
            setPedidos(prev => prev.map(p => p.id === pedidoToAdvance.id ? updatedPedido : p));
            logAction(`Pedido ${numeroPedidoCliente} avanzado de ${ETAPAS[etapaActual].title} a ${ETAPAS[finalNewEtapa].title}.`);
        }
    };

    const handleSavePedido = async (updatedPedido: Pedido) => {
        if (!store) return;
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado: Solo los administradores pueden modificar pedidos.');
            return;
        }

        const originalPedido = pedidos.find(p => p.id === updatedPedido.id);
        if (!originalPedido) return;

        let modifiedPedido = { ...updatedPedido };
        const newHistoryEntries: HistorialEntry[] = [];
        const fieldsToCompare: Array<keyof Pedido> = ['numeroPedidoCliente', 'cliente', 'metros', 'fechaEntrega', 'prioridad', 'tipoImpresion', 'desarrollo', 'capa', 'tiempoProduccionPlanificado', 'observaciones', 'materialDisponible', 'estadoCliché', 'secuenciaTrabajo'];

        fieldsToCompare.forEach(key => {
             if (JSON.stringify(originalPedido[key]) !== JSON.stringify(modifiedPedido[key])) {
                const formatValue = (val: any) => val === true ? 'Sí' : (val === false ? 'No' : (Array.isArray(val) ? val.map(v => ETAPAS[v]?.title || v).join(', ') || 'Vacía' : val || 'N/A'));
                newHistoryEntries.push(generarEntradaHistorial(currentUserRole, `Campo Actualizado: ${key}`, `Cambiado de '${formatValue(originalPedido[key])}' a '${formatValue(modifiedPedido[key])}'.`));
            }
        });
        
        const originalEtapa = originalPedido.etapaActual;
        const modifiedEtapa = modifiedPedido.etapaActual;
        if (originalEtapa !== modifiedEtapa) {
            newHistoryEntries.push(generarEntradaHistorial(currentUserRole, 'Cambio de Etapa', `Movido de '${ETAPAS[originalEtapa].title}' a '${ETAPAS[modifiedEtapa].title}'.`));
        }
        
        if (newHistoryEntries.length > 0) {
            modifiedPedido.historial = [...(modifiedPedido.historial || []), ...newHistoryEntries];
        }

        await store.update(modifiedPedido);
        setPedidos(prev => prev.map(p => p.id === modifiedPedido.id ? modifiedPedido : p));
        setSelectedPedido(null);
        if (newHistoryEntries.length > 0) logAction(`Pedido ${modifiedPedido.numeroPedidoCliente} actualizado.`);
    };

    const handleAddPedido = async (data: { pedidoData: Omit<Pedido, 'id' | 'secuenciaPedido' | 'numeroRegistro' | 'fechaCreacion' | 'etapasSecuencia' | 'etapaActual' | 'maquinaImpresion' | 'secuenciaTrabajo' | 'orden' | 'historial'>; secuenciaTrabajo: Etapa[]; }) => {
        if (!store) return;
        const { pedidoData, secuenciaTrabajo } = data;
        const now = new Date();
        const newId = now.getTime().toString();
        const numeroRegistro = `REG-${now.toISOString().slice(0, 19).replace(/[-:T]/g, '')}-${newId.slice(-4)}`;
        const initialStage = Etapa.PREPARACION;
        const maxOrder = Math.max(...pedidos.map(p => p.orden), 0);

        const newPedido: Pedido = {
            ...pedidoData,
            id: newId,
            secuenciaPedido: parseInt(newId.slice(-6)),
            orden: maxOrder + 1,
            numeroRegistro: numeroRegistro,
            fechaCreacion: now.toISOString(),
            etapaActual: initialStage,
            etapasSecuencia: [{ etapa: initialStage, fecha: now.toISOString() }],
            historial: [generarEntradaHistorial(currentUserRole, 'Creación', 'Pedido creado en Preparación.')],
            maquinaImpresion: '',
            secuenciaTrabajo,
        };

        await store.create(newPedido);
        setPedidos(prev => [newPedido, ...prev]);
        logAction(`Nuevo pedido ${newPedido.numeroPedidoCliente} creado.`);
        setIsAddModalOpen(false);
    };

    const handleConfirmSendToPrint = async (pedidoToUpdate: Pedido, impresionEtapa: Etapa, postImpresionSequence: Etapa[]) => {
        if (!store) return;
        const detalles = `Movido de 'Preparación' a '${ETAPAS[impresionEtapa].title}'.`;
        const historialEntry = generarEntradaHistorial(currentUserRole, 'Enviado a Impresión', detalles);
        
        const updatedPedido = {
            ...pedidoToUpdate,
            etapaActual: impresionEtapa,
            maquinaImpresion: ETAPAS[impresionEtapa].title,
            secuenciaTrabajo: postImpresionSequence,
            etapasSecuencia: [...pedidoToUpdate.etapasSecuencia, { etapa: impresionEtapa, fecha: new Date().toISOString() }],
            historial: [...pedidoToUpdate.historial, historialEntry],
        };
        
        await store.update(updatedPedido);
        setPedidos(prev => prev.map(p => p.id === updatedPedido.id ? updatedPedido : p));
        logAction(`Pedido ${updatedPedido.numeroPedidoCliente} enviado a Impresión.`);
        setPedidoToSend(null);
    };


    const handleArchiveToggle = async (pedido: Pedido) => {
        if (!store) return;
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado.');
            return;
        }

        const isArchived = pedido.etapaActual === Etapa.ARCHIVADO;
        const newEtapa = isArchived ? Etapa.COMPLETADO : Etapa.ARCHIVADO;
        const actionText = isArchived ? 'desarchivado' : 'archivado';
        const historialAction = isArchived ? 'Desarchivado' : 'Archivado';
        
        const historialEntry = generarEntradaHistorial(currentUserRole, historialAction, `Pedido ${actionText}.`);
        const updatedPedido = { ...pedido, etapaActual: newEtapa, historial: [...pedido.historial, historialEntry] };
        
        await store.update(updatedPedido);
        setPedidos(prev => prev.map(p => p.id === pedido.id ? updatedPedido : p));
        logAction(`Pedido ${pedido.numeroPedidoCliente} ${actionText}.`);
        if (selectedPedido && selectedPedido.id === pedido.id) setSelectedPedido(null);
    };
    
    const handleFilterChange = (name: string, value: string) => setFilters(prev => ({ ...prev, [name]: value }));
    const handleDateFilterChange = (value: string) => setDateFilter(value as DateFilterOption);
    const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomDateRange(prev => ({ ...prev, [name]: value }));
    };
    const handleSort = useCallback((key: keyof Pedido) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    }, []);

    const handleViewChange = (newView: ViewType) => {
        if (newView === 'report' && currentUserRole !== 'Administrador') {
            alert('Permiso denegado.');
            return;
        }
        setView(newView);
    }
    
    const handleExportPDF = () => {
        const pedidosToExport = view === 'list' ? activePedidos : (view === 'archived' ? archivedPedidos : []);
        if (pedidosToExport.length > 0) {
            generatePedidosPDF(pedidosToExport);
        } else {
            alert("No hay pedidos para exportar en la vista actual.");
        }
    };
    
    const handleExportData = async () => {
        if (!store) return;
        try {
            const allPedidos = await store.getAll();
            const jsonData = JSON.stringify(allPedidos, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStr = new Date().toISOString().slice(0, 10);
            a.download = `pedidos_backup_${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export data:", error);
            alert("Error al exportar los datos.");
        }
    };

    const handleImportData = () => {
        if (!store) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error("File content is not text.");
                    
                    const importedPedidos: Pedido[] = JSON.parse(text);
                    if (!Array.isArray(importedPedidos) || !importedPedidos.every(p => p.id && p.numeroPedidoCliente)) {
                        throw new Error("Invalid JSON format. Expected an array of orders.");
                    }

                    if (window.confirm(`¿Está seguro de importar ${importedPedidos.length} pedidos? ESTA ACCIÓN BORRARÁ TODOS LOS DATOS ACTUALES.`)) {
                        setIsLoading(true);
                        await store.clear();
                        await store.bulkInsert(importedPedidos);
                        const freshData = await store.getAll();
                        setPedidos(freshData);
                        setIsLoading(false);
                        alert("Datos importados con éxito.");
                    }
                } catch (error) {
                    console.error("Failed to import data:", error);
                    alert(`Error al importar los datos: ${(error as Error).message}`);
                    setIsLoading(false);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-xl font-semibold text-gray-500 dark:text-gray-400">Cargando datos...</div>
                </div>
            );
        }
        switch (view) {
            case 'preparacion':
                return (
                    <PreparacionView
                        pedidos={preparacionPedidos}
                        onSelectPedido={setSelectedPedido}
                        currentUserRole={currentUserRole}
                        onSendToPrint={setPedidoToSend}
                    />
                );
            case 'kanban':
                return (
                    <main className="flex-grow p-4 md:p-8 flex flex-col gap-10">
                        <section>
                            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4 border-l-4 border-cyan-500 pl-4">Impresión</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {KANBAN_FUNNELS.IMPRESION.stages.map(etapaId => (
                                    <KanbanColumn
                                        key={etapaId}
                                        etapa={ETAPAS[etapaId]}
                                        pedidos={activePedidos.filter(p => p.etapaActual === etapaId)}
                                        onSelectPedido={setSelectedPedido}
                                        onArchiveToggle={handleArchiveToggle}
                                        currentUserRole={currentUserRole}
                                        onAdvanceStage={handleAdvanceStage}
                                    />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4 border-l-4 border-indigo-500 pl-4">Post-Impresión</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6">
                                {KANBAN_FUNNELS.POST_IMPRESION.stages.map(etapaId => (
                                    <KanbanColumn
                                        key={etapaId}
                                        etapa={ETAPAS[etapaId]}
                                        pedidos={activePedidos.filter(p => p.etapaActual === etapaId)}
                                        onSelectPedido={setSelectedPedido}
                                        onArchiveToggle={handleArchiveToggle}
                                        currentUserRole={currentUserRole}
                                        onAdvanceStage={handleAdvanceStage}
                                    />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4 border-l-4 border-green-500 pl-4">Finalizado</h2>
                            <div className="w-full">
                                <CompletedPedidosList
                                    pedidos={activePedidos.filter(p => p.etapaActual === Etapa.COMPLETADO)}
                                    onSelectPedido={setSelectedPedido}
                                    onArchiveToggle={handleArchiveToggle}
                                    currentUserRole={currentUserRole}
                                />
                            </div>
                        </section>
                    </main>
                );
            case 'list':
                return <PedidoList 
                            pedidos={activePedidos} 
                            onSelectPedido={setSelectedPedido}
                            onArchiveToggle={handleArchiveToggle}
                            isArchivedView={false}
                            currentUserRole={currentUserRole}
                            onAdvanceStage={handleAdvanceStage}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                        />;
            case 'archived':
                return <PedidoList 
                            pedidos={archivedPedidos}
                            onSelectPedido={setSelectedPedido}
                            onArchiveToggle={handleArchiveToggle}
                            isArchivedView={true}
                            currentUserRole={currentUserRole}
                            onAdvanceStage={handleAdvanceStage}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                        />;
            case 'report':
                    if (currentUserRole !== 'Administrador') {
                    return <div className="p-8 text-center text-red-500">Acceso denegado.</div>;
                    }
                return <ReportView pedidos={pedidos} auditLog={auditLog} />;
            default:
                return null;
        }
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="min-h-screen text-gray-900 dark:text-white flex flex-col">
                <Header
                    onSearch={setSearchTerm}
                    currentView={view}
                    onViewChange={handleViewChange}
                    onFilterChange={handleFilterChange}
                    activeFilters={filters}
                    onDateFilterChange={handleDateFilterChange}
                    activeDateFilter={dateFilter}
                    customDateRange={customDateRange}
                    onCustomDateChange={handleCustomDateChange}
                    currentUserRole={currentUserRole}
                    onRoleChange={setCurrentUserRole}
                    onAddPedido={() => setIsAddModalOpen(true)}
                    onExportPDF={handleExportPDF}
                    onExportData={handleExportData}
                    onImportData={handleImportData}
                />
                {renderContent()}
                {selectedPedido && (
                    <PedidoModal
                        pedido={selectedPedido}
                        onClose={() => setSelectedPedido(null)}
                        onSave={handleSavePedido}
                        onArchiveToggle={handleArchiveToggle}
                        currentUserRole={currentUserRole}
                        onAdvanceStage={handleAdvanceStage}
                        onSendToPrint={setPedidoToSend}
                    />
                )}
                {isAddModalOpen && (
                    <AddPedidoModal
                        onClose={() => setIsAddModalOpen(false)}
                        onAdd={handleAddPedido}
                    />
                )}
                {pedidoToSend && (
                    <EnviarAImpresionModal
                        pedido={pedidoToSend}
                        onClose={() => setPedidoToSend(null)}
                        onConfirm={handleConfirmSendToPrint}
                    />
                )}
                <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
            </div>
        </DragDropContext>
    );
};

export default App;