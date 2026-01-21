import { useCallback } from 'react';
import type { Pedido } from '../types';
import type { Cliente } from './useClientesManager';
import type { Vendedor } from '../types/vendedor';
import { useActionHistory } from './useActionHistory';
import { ETAPAS } from '../constants';

const MAX_CHANGE_PREVIEW = 3;

const safeString = (value: unknown, maxLen: number = 32) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length <= maxLen) return trimmed;
        return `${trimmed.slice(0, maxLen - 1)}…`;
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const preview = value.slice(0, 3).map(v => safeString(v, 16)).join(', ');
        const extra = value.length > 3 ? ` +${value.length - 3}` : '';
        return `[${preview}${extra}]`;
    }

    try {
        const json = JSON.stringify(value);
        if (!json) return '[obj]';
        return json.length <= maxLen ? json : `${json.slice(0, maxLen - 1)}…`;
    } catch {
        return '[obj]';
    }
};

const shallowEqual = (a: unknown, b: unknown) => {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    return false;
};

const etapaTitle = (etapa: Pedido['etapaActual']) => {
    const info = (ETAPAS as any)?.[etapa];
    return info?.title ?? String(etapa);
};

const diffPedidoChanges = (before: Pedido, after: Pedido): string[] => {
    const changes: string[] = [];

    // 1) Movimiento / etapa
    if (before.etapaActual !== after.etapaActual) {
        changes.push(`Etapa: ${etapaTitle(before.etapaActual)} → ${etapaTitle(after.etapaActual)}`);
    }
    if (before.subEtapaActual !== after.subEtapaActual) {
        changes.push(`Sub-etapa: ${safeString(before.subEtapaActual)} → ${safeString(after.subEtapaActual)}`);
    }

    // 2) Campos relevantes (resumen)
    const fields: Array<{ key: keyof Pedido; label: string }> = [
        { key: 'prioridad', label: 'Prioridad' },
        { key: 'fechaEntrega', label: 'Entrega' },
        { key: 'maquinaImpresion', label: 'Máquina' },
        { key: 'metros', label: 'Metros' },
        { key: 'tipoImpresion', label: 'Impresión' },
        { key: 'desarrollo', label: 'Desarrollo' },
        { key: 'capa', label: 'Capa' },
        { key: 'camisa', label: 'Camisa' },
        { key: 'producto', label: 'Producto' },
        { key: 'antivaho', label: 'Antivaho' },
        { key: 'antivahoRealizado', label: 'Antivaho hecho' },
        { key: 'microperforado', label: 'Micro' },
        { key: 'macroperforado', label: 'Macro' },
        { key: 'anonimo', label: 'Anónimo' },
        { key: 'compraCliche', label: 'Compra Cliché' },
        { key: 'horasConfirmadas', label: 'Horas Confirmadas' },
    ];

    for (const field of fields) {
        const beforeValue = before[field.key];
        const afterValue = after[field.key];
        if (shallowEqual(beforeValue, afterValue)) continue;
        if (beforeValue === afterValue) continue;
        changes.push(`${field.label}: ${safeString(beforeValue)} → ${safeString(afterValue)}`);
    }

    // Arrays (resumen por conteo/preview)
    if (!shallowEqual(before.numerosCompra, after.numerosCompra)) {
        changes.push(`Nº compra: ${safeString(before.numerosCompra)} → ${safeString(after.numerosCompra)}`);
    }

    return changes;
};

/**
 * Hook helper para registrar acciones desde componentes.
 */
export const useActionRecorder = () => {
    const { recordAction } = useActionHistory();

    const recordPedidoCreate = useCallback(
        async (pedido: Pedido) => {
            const details = `Pedido creado en ${etapaTitle(pedido.etapaActual)}.`;
            await recordAction(
                pedido.id,
                'pedido',
                'CREATE',
                {
                    after: pedido,
                    summary: {
                        title: `Creación: ${pedido.numeroPedidoCliente}`,
                        details,
                    },
                },
                `Creación: ${pedido.numeroPedidoCliente} — ${safeString(pedido.cliente, 28)}`
            );
        },
        [recordAction]
    );

    const recordPedidoUpdate = useCallback(
        async (before: Pedido, after: Pedido) => {
            const changes = diffPedidoChanges(before, after);

            const preview = changes.slice(0, MAX_CHANGE_PREVIEW);
            const extraChangesCount = Math.max(0, changes.length - preview.length);
            const previewText = preview.join('; ');

            const isStageMove = before.etapaActual !== after.etapaActual;
            const title = isStageMove
                ? `Cambio de Etapa: ${after.numeroPedidoCliente}`
                : `Edición: ${after.numeroPedidoCliente}`;

            const details = changes.length > 0
                ? `${previewText}${extraChangesCount > 0 ? `; +${extraChangesCount} más` : ''}`
                : 'Actualización sin cambios detectables.';

            const description = isStageMove
                ? `Movimiento: ${after.numeroPedidoCliente} — ${etapaTitle(before.etapaActual)} → ${etapaTitle(after.etapaActual)}`
                : `Actualizado: ${after.numeroPedidoCliente}${changes.length > 0 ? ` (${previewText}${extraChangesCount > 0 ? `; +${extraChangesCount} más` : ''})` : ''}`;

            await recordAction(
                after.id,
                'pedido',
                'UPDATE',
                {
                    before,
                    after,
                    summary: {
                        title,
                        details,
                        changes,
                        extraChangesCount,
                    },
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
                    summary: {
                        title: `Eliminación: ${pedido.numeroPedidoCliente}`,
                        details: `Pedido eliminado (${safeString(pedido.cliente, 28)}).`,
                    },
                },
                `Eliminado: ${pedido.numeroPedidoCliente} — ${safeString(pedido.cliente, 28)}`
            );
        },
        [recordAction]
    );

    const recordBulkUpdate = useCallback(
        async (pedidoIds: string[], description: string) => {
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
                `Vendedor actualizado: ${after.nombre}`
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
