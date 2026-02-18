import React, { useMemo, useState } from 'react';
import { Pedido, UserRole, Etapa, Prioridad } from '../types';
import { PREPARACION_COLUMNS, PREPARACION_SUB_ETAPAS_IDS, PRIORIDAD_COLORS } from '../constants';
import PreparacionColumn from './PreparacionColumn';
import { formatMetros } from '../utils/date';

interface ListoProduccionViewProps {
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    onArchiveToggle: (pedido: Pedido) => void;
    currentUserRole: UserRole;
    onSendToPrint: (pedido: Pedido) => void;
    highlightedPedidoId?: string | null;
    onUpdatePedido?: (updatedPedido: Pedido) => Promise<void>;
    // Bulk selection props
    selectedIds?: string[];
    isSelectionActive?: boolean;
    onToggleSelection?: (id: string) => void;
    onSelectAll?: (ids: string[]) => void;
}

const ListoProduccionView: React.FC<ListoProduccionViewProps> = ({
    pedidos,
    onSelectPedido,
    onArchiveToggle,
    currentUserRole,
    onSendToPrint,
    highlightedPedidoId,
    onUpdatePedido,
    selectedIds = [],
    isSelectionActive = false,
    onToggleSelection,
    onSelectAll
}) => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    // Filtrar solo los pedidos que están en la sub-etapa "Listo para Producción"
    const pedidosListos = pedidos.filter(
        pedido => pedido.etapaActual === Etapa.PREPARACION &&
            pedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION
    );

    // Encontrar la configuración de la columna "Listo para Producción"
    const columnaListo = PREPARACION_COLUMNS.find(
        col => col.id === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION
    );

    // Calcular métricas de los pedidos
    const metricas = useMemo(() => {
        const tiemposPorMaquina: Record<string, number> = {};
        const pedidosPorCliente: Record<string, number> = {};
        const pedidosPorVendedor: Record<string, number> = {};
        const estadosCliché: Record<string, number> = {};
        let tiempoTotal = 0;
        let metrosTotal = 0;

        pedidosListos.forEach(pedido => {
            // Tiempo por máquina
            let maquina = pedido.maquinaImpresion || 'Sin asignar';

            // Si la máquina es ANON (legacy), ignorar o reasignar a 'Sin asignar'
            if (maquina === 'ANON') {
                maquina = 'Sin asignar';
            }

            const tiempo = pedido.tiempoProduccionDecimal || 0;
            tiemposPorMaquina[maquina] = (tiemposPorMaquina[maquina] || 0) + tiempo;
            tiempoTotal += tiempo;

            // Pedidos por cliente
            const cliente = pedido.cliente || 'Sin cliente';
            pedidosPorCliente[cliente] = (pedidosPorCliente[cliente] || 0) + 1;

            // Pedidos por vendedor
            const vendedor = pedido.vendedorNombre || 'Sin vendedor';
            pedidosPorVendedor[vendedor] = (pedidosPorVendedor[vendedor] || 0) + 1;

            // Estado de cliché
            const estadoCliché = pedido.estadoCliché || 'Sin definir';
            estadosCliché[estadoCliché] = (estadosCliché[estadoCliché] || 0) + 1;

            // Metros
            const metros = typeof pedido.metros === 'number' ? pedido.metros : parseFloat(String(pedido.metros || 0));
            metrosTotal += metros;
        });

        return {
            tiemposPorMaquina,
            pedidosPorCliente,
            pedidosPorVendedor,
            estadosCliché,
            tiempoTotal,
            metrosTotal,
            cantidadPedidos: pedidosListos.length
        };
    }, [pedidosListos]);

    // Formatear tiempo decimal a horas y minutos
    const formatearTiempo = (decimal: number) => {
        const horas = Math.floor(decimal);
        const minutos = Math.round((decimal - horas) * 60);
        return `${horas}h ${minutos}m`;
    };

    if (!columnaListo) {
        return (
            <main className="flex-grow p-4 md:p-8">
                <div className="text-center text-red-500">
                    Error: No se encontró la configuración de la columna "Listo para Producción"
                </div>
            </main>
        );
    }

    const renderLista = () => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                        {pedidosListos.length} pedidos listos
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMetros(metricas.metrosTotal)} m · {formatearTiempo(metricas.tiempoTotal)}
                    </span>
                </div>
                {onToggleSelection && (
                    <div className="flex items-center gap-2">
                        {onSelectAll && (
                            <button
                                onClick={() => onSelectAll(pedidosListos.map(p => p.id))}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-800/60 border border-indigo-200 dark:border-indigo-700"
                            >
                                Seleccionar todos
                            </button>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Seleccionados: {selectedIds.length}
                        </span>
                    </div>
                )}
            </div>
            <div className="overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/40">
                        <tr>
                            {onToggleSelection && <th className="px-3 py-2 w-10"></th>}
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">N°</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Cliente</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Desarrollo</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Máquina</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Comercial</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Metros</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Tiempo</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Prioridad</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Cliché</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">F. Entrega</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Nueva Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {pedidosListos.length === 0 ? (
                            <tr>
                                <td colSpan={onToggleSelection ? 12 : 11} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                    No hay pedidos listos para producción con los filtros actuales.
                                </td>
                            </tr>
                        ) : (
                            pedidosListos.map(pedido => {
                                const metrosValor = typeof pedido.metros === 'number' ? pedido.metros : Number(pedido.metros || 0);
                                const prioridadColor = PRIORIDAD_COLORS[pedido.prioridad] || PRIORIDAD_COLORS[Prioridad.NORMAL] || 'border-blue-500';
                                return (
                                    <tr
                                        key={pedido.id}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors ${pedido.id === highlightedPedidoId ? 'card-highlight' : ''}`}
                                        onClick={() => onSelectPedido(pedido)}
                                    >
                                        {onToggleSelection && (
                                            <td className="px-3 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(pedido.id)}
                                                    onChange={() => onToggleSelection(pedido.id)}
                                                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </td>
                                        )}
                                        <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{pedido.numeroPedidoCliente}</td>
                                        <td className="px-3 py-3 text-gray-800 dark:text-gray-200 truncate max-w-[160px]" title={pedido.cliente}>{pedido.cliente}</td>
                                        <td className="px-3 py-3 text-gray-700 dark:text-gray-300 truncate max-w-[180px]" title={pedido.desarrollo}>{pedido.desarrollo}</td>
                                        <td className="px-3 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">{pedido.maquinaImpresion || 'Sin asignar'}</td>
                                        <td className="px-3 py-3 text-gray-700 dark:text-gray-300 truncate max-w-[140px]" title={pedido.vendedorNombre || 'Sin vendedor'}>{pedido.vendedorNombre || 'Sin vendedor'}</td>
                                        <td className="px-3 py-3 text-center text-gray-800 dark:text-gray-200">{formatMetros(metrosValor)} m</td>
                                        <td className="px-3 py-3 text-center text-gray-800 dark:text-gray-200">{pedido.tiempoProduccionPlanificado || formatearTiempo(pedido.tiempoProduccionDecimal || 0)}</td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full text-white ${prioridadColor.replace('border', 'bg').replace('-500', '-700')}`}>
                                                {pedido.prioridad}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center text-gray-800 dark:text-gray-200">{pedido.estadoCliché || 'Sin definir'}</td>
                                        <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{pedido.fechaEntrega || '-'}</td>
                                        <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{pedido.nuevaFechaEntrega || '-'}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <main className="flex-grow p-4 md:p-8 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white border-l-4 border-green-500 pl-4">
                        Listos para Producción
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Cambia entre Kanban y Lista para editar en bloque sin perder contexto.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-900 text-green-600 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                        Kanban
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                        Lista
                    </button>
                </div>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Columna de Pedidos */}
                <div className="flex-1 flex flex-col max-h-[calc(100vh-12rem)]">
                    {viewMode === 'kanban' ? (
                        <PreparacionColumn
                            key={columnaListo.id}
                            columna={columnaListo}
                            pedidos={pedidosListos}
                            onSelectPedido={onSelectPedido}
                            onArchiveToggle={onArchiveToggle}
                            currentUserRole={currentUserRole}
                            onSendToPrint={onSendToPrint}
                            highlightedPedidoId={highlightedPedidoId}
                            onUpdatePedido={onUpdatePedido}
                            selectedIds={selectedIds}
                            isSelectionActive={isSelectionActive}
                            onToggleSelection={onToggleSelection}
                        />
                    ) : (
                        renderLista()
                    )}
                </div>

                {/* Panel de Métricas */}
                <div className="w-96 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 sticky top-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                Métricas de Producción
                            </h3>
                        </div>

                        {/* Resumen General */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Resumen General</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Total Pedidos:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{metricas.cantidadPedidos}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Metros Totales:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{formatMetros(metricas.metrosTotal)} m</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Tiempo Total:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{formatearTiempo(metricas.tiempoTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tiempo por Máquina */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Tiempo por Máquina</h4>
                            <div className="space-y-2">
                                {Object.entries(metricas.tiemposPorMaquina).map(([maquina, tiempo]) => (
                                    <div key={maquina} className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{maquina}</span>
                                            <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatearTiempo(tiempo)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all"
                                                style={{ width: `${metricas.tiempoTotal ? (tiempo / metricas.tiempoTotal) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Estado de Clichés */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Estado de Clichés</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {Object.entries(metricas.estadosCliché).map(([estado, cantidad]) => (
                                    <div key={estado} className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{estado}</span>
                                        <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">{cantidad}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pedidos por Cliente */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Pedidos por Cliente</h4>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {Object.entries(metricas.pedidosPorCliente)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([cliente, cantidad]) => (
                                        <div key={cliente} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 truncate mr-2">{cliente}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{cantidad}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Pedidos por Comercial */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Pedidos por Comercial</h4>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {Object.entries(metricas.pedidosPorVendedor)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([vendedor, cantidad]) => (
                                        <div key={vendedor} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 truncate mr-2">{vendedor}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{cantidad}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Gráfico de Distribución */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Distribución de Tiempo</h4>
                            <div className="space-y-2">
                                {Object.entries(metricas.tiemposPorMaquina)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([maquina, tiempo]) => {
                                        const maxTiempo = Math.max(...Object.values(metricas.tiemposPorMaquina));
                                        const porcentaje = maxTiempo ? (tiempo / maxTiempo) * 100 : 0;
                                        return (
                                            <div key={maquina} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600 dark:text-gray-400">{maquina}</span>
                                                    <span className="font-semibold text-gray-900 dark:text-white">{formatearTiempo(tiempo)}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                    <div
                                                        className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end px-2"
                                                        style={{ width: `${porcentaje}%` }}
                                                    >
                                                        <span className="text-[10px] text-white font-bold">{porcentaje.toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ListoProduccionView;
