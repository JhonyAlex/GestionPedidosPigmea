import React from 'react';
import { Pedido, UserRole, Etapa } from '../types';
import { PREPARACION_COLUMNS, PREPARACION_SUB_ETAPAS_IDS } from '../constants';
import PreparacionColumn from './PreparacionColumn';

interface ListoProduccionViewProps {
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

const ListoProduccionView: React.FC<ListoProduccionViewProps> = ({ 
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

    // Filtrar solo los pedidos que están en la sub-etapa "Listo para Producción"
    const pedidosListos = pedidos.filter(
        pedido => pedido.etapaActual === Etapa.PREPARACION && 
                  pedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION
    );

    // Encontrar la configuración de la columna "Listo para Producción"
    const columnaListo = PREPARACION_COLUMNS.find(
        col => col.id === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION
    );

    if (!columnaListo) {
        return (
            <main className="flex-grow p-4 md:p-8">
                <div className="text-center text-red-500">
                    Error: No se encontró la configuración de la columna "Listo para Producción"
                </div>
            </main>
        );
    }

    return (
        <main className="flex-grow p-4 md:p-8">
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-6 border-l-4 border-green-500 pl-4">
                Listos para Producción
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PreparacionColumn
                    key={columnaListo.id}
                    columna={columnaListo}
                    pedidos={pedidosListos}
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
            </div>
        </main>
    );
};

export default ListoProduccionView;
