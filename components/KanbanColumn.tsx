import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Pedido, KanbanEtapa, UserRole } from '../types';
import PedidoCard from './PedidoCard';

interface KanbanColumnProps {
    etapa: KanbanEtapa;
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    onArchiveToggle: (pedido: Pedido) => void;
    currentUserRole: UserRole;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ etapa, pedidos, onSelectPedido, onArchiveToggle, currentUserRole }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className="flex flex-col bg-gray-800 rounded-xl shadow-lg h-full">
            <div className={`p-4 rounded-t-xl ${etapa.color}`}>
                <h2 className="text-xl font-bold text-white text-center">{etapa.title} ({pedidos.length})</h2>
            </div>
            {isMounted && (
                <Droppable droppableId={etapa.id} isDropDisabled={currentUserRole === 'Operador' && etapa.id === 'COMPLETADO'}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-grow p-4 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-gray-700' : 'bg-gray-800'} rounded-b-xl overflow-y-auto`}
                            style={{ minHeight: '300px' }}
                        >
                            {pedidos.map((pedido, index) => (
                                <Draggable key={pedido.id} draggableId={pedido.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`mb-4 ${snapshot.isDragging ? 'shadow-2xl' : ''}`}
                                        >
                                            <PedidoCard 
                                                pedido={pedido} 
                                                onArchiveToggle={onArchiveToggle} 
                                                onSelectPedido={onSelectPedido}
                                                currentUserRole={currentUserRole} 
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