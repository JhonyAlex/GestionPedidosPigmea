import React, { useMemo } from 'react';
import { Pedido, UserRole, Etapa, EstadoCliché } from '../types';
import { PREPARACION_COLUMNS, PREPARACION_SUB_ETAPAS_IDS } from '../constants';
import PreparacionColumn from './PreparacionColumn';

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
    onToggleSelection
}) => {

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
            const maquina = pedido.maquinaImpresion || 'Sin asignar';
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

    return (
        <main className="flex-grow p-4 md:p-8 flex flex-col">
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-6 border-l-4 border-green-500 pl-4">
                Listos para Producción
            </h2>
            
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Columna de Pedidos */}
                <div className="flex-1 flex flex-col">
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
                </div>

                {/* Panel de Métricas */}
                <div className="w-96 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 sticky top-4">
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                📊 Métricas de Producción
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
                                    <span className="font-bold text-gray-900 dark:text-white">{metricas.metrosTotal.toLocaleString()} m</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Tiempo Total:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{formatearTiempo(metricas.tiempoTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tiempo por Máquina */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">⚙️ Tiempo por Máquina</h4>
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
                                                style={{ width: `${(tiempo / metricas.tiempoTotal) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Estado de Clichés */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">🎨 Estado de Clichés</h4>
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
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">👥 Pedidos por Cliente</h4>
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

                        {/* Pedidos por Vendedor */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">💼 Pedidos por Vendedor</h4>
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
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">📈 Distribución de Tiempo</h4>
                            <div className="space-y-2">
                                {Object.entries(metricas.tiemposPorMaquina)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([maquina, tiempo]) => {
                                        const maxTiempo = Math.max(...Object.values(metricas.tiemposPorMaquina));
                                        const porcentaje = (tiempo / maxTiempo) * 100;
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
