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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isEquiv = (a: any, b: any): boolean => {
    // null, undefined y string vacío son equivalentes
    const isEmptyA = a === null || a === undefined || a === '';
    const isEmptyB = b === null || b === undefined || b === '';
    if (isEmptyA && isEmptyB) return true;

    // Si uno es vacío y el otro no
    if (isEmptyA !== isEmptyB) {
        if (Array.isArray(a) && a.length === 0 && isEmptyB) return true;
        if (Array.isArray(b) && b.length === 0 && isEmptyA) return true;
        return false;
    }

    // Ambos son objetos (arrays u objetos planos): comparación profunda
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
        if (Array.isArray(a) !== Array.isArray(b)) return false;

        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            return a.every((v: any, i: number) => isEquiv(v, b[i]));
        }

        // Comparación profunda de objetos por claves
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(k => k in b && isEquiv(a[k], b[k]));
    }

    // Números vs strings numéricos (ej. '0' == 0, '1.5' == 1.5)
    if (!isNaN(Number(a)) && !isNaN(Number(b))) {
        return Number(a) === Number(b);
    }

    // Fechas: strings ISO que representan el mismo instante
    if (typeof a === 'string' && typeof b === 'string') {
        const da = Date.parse(a);
        const db = Date.parse(b);
        if (!isNaN(da) && !isNaN(db) && da === db) return true;
    }

    return a === b;
};

const etapaTitle = (etapa: Pedido['etapaActual']) => {
    const info = (ETAPAS as any)?.[etapa];
    return info?.title ?? String(etapa);
};

const IGNORED_KEYS = new Set(['id', 'updatedAt', 'createdAt', 'history', '_id', 'historial']);

const FIELD_LABELS: Record<string, string> = {
    etapaActual: 'Etapa',
    subEtapaActual: 'Sub-etapa',
    prioridad: 'Prioridad',
    fechaEntrega: 'Entrega',
    maquinaImpresion: 'Máquina',
    metros: 'Metros',
    tipoImpresion: 'Impresión',
    desarrollo: 'Desarrollo',
    capa: 'Capa',
    camisa: 'Camisa',
    producto: 'Producto',
    antivaho: 'Antivaho',
    antivahoRealizado: 'Antivaho hecho',
    microperforado: 'Micro',
    macroperforado: 'Macro',
    anonimo: 'Anónimo',
    compraCliche: 'Compra Cliché',
    horasConfirmadas: 'Horas Confirmadas',
    numerosCompra: 'Nº compra',
    cliente: 'Cliente',
    numeroPedidoCliente: 'Nº Pedido',
    etapasSecuencia: 'Secuencia de etapas',
    subEtapasSecuencia: 'Secuencia sub-etapas',
    materialConsumo: 'Material/Consumo',
    tiempoProduccionDecimal: 'Tiempo producción',
};

const diffPedidoChanges = (before: Pedido, after: Pedido): string[] => {
    const changes: string[] = [];
    if (!before || !after) return changes;

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    allKeys.forEach(key => {
        if (IGNORED_KEYS.has(key)) return;

        const oldVal = (before as any)[key];
        const newVal = (after as any)[key];

        // Comparación unificada con isEquiv (soporta objetos profundos)
        if (!isEquiv(oldVal, newVal)) {
            const label = FIELD_LABELS[key] || key;
            if (key === 'etapaActual') {
                changes.push(`${label}: ${etapaTitle(oldVal)} → ${etapaTitle(newVal)}`);
            } else {
                changes.push(`${label}: ${safeString(oldVal)} → ${safeString(newVal)}`);
            }
        }
    });

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

            // No registrar si no hay cambios reales
            if (changes.length === 0) return;

            const preview = changes.slice(0, MAX_CHANGE_PREVIEW);
            const extraChangesCount = Math.max(0, changes.length - preview.length);
            const previewText = preview.join('; ');

            const isStageMove = before.etapaActual !== after.etapaActual;
            const title = isStageMove
                ? `Cambio de Etapa: ${after.numeroPedidoCliente}`
                : `Edición: ${after.numeroPedidoCliente}`;

            const details = `${previewText}${extraChangesCount > 0 ? `; +${extraChangesCount} más` : ''}`;

            const description = isStageMove
                ? `Movimiento: ${after.numeroPedidoCliente} — ${etapaTitle(before.etapaActual)} → ${etapaTitle(after.etapaActual)}`
                : `Actualizado: ${after.numeroPedidoCliente} (${previewText}${extraChangesCount > 0 ? `; +${extraChangesCount} más` : ''})`;

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
