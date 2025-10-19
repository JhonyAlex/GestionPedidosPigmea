import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Pedido, UserRole, Etapa } from '../types';
import { PREPARACION_COLUMNS } from '../constants';
import PreparacionColumn from './PreparacionColumn';

interface PreparacionViewProps {
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    currentUserRole: UserRole;
    onSendToPrint: (pedido: Pedido) => void;
    highlightedPedidoId?: string | null;
    onUpdatePedido?: (updatedPedido: Pedido) => Promise<void>;
    // Bulk selection props
    selectedIds?: string[];
    isSelectionActive?: boolean;
    onToggleSelection?: (id: string) => void;
}

const PreparacionView: React.FC<PreparacionViewProps> = ({ 
    pedidos, 
    onSelectPedido, 
    currentUserRole, 
    onSendToPrint, 
    highlightedPedidoId, 
    onUpdatePedido,
    selectedIds = [],
    isSelectionActive = false,
    onToggleSelection
}) => {

    const pedidosPorColumna = pedidos.reduce((acc, pedido) => {
        if (pedido.etapaActual === Etapa.PREPARACION && pedido.subEtapaActual) {
            (acc[pedido.subEtapaActual] = acc[pedido.subEtapaActual] || []).push(pedido);
        }
        return acc;
    }, {} as Record<string, Pedido[]>);

    return (
        <main className="flex-grow p-4 md:p-8">
             <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-6 border-l-4 border-yellow-500 pl-4">Preparación de Pedidos</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PREPARACION_COLUMNS.map(columna => (
                    <PreparacionColumn
                        key={columna.id}
                        columna={columna}
                        pedidos={pedidosPorColumna[columna.id] || []}
                        onSelectPedido={onSelectPedido}
                        currentUserRole={currentUserRole}
                        onSendToPrint={onSendToPrint}
                        highlightedPedidoId={highlightedPedidoId}
                        onUpdatePedido={onUpdatePedido}
                        selectedIds={selectedIds}
                        isSelectionActive={isSelectionActive}
                        onToggleSelection={onToggleSelection}
                    />
                ))}
             </div>
        </main>
    );
};

export default PreparacionView;
