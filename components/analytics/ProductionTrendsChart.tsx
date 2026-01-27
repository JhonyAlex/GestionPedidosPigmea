import React from 'react';
import { TimeSeriesPoint } from '../../hooks/useAnalyticsData';
import LineChart from '../LineChart';
import { formatMetros } from '../../utils/date';

interface ProductionTrendsChartProps {
    data: TimeSeriesPoint[];
    loading?: boolean;
    metricType?: 'metros' | 'pedidos' | 'tiempo';
}

export const ProductionTrendsChart: React.FC<ProductionTrendsChartProps> = ({
    data,
    loading,
    metricType = 'metros'
}) => {
    const [selectedMetric, setSelectedMetric] = React.useState<'metros' | 'pedidos' | 'tiempo'>(metricType);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Tendencias de Producción
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No hay datos disponibles para el período seleccionado
                </div>
            </div>
        );
    }

    // Preparar datos para el gráfico
    const chartLabels: string[] = [];
    const chartValues: number[] = [];

    data.forEach((point) => {
        const date = new Date(point.fecha);
        const label = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });
        chartLabels.push(label);

        let value = 0;
        if (selectedMetric === 'metros') {
            value = Number(point.metros_totales);
        } else if (selectedMetric === 'pedidos') {
            value = Number(point.total_pedidos);
        } else {
            value = Number(point.tiempo_total_horas);
        }
        chartValues.push(value);
    });

    const metricConfig = {
        metros: {
            title: 'Metros Producidos por Día',
            color: '#10b981',
            label: 'Metros'
        },
        pedidos: {
            title: 'Pedidos por Día',
            color: '#3b82f6',
            label: 'Pedidos'
        },
        tiempo: {
            title: 'Horas de Producción por Día',
            color: '#8b5cf6',
            label: 'Horas'
        }
    };

    const config = metricConfig[selectedMetric];

    const chartData = {
        labels: chartLabels,
        datasets: [{
            label: config.label,
            data: chartValues,
            borderColor: config.color,
            backgroundColor: config.color + '20' // Add transparency
        }]
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    {config.title}
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

            <div className="h-80">
                <LineChart data={chartData} />
            </div>

            {/* Summary Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedMetric === 'metros' && formatMetros(chartValues.reduce((sum, v) => sum + v, 0))}
                        {selectedMetric === 'pedidos' && chartValues.reduce((sum, v) => sum + v, 0)}
                        {selectedMetric === 'tiempo' && chartValues.reduce((sum, v) => sum + v, 0).toFixed(1) + ' h'}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Promedio</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedMetric === 'metros' && formatMetros(chartValues.reduce((sum, v) => sum + v, 0) / chartValues.length)}
                        {selectedMetric === 'pedidos' && (chartValues.reduce((sum, v) => sum + v, 0) / chartValues.length).toFixed(1)}
                        {selectedMetric === 'tiempo' && (chartValues.reduce((sum, v) => sum + v, 0) / chartValues.length).toFixed(1) + ' h'}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Días</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {chartValues.length}
                    </p>
                </div>
            </div>
        </div>
    );
};
