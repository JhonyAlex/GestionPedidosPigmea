import React, { useCallback } from 'react';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { Pedido } from '../types';
import type { Cliente } from '../hooks/useClientesManager';
import type { Vendedor } from '../types/vendedor';

interface UndoRedoProviderProps {
    children: React.ReactNode;
}

/**
 * Provider legacy (solo envoltorio).
 * El proyecto ya no expone acciones de deshacer/rehacer desde la UI.
 */
export const UndoRedoProvider: React.FC<UndoRedoProviderProps> = ({
    children,
}) => {
    return <>{children}</>;
};

/**
 * Hook helper para registrar acciones desde componentes
 */
export const useActionRecorder = () => {
    const { recordAction } = useUndoRedo();

    const recordPedidoCreate = useCallback(
        async (pedido: Pedido) => {
            await recordAction(
                pedido.id,
                'pedido',
                'CREATE',
                {
                    after: pedido,
                },
                `Pedido creado: ${pedido.numeroPedidoCliente} - ${pedido.cliente}`
            );
        },
        [recordAction]
    );

    const recordPedidoUpdate = useCallback(
        async (before: Pedido, after: Pedido) => {
            const changes: string[] = [];
            
            // Detectar cambios específicos
            if (before.etapaActual !== after.etapaActual) {
                changes.push(`Etapa: ${before.etapaActual} → ${after.etapaActual}`);
            }
            if (before.prioridad !== after.prioridad) {
                changes.push(`Prioridad: ${before.prioridad} → ${after.prioridad}`);
            }
            if (before.fechaEntrega !== after.fechaEntrega) {
                changes.push(`Fecha entrega: ${before.fechaEntrega} → ${after.fechaEntrega}`);
            }

            const description = changes.length > 0
                ? `Pedido actualizado: ${after.numeroPedidoCliente} (${changes.join(', ')})`
                : `Pedido actualizado: ${after.numeroPedidoCliente}`;

            await recordAction(
                after.id,
                'pedido',
                'UPDATE',
                {
                    before,
                    after,
                },
                description
            );
        },
        [recordAction]
    );

    const recordPedidoDelete = useCallback(
        async (pedido: Pedido) => {
            await recordAction(
                pedido.id,
                'pedido',
                'DELETE',
                {
                    before: pedido,
                },
                `Pedido eliminado: ${pedido.numeroPedidoCliente} - ${pedido.cliente}`
            );
        },
        [recordAction]
    );

    const recordBulkUpdate = useCallback(
        async (pedidoIds: string[], description: string) => {
            // Para operaciones masivas, usamos el primer ID como contexto
            const contextId = pedidoIds[0] || 'bulk';
            
            await recordAction(
                contextId,
                'pedido',
                'BULK_UPDATE',
                {
                    affectedIds: pedidoIds,
                },
                description
            );
        },
        [recordAction]
    );

    const recordBulkDelete = useCallback(
        async (pedidoIds: string[], pedidos: Pedido[]) => {
            const contextId = pedidoIds[0] || 'bulk';
            
            await recordAction(
                contextId,
                'pedido',
                'BULK_DELETE',
                {
                    before: pedidos,
                    affectedIds: pedidoIds,
                },
                `Eliminados ${pedidoIds.length} pedidos en masa`
            );
        },
        [recordAction]
    );

    const recordClienteUpdate = useCallback(
        async (before: Cliente, after: Cliente) => {
            await recordAction(
                String(after.id),
                'cliente',
                'UPDATE',
                { before, after },
                `Cliente actualizado: ${after.nombre}`
            );
        },
        [recordAction]
    );

    const recordVendedorUpdate = useCallback(
        async (before: Vendedor, after: Vendedor) => {
            await recordAction(
                String(after.id),
                'vendedor',
                'UPDATE',
                { before, after },
                `Comercial actualizado: ${after.nombre}`
            );
        },
        [recordAction]
    );

    return {
        recordPedidoCreate,
        recordPedidoUpdate,
        recordPedidoDelete,
        recordBulkUpdate,
        recordBulkDelete,
        recordClienteUpdate,
        recordVendedorUpdate,
    };
};
