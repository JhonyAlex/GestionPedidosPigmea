import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Pedido, UserRole, Etapa } from '../types';
import { PREPARACION_COLUMNS } from '../constants';
import PreparacionColumn from './PreparacionColumn';

interface PreparacionViewProps {
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

const PreparacionView: React.FC<PreparacionViewProps> = ({ 
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

    const pedidosPorColumna = pedidos.reduce((acc, pedido) => {
        if (pedido.etapaActual === Etapa.PREPARACION && pedido.subEtapaActual) {
            (acc[pedido.subEtapaActual] = acc[pedido.subEtapaActual] || []).push(pedido);
        }
        return acc;
    }, {} as Record<string, Pedido[]>);

    return (
        <main className="flex-grow p-4 md:p-8">
             <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-6 border-l-4 border-yellow-500 pl-4">Preparación de Pedidos</h2>
             
             {/* FILA 1: Problemas de disponibilidad */}
             <div className="mb-6">
                 <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Bloqueos de Disponibilidad</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PREPARACION_COLUMNS.slice(0, 2).map(columna => (
                        <PreparacionColumn
                            key={columna.id}
                            columna={columna}
                            pedidos={pedidosPorColumna[columna.id] || []}
                            onSelectPedido={onSelectPedido}
                            onArchiveToggle={onArchiveToggle}
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
             </div>

             {/* FILA 2: Estados del cliché - Repeticiones */}
             <div className="mb-6">
                 <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Estado de Clichés - Repeticiones</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PREPARACION_COLUMNS.slice(2, 4).map(columna => (
                        <PreparacionColumn
                            key={columna.id}
                            columna={columna}
                            pedidos={pedidosPorColumna[columna.id] || []}
                            onSelectPedido={onSelectPedido}
                            onArchiveToggle={onArchiveToggle}
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
             </div>

             {/* FILA 3: Cliché Nuevo + Listo para Producción */}
             <div className="mb-6">
                 <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Cliché Nuevo y Producción</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PREPARACION_COLUMNS.slice(4, 6).map(columna => (
                        <PreparacionColumn
                            key={columna.id}
                            columna={columna}
                            pedidos={pedidosPorColumna[columna.id] || []}
                            onSelectPedido={onSelectPedido}
                            onArchiveToggle={onArchiveToggle}
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
             </div>
        </main>
    );
};

export default PreparacionView;
