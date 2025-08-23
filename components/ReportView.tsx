
import React, { useMemo } from 'react';
import { Pedido, Prioridad, Etapa, AuditEntry } from '../types';
import { parseTimeToMinutes, calcularTiempoRealProduccion } from '../utils/kpi';
import BarChart from './BarChart';

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
            labels: completed.map(p => p.numeroPedido),
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

    return (
        <main className="flex-grow p-4 md:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Urgent Orders & Audit Log */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Urgent Orders */}
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-red-400 mb-4">Pedidos Urgentes Activos</h2>
                        {urgentPedidos.length > 0 ? (
                             <ul className="space-y-3">
                                {urgentPedidos.map(p => (
                                    <li key={p.id} className="p-3 bg-gray-700 rounded-md">
                                        <p className="font-semibold text-white">{p.numeroPedido}</p>
                                        <p className="text-sm text-gray-300">{p.cliente}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No hay pedidos urgentes activos.</p>
                        )}
                    </div>
                    {/* Audit Log */}
                     <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-indigo-400 mb-4">Registro de Auditoría</h2>
                        <div className="h-96 overflow-y-auto pr-2">
                             <ul className="space-y-3 text-sm">
                                {auditLog.map((log, index) => (
                                    <li key={index} className="p-3 bg-gray-900/50 rounded-md">
                                        <p className="font-mono text-gray-300">
                                            <span className="font-semibold text-teal-400">{log.userRole}</span>: {log.action}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                {/* Performance Chart */}
                <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-blue-400 mb-4">Análisis Plan vs. Real (Últimos 10 Completados)</h2>
                     <div className="h-[500px] w-full">
                         <BarChart data={performanceChartData} />
                     </div>
                </div>
            </div>
        </main>
    );
};

export default ReportView;
