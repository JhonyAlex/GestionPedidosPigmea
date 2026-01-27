import React from 'react';
import { MachineMetric } from '../../hooks/useAnalyticsData';
import BarChart from '../BarChart';
import { formatMetros } from '../../utils/date';
import InfoTooltip from '../InfoTooltip';

interface MachinePerformanceChartProps {
    data: MachineMetric[];
    loading?: boolean;
}

export const MachinePerformanceChart: React.FC<MachinePerformanceChartProps> = ({
    data,
    loading
}) => {
    const [selectedMetric, setSelectedMetric] = React.useState<'metros' | 'pedidos' | 'tiempo'>('metros');

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Rendimiento por Máquina
                </h3>
                <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No hay datos disponibles
                </div>
            </div>
        );
    }

    // Mapeo de colores por máquina (siguiendo el patrón de ReportView)
    const machineColors: Record<string, string> = {
        'Windmöller 1': '#1e3a8a', // blue-900
        'Windmöller 3': '#7f1d1d', // red-900
        'GIAVE': '#7c2d12', // orange-900
        'DNT': '#14532d', // green-900
        'VARIABLES': '#581c87', // purple-900
        'ANON': '#44403c', // stone-700
    };

    // Preparar datos para el gráfico
    const sortedMachines = data
        .filter(m => m.maquina_impresion)
        .sort((a, b) => {
            const aValue = selectedMetric === 'metros' ? Number(a.metros_totales) :
                          selectedMetric === 'pedidos' ? Number(a.total_pedidos) :
                          Number(a.tiempo_total_horas);
            const bValue = selectedMetric === 'metros' ? Number(b.metros_totales) :
                          selectedMetric === 'pedidos' ? Number(b.total_pedidos) :
                          Number(b.tiempo_total_horas);
            return bValue - aValue;
        });

    const chartLabels = sortedMachines.map(m => m.maquina_impresion || 'Sin asignar');
    const chartValues = sortedMachines.map(m => {
        if (selectedMetric === 'metros') {
            return Number(m.metros_totales);
        } else if (selectedMetric === 'pedidos') {
            return Number(m.total_pedidos);
        } else {
            return Number(m.tiempo_total_horas);
        }
    });

    const chartColors = sortedMachines.map(m => machineColors[m.maquina_impresion] || '#6b7280');

    const metricConfig = {
        metros: {
            title: 'Metros Producidos por Máquina',
            label: 'Metros'
        },
        pedidos: {
            title: 'Pedidos por Máquina',
            label: 'Pedidos'
        },
        tiempo: {
            title: 'Horas de Producción por Máquina',
            label: 'Horas'
        }
    };

    const config = metricConfig[selectedMetric];

    const chartData = {
        labels: chartLabels,
        datasets: [{
            label: config.label,
            data: chartValues,
            backgroundColor: (value: number, index: number) => chartColors[index]
        }]
    };

    // Calcular totales
    const totals = data.reduce(
        (acc, machine) => ({
            metros: acc.metros + Number(machine.metros_totales),
            pedidos: acc.pedidos + Number(machine.total_pedidos),
            tiempo: acc.tiempo + Number(machine.tiempo_total_horas)
        }),
        { metros: 0, pedidos: 0, tiempo: 0 }
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    {config.title}
                    <InfoTooltip 
                        content="Gráfico de barras que compara el rendimiento entre máquinas. Los datos se ordenan de mayor a menor según la métrica seleccionada. Incluye WM1, WM3, GIAVE, DNT y VARIABLES."
                        position="right"
                    />
                </h3>

                {/* Metric Selector */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedMetric('metros')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            selectedMetric === 'metros'
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Metros
                    </button>
                    <button
                        onClick={() => setSelectedMetric('pedidos')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            selectedMetric === 'pedidos'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Pedidos
                    </button>
                    <button
                        onClick={() => setSelectedMetric('tiempo')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            selectedMetric === 'tiempo'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Tiempo
                    </button>
                </div>
            </div>

            <div className="h-80 mb-4">
                <BarChart data={chartData} />
            </div>

            {/* Detailed Stats Table */}
            <div className="overflow-x-auto">
                <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Resumen Detallado</h4>
                    <InfoTooltip 
                        content="Tabla con todas las métricas por máquina, ordenada por metros producidos. El porcentaje indica la participación sobre el total de metros producidos."
                        position="right"
                        size="sm"
                    />
                </div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Máquina
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Pedidos
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Metros
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Horas
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                % del Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data
                            .filter(m => m.maquina_impresion)
                            .sort((a, b) => Number(b.metros_totales) - Number(a.metros_totales))
                            .map((machine, idx) => {
                                const percentage = totals.metros > 0 
                                    ? (Number(machine.metros_totales) / totals.metros * 100).toFixed(1)
                                    : '0';
                                
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-sm"
                                                    style={{ backgroundColor: machineColors[machine.maquina_impresion] || '#6b7280' }}
                                                ></div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {machine.maquina_impresion || 'Sin asignar'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                                            {Number(machine.total_pedidos).toLocaleString('es-ES')}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                                            {formatMetros(machine.metros_totales)} m
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                                            {Number(machine.tiempo_total_horas).toFixed(1)} h
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                                            {percentage}%
                                        </td>
                                    </tr>
                                );
                            })}
                        <tr className="bg-gray-100 dark:bg-gray-900 font-bold">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                TOTAL
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                                {Number(totals.pedidos || 0).toLocaleString('es-ES')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                                {formatMetros(totals.metros)} m
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                                {Number(totals.tiempo || 0).toFixed(1)} h
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                                100%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
