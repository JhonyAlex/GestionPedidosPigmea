import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Pedido, Etapa, ViewType, UserRole, AuditEntry, Prioridad, EstadoCliché, HistorialEntry, DateField } from './types';
import { KANBAN_FUNNELS, KANBAN_VISUAL_LAYOUT, ETAPAS, PREPARACION_SUB_ETAPAS_IDS } from './constants';
import { DateFilterOption } from './utils/date';
import { calculateTotalProductionTime, generatePedidosPDF, parseTimeToMinutes, formatMinutesToHHMM } from './utils/kpi';
import { scrollToPedido } from './utils/scroll';
import KanbanColumn from './components/KanbanColumn';
import PedidoModal from './components/PedidoModal';
import AddPedidoModal from './components/AddPedidoModal';
import AntivahoConfirmationModal from './components/AntivahoConfirmationModal';
import AntivahoDestinationModal from './components/AntivahoDestinationModal';
import Header from './components/Header';
import PedidoList from './components/PedidoList';
import ReportView from './components/ReportView';
import ClientesList from './components/ClientesList';
import VendedoresList from './components/VendedoresList';
import ThemeSwitcher from './components/ThemeSwitcher';
import CompletedPedidosList from './components/CompletedPedidosList';
import PreparacionView from './components/PreparacionView';
import ListoProduccionView from './components/ListoProduccionView';

import EnviarAImpresionModal from './components/EnviarAImpresionModal';
import SequenceReorderModal from './components/SequenceReorderModal';
import NotificationCenter from './components/NotificationCenter';
import ConnectedUsers from './components/ConnectedUsers';
import LoginModal from './components/LoginModal';
import UserInfo from './components/UserInfo';
import UserManagement from './components/UserManagement';
import PermissionsDebug from './components/PermissionsDebug';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import BulkArchiveConfirmationModal from './components/BulkArchiveConfirmationModal';
import BulkDateUpdateModal from './components/BulkDateUpdateModal';
import BulkMachineUpdateModal from './components/BulkMachineUpdateModal';
import BulkStageUpdateModal from './components/BulkStageUpdateModal';
import BulkClicheUpdateModal from './components/BulkClicheUpdateModal';
import ImportDataModal from './components/ImportDataModal';
import BulkImportModalV2 from './components/BulkImportModalV2';
import PdfImportModal from './components/PdfImportModal';
import { ToastContainer } from './components/Toast';
import NotesWidget from './components/NotesWidget';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MaterialesProvider } from './contexts/MaterialesContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { calcularSiguienteEtapa, estaFueraDeSecuencia } from './utils/etapaLogic';
import { procesarDragEnd } from './utils/dragLogic';
import { usePedidosManager } from './hooks/usePedidosManager';
import { useMaterialesManager } from './hooks/useMaterialesManager';
import { useWebSocket } from './hooks/useWebSocket';
import { useFiltrosYOrden } from './hooks/useFiltrosYOrden';
import { useListasTemporales } from './hooks/useListasTemporales';
import { useNavigateToPedido } from './hooks/useNavigateToPedido';
import { store } from './services/storage';
import { useBulkOperations } from './hooks/useBulkOperations';
import { useToast } from './hooks/useToast';
import { useInactivityReload } from './hooks/useInactivityReload';
import { useVersionCheck } from './hooks/useVersionCheck';
import { auditService } from './services/audit';
import UpdateBanner from './components/UpdateBanner';
import {
    KanbanManualOrderMap,
    loadKanbanManualOrderMap,
    pruneKanbanManualOrderMap,
    saveKanbanManualOrderMap,
    sortKanbanColumnPedidos,
    mergeVisibleKanbanReorder,
    getOrderedKanbanColumnPedidos
} from './utils/kanbanManualOrder';


const AppContent: React.FC = () => {
    const { user, loading, logout } = useAuth();
    const { updateAvailable, newVersion, forceRefresh } = useVersionCheck();

    // Hook para detectar inactividad y cerrar sesión automáticamente
    // ⚠️ Sincronizado con el timeout de bloqueo de pedidos (30 minutos)
    useInactivityReload({
        inactivityThreshold: 30 * 60 * 1000, // 30 minutos (igual que el timeout de bloqueos)
        reloadDelay: 3000, // 3 segundos para mostrar mensaje
        onLogout: logout // Cerrar sesión al detectar inactividad
    });

    // Hook de toast para notificaciones
    const { messages: toastMessages, addToast, removeToast } = useToast();

    // Estados locales - siempre llamar antes de returns condicionales
    const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddPedidoPruebaModalOpen, setIsAddPedidoPruebaModalOpen] = useState(false);
    const [clientePreseleccionado, setClientePreseleccionado] = useState<{ id: string; nombre: string } | null>(null); // ✅ Estado para cliente preseleccionado
    
    // 💾 Persistir vista actual en localStorage para que al recargar vuelva donde estaba
    const [view, setView] = useState<ViewType>(() => {
        if (typeof window !== 'undefined' && localStorage.lastView) {
            return localStorage.lastView as ViewType;
        }
        return 'preparacion';
    });
    
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [pedidoToSend, setPedidoToSend] = useState<Pedido | null>(null);
    const [pedidoToReorder, setPedidoToReorder] = useState<Pedido | null>(null);
    const [highlightedPedidoId, setHighlightedPedidoId] = useState<string | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [duplicatingMessage, setDuplicatingMessage] = useState('Duplicando pedido...');
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [showPdfImportModal, setShowPdfImportModal] = useState(false);
    const [kanbanManualOrderMap, setKanbanManualOrderMap] = useState<KanbanManualOrderMap>(() => loadKanbanManualOrderMap());

    // Estados para operaciones masivas
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showDateUpdateModal, setShowDateUpdateModal] = useState(false);
    const [showMachineUpdateModal, setShowMachineUpdateModal] = useState(false);
    const [showStageUpdateModal, setShowStageUpdateModal] = useState(false);
    const [showClicheUpdateModal, setShowClicheUpdateModal] = useState(false);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && localStorage.theme) {
            return localStorage.theme as 'light' | 'dark';
        }
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    // Valores derivados del usuario (o valores por defecto)
    const currentUserRole = user?.role || 'Visualizador';
    const currentUserId = user?.username || 'guest-user';
    const currentUserDisplayName = user?.displayName;

    // Hooks personalizados - siempre llamar antes de returns condicionales
    const {
        isConnected,
        notifications,
        connectedUsers,
        removeNotification,
        emitActivity,
        subscribeToPedidoCreated,
        subscribeToPedidoUpdated,
        subscribeToPedidoDeleted,
        subscribeToPedidosByVendedorUpdated,
        subscribeToPedidosByClienteUpdated,
        subscribeToPageReturn
    } = useWebSocket(currentUserId, currentUserRole, currentUserDisplayName);

    const generarEntradaHistorial = useCallback((usuarioRole: UserRole, accion: string, detalles: string): HistorialEntry => ({
        timestamp: new Date().toISOString(),
        usuario: user?.displayName || user?.username || usuarioRole, // Usar nombre del usuario en lugar del rol
        accion,
        detalles
    }), [user]);

    const {
        pedidos,
        setPedidos,
        isLoading,
        setIsLoading,
        handleSavePedido: handleSavePedidoLogic,
        handleAddPedido: handleAddPedidoLogic,
        handleConfirmSendToPrint: handleConfirmSendToPrintLogic,
        handleArchiveToggle: handleArchiveToggleLogic,
        handleDuplicatePedido: handleDuplicatePedidoLogic,
        handleDeletePedido: handleDeletePedidoLogic,
        handleExportData,
        handleImportData,
        handleImportSelectedPedidos,
        handleUpdatePedidoEtapa,
        antivahoModalState,
        handleConfirmAntivaho,
        handleCancelAntivaho,
        antivahoDestinationModalState,
        setAntivahoDestinationModalState,
        handleAntivahoDestinationImpresion,
        handleAntivahoDestinationListoProduccion,
        handleCancelAntivahoDestination,
        handleSetReadyForProduction,
        currentPage,
        hasMore,
        totalPedidos,
        loadMore,
        reloadPedidos,
    } = usePedidosManager(
        currentUserRole,
        generarEntradaHistorial,
        setPedidoToSend,
        subscribeToPedidoCreated,
        subscribeToPedidoUpdated,
        subscribeToPedidoDeleted,
        subscribeToPedidosByVendedorUpdated,
        subscribeToPedidosByClienteUpdated
    );

    // Hook de materiales
    const { getMaterialesByPedidoId } = useMaterialesManager();

    // Hook para listas temporales (visualización sin cambiar etapa real)
    const {
        listasTemporalesMap,
        setListaTemporal,
        resetListaTemporal,
        limpiarHuerfanos,
    } = useListasTemporales();

    // Estado para filtro de "Solo con lista temporal" en la vista Producción (kanban)
    const [filtrarSoloTemporales, setFiltrarSoloTemporales] = useState(false);

    const {
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
        weekFilter,
        handleWeekFilterToggle,
        handleWeekChange,
        handleWeekDateFieldChange,
        dateFilter,
        handleDateFilterChange,
        customDateRange,
        handleCustomDateChange,
        sortConfig,
        handleSort,
        updateSortConfig,
        resetAllFilters,
    } = useFiltrosYOrden(pedidos, listasTemporalesMap, kanbanManualOrderMap);

    // Hook para navegación a pedidos desde reportes y búsqueda global
    const { navigateToPedido } = useNavigateToPedido({
        setView,
        setSelectedPedido,
        setHighlightedPedidoId
    });

    // Función para navegar a un pedido (usado por búsqueda global y referencias)
    const handleNavigateToPedido = useCallback((pedido: Pedido) => {
        // Limpiar el término de búsqueda al navegar
        setSearchTerm('');
        navigateToPedido(pedido);
    }, [navigateToPedido, setSearchTerm]);

    // Función para navegar a un pedido por ID (usado por clientes/vendedores)
    const handleNavigateToPedidoById = useCallback((pedidoId: string) => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (pedido) {
            handleNavigateToPedido(pedido);
        } else {
            console.warn('Pedido no encontrado:', pedidoId);
        }
    }, [pedidos, handleNavigateToPedido]);

    // Hook para operaciones masivas
    const {
        selectedIds,
        isSelectionActive,
        toggleSelection,
        clearSelection,
        selectAll,
        bulkDelete,
        bulkUpdateDate,
        bulkUpdateMachine,
        bulkArchive,
    } = useBulkOperations();

    // Limpiar selección al cambiar de vista
    useEffect(() => {
        clearSelection();
    }, [view, clearSelection]);

    // 💾 Guardar vista actual en localStorage cada vez que cambie
    useEffect(() => {
        localStorage.setItem('lastView', view);
    }, [view]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    // Resetear filtros de etapa cuando se cambia entre vistas con diferentes sistemas de filtro
    useEffect(() => {
        const viewsThatNeedStageReset = ['preparacion', 'listoProduccion', 'archived', 'report'];

        if (viewsThatNeedStageReset.includes(view)) {
            // Resetear completamente para vistas que no usan filtros de etapa
            resetStageFilters();
        } else if (view === 'kanban' && selectedStages.length > 0) {
            // Al ir de 'list' (botones) a 'kanban' (select), resetear botones
            resetStageFilters();
        } else if (view === 'list' && filters.stage !== 'all') {
            // Al ir de 'kanban' (select) a 'list' (botones), resetear select
            resetTraditionalStageFilter();
        }
    }, [view, resetStageFilters, resetTraditionalStageFilter, selectedStages.length, filters.stage]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const logAction = useCallback(async (action: string, pedidoId?: string) => {
        const userName = user?.displayName || user?.username || currentUserRole;

        // Agregar al estado local para respuesta inmediata
        setAuditLog(prevLog => {
            const newEntry = { timestamp: new Date().toISOString(), userRole: userName, action };
            return [newEntry, ...prevLog];
        });

        // Persistir en base de datos
        await auditService.logAction(userName, action, pedidoId);
    }, [currentUserRole, user]);

    // Cargar registros de auditoría al iniciar
    useEffect(() => {
        const loadAuditLog = async () => {
            try {
                const savedAuditLog = await auditService.getAuditLog(100);
                setAuditLog(savedAuditLog);
            } catch (error) {
                console.error('Error cargando log de auditoría:', error);
            }
        };
        loadAuditLog();
    }, []);

    // Limpiar listas temporales de pedidos que ya no existen
    useEffect(() => {
        if (pedidos.length > 0) {
            limpiarHuerfanos(pedidos.map(p => p.id));
        }
    }, [pedidos, limpiarHuerfanos]);

    useEffect(() => {
        if (isLoading) return; // ✅ NO podar el mapa de ordenamiento si los pedidos aún se están cargando
        
        const existingPedidoIds = new Set(pedidos.map(p => p.id));

        setKanbanManualOrderMap(prev => {
            const next = pruneKanbanManualOrderMap(prev, existingPedidoIds);
            const prevEntries = Object.entries(prev);
            const nextEntries = Object.entries(next);
            const isEqual = prevEntries.length === nextEntries.length
                && prevEntries.every(([stageId, ids]) => {
                    const nextIds = next[stageId as Etapa] || [];
                    return ids.length === nextIds.length && ids.every((id, index) => id === nextIds[index]);
                });

            if (isEqual) {
                return prev;
            }

            saveKanbanManualOrderMap(next);
            return next;
        });
    }, [pedidos, isLoading]);

    // Si no quedan listas temporales, apagar el filtro para evitar pantalla en blanco.
    useEffect(() => {
        if (filtrarSoloTemporales && Object.keys(listasTemporalesMap).length === 0) {
            setFiltrarSoloTemporales(false);
        }
    }, [filtrarSoloTemporales, listasTemporalesMap]);

    const updateKanbanManualOrderForStage = useCallback((stageId: Etapa, orderedIds: string[]) => {
        setKanbanManualOrderMap(prev => {
            const normalizedIds = Array.from(new Set(orderedIds.filter(Boolean)));
            const previousIds = prev[stageId] || [];
            const isEqual = previousIds.length === normalizedIds.length
                && previousIds.every((id, index) => id === normalizedIds[index]);

            if (isEqual) {
                return prev;
            }

            const next: KanbanManualOrderMap = { ...prev };

            if (normalizedIds.length > 0) {
                next[stageId] = normalizedIds;
            } else {
                delete next[stageId];
            }

            saveKanbanManualOrderMap(next);
            return next;
        });
    }, []);

    const productionKanbanStages = useMemo(
        () => [
            ...KANBAN_VISUAL_LAYOUT.topRow,
            ...KANBAN_VISUAL_LAYOUT.postImpresionRows.flatMap(row => row.stages),
        ],
        []
    );

    const preparacionPedidos = useMemo(() => processedPedidos.filter(p => p.etapaActual === Etapa.PREPARACION && p.subEtapaActual !== PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION), [processedPedidos]);
    const listoProduccionPedidos = useMemo(() => processedPedidos.filter(p => p.etapaActual === Etapa.PREPARACION && p.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION), [processedPedidos]);
    const activePedidos = useMemo(() => processedPedidos.filter(p => p.etapaActual !== Etapa.ARCHIVADO && p.etapaActual !== Etapa.PREPARACION), [processedPedidos]);

    // --- Archivados: estado separado con carga diferida ---
    const [archivedPedidos, setArchivedPedidos] = useState<Pedido[]>([]);
    const [isLoadingArchived, setIsLoadingArchived] = useState(false);
    const [archivedPage, setArchivedPage] = useState(1);
    const [archivedHasMore, setArchivedHasMore] = useState(true);
    const [archivedTotal, setArchivedTotal] = useState(0);

    const loadArchivedPedidos = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            setIsLoadingArchived(true);
            const result = await store.getArchived(page, 50);
            if (append) {
                setArchivedPedidos(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = result.pedidos.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
            } else {
                setArchivedPedidos(result.pedidos);
            }
            setArchivedPage(page);
            setArchivedHasMore(page < result.pagination.totalPages);
            setArchivedTotal(result.pagination.total);
        } catch (error) {
            console.error('❌ Error cargando archivados:', error);
        } finally {
            setIsLoadingArchived(false);
        }
    }, []);

    // Cargar archivados al entrar a la vista, limpiar al salir
    useEffect(() => {
        if (view === 'archived') {
            loadArchivedPedidos(1, false);
        } else {
            // Limpiar memoria cuando el usuario sale de la vista
            setArchivedPedidos([]);
            setArchivedPage(1);
            setArchivedHasMore(true);
            setArchivedTotal(0);
        }
    }, [view, loadArchivedPedidos]);

    const kanbanAllPedidosByStage = useMemo(() => {
        return productionKanbanStages.reduce((acc, etapaId) => {
            const columnPedidos = activePedidos.filter(p =>
                p.etapaActual === etapaId ||
                (listasTemporalesMap[p.id] || []).includes(etapaId)
            );

            acc[etapaId] = sortKanbanColumnPedidos(columnPedidos, etapaId, kanbanManualOrderMap);
            return acc;
        }, {} as Partial<Record<Etapa, Pedido[]>>);
    }, [activePedidos, listasTemporalesMap, kanbanManualOrderMap, productionKanbanStages]);

    const kanbanVisiblePedidosByStage = useMemo(() => {
        return productionKanbanStages.reduce((acc, etapaId) => {
            const columnPedidos = kanbanAllPedidosByStage[etapaId] || [];

            acc[etapaId] = filtrarSoloTemporales
                ? columnPedidos.filter(p => (listasTemporalesMap[p.id] || []).length > 0)
                : columnPedidos;

            return acc;
        }, {} as Partial<Record<Etapa, Pedido[]>>);
    }, [filtrarSoloTemporales, kanbanAllPedidosByStage, listasTemporalesMap, productionKanbanStages]);

    const listViewMetrics = useMemo(() => {
        const totals = activePedidos.reduce((acc, pedido) => {
            const metros = typeof pedido.metros === 'number' ? pedido.metros : Number(pedido.metros || 0);
            const tiempoPlanificado = pedido.tiempoProduccionPlanificado
                ? parseTimeToMinutes(pedido.tiempoProduccionPlanificado)
                : Math.round((pedido.tiempoProduccionDecimal || 0) * 60);

            acc.totalPedidos += 1;
            acc.totalMetros += Number.isFinite(metros) ? metros : 0;
            acc.totalMinutos += tiempoPlanificado;
            return acc;
        }, {
            totalPedidos: 0,
            totalMetros: 0,
            totalMinutos: 0,
        });

        return {
            totalPedidos: totals.totalPedidos,
            totalMetros: totals.totalMetros,
            totalTiempo: formatMinutesToHHMM(totals.totalMinutos),
        };
    }, [activePedidos]);

    const handleManualKanbanReorder = useCallback((stageId: Etapa, pedidoId: string, destinationIndex: number) => {
        const visiblePedidos = kanbanVisiblePedidosByStage[stageId] || [];
        const sourceIndex = visiblePedidos.findIndex(p => p.id === pedidoId);
        
        if (sourceIndex === -1 || sourceIndex === destinationIndex) return;

        const allPedidosInStage = kanbanAllPedidosByStage[stageId] || [];
        const finalOrderedIds = mergeVisibleKanbanReorder(
            allPedidosInStage,
            visiblePedidos,
            sourceIndex,
            destinationIndex
        );

        updateKanbanManualOrderForStage(stageId, finalOrderedIds);

        // Calculate positions to maintain persistence
        const fullColumnPedidos = kanbanAllPedidosByStage[stageId] || [];
        const reordered = getOrderedKanbanColumnPedidos(fullColumnPedidos, finalOrderedIds);
        
        const updatedPositions = new Map<string, number>();
        reordered
            .filter(pedido => pedido.etapaActual === stageId)
            .forEach((pedido, index) => {
                updatedPositions.set(pedido.id, index + 1);
            });

        // Optimistic UI update
        setPedidos(prev => prev.map(pedido => {
            if (pedido.etapaActual === stageId) {
                const newPos = updatedPositions.get(pedido.id);
                if (newPos !== undefined && newPos !== pedido.posicionEnEtapa) {
                    return { ...pedido, posicionEnEtapa: newPos };
                }
            }
            return pedido;
        }));

        // Trigger persistence & log
        const pedidoToUpdate = pedidos.find(p => p.id === pedidoId);
        if (pedidoToUpdate) {
            const entrada = generarEntradaHistorial(
                currentUserRole,
                'Reordenamiento Manual',
                `Pedido movido a la posición ${destinationIndex + 1} en ${ETAPAS[stageId]?.title ?? stageId} (Botón Orden)`
            );
            const updatedPedido = {
                ...pedidoToUpdate,
                posicionEnEtapa: updatedPositions.get(pedidoToUpdate.id) ?? pedidoToUpdate.posicionEnEtapa,
                historial: [...(pedidoToUpdate.historial || []), entrada]
            };
            handleSavePedidoLogic(updatedPedido).catch(console.error);
            logAction(`Pedido ${pedidoToUpdate.numeroPedidoCliente} movido a la posición ${destinationIndex + 1} en ${ETAPAS[stageId]?.title ?? stageId}.`, pedidoToUpdate.id);
        }
    }, [kanbanVisiblePedidosByStage, kanbanAllPedidosByStage, updateKanbanManualOrderForStage, setPedidos, pedidos, currentUserRole, generarEntradaHistorial, handleSavePedidoLogic, logAction]);

    const handleDragEnd = useCallback(async (result: DropResult) => {
        await procesarDragEnd({
            result,
            pedidos,
            processedPedidos,
            currentUserRole,
            generarEntradaHistorial,
            logAction,
            setPedidos,
            handleSavePedido: handleSavePedidoLogic,
            handleUpdatePedidoEtapa,
            setSortConfig: updateSortConfig, // Usar la función correcta para establecer el sorting
            getMaterialesByPedidoId,
            kanbanAllPedidosByStage,
            kanbanVisiblePedidosByStage,
            setKanbanManualOrderForStage: updateKanbanManualOrderForStage,
        });

    }, [
        pedidos,
        currentUserRole,
        processedPedidos,
        generarEntradaHistorial,
        logAction,
        setPedidos,
        handleSavePedidoLogic,
        handleUpdatePedidoEtapa,
        getMaterialesByPedidoId,
        kanbanAllPedidosByStage,
        kanbanVisiblePedidosByStage,
        updateKanbanManualOrderForStage,
        updateSortConfig,
    ]);

    const handleAdvanceStage = async (pedidoToAdvance: Pedido) => {
        // Para pedidos con antivaho no realizado en post-impresión, primero decidir si vuelve a impresión
        // o si pasa a listo para producción.
        const isInPostImpresion = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedidoToAdvance.etapaActual);
        const isInPostLaminacionNexus = pedidoToAdvance.etapaActual === Etapa.POST_LAMINACION_NEXUS;
        const isInListoProduccion = pedidoToAdvance.etapaActual === Etapa.PREPARACION && 
                                     pedidoToAdvance.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
        
        // Para antivaho pendiente, la decisión de destino solo se toma al salir de Laminación NEXUS.
        if (pedidoToAdvance.antivaho && !pedidoToAdvance.antivahoRealizado && isInPostLaminacionNexus) {
            setAntivahoDestinationModalState({ isOpen: true, pedido: pedidoToAdvance });
            return;
        }

        if (pedidoToAdvance.antivaho && !pedidoToAdvance.antivahoRealizado && isInListoProduccion) {
            setPedidoToSend(pedidoToAdvance);
            return;
        }

        // Si el pedido está fuera de secuencia, abrir modal de reordenamiento
        if (estaFueraDeSecuencia(pedidoToAdvance.etapaActual, pedidoToAdvance.secuenciaTrabajo, pedidoToAdvance.cliente)) {
            setPedidoToReorder(pedidoToAdvance);
            return;
        }

        const { etapaActual, secuenciaTrabajo } = pedidoToAdvance;
        const newEtapa = calcularSiguienteEtapa(etapaActual, secuenciaTrabajo, pedidoToAdvance.cliente);

        if (newEtapa) {
            // Highlight effect
            setHighlightedPedidoId(pedidoToAdvance.id);

            await handleUpdatePedidoEtapa(pedidoToAdvance, newEtapa);

            logAction(`Pedido ${pedidoToAdvance.numeroPedidoCliente} avanzado de ${ETAPAS[etapaActual].title} a ${ETAPAS[newEtapa].title}.`, pedidoToAdvance.id);

            // 🎉 Notificación toast con opción de navegar
            const etapaAnterior = ETAPAS[etapaActual]?.title || etapaActual;
            const etapaNueva = ETAPAS[newEtapa]?.title || newEtapa;

            addToast(
                `✅ Pedido ${pedidoToAdvance.numeroPedidoCliente} movido de "${etapaAnterior}" a "${etapaNueva}"`,
                'success',
                {
                    duration: 6000,
                    pedidoId: pedidoToAdvance.id,
                    onNavigate: () => {
                        // Cambiar a la vista apropiada según la etapa
                        if (newEtapa === Etapa.PREPARACION) {
                            setView('preparacion');
                        } else if (newEtapa === Etapa.COMPLETADO) {
                            setView('archived');
                        } else {
                            setView('kanban');
                        }
                        // Scroll automático al pedido
                        scrollToPedido(pedidoToAdvance.id);
                    }
                }
            );

            // Scroll automático al pedido después de un pequeño delay
            // scrollToPedido(pedidoToAdvance.id, 120);

            setTimeout(() => {
                setHighlightedPedidoId(null);
            }, 6000); // 6 segundos (sincronizado con la animación)
        }
    };

    const handleMoveToVisibleStage = useCallback(async (pedidoId: string, targetEtapa: Etapa) => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido || pedido.etapaActual === targetEtapa) return;

        const etapaOrigen = pedido.etapaActual;
        const fromPostImpresion = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedido.etapaActual);
        const fromListoProduccion = pedido.etapaActual === Etapa.PREPARACION
            && pedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
        const toImpresion = KANBAN_FUNNELS.IMPRESION.stages.includes(targetEtapa);
        const requiresAntivahoConfirmation = pedido.antivaho
            && !pedido.antivahoRealizado
            && (fromPostImpresion || fromListoProduccion)
            && toImpresion;

        await handleUpdatePedidoEtapa(pedido, targetEtapa);
        if (requiresAntivahoConfirmation) return;

        // Intercambio de lugar: la etapa de destino pasa a ser real y la anterior queda como temporal.
        setListaTemporal(pedidoId, targetEtapa, false);
        setListaTemporal(pedidoId, etapaOrigen, true);

        logAction(
            `Pedido ${pedido.numeroPedidoCliente} movido desde "${ETAPAS[etapaOrigen].title}" a "${ETAPAS[targetEtapa].title}" desde Visibilidad en Listas.`,
            pedido.id
        );
    }, [pedidos, handleUpdatePedidoEtapa, setListaTemporal, logAction]);

    const handleSavePedido = async (updatedPedido: Pedido) => {
        const originalPedido = pedidos.find(p => p.id === updatedPedido.id);
        const result = await handleSavePedidoLogic(updatedPedido);
        
        if (result?.hasChanges) {
            logAction(`Pedido ${result.modifiedPedido.numeroPedidoCliente} actualizado.`, result.modifiedPedido.id);
            // 🚀 Emitir actividad WebSocket
            emitActivity('pedido-edited', {
                pedidoId: result.modifiedPedido.id,
                numeroCliente: result.modifiedPedido.numeroPedidoCliente
            });

            // 🆕 LÓGICA ESPECIAL PARA ANTIVAHO DESDE LISTO PARA PRODUCCIÓN
            // Si se marca antivahoRealizado=true desde LISTO_PARA_PRODUCCION, abrir modal de destino
            const wasInListoProduccion = originalPedido?.etapaActual === Etapa.PREPARACION && 
                                         originalPedido?.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
            const hasAntivahoAndJustMarked = updatedPedido.antivaho && 
                                              updatedPedido.antivahoRealizado && 
                                              !originalPedido?.antivahoRealizado;
            
            if (wasInListoProduccion && hasAntivahoAndJustMarked) {
                // Abrir modal de destino de antivaho
                setAntivahoDestinationModalState({ isOpen: true, pedido: result.modifiedPedido });
                setSelectedPedido(null);
                return;
            }
        }
        setSelectedPedido(null);
    };

    // ✅ FIX: Auto-save separado que NO cierra el modal
    // Usado por SeccionDatosTecnicosDeMaterial cuando materialDisponible cambia automáticamente
    const handleAutoSavePedido = async (updatedPedido: Pedido) => {
        const originalPedido = pedidos.find(p => p.id === updatedPedido.id);
        const result = await handleSavePedidoLogic(updatedPedido);
        if (result?.hasChanges) {
            logAction(`Pedido ${result.modifiedPedido.numeroPedidoCliente} auto-guardado.`, result.modifiedPedido.id);
            emitActivity('pedido-edited', {
                pedidoId: result.modifiedPedido.id,
                numeroCliente: result.modifiedPedido.numeroPedidoCliente
            });

            // 🆕 LÓGICA ESPECIAL PARA ANTIVAHO DESDE LISTO PARA PRODUCCIÓN
            // Si se marca antivahoRealizado=true desde LISTO_PARA_PRODUCCION, abrir modal de destino
            const wasInListoProduccion = originalPedido?.etapaActual === Etapa.PREPARACION && 
                                         originalPedido?.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
            const hasAntivahoAndJustMarked = updatedPedido.antivaho && 
                                              updatedPedido.antivahoRealizado && 
                                              !originalPedido?.antivahoRealizado;
            
            if (wasInListoProduccion && hasAntivahoAndJustMarked) {
                // Abrir modal de destino de antivaho
                setAntivahoDestinationModalState({ isOpen: true, pedido: result.modifiedPedido });
                setSelectedPedido(null);
                return;
            }
        }
        // ✅ NO cerrar el modal - el usuario sigue editando (a menos que se abra el modal de antivaho)
    };

    const handleAddPedido = async (data: { pedidoData: Omit<Pedido, 'id' | 'secuenciaPedido' | 'numeroRegistro' | 'fechaCreacion' | 'etapasSecuencia' | 'subEtapasSecuencia' | 'etapaActual' | 'subEtapaActual' | 'secuenciaTrabajo' | 'orden' | 'historial'>; secuenciaTrabajo: Etapa[]; initialStage?: Etapa }) => {
        const newPedido = await handleAddPedidoLogic(data);
        if (newPedido) {
            logAction(`Nuevo pedido ${newPedido.numeroPedidoCliente} creado.`, newPedido.id);
            setIsAddModalOpen(false);
            setClientePreseleccionado(null); // ✅ Limpiar cliente preseleccionado
            setSearchTerm(''); // ✅ Limpiar búsqueda para asegurar visibilidad
            // 🚀 Emitir actividad WebSocket
            emitActivity('pedido-created', {
                pedidoId: newPedido.id,
                numeroCliente: newPedido.numeroPedidoCliente
            });
        }
        return newPedido; // ✅ Devolver el pedido creado para que AddPedidoModal pueda registrar la acción
    };

    // ✅ Función para abrir modal de crear pedido con cliente preseleccionado
    const handleCrearPedidoDesdeCliente = (cliente: { id: string; nombre: string }) => {
        setClientePreseleccionado(cliente);
        setIsAddModalOpen(true);
        setView('preparacion'); // Cambiar a vista de pedidos
    };

    const handleCrearPedidoDesdeVendedor = (vendedor: { id: string; nombre: string }) => {
        // Similar a clientes, pero con vendedor preseleccionado
        // Nota: Necesitarías añadir estado vendedorPreseleccionado similar a clientePreseleccionado
        setIsAddModalOpen(true);
        setView('preparacion'); // Cambiar a vista de pedidos
    };

    const handleConfirmSendToPrint = (pedidoToUpdate: Pedido, impresionEtapa: Etapa, postImpresionSequence: Etapa[]) => {
        // 1. Close modal and highlight in original position
        setPedidoToSend(null);
        setHighlightedPedidoId(pedidoToUpdate.id);

        // 2. Move immediately for better UX
        setTimeout(() => {
            // This function from the hook updates the DB and the `pedidos` state
            handleConfirmSendToPrintLogic(pedidoToUpdate, impresionEtapa, postImpresionSequence)
                .then(updatedPedido => {
                    if (updatedPedido) {
                        logAction(`Pedido ${updatedPedido.numeroPedidoCliente} enviado a Impresión.`, updatedPedido.id);

                        // 🎉 Notificación toast
                        const etapaNueva = ETAPAS[impresionEtapa]?.title || impresionEtapa;
                        addToast(
                            `✅ Pedido ${updatedPedido.numeroPedidoCliente} enviado a "${etapaNueva}"`,
                            'success',
                            {
                                duration: 6000,
                                pedidoId: updatedPedido.id,
                                onNavigate: () => {
                                    setView('kanban');
                                    scrollToPedido(updatedPedido.id);
                                }
                            }
                        );

                        // Scroll automático
                        // scrollToPedido(updatedPedido.id, 120);

                        // 3. Set timer to remove highlight from new position
                        setTimeout(() => {
                            setHighlightedPedidoId(null);
                        }, 6000); // 6 segundos
                    } else {
                        // If the update failed, remove the highlight
                        setHighlightedPedidoId(null);
                    }
                });
        }, 50); // Reduced delay for better responsiveness
    };

    const handleConfirmSequenceReorder = async (pedido: Pedido, newSequence: Etapa[], continueTo: Etapa) => {
        // Cerrar modal y resaltar pedido
        setPedidoToReorder(null);
        setHighlightedPedidoId(pedido.id);

        try {
            // Actualizar la secuencia de trabajo del pedido
            const updatedPedido: Pedido = {
                ...pedido,
                secuenciaTrabajo: newSequence,
                historial: [
                    ...(pedido.historial || []),
                    generarEntradaHistorial(
                        currentUserRole,
                        'Secuencia Reordenada',
                        `Secuencia reordenada: ${newSequence.map(e => ETAPAS[e].title).join(' → ')}`
                    )
                ]
            };

            // Guardar la secuencia actualizada
            const saveResult = await handleSavePedidoLogic(updatedPedido);

            if (saveResult?.modifiedPedido) {
                logAction(
                    `Pedido ${saveResult.modifiedPedido.numeroPedidoCliente} - secuencia reordenada.`,
                    saveResult.modifiedPedido.id
                );

                // Emitir actividad WebSocket
                emitActivity('pedido-edited', {
                    pedidoId: saveResult.modifiedPedido.id,
                    numeroCliente: saveResult.modifiedPedido.numeroPedidoCliente
                });

                // Si el usuario eligió continuar a una etapa diferente, hacer el movimiento
                if (continueTo !== pedido.etapaActual) {
                    await handleUpdatePedidoEtapa(saveResult.modifiedPedido, continueTo);
                    logAction(
                        `Pedido ${saveResult.modifiedPedido.numeroPedidoCliente} movido a ${ETAPAS[continueTo].title} tras reordenamiento.`,
                        saveResult.modifiedPedido.id
                    );
                }
            }

            // Remover resaltado
            setTimeout(() => {
                setHighlightedPedidoId(null);
            }, 5000); // 5 segundos

        } catch (error) {
            console.error('Error al reordenar secuencia:', error);
            setHighlightedPedidoId(null);
            // Opcional: mostrar mensaje de error al usuario
        }
    };

    const handleArchiveToggle = async (pedido: Pedido) => {
        const result = await handleArchiveToggleLogic(pedido);
        if (result) {
            logAction(`Pedido ${result.updatedPedido.numeroPedidoCliente} ${result.actionText}.`, result.updatedPedido.id);
            if (selectedPedido && selectedPedido.id === pedido.id) {
                setSelectedPedido(null);
            }
        }
    };

    const handleDuplicatePedido = async (pedidoToDuplicate: Pedido) => {
        // Mostrar estado de carga
        setIsDuplicating(true);
        setDuplicatingMessage('Duplicando pedido...');
        setSelectedPedido(null); // Cierra el modal actual

        try {
            // Primer segundo - mensaje de duplicación
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Cambiar mensaje después del primer segundo
            setDuplicatingMessage('Abriendo pedido duplicado...');

            // Segundo segundo - completar proceso
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newPedido = await handleDuplicatePedidoLogic(pedidoToDuplicate);
            if (newPedido) {
                logAction(`Pedido ${pedidoToDuplicate.numeroPedidoCliente} duplicado como ${newPedido.numeroPedidoCliente}.`, newPedido.id);

                // Emitir actividad WebSocket
                emitActivity('pedido-created', {
                    pedidoId: newPedido.id,
                    numeroCliente: newPedido.numeroPedidoCliente
                });

                // ✅ FIX: Abrir el modal del pedido duplicado SIN vaciar el numeroPedidoCliente
                // El pedido ya fue creado en BD con numeroPedidoCliente vacío para que sea único
                // Mostramos el pedido tal como fue creado para evitar confusión
                setSelectedPedido(newPedido);
                setSearchTerm(''); // ✅ Limpiar búsqueda para asegurar visibilidad
            }
        } catch (error) {
            console.error('Error al duplicar pedido:', error);
        } finally {
            setIsDuplicating(false);
            setDuplicatingMessage('Duplicando pedido...'); // Resetear mensaje para próxima vez
        }
    };

    const handleDeletePedido = async (pedidoId: string) => {
        const deletedPedido = await handleDeletePedidoLogic(pedidoId);
        if (deletedPedido) {
            logAction(`Pedido ${deletedPedido.numeroPedidoCliente} eliminado.`, deletedPedido.id);
            setSelectedPedido(null); // Cierra el modal
        }
    };

    // === MANEJADORES DE OPERACIONES MASIVAS ===
    const handleBulkDelete = async () => {
        const ids = [...selectedIds];
        const selectedPedidos = pedidos.filter(p => ids.includes(p.id));
        const result = await bulkDelete(ids);

        if (result.success) {
            // Actualizar la lista de pedidos
            setPedidos(prev => prev.filter(p => !ids.includes(p.id)));

            // Log de auditoría
            logAction(`${result.deletedCount} pedidos eliminados en operación masiva.`);

            // Emitir actividad WebSocket
            emitActivity('bulk-delete', {
                count: result.deletedCount,
                pedidoIds: ids
            });

            // Mostrar toast de éxito
            alert(`✅ ${result.deletedCount} ${result.deletedCount === 1 ? 'pedido eliminado' : 'pedidos eliminados'} exitosamente.`);

            setShowDeleteModal(false);
        } else {
            alert(`❌ Error al eliminar pedidos: ${result.error}`);
        }
    };

    const handleBulkUpdateDate = async (nuevaFecha: string) => {
        const ids = [...selectedIds];
        console.log('🟢 handleBulkUpdateDate - selectedIds:', ids);
        console.log('🟢 handleBulkUpdateDate - nuevaFecha:', nuevaFecha);
        console.log('Total seleccionados:', ids.length);

        // Asegurarse de que nuevaFecha sea un string válido
        if (!nuevaFecha) {
            console.error('Error: nuevaFecha es inválida o vacía');
            alert('Error: La fecha seleccionada no es válida.');
            return;
        }

        const result = await bulkUpdateDate(ids, nuevaFecha);

        console.log('🟢 handleBulkUpdateDate - Resultado:', result);

        if (result.success) {
            console.log('🟢 handleBulkUpdateDate - Actualizando pedidos locales...');

            // Actualizar la lista de pedidos
            setPedidos(prev => {
                const updated = prev.map(p => {
                    if (ids.includes(p.id)) {
                        console.log(`  ✅ Actualizando pedido ${p.id} (${p.numeroPedidoCliente})`);
                        return {
                            ...p,
                            nuevaFechaEntrega: nuevaFecha,
                            historial: [
                                ...(p.historial || []),
                                {
                                    timestamp: new Date().toISOString(),
                                    usuario: user?.displayName || user?.username || currentUserRole,
                                    accion: 'Actualización masiva de Nueva Fecha Entrega',
                                    detalles: `Nueva fecha establecida: ${nuevaFecha}`
                                }
                            ]
                        };
                    }
                    return p;
                });

                console.log('🟢 handleBulkUpdateDate - Pedidos actualizados en estado local');
                return updated;
            });

            // Log de auditoría
            logAction(`${result.updatedCount} pedidos actualizados con nueva fecha: ${nuevaFecha}`);

            // Emitir actividad WebSocket
            emitActivity('bulk-update-date', {
                count: result.updatedCount,
                pedidoIds: ids,
                nuevaFecha
            });

            // Mostrar toast de éxito
            alert(`✅ ${result.updatedCount} ${result.updatedCount === 1 ? 'pedido actualizado' : 'pedidos actualizados'} exitosamente.`);

            setShowDateUpdateModal(false);
        } else {
            alert(`❌ Error al actualizar fechas: ${result.error}`);
        }
    };

    const handleBulkUpdateMachine = async (nuevaMaquina: string) => {
        const ids = [...selectedIds];

        // Validar límite de 30 pedidos
        if (ids.length > 30) {
            alert('⚠️ Por seguridad, no se pueden actualizar más de 30 pedidos a la vez.');
            return;
        }

        const result = await bulkUpdateMachine(ids, nuevaMaquina);

        if (result.success) {
            // Actualizar la lista de pedidos
            setPedidos(prev => {
                return prev.map(p => {
                    if (ids.includes(p.id)) {
                        return {
                            ...p,
                            maquinaImpresion: nuevaMaquina,
                            historial: [
                                ...(p.historial || []),
                                {
                                    timestamp: new Date().toISOString(),
                                    usuario: user?.displayName || user?.username || currentUserRole,
                                    accion: 'Actualización masiva de Máquina',
                                    detalles: `Nueva máquina establecida: ${nuevaMaquina}`
                                }
                            ]
                        };
                    }
                    return p;
                });
            });

            // Log de auditoría
            logAction(`${result.updatedCount} pedidos actualizados con nueva máquina: ${nuevaMaquina}`);

            // Emitir actividad WebSocket
            emitActivity('bulk-update-machine', {
                count: result.updatedCount,
                pedidoIds: ids,
                maquinaImpresion: nuevaMaquina
            });

            // Mostrar toast de éxito
            alert(`✅ ${result.updatedCount} ${result.updatedCount === 1 ? 'pedido actualizado' : 'pedidos actualizados'} exitosamente.`);

            setShowMachineUpdateModal(false);
        } else {
            alert(`❌ Error al actualizar máquinas: ${result.error}`);
        }
    };

    const handleBulkUpdateStage = async (nuevaEtapa: Etapa, nuevaSubEtapa?: string | null) => {
        const ids = [...selectedIds];
        const pedidosSeleccionados = pedidos.filter(p => ids.includes(p.id));

        if (!nuevaEtapa) {
            alert('Selecciona una etapa válida.');
            return;
        }

        // 🚫 VALIDACIÓN: Bloquear pedidos en "Sin Gestión Iniciada" con materiales pendientes de gestión
        // El campo está en pedido.materialConsumo[i].gestionado (dentro del propio pedido)
        const esMovimientoFueraDeSinGestion =
            nuevaSubEtapa !== PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA &&
            !(nuevaEtapa === Etapa.PREPARACION && !nuevaSubEtapa);

        if (esMovimientoFueraDeSinGestion) {
            const pedidosEnGestionNoIniciada = pedidosSeleccionados.filter(
                p => p.etapaActual === Etapa.PREPARACION &&
                     p.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA
            );

            if (pedidosEnGestionNoIniciada.length > 0) {
                const bloqueados: { numeroPedido: string; indices: number[] }[] = [];

                for (const pedido of pedidosEnGestionNoIniciada) {
                    const cantidad = pedido.materialConsumoCantidad ?? 0;
                    const consumo = pedido.materialConsumo ?? [];
                    const sinGestionar: number[] = [];

                    for (let i = 0; i < cantidad; i++) {
                        if (consumo[i]?.gestionado !== true) {
                            sinGestionar.push(i + 1);
                        }
                    }

                    if (sinGestionar.length > 0) {
                        bloqueados.push({
                            numeroPedido: pedido.numeroPedidoCliente,
                            indices: sinGestionar
                        });
                    }
                }

                if (bloqueados.length > 0) {
                    const detalle = bloqueados
                        .map(b => `• ${b.numeroPedido}: ${b.indices.map(n => `Material ${n}`).join(', ')}`)
                        .join('\n');
                    alert(
                        `🚫 No se puede mover ${bloqueados.length === 1 ? 'este pedido' : `estos ${bloqueados.length} pedidos`}\n\n` +
                        'Los siguientes pedidos están en "Sin Gestión Iniciada" con materiales\npendientes de gestión:\n\n' +
                        detalle +
                        '\n\nDebes completar la gestión de sus materiales antes de moverlos.'
                    );
                    return; // ⛔ Bloquear toda la operación
                }
            }
        }

        try {
            // 🚀 Actualización optimista: mover visualmente antes de guardar
            setPedidos(prev => prev.map(p => {
                if (!ids.includes(p.id)) return p;
                if (p.etapaActual === nuevaEtapa && (!nuevaSubEtapa || p.subEtapaActual === nuevaSubEtapa)) return p;
                return {
                    ...p,
                    etapaActual: nuevaEtapa,
                    subEtapaActual: nuevaEtapa === Etapa.PREPARACION ? (nuevaSubEtapa ?? p.subEtapaActual) : undefined
                };
            }));

            let updatedCount = 0;
            for (const pedido of pedidosSeleccionados) {
                if (pedido.etapaActual === nuevaEtapa && (!nuevaSubEtapa || pedido.subEtapaActual === nuevaSubEtapa)) continue;
                await handleUpdatePedidoEtapa(pedido, nuevaEtapa, nuevaEtapa === Etapa.PREPARACION ? nuevaSubEtapa : null);
                updatedCount++;
            }

            if (updatedCount > 0) {
                logAction(`${updatedCount} pedidos movidos a ${ETAPAS[nuevaEtapa].title} en operación masiva.`);
                emitActivity('bulk-stage-update', {
                    count: updatedCount,
                    pedidoIds: ids,
                    etapa: nuevaEtapa,
                    subEtapa: nuevaSubEtapa || null
                });
            }

            alert(`✅ ${updatedCount} ${updatedCount === 1 ? 'pedido movido' : 'pedidos movidos'} a ${ETAPAS[nuevaEtapa].title}.`);
        } catch (error) {
            console.error('Error al cambiar etapa masivamente:', error);
            alert('Error al cambiar de etapa. Revisa la consola para más detalles.');
        } finally {
            setShowStageUpdateModal(false);
        }
    };

    const handleBulkUpdateCliche = async (clicheDisponible: boolean, estadoCliche?: EstadoCliché) => {
        const ids = [...selectedIds];
        const pedidosSeleccionados = pedidos.filter(p => ids.includes(p.id));

        const generarHistorialEntry = () => ({
            timestamp: new Date().toISOString(),
            usuario: user?.displayName || user?.username || currentUserRole,
            accion: 'Actualización masiva de Cliché',
            detalles: `Cliché disponible: ${clicheDisponible ? 'Sí' : 'No'}${estadoCliche ? `, Estado: ${estadoCliche}` : ''}`
        });

        try {
            let updatedCount = 0;
            for (const pedido of pedidosSeleccionados) {
                if (pedido.clicheDisponible === clicheDisponible && (!estadoCliche || pedido.estadoCliché === estadoCliche)) continue;

                const updatedPedido = {
                    ...pedido,
                    clicheDisponible,
                    estadoCliché: estadoCliche ?? pedido.estadoCliché,
                    historial: [...(pedido.historial || []), generarHistorialEntry()]
                };

                const result = await handleSavePedidoLogic(updatedPedido);
                if (result?.hasChanges) updatedCount++;
            }

            if (updatedCount > 0) {
                logAction(`${updatedCount} pedidos actualizados con estado de cliché en operación masiva.`);
                emitActivity('bulk-cliche-update', {
                    count: updatedCount,
                    pedidoIds: ids,
                    clicheDisponible,
                    estadoCliché: estadoCliché || null
                });
            }

            alert(`✅ ${updatedCount} ${updatedCount === 1 ? 'pedido actualizado' : 'pedidos actualizados'} con estado de cliché.`);
        } catch (error) {
            console.error('Error al actualizar cliché masivamente:', error);
            alert('Error al actualizar cliché. Revisa la consola para más detalles.');
        } finally {
            setShowClicheUpdateModal(false);
        }
    };

    const handleBulkArchive = async () => {
        const ids = [...selectedIds];
        const result = await bulkArchive(ids, true);

        if (result.success) {
            // Actualizar la lista de pedidos
            setPedidos(prev => prev.map(p => {
                if (ids.includes(p.id)) {
                    return {
                        ...p,
                        etapaActual: Etapa.ARCHIVADO,
                        archivado: true,
                        historial: [
                            ...(p.historial || []),
                            {
                                timestamp: new Date().toISOString(),
                                usuario: user?.displayName || user?.username || currentUserRole,
                                accion: 'Archivado masivo',
                                detalles: 'Pedido archivado mediante operación masiva'
                            }
                        ]
                    };
                }
                return p;
            }));

            // Log de auditoría
            logAction(`${result.updatedCount} pedidos archivados en operación masiva.`);

            // Emitir actividad WebSocket
            emitActivity('bulk-archive', {
                count: result.updatedCount,
                pedidoIds: ids,
                archived: true
            });

            // Mostrar toast de éxito
            alert(`✅ ${result.updatedCount} ${result.updatedCount === 1 ? 'pedido archivado' : 'pedidos archivados'} exitosamente.`);

            // Limpiar selección y cerrar modal
            clearSelection();
            setShowArchiveModal(false);
        } else {
            alert(`❌ Error al archivar pedidos: ${result.error}`);
        }
    };

    const handleViewChange = (newView: ViewType) => {
        if (newView === 'report' && currentUserRole !== 'Administrador') {
            alert('Permiso denegado.');
            return;
        }

        // Cerrar cualquier modal abierto al cambiar de vista
        if (selectedPedido) {
            console.log('🔄 [APP] Cambiando de vista - cerrando modal abierto');
            setSelectedPedido(null);
        }

        setView(newView);
    }

    const handleExportPDF = () => {
        const pedidosToExport = view === 'list' ? activePedidos : (view === 'archived' ? archivedPedidos : []);
        if (pedidosToExport.length > 0) {
            generatePedidosPDF(pedidosToExport, listasTemporalesMap, { stage: filters.stage, selectedStages });
        } else {
            alert("No hay pedidos para exportar en la vista actual.");
        }
    };

    const doExportData = async () => {
        await handleExportData(pedidos);
    }

    const doImportData = () => {
        setShowImportModal(true);
    }

    // Renderizado condicional DESPUÉS de todos los hooks
    // Mostrar pantalla de carga mientras se verifica la autenticación
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                        Cargando Planning Pigmea...
                    </h2>
                </div>
            </div>
        );
    }

    // Mostrar modal de login si no hay usuario autenticado
    if (!user) {
        return <LoginModal />;
    }

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
                        onArchiveToggle={handleArchiveToggle}
                        currentUserRole={currentUserRole}
                        onSendToPrint={setPedidoToSend}
                        highlightedPedidoId={highlightedPedidoId}
                        onUpdatePedido={handleSavePedido}
                        selectedIds={selectedIds}
                        isSelectionActive={isSelectionActive}
                        onToggleSelection={toggleSelection}
                        onSelectAll={selectAll}
                    />
                );
            case 'listoProduccion':
                return (
                    <ListoProduccionView
                        pedidos={listoProduccionPedidos}
                        onSelectPedido={setSelectedPedido}
                        onArchiveToggle={handleArchiveToggle}
                        currentUserRole={currentUserRole}
                        onSendToPrint={setPedidoToSend}
                        highlightedPedidoId={highlightedPedidoId}
                        onUpdatePedido={handleSavePedido}
                        selectedIds={selectedIds}
                        isSelectionActive={isSelectionActive}
                        onToggleSelection={toggleSelection}
                        onSelectAll={selectAll}
                    />
                );
            case 'clientes':
                return <ClientesList onCrearPedido={handleCrearPedidoDesdeCliente} onNavigateToPedido={handleNavigateToPedidoById} />;
            case 'vendedores':
                return <VendedoresList onCrearPedido={handleCrearPedidoDesdeVendedor} onNavigateToPedido={handleNavigateToPedidoById} />;
            case 'kanban':
                return (
                    <main className="flex-grow p-4 md:p-8 flex flex-col gap-10">
                        {/* Filtro de listas temporales en vista Producción */}
                        {Object.keys(listasTemporalesMap).length > 0 && (
                            <div className="flex items-center gap-3 -mb-6">
                                <button
                                    onClick={() => setFiltrarSoloTemporales(prev => !prev)}
                                    className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                        filtrarSoloTemporales
                                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-400 dark:border-amber-600'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                    title="Mostrar solo pedidos con lista temporal activa"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
                                    </svg>
                                    Con lista temporal ({Object.keys(listasTemporalesMap).length})
                                </button>
                            </div>
                        )}
                        <section>
                            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4 border-l-4 border-cyan-500 pl-4">Impresión y DNT</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {KANBAN_VISUAL_LAYOUT.topRow.map(etapaId => {
                                    const columnPedidos = kanbanVisiblePedidosByStage[etapaId] || [];
                                    return (
                                    <KanbanColumn
                                        key={etapaId}
                                        etapa={ETAPAS[etapaId]}
                                        pedidos={columnPedidos}
                                        onSelectPedido={setSelectedPedido}
                                        onArchiveToggle={handleArchiveToggle}
                                        currentUserRole={currentUserRole}
                                        onAdvanceStage={handleAdvanceStage}
                                        highlightedPedidoId={highlightedPedidoId}
                                        onUpdatePedido={handleSavePedido}
                                        selectedIds={selectedIds}
                                        isSelectionActive={isSelectionActive}
                                        onToggleSelection={toggleSelection}
                                        onSelectAll={selectAll}
                                        listasTemporalesMap={listasTemporalesMap}
                                        onSetListaTemporal={setListaTemporal}
                                        onResetListaTemporal={resetListaTemporal}
                                        onMoveListaTemporal={handleMoveToVisibleStage}
                                        onManualReorder={handleManualKanbanReorder}
                                    />
                                    );
                                })}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4 border-l-4 border-indigo-500 pl-4">Post-Impresión</h2>

                            {KANBAN_VISUAL_LAYOUT.postImpresionRows.map((row, rowIndex) => (
                                <div key={row.title} className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-3 ml-1">{row.title}</h3>
                                    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${row.stages.length <= 3 ? row.stages.length : 4} xl:grid-cols-${row.stages.length <= 5 ? row.stages.length : 5} gap-6`}>
                                        {row.stages.map(etapaId => {
                                            const columnPedidos = kanbanVisiblePedidosByStage[etapaId] || [];
                                            return (
                                            <KanbanColumn
                                                key={etapaId}
                                                etapa={ETAPAS[etapaId]}
                                                pedidos={columnPedidos}
                                                onSelectPedido={setSelectedPedido}
                                                onArchiveToggle={handleArchiveToggle}
                                                currentUserRole={currentUserRole}
                                                onAdvanceStage={handleAdvanceStage}
                                                highlightedPedidoId={highlightedPedidoId}
                                                onUpdatePedido={handleSavePedido}
                                                selectedIds={selectedIds}
                                                isSelectionActive={isSelectionActive}
                                                onToggleSelection={toggleSelection}
                                                onSelectAll={selectAll}
                                                listasTemporalesMap={listasTemporalesMap}
                                                onSetListaTemporal={setListaTemporal}
                                        onResetListaTemporal={resetListaTemporal}
                                        onMoveListaTemporal={handleMoveToVisibleStage}
                                        onManualReorder={handleManualKanbanReorder}
                                    />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </section>

                        <section>
                            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4 border-l-4 border-green-500 pl-4">Finalizado</h2>
                            <div className="w-full">
                                <CompletedPedidosList
                                    pedidos={processedPedidos.filter(p => p.etapaActual === Etapa.COMPLETADO)}
                                    onSelectPedido={setSelectedPedido}
                                    onArchiveToggle={handleArchiveToggle}
                                    currentUserRole={currentUserRole}
                                    highlightedPedidoId={highlightedPedidoId}
                                    selectedIds={selectedIds}
                                    onToggleSelection={toggleSelection}
                                    onSelectAll={selectAll}
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
                    highlightedPedidoId={highlightedPedidoId}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                    onSelectAll={selectAll}
                    listasTemporalesMap={listasTemporalesMap}
                    selectedStages={selectedStages}
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
                    highlightedPedidoId={highlightedPedidoId}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                    onSelectAll={selectAll}
                    isLoadingMore={isLoadingArchived}
                    hasMore={archivedHasMore}
                    totalItems={archivedTotal}
                    onLoadMore={() => loadArchivedPedidos(archivedPage + 1, true)}
                />;
            case 'report':
                if (currentUserRole !== 'Administrador') {
                    return <div className="p-8 text-center text-red-500">Acceso denegado.</div>;
                }
                return <ReportView
                    pedidos={pedidos}
                    auditLog={auditLog}
                    onNavigateToPedido={navigateToPedido}
                    onSelectPedido={setSelectedPedido}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                    onSelectAll={selectAll}
                    onBulkUpdateDate={() => setShowDateUpdateModal(true)}
                    onBulkUpdateMachine={() => setShowMachineUpdateModal(true)}
                    onBulkUpdateStage={() => setShowStageUpdateModal(true)}
                    onBulkDelete={() => setShowDeleteModal(true)}
                    onBulkArchive={() => setShowArchiveModal(true)}
                    onClearSelection={clearSelection}
                />;

            case 'permissions-debug':
                return <PermissionsDebug />;
            default:
                return null;
        }
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            {/* Banner de actualización */}
            {updateAvailable && (
                <UpdateBanner
                    onRefresh={forceRefresh}
                    newVersion={newVersion}
                />
            )}

            <div className="min-h-screen text-gray-900 dark:text-white flex flex-col">
                <Header
                    searchTerm={searchTerm}
                    onSearch={setSearchTerm}
                    allPedidos={pedidos}
                    onNavigateToPedido={handleNavigateToPedido}
                    currentView={view}
                    onViewChange={handleViewChange}
                    onFilterChange={handleFilterChange}
                    activeFilters={filters}
                    selectedStages={selectedStages}
                    onStageToggle={handleStageToggle}
                    listViewMetrics={listViewMetrics}
                    selectedVendedores={selectedVendedores}
                    onVendedorToggle={handleVendedorToggle}
                    selectedClientes={selectedClientes}
                    onClienteToggle={handleClienteToggle}
                    selectedMaquinas={selectedMaquinas}
                    onMaquinaToggle={handleMaquinaToggle}
                    antivahoFilter={antivahoFilter}
                    onAntivahoFilterChange={handleAntivahoFilterChange}
                    preparacionFilter={preparacionFilter}
                    onPreparacionFilterChange={handlePreparacionFilterChange}
                    estadoClicheFilter={estadoClicheFilter}
                    onEstadoClicheFilterChange={handleEstadoClicheFilterChange}
                    anonimoFilter={anonimoFilter}
                    onAnonimoFilterChange={handleAnonimoFilterChange}
                    weekFilter={weekFilter}
                    onWeekFilterToggle={handleWeekFilterToggle}
                    onWeekChange={handleWeekChange}
                    onWeekDateFieldChange={handleWeekDateFieldChange}
                    onDateFilterChange={handleDateFilterChange}
                    activeDateFilter={dateFilter}
                    customDateRange={customDateRange}
                        onCustomDateChange={handleCustomDateChange}
                        onAddPedido={() => setIsAddModalOpen(true)}
                        onAddPedidoPrueba={() => setIsAddPedidoPruebaModalOpen(true)}
                        onBulkImport={() => setShowBulkImportModal(true)}
                    onPdfImport={() => setShowPdfImportModal(true)}
                    onExportPDF={handleExportPDF}
                    onExportData={doExportData}
                    onImportData={doImportData}
                    onUserManagement={() => setShowUserManagement(true)}
                    onResetAllFilters={resetAllFilters}
                />
                {view !== 'report' && selectedIds.length > 1 && (
                    <div className="px-2 pt-2 md:px-4 md:pt-3">
                        <BulkActionsToolbar
                            selectedCount={selectedIds.length}
                            onUpdateDate={() => setShowDateUpdateModal(true)}
                            onUpdateMachine={() => setShowMachineUpdateModal(true)}
                            onUpdateStage={() => setShowStageUpdateModal(true)}
                            onUpdateCliche={() => setShowClicheUpdateModal(true)}
                            onDelete={() => setShowDeleteModal(true)}
                            onArchive={() => setShowArchiveModal(true)}
                            onCancel={clearSelection}
                        />
                    </div>
                )}
                {renderContent()}
                {selectedPedido && (
                    <PedidoModal
                        pedido={selectedPedido}
                        onClose={() => setSelectedPedido(null)}
                        onSave={handleSavePedido}
                        onAutoSave={handleAutoSavePedido}
                        onArchiveToggle={handleArchiveToggle}
                        onDuplicate={handleDuplicatePedido}
                        onDelete={handleDeletePedido}
                        onAdvanceStage={handleAdvanceStage}
                        onSendToPrint={setPedidoToSend}
                        onSetReadyForProduction={handleSetReadyForProduction}
                        onUpdateEtapa={handleUpdatePedidoEtapa}
                        isConnected={isConnected}
                    />
                )}
                {isAddModalOpen && (
                    <AddPedidoModal
                        onClose={() => {
                            setIsAddModalOpen(false);
                            setClientePreseleccionado(null); // ✅ Limpiar al cerrar
                        }}
                        onAdd={handleAddPedido}
                        clientePreseleccionado={clientePreseleccionado} // ✅ Pasar cliente preseleccionado
                    />
                )}
                {isAddPedidoPruebaModalOpen && (
                    <AddPedidoModal
                        onClose={() => setIsAddPedidoPruebaModalOpen(false)}
                        onAdd={async (data) => {
                            const result = await handleAddPedido(data);
                            if (result) {
                                setIsAddPedidoPruebaModalOpen(false);
                            }
                            return result;
                        }}
                        isPedidoPrueba={true}
                    />
                )}
                {pedidoToSend && (
                    <EnviarAImpresionModal
                        pedido={pedidoToSend}
                        onClose={() => setPedidoToSend(null)}
                        onConfirm={handleConfirmSendToPrint}
                    />
                )}
                {pedidoToReorder && (
                    <SequenceReorderModal
                        pedido={pedidoToReorder}
                        onClose={() => setPedidoToReorder(null)}
                        onConfirm={handleConfirmSequenceReorder}
                    />
                )}
                {isDuplicating && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-sm w-full mx-4 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {duplicatingMessage}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {duplicatingMessage === 'Duplicando pedido...'
                                    ? 'Creando una copia del pedido. El pedido original NO se modificará.'
                                    : 'Se está preparando para mostrar el nuevo pedido duplicado.'
                                }
                            </p>
                        </div>
                    </div>
                )}
                <AntivahoConfirmationModal
                    isOpen={antivahoModalState.isOpen}
                    onConfirm={handleConfirmAntivaho}
                    onCancel={handleCancelAntivaho}
                    pedido={antivahoModalState.pedido}
                />
                <AntivahoDestinationModal
                    isOpen={antivahoDestinationModalState.isOpen}
                    onSelectImpresion={handleAntivahoDestinationImpresion}
                    onSelectListoProduccion={handleAntivahoDestinationListoProduccion}
                    onCancel={handleCancelAntivahoDestination}
                    pedido={antivahoDestinationModalState.pedido}
                />
                <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />

                {/* 🎉 Toast Notifications */}
                <ToastContainer messages={toastMessages} onClose={removeToast} />

                {/* 🚀 WebSocket Components */}
                <NotificationCenter
                    notifications={notifications}
                    onRemoveNotification={removeNotification}
                    isConnected={isConnected}
                />
                <ConnectedUsers
                    users={connectedUsers}
                    currentUser={currentUserId}
                    isConnected={isConnected}
                />

                {/* 👥 User Management Modal */}
                {showUserManagement && (
                    <UserManagement onClose={() => setShowUserManagement(false)} />
                )}

                {/* 📦 Bulk Operations Components */}

                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    pedidos={pedidos.filter(p => selectedIds.includes(p.id))}
                    onConfirm={handleBulkDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />

                <BulkArchiveConfirmationModal
                    isOpen={showArchiveModal}
                    pedidos={pedidos.filter(p => selectedIds.includes(p.id))}
                    onConfirm={handleBulkArchive}
                    onCancel={() => setShowArchiveModal(false)}
                />

                <BulkDateUpdateModal
                    isOpen={showDateUpdateModal}
                    pedidos={pedidos.filter(p => selectedIds.includes(p.id))}
                    onConfirm={handleBulkUpdateDate}
                    onCancel={() => setShowDateUpdateModal(false)}
                />

                <BulkMachineUpdateModal
                    isOpen={showMachineUpdateModal}
                    pedidos={pedidos.filter(p => selectedIds.includes(p.id))}
                    onConfirm={handleBulkUpdateMachine}
                    onCancel={() => setShowMachineUpdateModal(false)}
                />

                <BulkStageUpdateModal
                    isOpen={showStageUpdateModal}
                    pedidos={pedidos.filter(p => selectedIds.includes(p.id))}
                    onConfirm={handleBulkUpdateStage}
                    onCancel={() => setShowStageUpdateModal(false)}
                />

                <BulkClicheUpdateModal
                    isOpen={showClicheUpdateModal}
                    pedidos={pedidos.filter(p => selectedIds.includes(p.id))}
                    onConfirm={handleBulkUpdateCliche}
                    onCancel={() => setShowClicheUpdateModal(false)}
                />

                <ImportDataModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onConfirm={handleImportSelectedPedidos}
                />

                {showBulkImportModal && (
                    <BulkImportModalV2
                        onClose={() => setShowBulkImportModal(false)}
                        onImportComplete={(results) => {
                            console.log('Importación completada:', results);
                            setShowBulkImportModal(false);
                            // Recargar pedidos para mostrar los nuevos
                            reloadPedidos();
                            addToast('¡Importación completada exitosamente!', 'success');
                        }}
                    />
                )}

                {showPdfImportModal && (
                    <PdfImportModal
                        onClose={() => setShowPdfImportModal(false)}
                        onImportComplete={(results) => {
                            console.log('Importación PDF completada:', results);
                            setShowPdfImportModal(false);
                            reloadPedidos();
                            addToast('¡Pedido importado desde PDF exitosamente!', 'success');
                        }}
                    />
                )}

                <NotesWidget />
            </div>
        </DragDropContext>
    );
};

// Componente App principal con AuthProvider
const App: React.FC = () => {
    return (
        <AuthProvider>
            <NotificationProvider>
                <MaterialesProvider>
                    <AppContent />
                </MaterialesProvider>
            </NotificationProvider>
        </AuthProvider>
    );
};

export default App;






