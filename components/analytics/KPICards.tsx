import React from 'react';
import { AnalyticsSummary } from '../../hooks/useAnalyticsData';
import { formatMetros } from '../../utils/date';
import InfoTooltip from '../InfoTooltip';

interface KPICardsProps {
    summary: AnalyticsSummary;
    loading?: boolean;
}

interface KPICardData {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    colorClass: string;
    tooltip: string; // Explicación de cómo se calcula
    trend?: {
        value: string;
        isPositive: boolean;
    };
}

export const KPICards: React.FC<KPICardsProps> = ({ summary, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    const cards: KPICardData[] = [
        {
            title: 'Total Pedidos',
            value: Number(summary.total_pedidos || 0).toLocaleString('es-ES'),
            subtitle: `${Number(summary.pedidos_completados || 0)} completados`,
            tooltip: 'Cuenta total de pedidos que coinciden con los filtros aplicados (rango de fechas, etapas, máquinas, etc.).',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            colorClass: 'from-blue-500 to-blue-600'
        },
        {
            title: 'Metros Producidos',
            value: formatMetros(summary.metros_totales),
            subtitle: 'metros totales',
            tooltip: 'Suma de todos los metros producidos en los pedidos filtrados. Se obtiene del campo "metros" de cada pedido.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            colorClass: 'from-green-500 to-green-600'
        },
        {
            title: 'Metros Promedio',
            value: formatMetros(summary.metros_promedio),
            subtitle: 'por pedido',
            tooltip: 'Promedio aritmético de metros por pedido. Calculado como: Metros Totales ÷ Total de Pedidos.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            colorClass: 'from-teal-500 to-teal-600'
        },
        {
            title: 'Horas Totales',
            value: Number(summary.tiempo_total_horas || 0).toFixed(1),
            subtitle: 'horas de producción',
            tooltip: 'Suma total de horas de producción. Se usa el campo "tiempoProduccionDecimal" o se convierte "tiempoProduccionPlanificado" a horas decimales.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            colorClass: 'from-purple-500 to-purple-600'
        },
        {
            title: 'Tiempo Promedio',
            value: Number(summary.tiempo_promedio_horas || 0).toFixed(2),
            subtitle: 'horas por pedido',
            tooltip: 'Promedio de horas de producción por pedido. Calculado como: Horas Totales ÷ Total de Pedidos.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            colorClass: 'from-indigo-500 to-indigo-600'
        },
        {
            title: 'Tasa Completados',
            value: Number(summary.total_pedidos || 0) > 0 
                ? `${((Number(summary.pedidos_completados || 0) / Number(summary.total_pedidos || 1)) * 100).toFixed(1)}%`
                : '0%',
            subtitle: `${Number(summary.pedidos_completados || 0)}/${Number(summary.total_pedidos || 0)}`,
            tooltip: 'Porcentaje de pedidos completados del total. Calculado como: (Pedidos Completados ÷ Total Pedidos) × 100.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            colorClass: 'from-emerald-500 to-emerald-600'
        },
        {
            title: 'Pedidos Urgentes',
            value: Number(summary.pedidos_urgentes || 0),
            subtitle: 'prioridad alta',
            tooltip: 'Pedidos marcados con prioridad "URGENTE" o "ALTA" según el campo "prioridad".',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            colorClass: 'from-orange-500 to-orange-600'
        },
        {
            title: 'Pedidos Atrasados',
            value: Number(summary.pedidos_atrasados || 0),
            subtitle: 'requieren atención',
            tooltip: 'Pedidos cuya fecha de entrega (nuevaFechaEntrega o fechaEntrega) es anterior a la fecha actual y NO están en etapa "COMPLETADO" o "ARCHIVADO".',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            colorClass: 'from-red-500 to-red-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
                >
                    <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {card.title}
                                    </p>
                                    <InfoTooltip 
                                        content={card.tooltip}
                                        position="top"
                                        size="sm"
                                    />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {card.value}
                                </p>
                                {card.subtitle && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {card.subtitle}
                                    </p>
                                )}
                            </div>
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${card.colorClass} text-white opacity-90 group-hover:opacity-100 transition-opacity`}>
                                {card.icon}
                            </div>
                        </div>
                        {card.trend && (
                            <div className={`flex items-center text-xs font-medium ${card.trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {card.trend.isPositive ? (
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {card.trend.value}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
