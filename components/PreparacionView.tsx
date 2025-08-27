import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Pedido, UserRole, EstadoCliché } from '../types';
import { PREPARACION_COLUMNS, PREPARACION_SUB_ETAPAS_IDS } from '../constants';
import PreparacionColumn from './PreparacionColumn';

interface PreparacionViewProps {
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    currentUserRole: UserRole;
    onSendToPrint: (pedido: Pedido) => void;
}

const PreparacionView: React.FC<PreparacionViewProps> = ({ pedidos, onSelectPedido, currentUserRole, onSendToPrint }) => {

    const pedidosPorColumna: Record<string, Pedido[]> = {
        [PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE]: pedidos.filter(p => !p.materialDisponible),
        [PREPARACION_SUB_ETAPAS_IDS.CLICHE_PENDIENTE]: pedidos.filter(p => p.materialDisponible && p.estadoCliché === EstadoCliché.PENDIENTE_CLIENTE),
        [PREPARACION_SUB_ETAPAS_IDS.CLICHE_REPETICION]: pedidos.filter(p => p.materialDisponible && p.estadoCliché === EstadoCliché.REPETICION_CAMBIO),
        [PREPARACION_SUB_ETAPAS_IDS.CLICHE_NUEVO]: pedidos.filter(p => p.materialDisponible && p.estadoCliché === EstadoCliché.NUEVO),
    };

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
                    />
                ))}
             </div>
        </main>
    );
};

export default PreparacionView;
