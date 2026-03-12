import { Pedido } from '../types';

/**
 * Normaliza un valor para búsqueda flexible: minúsculas, sin tildes ni espacios ni caracteres especiales.
 */
export const normalizeSearchValue = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
};

/**
 * Determina si un pedido coincide con un término de búsqueda ya normalizado.
 */
export const pedidoMatchesSearch = (pedido: Pedido, normalizedTerm: string): boolean => {
    if (!normalizedTerm) {
        return false;
    }

    const matches = (value: string | number | boolean | null | undefined) =>
        normalizeSearchValue(value).includes(normalizedTerm);

    return (
        matches(pedido.numeroPedidoCliente) ||
        matches(pedido.numeroRegistro) ||
        matches(pedido.cliente) ||
        matches(pedido.clienteId) ||
        matches(pedido.vendedorNombre) ||
        matches(pedido.vendedorId)
    );
};
