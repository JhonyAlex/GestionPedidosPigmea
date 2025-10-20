import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Pedido, UserRole } from '../types';
import PedidoCard from './PedidoCard';

interface PreparacionColumnProps {
    columna: { id: string; title: string; color: string; };
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    onArchiveToggle: (pedido: Pedido) => void;
    currentUserRole: UserRole;
    onSendToPrint: (pedido: Pedido) => void;
    highlightedPedidoId?: string | null;
    onUpdatePedido?: (updatedPedido: Pedido) => Promise<void>;
    // Bulk selection props
    selectedIds?: string[];
    isSelectionActive?: boolean;
    onToggleSelection?: (id: string) => void;
}

const PreparacionColumn: React.FC<PreparacionColumnProps> = ({ 
    columna, 
    pedidos, 
    onSelectPedido, 
    onArchiveToggle,
    currentUserRole, 
    onSendToPrint, 
    highlightedPedidoId, 
    onUpdatePedido,
    selectedIds = [],
    isSelectionActive = false,
    onToggleSelection
}) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className="flex flex-col bg-gray-200 dark:bg-gray-800 rounded-xl shadow-lg h-full">
            <div className={`px-4 py-2 rounded-t-xl ${columna.color}`}>
                <div className="flex justify-center items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{columna.title}</h2>
                    <span className="bg-black bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {pedidos.length}
                    </span>
                </div>
            </div>
            {isMounted && (
                <Droppable droppableId={`PREP_${columna.id}`}>
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
                                                onAdvanceStage={() => {}} // Advance is handled by onSendToPrint
                                                onSendToPrint={onSendToPrint}
                                                highlightedPedidoId={highlightedPedidoId}
                                                onUpdatePedido={onUpdatePedido}
                                                isSelected={selectedIds.includes(pedido.id)}
                                                isSelectionActive={isSelectionActive}
                                                onToggleSelection={onToggleSelection}
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

export default PreparacionColumn;