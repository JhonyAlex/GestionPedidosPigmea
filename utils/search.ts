import { Pedido } from '../types';
import { ETAPAS } from '../constants';

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
        matches(pedido.vendedorId) ||
        (pedido.numerosCompra?.some(numero => matches(numero)) ?? false) ||
        matches(pedido.desarrollo) ||
        matches(pedido.maquinaImpresion) ||
        matches(pedido.metros) ||
        matches(pedido.capa) ||
        matches(pedido.camisa) ||
        matches(pedido.tipoImpresion) ||
        matches(pedido.tiempoProduccionPlanificado) ||
        matches(pedido.tiempoTotalProduccion) ||
        matches(ETAPAS[pedido.etapaActual]?.title) ||
        matches(pedido.subEtapaActual) ||
        matches(pedido.prioridad) ||
        matches(pedido.fechaCreacion) ||
        matches(pedido.fechaEntrega) ||
        matches(pedido.nuevaFechaEntrega) ||
        matches(pedido.fechaFinalizacion) ||
        matches(pedido.estadoCliché) ||
        matches(pedido.clicheInfoAdicional) ||
        matches(pedido.observaciones) ||
        matches(pedido.producto) ||
        matches(pedido.bobinaMadre) ||
        matches(pedido.bobinaFinal) ||
        matches(pedido.minAdap) ||
        matches(pedido.colores) ||
        matches(pedido.minColor) ||
        matches(pedido.materialCapasCantidad) ||
        matches(pedido.materialConsumoCantidad) ||
        (pedido.materialCapas?.some(capa => matches(capa.micras) || matches(capa.densidad)) ?? false) ||
        (pedido.materialConsumo?.some(consumo =>
            matches(consumo.necesario) ||
            matches(consumo.recibido) ||
            matches(consumo.gestionado) ||
            matches(consumo.micras) ||
            matches(consumo.densidad)
        ) ?? false)
    );
};
