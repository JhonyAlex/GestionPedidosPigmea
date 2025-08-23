import React, { useState, useMemo, useCallback } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Pedido, Etapa, ViewType, UserRole, AuditEntry } from './types';
import { KANBAN_FUNNELS, ETAPAS, PRIORIDAD_ORDEN } from './constants';
import { initialPedidos } from './data/seedData';
import KanbanColumn from './components/KanbanColumn';
import PedidoModal from './components/PedidoModal';
import Header from './components/Header';
import PedidoList from './components/PedidoList';
import ReportView from './components/ReportView';

const App: React.FC = () => {
    const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
    const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
    const [view, setView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ priority: string, stage: string }>({ priority: 'all', stage: 'all' });
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Administrador');
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

    const logAction = useCallback((action: string) => {
        setAuditLog(prevLog => [
            { timestamp: new Date().toISOString(), userRole: currentUserRole, action },
            ...prevLog
        ]);
    }, [currentUserRole]);

    const sortedPedidos = useMemo(() => {
        return [...pedidos].sort((a, b) => {
            const priorityA = PRIORIDAD_ORDEN[a.prioridad];
            const priorityB = PRIORIDAD_ORDEN[b.prioridad];
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            if (a.secuenciaPedido !== b.secuenciaPedido) {
                return a.secuenciaPedido - b.secuenciaPedido;
            }
            return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        });
    }, [pedidos]);

    const filteredPedidos = useMemo(() => {
        return sortedPedidos.filter(p => {
            const searchTermMatch = !searchTerm ||
                p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase());

            const priorityMatch = filters.priority === 'all' || p.prioridad === filters.priority;
            const stageMatch = filters.stage === 'all' || p.etapaActual === filters.stage;

            return searchTermMatch && priorityMatch && stageMatch;
        });
    }, [sortedPedidos, searchTerm, filters]);

    const activePedidos = useMemo(() => filteredPedidos.filter(p => p.etapaActual !== Etapa.ARCHIVADO), [filteredPedidos]);
    const archivedPedidos = useMemo(() => filteredPedidos.filter(p => p.etapaActual === Etapa.ARCHIVADO), [filteredPedidos]);

    const handleDragEnd = useCallback((result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const pedido = pedidos.find(p => p.id === draggableId);
        if (!pedido) return;

        const newEtapa = destination.droppableId as Etapa;
        const oldEtapa = source.droppableId as Etapa;

        setPedidos(prevPedidos =>
            prevPedidos.map(p => {
                if (p.id === draggableId) {
                    const newEtapasSecuencia = [...p.etapasSecuencia, { etapa: newEtapa, fecha: new Date().toISOString() }];
                    return { ...p, etapaActual: newEtapa, etapasSecuencia: newEtapasSecuencia };
                }
                return p;
            })
        );
        logAction(`Pedido ${pedido.numeroPedido} movido de ${ETAPAS[oldEtapa].title} a ${ETAPAS[newEtapa].title}.`);
    }, [pedidos, logAction]);

    const handleSavePedido = (updatedPedido: Pedido) => {
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado: Solo los administradores pueden modificar pedidos.');
            return;
        }
        setPedidos(prev => prev.map(p => p.id === updatedPedido.id ? updatedPedido : p));
        setSelectedPedido(null);
        logAction(`Pedido ${updatedPedido.numeroPedido} actualizado.`);
    };

    const handleArchiveToggle = (pedido: Pedido) => {
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado: Solo los administradores pueden archivar o desarchivar pedidos.');
            return;
        }

        const isArchiving = pedido.etapaActual !== Etapa.ARCHIVADO;
        
        if (isArchiving && pedido.etapaActual !== Etapa.COMPLETADO) {
            alert("Solo se pueden archivar pedidos que están en la etapa 'Completado'.");
            return;
        }

        const newEtapa = isArchiving ? Etapa.ARCHIVADO : Etapa.COMPLETADO;
        const newEtapasSecuencia = [...pedido.etapasSecuencia, { etapa: newEtapa, fecha: new Date().toISOString() }];

        setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, etapaActual: newEtapa, etapasSecuencia: newEtapasSecuencia } : p));
        logAction(`Pedido ${pedido.numeroPedido} ${isArchiving ? 'archivado' : 'desarchivado'}.`);
        
        if (selectedPedido && selectedPedido.id === pedido.id) {
            setSelectedPedido(null);
        }
    };
    
    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    }

    const handleViewChange = (newView: ViewType) => {
        if (newView === 'report' && currentUserRole !== 'Administrador') {
            alert('Permiso denegado: Solo los administradores pueden acceder a los reportes.');
            return;
        }
        setView(newView);
    }
    
    const renderContent = () => {
        switch (view) {
            case 'kanban':
                return (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <main className="flex-grow p-4 md:p-8 flex flex-col gap-10">
                            {/* Funnel de Impresión */}
                            <section>
                                <h2 className="text-3xl font-extrabold text-white mb-5 border-l-4 border-cyan-500 pl-4">Impresión</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {KANBAN_FUNNELS.IMPRESION.stages.map(etapaId => {
                                        const etapa = ETAPAS[etapaId];
                                        const pedidosEnEtapa = activePedidos.filter(p => p.etapaActual === etapaId);
                                        return (
                                            <KanbanColumn
                                                key={etapa.id}
                                                etapa={etapa}
                                                pedidos={pedidosEnEtapa}
                                                onSelectPedido={setSelectedPedido}
                                                onArchiveToggle={handleArchiveToggle}
                                                currentUserRole={currentUserRole}
                                            />
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Funnel de Post-Impresión */}
                            <section>
                                <h2 className="text-3xl font-extrabold text-white mb-5 border-l-4 border-indigo-500 pl-4">Post-Impresión</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6">
                                    {KANBAN_FUNNELS.POST_IMPRESION.stages.map(etapaId => {
                                        const etapa = ETAPAS[etapaId];
                                        const pedidosEnEtapa = activePedidos.filter(p => p.etapaActual === etapaId);
                                        return (
                                            <KanbanColumn
                                                key={etapa.id}
                                                etapa={etapa}
                                                pedidos={pedidosEnEtapa}
                                                onSelectPedido={setSelectedPedido}
                                                onArchiveToggle={handleArchiveToggle}
                                                currentUserRole={currentUserRole}
                                            />
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Columna de Completado */}
                             <section>
                                <h2 className="text-3xl font-extrabold text-white mb-5 border-l-4 border-green-500 pl-4">Finalizado</h2>
                                <div className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
                                     {(() => {
                                        const etapa = ETAPAS[Etapa.COMPLETADO];
                                        const pedidosEnEtapa = activePedidos.filter(p => p.etapaActual === Etapa.COMPLETADO);
                                        return (
                                            <KanbanColumn
                                                key={etapa.id}
                                                etapa={etapa}
                                                pedidos={pedidosEnEtapa}
                                                onSelectPedido={setSelectedPedido}
                                                onArchiveToggle={handleArchiveToggle}
                                                currentUserRole={currentUserRole}
                                            />
                                        );
                                    })()}
                                </div>
                            </section>
                        </main>
                    </DragDropContext>
                );
            case 'list':
                return <PedidoList 
                            pedidos={activePedidos} 
                            onSelectPedido={setSelectedPedido}
                            onArchiveToggle={handleArchiveToggle}
                            isArchivedView={false}
                            currentUserRole={currentUserRole}
                        />;
            case 'archived':
                return <PedidoList 
                            pedidos={archivedPedidos}
                            onSelectPedido={setSelectedPedido}
                            onArchiveToggle={handleArchiveToggle}
                            isArchivedView={true}
                            currentUserRole={currentUserRole}
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
        <div className="min-h-screen text-white flex flex-col">
            <Header
                onSearch={setSearchTerm}
                currentView={view}
                onViewChange={handleViewChange}
                onFilterChange={handleFilterChange}
                activeFilters={filters}
                currentUserRole={currentUserRole}
                onRoleChange={setCurrentUserRole}
            />
            {renderContent()}
            {selectedPedido && (
                <PedidoModal
                    pedido={selectedPedido}
                    onClose={() => setSelectedPedido(null)}
                    onSave={handleSavePedido}
                    onArchiveToggle={handleArchiveToggle}
                    currentUserRole={currentUserRole}
                />
            )}
        </div>
    );
};

export default App;