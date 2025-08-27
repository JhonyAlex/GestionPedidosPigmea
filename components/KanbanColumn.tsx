import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Pedido, KanbanEtapa, UserRole } from '../types';
import PedidoCard from './PedidoCard';

interface KanbanColumnProps {
    etapa: KanbanEtapa;
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    onArchiveToggle: (pedido: Pedido) => void;
    onDuplicate: (pedido: Pedido) => void;
    currentUserRole: UserRole;
    onAdvanceStage: (pedido: Pedido) => void;
    highlightedPedidoId: string | null;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ etapa, pedidos, onSelectPedido, onArchiveToggle, currentUserRole, onAdvanceStage, highlightedPedidoId, onDuplicate }) => {
    // Eliminado delay artificial, renderiza directamente
    const isMounted = true;

    return (
        <div className="flex flex-col bg-gray-200 dark:bg-gray-800 rounded-xl shadow-lg h-full">
            <div className={`px-4 py-2 rounded-t-xl ${etapa.color}`}>
                <div className="flex justify-center items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{etapa.title}</h2>
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
                                                onDuplicate={onDuplicate}
                                                currentUserRole={currentUserRole} 
                                                onAdvanceStage={onAdvanceStage}
                                                highlightedPedidoId={highlightedPedidoId}
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