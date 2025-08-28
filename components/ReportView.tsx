import React, { useMemo } from 'react';
import { Pedido, Prioridad, Etapa, AuditEntry } from '../types';
import { parseTimeToMinutes, calcularTiempoRealProduccion } from '../utils/kpi';
import BarChart from './BarChart';
import LineChart from './LineChart';

interface ReportViewProps {
    pedidos: Pedido[];
    auditLog: AuditEntry[];
}

const ReportView: React.FC<ReportViewProps> = ({ pedidos, auditLog }) => {
    const urgentPedidos = useMemo(() => {
        return pedidos.filter(p => p.prioridad === Prioridad.URGENTE && p.etapaActual !== Etapa.ARCHIVADO && p.etapaActual !== Etapa.COMPLETADO);
    }, [pedidos]);

    const performanceChartData = useMemo(() => {
        const completed = pedidos
            .filter(p => p.etapaActual === Etapa.COMPLETADO || p.etapaActual === Etapa.ARCHIVADO)
            .sort((a,b) => {
                const dateA = new Date(a.etapasSecuencia.slice(-1)[0]?.fecha || 0).getTime();
                const dateB = new Date(b.etapasSecuencia.slice(-1)[0]?.fecha || 0).getTime();
                return dateB - dateA;
            })
            .slice(0, 10); // Get last 10 completed orders

        return {
            labels: completed.map(p => p.numeroPedidoCliente),
            datasets: [
                {
                    label: 'Tiempo Planificado (min)',
                    data: completed.map(p => parseTimeToMinutes(p.tiempoProduccionPlanificado)),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                },
                {
                    label: 'Tiempo Real (min)',
                    data: completed.map(p => calcularTiempoRealProduccion(p)),
                    backgroundColor: (p, index) => {
                        const planned = parseTimeToMinutes(completed[index].tiempoProduccionPlanificado);
                        const real = calcularTiempoRealProduccion(completed[index]);
                        return real <= planned ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)';
                    },
                }
            ]
        };
    }, [pedidos]);

    // KPI Cards Data
    const kpiData = useMemo(() => {
        const totalPedidos = pedidos.length;
        const completados = pedidos.filter(p => p.etapaActual === Etapa.COMPLETADO || p.etapaActual === Etapa.ARCHIVADO).length;
        const enProceso = pedidos.filter(p => ![Etapa.COMPLETADO, Etapa.ARCHIVADO, Etapa.PENDIENTE].includes(p.etapaActual)).length;
        const pendientes = pedidos.filter(p => p.etapaActual === Etapa.PENDIENTE).length;

        const completadosList = pedidos.filter(p => p.etapaActual === Etapa.COMPLETADO || p.etapaActual === Etapa.ARCHIVADO);
        const onTimeCount = completadosList.filter(p => {
            const real = calcularTiempoRealProduccion(p);
            const planned = parseTimeToMinutes(p.tiempoProduccionPlanificado);
            return real <= planned;
        }).length;
        const onTimePercentage = completados > 0 ? Math.round((onTimeCount / completados) * 100) : 0;

        const avgRealTime = completadosList.length > 0
            ? Math.round(completadosList.reduce((sum, p) => sum + calcularTiempoRealProduccion(p), 0) / completadosList.length)
            : 0;

        return {
            totalPedidos,
            completados,
            enProceso,
            pendientes,
            onTimePercentage,
            avgRealTime
        };
    }, [pedidos]);

    // Stage Analysis Data
    const stageAnalysisData = useMemo(() => {
        const stageTimes: { [key: string]: number[] } = {};
        const allStages = Object.values(Etapa);

        allStages.forEach(stage => {
            stageTimes[stage] = [];
        });

        pedidos.forEach(pedido => {
            pedido.etapasSecuencia.forEach((etapaInfo, index) => {
                const startTime = new Date(etapaInfo.fecha).getTime();
                const nextEtapa = pedido.etapasSecuencia[index + 1];
                const endTime = nextEtapa ? new Date(nextEtapa.fecha).getTime() : new Date().getTime();
                const duration = (endTime - startTime) / (1000 * 60); // minutes

                if (stageTimes[etapaInfo.etapa]) {
                    stageTimes[etapaInfo.etapa].push(duration);
                }
            });
        });

        const stageAvgTimes = Object.entries(stageTimes).map(([stage, times]) => ({
            stage,
            avgTime: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
            count: times.length
        })).filter(s => s.count > 0).sort((a, b) => b.avgTime - a.avgTime);

        return {
            labels: stageAvgTimes.map(s => s.stage.replace('IMPRESION_', '').replace('POST_', '')),
            datasets: [{
                label: 'Tiempo Promedio (min)',
                data: stageAvgTimes.map(s => s.avgTime),
                backgroundColor: 'rgba(147, 51, 234, 0.7)',
            }]
        };
    }, [pedidos]);

    // Monthly Trends Data
    const monthlyTrendsData = useMemo(() => {
        const monthlyData: { [key: string]: { completed: number; created: number } } = {};
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        // Initialize months
        for (let i = 0; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            const key = date.toISOString().slice(0, 7); // YYYY-MM
            monthlyData[key] = { completed: 0, created: 0 };
        }

        pedidos.forEach(pedido => {
            const createdMonth = new Date(pedido.fechaCreacion).toISOString().slice(0, 7);
            if (monthlyData[createdMonth]) {
                monthlyData[createdMonth].created++;
            }

            if (pedido.etapaActual === Etapa.COMPLETADO || pedido.etapaActual === Etapa.ARCHIVADO) {
                const completedDate = pedido.etapasSecuencia.slice(-1)[0]?.fecha;
                if (completedDate) {
                    const completedMonth = new Date(completedDate).toISOString().slice(0, 7);
                    if (monthlyData[completedMonth]) {
                        monthlyData[completedMonth].completed++;
                    }
                }
            }
        });

        const labels = Object.keys(monthlyData).sort();
        return {
            labels: labels.map(label => {
                const [year, month] = label.split('-');
                return `${month}/${year.slice(2)}`;
            }),
            datasets: [
                {
                    label: 'Pedidos Creados',
                    data: labels.map(label => monthlyData[label].created),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                },
                {
                    label: 'Pedidos Completados',
                    data: labels.map(label => monthlyData[label].completed),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                }
            ]
        };
    }, [pedidos]);

    // User Performance Data
    const userPerformanceData = useMemo(() => {
        const userStats: { [key: string]: { actions: number; orders: Set<string> } } = {};

        auditLog.forEach(log => {
            if (!userStats[log.userRole]) {
                userStats[log.userRole] = { actions: 0, orders: new Set() };
            }
            userStats[log.userRole].actions++;

            // Extract order number from action if possible
            const orderMatch = log.action.match(/#(\w+)/);
            if (orderMatch) {
                userStats[log.userRole].orders.add(orderMatch[1]);
            }
        });

        const labels = Object.keys(userStats);
        return {
            labels,
            datasets: [{
                label: 'Acciones Realizadas',
                data: labels.map(user => userStats[user].actions),
                backgroundColor: 'rgba(245, 158, 11, 0.7)',
            }]
        };
    }, [auditLog]);

    // Client Analysis Data
    const clientAnalysisData = useMemo(() => {
        const clientStats: { [key: string]: { orders: number; totalMetros: number } } = {};

        pedidos.forEach(pedido => {
            if (!clientStats[pedido.cliente]) {
                clientStats[pedido.cliente] = { orders: 0, totalMetros: 0 };
            }
            clientStats[pedido.cliente].orders++;
            clientStats[pedido.cliente].totalMetros += typeof pedido.metros === 'number' ? pedido.metros : 0;
        });

        const topClients = Object.entries(clientStats)
            .sort(([,a], [,b]) => b.orders - a.orders)
            .slice(0, 10);

        return {
            labels: topClients.map(([client]) => client.length > 15 ? client.slice(0, 15) + '...' : client),
            datasets: [{
                label: 'Pedidos por Cliente',
                data: topClients.map(([,stats]) => stats.orders),
                backgroundColor: 'rgba(236, 72, 153, 0.7)',
            }]
        };
    }, [pedidos]);

    // Stage Status Data
    const stageStatusData = useMemo(() => {
        const materialNoDisponible = pedidos.filter(p => 
            p.etapaActual === Etapa.PREPARACION && p.materialDisponible === false
        ).length;

        const pendienteCliche = pedidos.filter(p => 
            p.etapaActual === Etapa.PREPARACION && p.clicheDisponible === false
        ).length;

        const etapasProduccion = [
            { key: Etapa.PENDIENTE, label: 'Pendiente', count: pedidos.filter(p => p.etapaActual === Etapa.PENDIENTE).length },
            { key: Etapa.IMPRESION_WM1, label: 'Impresión WM1', count: pedidos.filter(p => p.etapaActual === Etapa.IMPRESION_WM1).length },
            { key: Etapa.IMPRESION_GIAVE, label: 'Impresión GIAVE', count: pedidos.filter(p => p.etapaActual === Etapa.IMPRESION_GIAVE).length },
            { key: Etapa.IMPRESION_WM3, label: 'Impresión WM3', count: pedidos.filter(p => p.etapaActual === Etapa.IMPRESION_WM3).length },
            { key: Etapa.IMPRESION_ANON, label: 'Impresión ANON', count: pedidos.filter(p => p.etapaActual === Etapa.IMPRESION_ANON).length },
            { key: Etapa.POST_LAMINACION_SL2, label: 'Post Laminación SL2', count: pedidos.filter(p => p.etapaActual === Etapa.POST_LAMINACION_SL2).length },
            { key: Etapa.POST_LAMINACION_NEXUS, label: 'Post Laminación NEXUS', count: pedidos.filter(p => p.etapaActual === Etapa.POST_LAMINACION_NEXUS).length },
            { key: Etapa.POST_REBOBINADO_S2DT, label: 'Post Rebobinado S2DT', count: pedidos.filter(p => p.etapaActual === Etapa.POST_REBOBINADO_S2DT).length },
            { key: Etapa.POST_REBOBINADO_PROSLIT, label: 'Post Rebobinado PROSLIT', count: pedidos.filter(p => p.etapaActual === Etapa.POST_REBOBINADO_PROSLIT).length },
            { key: Etapa.POST_PERFORACION_MIC, label: 'Post Perforación MIC', count: pedidos.filter(p => p.etapaActual === Etapa.POST_PERFORACION_MIC).length },
            { key: Etapa.POST_PERFORACION_MAC, label: 'Post Perforación MAC', count: pedidos.filter(p => p.etapaActual === Etapa.POST_PERFORACION_MAC).length },
            { key: Etapa.POST_REBOBINADO_TEMAC, label: 'Post Rebobinado TEMAC', count: pedidos.filter(p => p.etapaActual === Etapa.POST_REBOBINADO_TEMAC).length },
        ];

        const antivahoPendiente = pedidos.filter(p => {
            const etapasPost = [
                Etapa.POST_LAMINACION_SL2, Etapa.POST_LAMINACION_NEXUS,
                Etapa.POST_REBOBINADO_S2DT, Etapa.POST_REBOBINADO_PROSLIT,
                Etapa.POST_PERFORACION_MIC, Etapa.POST_PERFORACION_MAC,
                Etapa.POST_REBOBINADO_TEMAC
            ];
            return etapasPost.includes(p.etapaActual) && p.antivahoRealizado === false;
        }).length;

        return {
            materialNoDisponible,
            pendienteCliche,
            etapasProduccion,
            antivahoPendiente
        };
    }, [pedidos]);

    return (
        <main className="flex-grow p-4 md:p-8 space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pedidos</h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpiData.totalPedidos}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completados</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{kpiData.completados}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">En Proceso</h3>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{kpiData.enProceso}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</h3>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{kpiData.pendientes}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">% A Tiempo</h3>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{kpiData.onTimePercentage}%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tiempo Promedio</h3>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{kpiData.avgRealTime}min</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Urgent Orders & Audit Log */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Urgent Orders */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-red-500 dark:text-red-400 mb-4">Pedidos Urgentes Activos</h2>
                        {urgentPedidos.length > 0 ? (
                             <ul className="space-y-3">
                                {urgentPedidos.map(p => (
                                    <li key={p.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                                        <p className="font-semibold text-gray-800 dark:text-white">{p.numeroPedidoCliente}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{p.cliente}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">No hay pedidos urgentes activos.</p>
                        )}
                    </div>
                    {/* Audit Log */}
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-indigo-500 dark:text-indigo-400 mb-4">Registro de Auditoría</h2>
                        <div className="h-96 overflow-y-auto pr-2">
                             <ul className="space-y-3 text-sm">
                                {auditLog.map((log, index) => (
                                    <li key={index} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                        <p className="font-mono text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold text-teal-600 dark:text-teal-400">{log.userRole}</span>: {log.action}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                {/* Performance Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-blue-500 dark:text-blue-400 mb-4">Análisis Plan vs. Real (Últimos 10 Completados)</h2>
                     <div className="h-[500px] w-full">
                         <BarChart data={performanceChartData} />
                     </div>
                </div>
            </div>

            {/* Additional Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Stage Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-purple-500 dark:text-purple-400 mb-4">Análisis de Etapas (Cuellos de Botella)</h2>
                    <div className="h-[400px] w-full">
                        <BarChart data={stageAnalysisData} />
                    </div>
                </div>

                {/* Monthly Trends */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-cyan-500 dark:text-cyan-400 mb-4">Tendencias Mensuales</h2>
                    <div className="h-[400px] w-full">
                        <LineChart data={monthlyTrendsData} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Performance */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-amber-500 dark:text-amber-400 mb-4">Rendimiento por Usuario</h2>
                    <div className="h-[400px] w-full">
                        <BarChart data={userPerformanceData} />
                    </div>
                </div>

                {/* Client Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-pink-500 dark:text-pink-400 mb-4">Análisis por Cliente (Top 10)</h2>
                    <div className="h-[400px] w-full">
                        <BarChart data={clientAnalysisData} />
                    </div>
                </div>
            </div>

            {/* Stage Status Report */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Reporte de Estado de Etapas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Material No Disponible */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Material No Disponible</h3>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stageStatusData.materialNoDisponible}</p>
                    </div>

                    {/* Pendiente Cliché */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Pendiente Cliché</h3>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stageStatusData.pendienteCliche}</p>
                    </div>

                    {/* Antivaho Pendiente */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Antivaho Pendiente</h3>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stageStatusData.antivahoPendiente}</p>
                    </div>
                </div>

                {/* Production Stages Breakdown */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Desglose por Etapa de Producción</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stageStatusData.etapasProduccion.map(etapa => (
                            <div key={etapa.key} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-800 dark:text-white">{etapa.label}</h4>
                                <p className="text-xl font-bold text-gray-900 dark:text-gray-300">{etapa.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stage Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Material No Disponible</h3>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stageStatusData.materialNoDisponible}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendiente Cliché</h3>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stageStatusData.pendienteCliche}</p>
                </div>
                {stageStatusData.etapasProduccion.map((etapa) => (
                    <div key={etapa.key} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{etapa.label}</h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{etapa.count}</p>
                    </div>
                ))}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Antivaho Pendiente</h3>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stageStatusData.antivahoPendiente}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Urgent Orders & Audit Log */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Urgent Orders */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-red-500 dark:text-red-400 mb-4">Pedidos Urgentes Activos</h2>
                        {urgentPedidos.length > 0 ? (
                             <ul className="space-y-3">
                                {urgentPedidos.map(p => (
                                    <li key={p.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                                        <p className="font-semibold text-gray-800 dark:text-white">{p.numeroPedidoCliente}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{p.cliente}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">No hay pedidos urgentes activos.</p>
                        )}
                    </div>
                    {/* Audit Log */}
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-indigo-500 dark:text-indigo-400 mb-4">Registro de Auditoría</h2>
                        <div className="h-96 overflow-y-auto pr-2">
                             <ul className="space-y-3 text-sm">
                                {auditLog.map((log, index) => (
                                    <li key={index} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                        <p className="font-mono text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold text-teal-600 dark:text-teal-400">{log.userRole}</span>: {log.action}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                {/* Performance Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-blue-500 dark:text-blue-400 mb-4">Análisis Plan vs. Real (Últimos 10 Completados)</h2>
                     <div className="h-[500px] w-full">
                         <BarChart data={performanceChartData} />
                     </div>
                </div>
            </div>

            {/* Additional Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Stage Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-purple-500 dark:text-purple-400 mb-4">Análisis de Etapas (Cuellos de Botella)</h2>
                    <div className="h-[400px] w-full">
                        <BarChart data={stageAnalysisData} />
                    </div>
                </div>

                {/* Monthly Trends */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-cyan-500 dark:text-cyan-400 mb-4">Tendencias Mensuales</h2>
                    <div className="h-[400px] w-full">
                        <LineChart data={monthlyTrendsData} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Performance */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-amber-500 dark:text-amber-400 mb-4">Rendimiento por Usuario</h2>
                    <div className="h-[400px] w-full">
                        <BarChart data={userPerformanceData} />
                    </div>
                </div>

                {/* Client Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-pink-500 dark:text-pink-400 mb-4">Análisis por Cliente (Top 10)</h2>
                    <div className="h-[400px] w-full">
                        <BarChart data={clientAnalysisData} />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ReportView;
