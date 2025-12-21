import React, { useEffect, useCallback } from 'react';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { Pedido } from '../types';

interface UndoRedoProviderProps {
    children: React.ReactNode;
    onUndoAction?: (actionId: string, payload: any) => Promise<void>;
    onRedoAction?: (actionId: string, payload: any) => Promise<void>;
}

/**
 * Provider que agrega funcionalidad de undo/redo a la aplicación
 * Maneja atajos de teclado y proporciona el contexto a los componentes hijos
 */
export const UndoRedoProvider: React.FC<UndoRedoProviderProps> = ({
    children,
    onUndoAction,
    onRedoAction,
}) => {
    const undoRedo = useUndoRedo({
        onUndo: async (action) => {
            console.log('🔄 Ejecutando undo:', action.description);
            if (onUndoAction) {
                await onUndoAction(action.id, action.payload);
            }
        },
        onRedo: async (action) => {
            console.log('🔄 Ejecutando redo:', action.description);
            if (onRedoAction) {
                await onRedoAction(action.id, action.payload);
            }
        },
    });

    /**
     * Maneja atajos de teclado para undo/redo
     */
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Ctrl+Z o Cmd+Z para undo
            if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                if (undoRedo.state.canUndo && !undoRedo.isProcessing) {
                    undoRedo.undo();
                }
            }

            // Ctrl+Y o Cmd+Shift+Z para redo
            if (
                ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
                ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')
            ) {
                event.preventDefault();
                if (undoRedo.state.canRedo && !undoRedo.isProcessing) {
                    undoRedo.redo();
                }
            }
        },
        [undoRedo]
    );

    /**
     * Registra los atajos de teclado
     */
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

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

    return {
        recordPedidoCreate,
        recordPedidoUpdate,
        recordPedidoDelete,
        recordBulkUpdate,
        recordBulkDelete,
    };
};
