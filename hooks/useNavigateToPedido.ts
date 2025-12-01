import { useCallback } from 'react';
import { Pedido, Etapa, ViewType } from '../types';
import { KANBAN_FUNNELS, PREPARACION_SUB_ETAPAS_IDS } from '../constants';

interface UseNavigateToPedidoProps {
    setView: (view: ViewType) => void;
    setSelectedPedido: (pedido: Pedido | null) => void;
    setHighlightedPedidoId: (id: string | null) => void;
}

export const useNavigateToPedido = ({
    setView,
    setSelectedPedido,
    setHighlightedPedidoId
}: UseNavigateToPedidoProps) => {
    
    const navigateToPedido = useCallback((pedido: Pedido) => {
        // Determinar qué vista usar según la etapa del pedido
        let targetView: ViewType = 'kanban'; // Vista por defecto
        
        // Si está en preparación
        if (pedido.etapaActual === Etapa.PREPARACION) {
            // Si está en "Listo para Producción", ir a esa vista específica
            if (pedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION) {
                targetView = 'listoProduccion';
            } else {
                targetView = 'preparacion';
            }
        }
        // Si está en etapas de kanban (impresión o post-impresión)
        else if (
            KANBAN_FUNNELS.IMPRESION.stages.includes(pedido.etapaActual) ||
            KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedido.etapaActual)
        ) {
            targetView = 'kanban';
        }
        // Si está completado
        else if (pedido.etapaActual === Etapa.COMPLETADO) {
            targetView = 'kanban'; // Los completados se ven en kanban
        }
        // Si está archivado
        else if (pedido.etapaActual === Etapa.ARCHIVADO) {
            targetView = 'archived';
        }
        
        // Cambiar a la vista correspondiente
        setView(targetView);
        
        // Abrir el modal del pedido
        setSelectedPedido(pedido);
        
        // Resaltar el pedido brevemente
        setHighlightedPedidoId(pedido.id);
        setTimeout(() => {
            setHighlightedPedidoId(null);
        }, 3000); // Resaltar por 3 segundos
    }, [setView, setSelectedPedido, setHighlightedPedidoId]);

    return { navigateToPedido };
};