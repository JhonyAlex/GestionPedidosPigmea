import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Pedido, UserRole, EstadoCliché } from '../types';
import { PREPARACION_SUB_ETAPAS, PREPARACION_SUB_ETAPAS_IDS } from '../constants';
import PreparacionColumn from './PreparacionColumn';

interface PreparacionViewProps {
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    currentUserRole: UserRole;
    onSendToPrint: (pedido: Pedido) => void;
}

const PreparacionView: React.FC<PreparacionViewProps> = ({ pedidos, onSelectPedido, currentUserRole, onSendToPrint }) => {
    const getSubEtapaPedidos = (subEtapaId: string) => {
        return pedidos.filter(pedido => {
            if (subEtapaId === PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE) {
                return !pedido.materialDisponible;
            }
            if (subEtapaId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE) {
                return pedido.materialDisponible && !pedido.clicheDisponible;
            }
            if (subEtapaId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_PENDIENTE) {
                return pedido.materialDisponible && pedido.clicheDisponible && pedido.estadoCliché === EstadoCliché.PENDIENTE_CLIENTE;
            }
            if (subEtapaId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_REPETICION) {
                return pedido.materialDisponible && pedido.clicheDisponible && pedido.estadoCliché === EstadoCliché.REPETICION_CAMBIO;
            }
            if (subEtapaId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_NUEVO) {
                return pedido.materialDisponible && pedido.clicheDisponible && pedido.estadoCliché === EstadoCliché.NUEVO;
            }
            return false;
        });
    };

    return (
        <main className="flex-grow p-4 md:p-8">
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-8 text-center">
                Preparación de Pedidos
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {PREPARACION_SUB_ETAPAS.map(subEtapa => (
                    <PreparacionColumn
                        key={subEtapa.id}
                        subEtapa={subEtapa}
                        pedidos={getSubEtapaPedidos(subEtapa.id)}
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
