import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Pedido, KanbanEtapa, UserRole } from '../types';
import PedidoCard from './PedidoCard';
import { useLockObserver } from '../hooks/useLockObserver';
import { useAuth } from '../contexts/AuthContext';

interface KanbanColumnProps {
    etapa: KanbanEtapa;
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    onArchiveToggle: (pedido: Pedido) => void;
    currentUserRole: UserRole;
    onAdvanceStage: (pedido: Pedido) => void;
    highlightedPedidoId: string | null;
    onUpdatePedido?: (updatedPedido: Pedido) => Promise<void>;
    // Bulk selection props
    selectedIds?: string[];
    isSelectionActive?: boolean;
    onToggleSelection?: (id: string) => void;
    onSelectAll?: (ids: string[]) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
    etapa, 
    pedidos, 
    onSelectPedido, 
    onArchiveToggle, 
    currentUserRole, 
    onAdvanceStage, 
    highlightedPedidoId, 
    onUpdatePedido,
    selectedIds = [],
    isSelectionActive = false,
    onToggleSelection,
    onSelectAll
}) => {
    const { user } = useAuth();
    const { getLockInfo } = useLockObserver();
    
    // Eliminado delay artificial, renderiza directamente
    const isMounted = true;

    // Verificar si todos los pedidos de esta columna están seleccionados
    const allSelected = pedidos.length > 0 && pedidos.every(p => selectedIds.includes(p.id));
    const someSelected = pedidos.some(p => selectedIds.includes(p.id)) && !allSelected;

    const handleSelectAll = () => {
        if (!onSelectAll) return;
        
        if (allSelected) {
            // Deseleccionar todos los de esta columna
            const idsToKeep = selectedIds.filter(id => !pedidos.find(p => p.id === id));
            onSelectAll(idsToKeep);
        } else {
            // Seleccionar todos los de esta columna (agregando a los ya seleccionados)
            const columnIds = pedidos.map(p => p.id);
            const newSelection = [...new Set([...selectedIds, ...columnIds])];
            onSelectAll(newSelection);
        }
    };

    return (
        <div className="flex flex-col bg-gray-200 dark:bg-gray-800 rounded-xl shadow-lg h-full">
            <div className={`px-4 py-2 rounded-t-xl ${etapa.color}`}>
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                        {isSelectionActive && onSelectAll && pedidos.length > 0 && (
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(input) => {
                                    if (input) {
                                        input.indeterminate = someSelected;
                                    }
                                }}
                                onChange={handleSelectAll}
                                className="w-4 h-4 cursor-pointer accent-white"
                                title={allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                            />
                        )}
                        <h2 className="text-lg font-medium text-white">{etapa.title}</h2>
                    </div>
                    <span className="bg-black bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {pedidos.length}
                    </span>
                </div>
            </div>
            {isMounted && (
                <Droppable droppableId={etapa.id}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-grow p-4 transition-colors duration-150 ease-in-out ${snapshot.isDraggingOver ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-800'} rounded-b-xl overflow-y-auto min-h-[300px] max-h-[48rem]`}
                        >
                            {pedidos.map((pedido, index) => (
                                <Draggable key={pedido.id} draggableId={pedido.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`mb-4 transition-transform duration-150 ease-in-out ${snapshot.isDragging ? 'scale-105 shadow-2xl rotate-1' : 'scale-100'}`}
                                        >
                                            <PedidoCard 
                                                pedido={pedido} 
                                                onArchiveToggle={onArchiveToggle} 
                                                onSelectPedido={onSelectPedido}
                                                currentUserRole={currentUserRole} 
                                                onAdvanceStage={onAdvanceStage}
                                                highlightedPedidoId={highlightedPedidoId}
                                                onUpdatePedido={onUpdatePedido}
                                                isSelected={selectedIds.includes(pedido.id)}
                                                isSelectionActive={isSelectionActive}
                                                onToggleSelection={onToggleSelection}
                                                lockInfo={getLockInfo(pedido.id, user?.id.toString())}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            )}
        </div>
    );
};

export default KanbanColumn;