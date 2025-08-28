import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Pedido, Etapa, ViewType, UserRole, AuditEntry, Prioridad, EstadoCliché, HistorialEntry, DateField } from './types';
import { KANBAN_FUNNELS, ETAPAS, PRIORIDAD_ORDEN, PREPARACION_SUB_ETAPAS_IDS } from './constants';
import { DateFilterOption } from './utils/date';
import { calculateTotalProductionTime, generatePedidosPDF } from './utils/kpi';
import KanbanColumn from './components/KanbanColumn';
import PedidoModal from './components/PedidoModal';
import AddPedidoModal from './components/AddPedidoModal';
import AntivahoConfirmationModal from './components/AntivahoConfirmationModal';
import Header from './components/Header';
import PedidoList from './components/PedidoList';
import ReportView from './components/ReportView';
import ThemeSwitcher from './components/ThemeSwitcher';
import CompletedPedidosList from './components/CompletedPedidosList';
import PreparacionView from './components/PreparacionView';
import EnviarAImpresionModal from './components/EnviarAImpresionModal';
import NotificationCenter from './components/NotificationCenter';
import ConnectedUsers from './components/ConnectedUsers';
import LoginModal from './components/LoginModal';
import UserInfo from './components/UserInfo';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { calcularSiguienteEtapa } from './utils/etapaLogic';
import { procesarDragEnd } from './utils/dragLogic';
import { usePedidosManager } from './hooks/usePedidosManager';
import { useWebSocket } from './hooks/useWebSocket';
import { useFiltrosYOrden } from './hooks/useFiltrosYOrden';


const AppContent: React.FC = () => {
    const { user, isAuthenticated, loading } = useAuth();
    
    // Estados locales - siempre llamar antes de returns condicionales
    const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [view, setView] = useState<ViewType>('preparacion');
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [pedidoToSend, setPedidoToSend] = useState<Pedido | null>(null);
    const [highlightedPedidoId, setHighlightedPedidoId] = useState<string | null>(null);

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
    const currentUserId = user ? `${user.username}-${user.id.slice(-6)}` : 'guest-user';

    // Hooks personalizados - siempre llamar antes de returns condicionales
    const { 
        isConnected, 
        notifications, 
        connectedUsers, 
        removeNotification, 
        emitActivity 
    } = useWebSocket(currentUserId, currentUserRole);

    const generarEntradaHistorial = useCallback((usuario: UserRole, accion: string, detalles: string): HistorialEntry => ({
        timestamp: new Date().toISOString(),
        usuario,
        accion,
        detalles
    }), []);
    
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
    } = usePedidosManager(currentUserRole, generarEntradaHistorial, setPedidoToSend);

    const {
      processedPedidos,
      setSearchTerm,
      filters,
      handleFilterChange,
      antivahoFilter,
      handleAntivahoFilterChange,
      dateFilter,
      handleDateFilterChange,
      customDateRange,
      handleCustomDateChange,
      sortConfig,
      handleSort,
    } = useFiltrosYOrden(pedidos);


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
    
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const logAction = useCallback((action: string) => {
        setAuditLog(prevLog => {
            const newEntry = { timestamp: new Date().toISOString(), userRole: currentUserRole, action };
            return [newEntry, ...prevLog];
        });
    }, [currentUserRole]);

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
          setSortConfig: handleSort as any // Re-sorting is handled inside the hook, but we need to pass a function
        });

    }, [pedidos, currentUserRole, processedPedidos, generarEntradaHistorial, logAction, handleSort, setPedidos, handleSavePedidoLogic, handleUpdatePedidoEtapa]);
    
    const handleAdvanceStage = async (pedidoToAdvance: Pedido) => {
        // Si es un pedido con antivaho no realizado en post-impresión, abrir modal de reconfirmación
        if (pedidoToAdvance.antivaho && !pedidoToAdvance.antivahoRealizado && 
            KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedidoToAdvance.etapaActual)) {
            setPedidoToSend(pedidoToAdvance);
            return;
        }

        const { etapaActual, secuenciaTrabajo } = pedidoToAdvance;
        const newEtapa = calcularSiguienteEtapa(etapaActual, secuenciaTrabajo);

        if (newEtapa) {
            // Highlight effect
            setHighlightedPedidoId(pedidoToAdvance.id);

            await handleUpdatePedidoEtapa(pedidoToAdvance, newEtapa);

            logAction(`Pedido ${pedidoToAdvance.numeroPedidoCliente} avanzado de ${ETAPAS[etapaActual].title} a ${ETAPAS[newEtapa].title}.`);

            setTimeout(() => {
                setHighlightedPedidoId(null);
            }, 800);
        }
    };

    const handleSavePedido = async (updatedPedido: Pedido) => {
        const result = await handleSavePedidoLogic(updatedPedido);
        if (result?.hasChanges) {
            logAction(`Pedido ${result.modifiedPedido.numeroPedidoCliente} actualizado.`);
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
            logAction(`Nuevo pedido ${newPedido.numeroPedidoCliente} creado.`);
            setIsAddModalOpen(false);
            // 🚀 Emitir actividad WebSocket
            emitActivity('pedido-created', { 
                pedidoId: newPedido.id, 
                numeroCliente: newPedido.numeroPedidoCliente 
            });
        }
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
                        logAction(`Pedido ${updatedPedido.numeroPedidoCliente} enviado a Impresión.`);
                        
                        // 3. Set timer to remove highlight from new position
                        setTimeout(() => {
                            setHighlightedPedidoId(null);
                        }, 800);
                    } else {
                        // If the update failed, remove the highlight
                        setHighlightedPedidoId(null);
                    }
                });
        }, 50); // Reduced delay for better responsiveness
    };
    
    const handleArchiveToggle = async (pedido: Pedido) => {
        const result = await handleArchiveToggleLogic(pedido);
        if (result) {
            logAction(`Pedido ${result.updatedPedido.numeroPedidoCliente} ${result.actionText}.`);
            if (selectedPedido && selectedPedido.id === pedido.id) {
                setSelectedPedido(null);
            }
        }
    };

    const handleDuplicatePedido = async (pedidoToDuplicate: Pedido) => {
        const newPedido = await handleDuplicatePedidoLogic(pedidoToDuplicate);
        if (newPedido) {
            logAction(`Pedido ${pedidoToDuplicate.numeroPedidoCliente} duplicado como ${newPedido.numeroPedidoCliente}.`);
            setSelectedPedido(null); // Cierra el modal actual
            // Opcional: abrir el modal del nuevo pedido duplicado
            // setSelectedPedido(newPedido);
        }
    };

    const handleDeletePedido = async (pedidoId: string) => {
        const deletedPedido = await handleDeletePedidoLogic(pedidoId);
        if (deletedPedido) {
            logAction(`Pedido ${deletedPedido.numeroPedidoCliente} eliminado.`);
            setSelectedPedido(null); // Cierra el modal
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

    // Mostrar modal de login si no está autenticado
    if (!isAuthenticated || !user) {
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
                                        highlightedPedidoId={highlightedPedidoId}
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
                                        highlightedPedidoId={highlightedPedidoId}
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
                    antivahoFilter={antivahoFilter}
                    onAntivahoFilterChange={handleAntivahoFilterChange}
                    onDateFilterChange={handleDateFilterChange}
                    activeDateFilter={dateFilter}
                    customDateRange={customDateRange}
                    onCustomDateChange={handleCustomDateChange}
                    onAddPedido={() => setIsAddModalOpen(true)}
                    onExportPDF={handleExportPDF}
                    onExportData={doExportData}
                    onImportData={doImportData}
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
                        onUpdateEtapa={handleUpdatePedidoEtapa}
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
                <AntivahoConfirmationModal
                    isOpen={antivahoModalState.isOpen}
                    onConfirm={handleConfirmAntivaho}
                    onCancel={handleCancelAntivaho}
                    pedido={antivahoModalState.pedido}
                />
                <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                
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