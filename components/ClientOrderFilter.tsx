import React, { useState, useMemo } from 'react';
import { Pedido, Etapa } from '../types';
import { ETAPAS, PREPARACION_COLUMNS } from '../constants';

interface Cliente {
    id: string;
    nombre: string;
    estado: 'activo' | 'inactivo' | 'archivado';
}

interface ClientOrderFilterProps {
    pedidos: Pedido[];
    clientes: Cliente[];
    onSelectPedido?: (pedido: Pedido) => void;
    onNavigateToPedido?: (pedido: Pedido) => void;
}

const formatShortDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const getEtapaLabel = (p: Pedido): string => {
    // Si está en Preparación y tiene sub-etapa, mostrar la sub-etapa
    if (p.etapaActual === Etapa.PREPARACION && p.subEtapaActual) {
        const subCol = PREPARACION_COLUMNS.find(c => c.id === p.subEtapaActual);
        if (subCol) return subCol.title;
    }
    // Si no, mostrar la etapa principal
    const etapa = ETAPAS[p.etapaActual];
    return etapa ? etapa.title : p.etapaActual;
};

const getEtapaColor = (p: Pedido): string => {
    if (p.etapaActual === Etapa.PREPARACION && p.subEtapaActual) {
        const subCol = PREPARACION_COLUMNS.find(c => c.id === p.subEtapaActual);
        if (subCol) return subCol.color;
    }
    const etapa = ETAPAS[p.etapaActual];
    return etapa ? etapa.color : 'bg-gray-400';
};

const getDateFieldLabel = (p: Pedido): string => {
    if (p.nuevaFechaEntrega) return 'Nueva entrega';
    return 'Entrega';
};

const ClientOrderFilter: React.FC<ClientOrderFilterProps> = ({
    pedidos,
    clientes,
    onSelectPedido,
    onNavigateToPedido,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const clientSearchResults = useMemo(() => {
        const term = clientSearchTerm.trim().toLowerCase();
        if (!term) {
            // Sin texto: mostrar todos los clientes (limitado a 15)
            return clientes.slice(0, 15);
        }
        return clientes
            .filter(c => c.nombre.toLowerCase().includes(term))
            .slice(0, 15);
    }, [clientes, clientSearchTerm]);

    const filteredPedidos = useMemo(() => {
        if (!selectedCliente) return [];

        return pedidos
            .filter(p => {
                const clientMatch = p.clienteId
                    ? p.clienteId === selectedCliente.id
                    : p.cliente === selectedCliente.nombre;
                if (!clientMatch) return false;

                const deliveryDate = p.nuevaFechaEntrega || p.fechaEntrega;
                if (!deliveryDate) return false;

                if (dateFrom && deliveryDate < dateFrom) return false;
                if (dateTo && deliveryDate > dateTo) return false;

                return true;
            })
            .sort((a, b) => {
                const dateA = a.nuevaFechaEntrega || a.fechaEntrega || '';
                const dateB = b.nuevaFechaEntrega || b.fechaEntrega || '';
                return dateA.localeCompare(dateB);
            });
    }, [pedidos, selectedCliente, dateFrom, dateTo]);

    const handleSelectCliente = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setClientSearchTerm('');
        setShowDropdown(false);
    };

    const handleClear = () => {
        setSelectedCliente(null);
        setClientSearchTerm('');
        setDateFrom('');
        setDateTo('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
            >
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Pedidos por Cliente
                    {selectedCliente && (
                        <span className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                            {filteredPedidos.length}
                        </span>
                    )}
                </div>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Client selector */}
                        <div className="relative flex-1">
                            {selectedCliente ? (
                                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-md">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedCliente.nombre}
                                    </span>
                                    <button
                                        onClick={handleClear}
                                        className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        value={clientSearchTerm}
                                        onChange={(e) => setClientSearchTerm(e.target.value)}
                                        onFocus={() => setShowDropdown(true)}
                                        onBlur={() => {
                                            setTimeout(() => setShowDropdown(false), 150);
                                        }}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                    {showDropdown && clientSearchResults.length > 0 && (
                                        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {clientSearchResults.map(c => (
                                                <button
                                                    key={c.id}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleSelectCliente(c)}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                                >
                                                    {c.nombre}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Date range */}
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <span className="text-gray-400 text-xs">a</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {selectedCliente && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Total de pedidos: {filteredPedidos.length}
                        </p>
                    )}

                    {selectedCliente && filteredPedidos.length > 0 && (
                        <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredPedidos.map(p => {
                                const etapaLabel = getEtapaLabel(p);
                                const etapaColor = getEtapaColor(p);
                                const dateFieldLabel = getDateFieldLabel(p);
                                const dateValue = p.nuevaFechaEntrega || p.fechaEntrega;

                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            if (onSelectPedido) onSelectPedido(p);
                                            else if (onNavigateToPedido) onNavigateToPedido(p);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                    >
                                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                                            {p.numeroPedidoCliente}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400 truncate flex-1">
                                            {p.cliente}
                                        </span>
                                        <span className={`${etapaColor} text-white text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap`}>
                                            {etapaLabel}
                                        </span>
                                        <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap text-xs text-right">
                                            <span className="text-[10px] text-gray-300 dark:text-gray-600">{dateFieldLabel}:</span>{' '}
                                            {formatShortDate(dateValue || '')}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {selectedCliente && filteredPedidos.length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">
                            No se encontraron pedidos para este cliente en el rango seleccionado.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientOrderFilter;
