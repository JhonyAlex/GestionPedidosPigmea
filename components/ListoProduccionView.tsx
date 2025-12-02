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

    // Dividir pedidos en dos columnas
    const mitad = Math.ceil(pedidosListos.length / 2);
    const pedidosColumna1 = pedidosListos.slice(0, mitad);
    const pedidosColumna2 = pedidosListos.slice(mitad);

    // Crear configuraciones para ambas columnas
    const columnaListo1 = {
        ...columnaListo,
        id: `${columnaListo.id}_col1`,
        title: `${columnaListo.title} - Columna 1`
    };
    
    const columnaListo2 = {
        ...columnaListo,
        id: `${columnaListo.id}_col2`,
        title: `${columnaListo.title} - Columna 2`
    };

    return (
        <main className="flex-grow p-4 md:p-8">
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-6 border-l-4 border-green-500 pl-4">
                Listos para Producción
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PreparacionColumn
                    key={columnaListo1.id}
                    columna={columnaListo1}
                    pedidos={pedidosColumna1}
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
                <PreparacionColumn
                    key={columnaListo2.id}
                    columna={columnaListo2}
                    pedidos={pedidosColumna2}
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
