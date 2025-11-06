import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Pedido, Etapa, ViewType, UserRole, AuditEntry, Prioridad, EstadoCliché, HistorialEntry, DateField } from './types';
import { KANBAN_FUNNELS, ETAPAS, PRIORIDAD_ORDEN, PREPARACION_SUB_ETAPAS_IDS } from './constants';
import { DateFilterOption } from './utils/date';
import { calculateTotalProductionTime, generatePedidosPDF } from './utils/kpi';
import { scrollToPedido } from './utils/scroll';
import KanbanColumn from './components/KanbanColumn';
import PedidoModal from './components/PedidoModal';
import AddPedidoModal from './components/AddPedidoModal';
import AntivahoConfirmationModal from './components/AntivahoConfirmationModal';
import Header from './components/Header';
import PedidoList from './components/PedidoList';
import ReportView from './components/ReportView';
import ClientesList from './components/ClientesList';
import VendedoresList from './components/VendedoresList';
import ThemeSwitcher from './components/ThemeSwitcher';
import CompletedPedidosList from './components/CompletedPedidosList';
import PreparacionView from './components/PreparacionView';
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
import BulkDateUpdateModal from './components/BulkDateUpdateModal';
import { ToastContainer } from './components/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { calcularSiguienteEtapa, estaFueraDeSecuencia } from './utils/etapaLogic';
import { procesarDragEnd } from './utils/dragLogic';
import { usePedidosManager } from './hooks/usePedidosManager';
import { useWebSocket } from './hooks/useWebSocket';
import { useFiltrosYOrden } from './hooks/useFiltrosYOrden';
import { useNavigateToPedido } from './hooks/useNavigateToPedido';
import { useBulkOperations } from './hooks/useBulkOperations';
import { useToast } from './hooks/useToast';
import { auditService } from './services/audit';


const AppContent: React.FC = () => {
    const { user, loading } = useAuth();
    
    // Hook de toast para notificaciones
    const { messages: toastMessages, addToast, removeToast } = useToast();
    
    // Estados locales - siempre llamar antes de returns condicionales
    const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [clientePreseleccionado, setClientePreseleccionado] = useState<{ id: string; nombre: string } | null>(null); // ✅ Estado para cliente preseleccionado
    const [view, setView] = useState<ViewType>('preparacion');
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [pedidoToSend, setPedidoToSend] = useState<Pedido | null>(null);
    const [pedidoToReorder, setPedidoToReorder] = useState<Pedido | null>(null);
    const [highlightedPedidoId, setHighlightedPedidoId] = useState<string | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [duplicatingMessage, setDuplicatingMessage] = useState('Duplicando pedido...');
    const [showUserManagement, setShowUserManagement] = useState(false);
    
    // Estados para operaciones masivas
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDateUpdateModal, setShowDateUpdateModal] = useState(false);

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
    const currentUserRole = user?.role || 'Operador';
    const currentUserId = user ? `${user.username}-${String(user.id).slice(-6)}` : 'guest-user';

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
        subscribeToPageReturn
    } = useWebSocket(currentUserId, currentUserRole);

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
        handleUpdatePedidoEtapa,
        antivahoModalState,
        handleConfirmAntivaho,
        handleCancelAntivaho,
        handleSetReadyForProduction,
    } = usePedidosManager(
        currentUserRole, 
        generarEntradaHistorial, 
        setPedidoToSend,
        subscribeToPedidoCreated,
        subscribeToPedidoUpdated,
        subscribeToPedidoDeleted
    );

    const {
      processedPedidos,
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
    } = useFiltrosYOrden(pedidos);

    // Hook para navegación a pedidos desde reportes
    const { navigateToPedido } = useNavigateToPedido({
        setView,
        setSelectedPedido,
        setHighlightedPedidoId
    });

    // Función para navegar a un pedido por ID
    const handleNavigateToPedidoById = useCallback((pedidoId: string) => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (pedido) {
            navigateToPedido(pedido);
        } else {
            console.warn('Pedido no encontrado:', pedidoId);
        }
    }, [pedidos, navigateToPedido]);

    // Hook para operaciones masivas
    const {
        selectedIds,
        isSelectionActive,
        toggleSelection,
        clearSelection,
        bulkDelete,
        bulkUpdateDate,
    } = useBulkOperations();

    // Limpiar selección al cambiar de vista
    useEffect(() => {
        clearSelection();
    }, [view, clearSelection]);

    // Suscribirse al evento de retorno de página para refrescar datos
    useEffect(() => {
        const unsubscribe = subscribeToPageReturn(async () => {
            console.log('🔄 Refrescando datos después de inactividad...');
            console.log(`📊 Total pedidos antes: ${pedidos.length}`);
            setIsLoading(true);
            try {
                // Importar el store dinámicamente para evitar ciclos
                const { store } = await import('./services/storage');
                const currentPedidos = await store.getAll();
                setPedidos(currentPedidos);
                console.log(`✅ Datos actualizados exitosamente - Total pedidos ahora: ${currentPedidos.length}`);
                
                // 🔥 Log detallado para debugging en producción
                if (currentPedidos.length !== pedidos.length) {
                    console.warn(`⚠️ CAMBIO DETECTADO: Pedidos antes=${pedidos.length}, después=${currentPedidos.length}`);
                }
            } catch (error) {
                console.error('❌ Error al refrescar datos:', error);
            } finally {
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [subscribeToPageReturn, setPedidos, setIsLoading, pedidos.length]);


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
        const viewsThatNeedStageReset = ['preparacion', 'archived', 'report'];
        
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

    const preparacionPedidos = useMemo(() => processedPedidos.filter(p => p.etapaActual === Etapa.PREPARACION), [processedPedidos]);
    const activePedidos = useMemo(() => processedPedidos.filter(p => p.etapaActual !== Etapa.ARCHIVADO && p.etapaActual !== Etapa.PREPARACION), [processedPedidos]);
    const archivedPedidos = useMemo(() => processedPedidos.filter(p => p.etapaActual === Etapa.ARCHIVADO), [processedPedidos]);

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
          setSortConfig: updateSortConfig // Usar la función correcta para establecer el sorting
        });

    }, [pedidos, currentUserRole, processedPedidos, generarEntradaHistorial, logAction, handleSort, setPedidos, handleSavePedidoLogic, handleUpdatePedidoEtapa]);
    
    const handleAdvanceStage = async (pedidoToAdvance: Pedido) => {
        // Si es un pedido con antivaho no realizado en post-impresión, abrir modal de reconfirmación
        if (pedidoToAdvance.antivaho && !pedidoToAdvance.antivahoRealizado && 
            KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedidoToAdvance.etapaActual)) {
            setPedidoToSend(pedidoToAdvance);
            return;
        }

        // Si el pedido está fuera de secuencia, abrir modal de reordenamiento
        if (estaFueraDeSecuencia(pedidoToAdvance.etapaActual, pedidoToAdvance.secuenciaTrabajo)) {
            setPedidoToReorder(pedidoToAdvance);
            return;
        }

        const { etapaActual, secuenciaTrabajo } = pedidoToAdvance;
        const newEtapa = calcularSiguienteEtapa(etapaActual, secuenciaTrabajo);

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
            scrollToPedido(pedidoToAdvance.id, 120);

            setTimeout(() => {
                setHighlightedPedidoId(null);
            }, 6000); // 6 segundos (sincronizado con la animación)
        }
    };

    const handleSavePedido = async (updatedPedido: Pedido) => {
        const result = await handleSavePedidoLogic(updatedPedido);
        if (result?.hasChanges) {
            logAction(`Pedido ${result.modifiedPedido.numeroPedidoCliente} actualizado.`, result.modifiedPedido.id);
            // 🚀 Emitir actividad WebSocket
            emitActivity('pedido-edited', { 
                pedidoId: result.modifiedPedido.id, 
                numeroCliente: result.modifiedPedido.numeroPedidoCliente 
            });
        }
        setSelectedPedido(null);
    };

    const handleAddPedido = async (data: { pedidoData: Omit<Pedido, 'id' | 'secuenciaPedido' | 'numeroRegistro' | 'fechaCreacion' | 'etapasSecuencia' | 'etapaActual' | 'maquinaImpresion' | 'secuenciaTrabajo' | 'orden' | 'historial'>; secuenciaTrabajo: Etapa[]; }) => {
        const newPedido = await handleAddPedidoLogic(data);
        if (newPedido) {
            logAction(`Nuevo pedido ${newPedido.numeroPedidoCliente} creado.`, newPedido.id);
            setIsAddModalOpen(false);
            setClientePreseleccionado(null); // ✅ Limpiar cliente preseleccionado
            // 🚀 Emitir actividad WebSocket
            emitActivity('pedido-created', { 
                pedidoId: newPedido.id, 
                numeroCliente: newPedido.numeroPedidoCliente 
            });
        }
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
                        scrollToPedido(updatedPedido.id, 120);
                        
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
                
                // Abrir el modal del pedido duplicado
                setSelectedPedido(newPedido);
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
        const selectedPedidos = pedidos.filter(p => selectedIds.includes(p.id));
        const result = await bulkDelete(selectedIds);
        
        if (result.success) {
            // Actualizar la lista de pedidos
            setPedidos(prev => prev.filter(p => !selectedIds.includes(p.id)));
            
            // Log de auditoría
            logAction(`${result.deletedCount} pedidos eliminados en operación masiva.`);
            
            // Emitir actividad WebSocket
            emitActivity('bulk-delete', { 
                count: result.deletedCount,
                pedidoIds: selectedIds
            });
            
            // Mostrar toast de éxito
            alert(`✅ ${result.deletedCount} ${result.deletedCount === 1 ? 'pedido eliminado' : 'pedidos eliminados'} exitosamente.`);
            
            setShowDeleteModal(false);
        } else {
            alert(`❌ Error al eliminar pedidos: ${result.error}`);
        }
    };

    const handleBulkUpdateDate = async (nuevaFecha: string) => {
        console.log('🟢 handleBulkUpdateDate - selectedIds:', selectedIds);
        console.log('🟢 handleBulkUpdateDate - nuevaFecha:', nuevaFecha);
        console.log('🟢 handleBulkUpdateDate - Total seleccionados:', selectedIds.length);
        
        const result = await bulkUpdateDate(selectedIds, nuevaFecha);
        
        console.log('🟢 handleBulkUpdateDate - Resultado:', result);
        
        if (result.success) {
            console.log('🟢 handleBulkUpdateDate - Actualizando pedidos locales...');
            
            // Actualizar la lista de pedidos
            setPedidos(prev => {
                const updated = prev.map(p => {
                    if (selectedIds.includes(p.id)) {
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
                pedidoIds: selectedIds,
                nuevaFecha
            });
            
            // Mostrar toast de éxito
            alert(`✅ ${result.updatedCount} ${result.updatedCount === 1 ? 'pedido actualizado' : 'pedidos actualizados'} exitosamente.`);
            
            setShowDateUpdateModal(false);
        } else {
            alert(`❌ Error al actualizar fechas: ${result.error}`);
        }
    };

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
    
    const doExportData = async () => {
        await handleExportData(pedidos);
    }
    
    const doImportData = () => {
        handleImportData((importedPedidos) => {
             if (window.confirm(`¿Está seguro de importar ${importedPedidos.length} pedidos? ESTA ACCIÓN BORRARÁ TODOS LOS DATOS ACTUALES.`)) {
                return true;
            }
            return false;
        });
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
                    />
                );
            case 'clientes':
                return <ClientesList onCrearPedido={handleCrearPedidoDesdeCliente} onNavigateToPedido={handleNavigateToPedidoById} />;
            case 'vendedores':
                return <VendedoresList onCrearPedido={handleCrearPedidoDesdeVendedor} onNavigateToPedido={handleNavigateToPedidoById} />;
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
                                        pedidos={processedPedidos.filter(p => p.etapaActual === etapaId)}
                                        onSelectPedido={setSelectedPedido}
                                        onArchiveToggle={handleArchiveToggle}
                                        currentUserRole={currentUserRole}
                                        onAdvanceStage={handleAdvanceStage}
                                        highlightedPedidoId={highlightedPedidoId}
                                        onUpdatePedido={handleSavePedido}
                                        selectedIds={selectedIds}
                                        isSelectionActive={isSelectionActive}
                                        onToggleSelection={toggleSelection}
                                    />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4 border-l-4 border-indigo-500 pl-4">Post-Impresión</h2>
                            
                            {/* Primera fila: 5 etapas (Laminación SL2, Laminación NEXUS, Rebobinado S2DT, Rebobinado PROSLIT, Rebobinado TEMAC) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-6">
                                {KANBAN_FUNNELS.POST_IMPRESION.stages.slice(0, 5).map(etapaId => (
                                    <KanbanColumn
                                        key={etapaId}
                                        etapa={ETAPAS[etapaId]}
                                        pedidos={activePedidos.filter(p => p.etapaActual === etapaId)}
                                        onSelectPedido={setSelectedPedido}
                                        onArchiveToggle={handleArchiveToggle}
                                        currentUserRole={currentUserRole}
                                        onAdvanceStage={handleAdvanceStage}
                                        highlightedPedidoId={highlightedPedidoId}
                                        onUpdatePedido={handleSavePedido}
                                        selectedIds={selectedIds}
                                        isSelectionActive={isSelectionActive}
                                        onToggleSelection={toggleSelection}
                                    />
                                ))}
                            </div>

                            {/* Segunda fila: 2 etapas (Perforación MIC, Perforación MAC) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {KANBAN_FUNNELS.POST_IMPRESION.stages.slice(5, 7).map(etapaId => (
                                    <KanbanColumn
                                        key={etapaId}
                                        etapa={ETAPAS[etapaId]}
                                        pedidos={activePedidos.filter(p => p.etapaActual === etapaId)}
                                        onSelectPedido={setSelectedPedido}
                                        onArchiveToggle={handleArchiveToggle}
                                        currentUserRole={currentUserRole}
                                        onAdvanceStage={handleAdvanceStage}
                                        highlightedPedidoId={highlightedPedidoId}
                                        onUpdatePedido={handleSavePedido}
                                        selectedIds={selectedIds}
                                        isSelectionActive={isSelectionActive}
                                        onToggleSelection={toggleSelection}
                                    />
                                ))}
                            </div>
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
                        />;
            case 'report':
                    if (currentUserRole !== 'Administrador') {
                    return <div className="p-8 text-center text-red-500">Acceso denegado.</div>;
                    }
                return <ReportView 
                    pedidos={pedidos} 
                    auditLog={auditLog} 
                    onNavigateToPedido={navigateToPedido}
                />;
            case 'permissions-debug':
                return <PermissionsDebug />;
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
                    selectedStages={selectedStages}
                    onStageToggle={handleStageToggle}
                    antivahoFilter={antivahoFilter}
                    onAntivahoFilterChange={handleAntivahoFilterChange}
                    preparacionFilter={preparacionFilter}
                    onPreparacionFilterChange={handlePreparacionFilterChange}
                    estadoClicheFilter={estadoClicheFilter}
                    onEstadoClicheFilterChange={handleEstadoClicheFilterChange}
                    weekFilter={weekFilter}
                    onWeekFilterToggle={handleWeekFilterToggle}
                    onWeekChange={handleWeekChange}
                    onWeekDateFieldChange={handleWeekDateFieldChange}
                    onDateFilterChange={handleDateFilterChange}
                    activeDateFilter={dateFilter}
                    customDateRange={customDateRange}
                    onCustomDateChange={handleCustomDateChange}
                    onAddPedido={() => setIsAddModalOpen(true)}
                    onExportPDF={handleExportPDF}
                    onExportData={doExportData}
                    onImportData={doImportData}
                    onUserManagement={() => setShowUserManagement(true)}
                    onResetAllFilters={resetAllFilters}
                />
                {renderContent()}
                {selectedPedido && (
                    <PedidoModal
                        pedido={selectedPedido}
                        onClose={() => setSelectedPedido(null)}
                        onSave={handleSavePedido}
                        onArchiveToggle={handleArchiveToggle}
                        onDuplicate={handleDuplicatePedido}
                        onDelete={handleDeletePedido}
                        currentUserRole={currentUserRole}
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
                                    ? 'Por favor espere mientras se procesa la duplicación' 
                                    : 'Se está preparando para mostrar el nuevo pedido'
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
                <BulkActionsToolbar
                    selectedCount={selectedIds.length}
                    onUpdateDate={() => setShowDateUpdateModal(true)}
                    onDelete={() => setShowDeleteModal(true)}
                    onCancel={clearSelection}
                />
                
                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    pedidos={pedidos.filter(p => selectedIds.includes(p.id))}
                    onConfirm={handleBulkDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />

                <BulkDateUpdateModal
                    isOpen={showDateUpdateModal}
                    pedidos={pedidos.filter(p => selectedIds.includes(p.id))}
                    onConfirm={handleBulkUpdateDate}
                    onCancel={() => setShowDateUpdateModal(false)}
                />
            </div>
        </DragDropContext>
    );
};

// Componente App principal con AuthProvider
const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;