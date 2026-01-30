import React, { useState } from 'react';
import { VendorMetric, ClientMetric, StageMetric } from '../../hooks/useAnalyticsData';
import { formatMetros, formatDecimalHoursToHHMM } from '../../utils/date';
import InfoTooltip from '../InfoTooltip';

interface RankingsTableProps {
    vendorData: VendorMetric[];
    clientData: ClientMetric[];
    stageData: StageMetric[];
    loading?: boolean;
}

type RankingType = 'vendors' | 'clients' | 'stages';
type SortColumn = 'name' | 'pedidos' | 'metros' | 'tiempo';
type SortDirection = 'asc' | 'desc';

export const RankingsTable: React.FC<RankingsTableProps> = ({
    vendorData,
    clientData,
    stageData,
    loading
}) => {
    const [activeTab, setActiveTab] = useState<RankingType>('vendors');
    const [sortColumn, setSortColumn] = useState<SortColumn>('metros');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const renderSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) {
            return (
                <svg className="w-4 h-4 ml-1 text-gray-400 opacity-0 group-hover:opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }

        return sortDirection === 'asc' ? (
            <svg className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    const sortData = <T extends VendorMetric | ClientMetric | StageMetric>(data: T[]): T[] => {
        return [...data].sort((a, b) => {
            let compareValue = 0;

            switch (sortColumn) {
                case 'name':
                    const nameA = 'vendedor_nombre' in a ? a.vendedor_nombre : 'cliente' in a ? a.cliente : (a as StageMetric).etapa_actual;
                    const nameB = 'vendedor_nombre' in b ? b.vendedor_nombre : 'cliente' in b ? b.cliente : (b as StageMetric).etapa_actual;
                    compareValue = (nameA || '').localeCompare(nameB || '');
                    break;
                case 'pedidos':
                    compareValue = Number(a.total_pedidos) - Number(b.total_pedidos);
                    break;
                case 'metros':
                    compareValue = Number(a.metros_totales) - Number(b.metros_totales);
                    break;
                case 'tiempo':
                    compareValue = Number(a.tiempo_total_horas) - Number(b.tiempo_total_horas);
                    break;
            }

            return sortDirection === 'asc' ? compareValue : -compareValue;
        });
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'vendors' as RankingType, label: 'Vendedores', count: vendorData.length, tooltip: 'Ranking de vendedores ordenados por metros totales producidos. Los datos se agrupan por el campo "vendedorNombre" de cada pedido.' },
        { id: 'clients' as RankingType, label: 'Clientes', count: clientData.length, tooltip: 'Ranking de clientes ordenados por metros totales producidos. Los datos se agrupan por el campo "cliente" de cada pedido.' },
        { id: 'stages' as RankingType, label: 'Etapas', count: stageData.length, tooltip: 'Distribución de pedidos por etapa del proceso. Muestra cuántos pedidos y metros están en cada fase del flujo productivo.' }
    ];

    const renderTable = () => {
        let data: Array<VendorMetric | ClientMetric | StageMetric> = [];
        let nameLabel = '';

        if (activeTab === 'vendors') {
            data = sortData(vendorData);
            nameLabel = 'Vendedor';
        } else if (activeTab === 'clients') {
            data = sortData(clientData);
            nameLabel = 'Cliente';
        } else {
            data = sortData(stageData);
            nameLabel = 'Etapa';
        }

        if (data.length === 0) {
            return (
                <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No hay datos disponibles
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                #
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center">
                                    {nameLabel}
                                    {renderSortIcon('name')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group"
                                onClick={() => handleSort('pedidos')}
                            >
                                <div className="flex items-center justify-end">
                                    Pedidos
                                    {renderSortIcon('pedidos')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group"
                                onClick={() => handleSort('metros')}
                            >
                                <div className="flex items-center justify-end">
                                    Metros
                                    {renderSortIcon('metros')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group"
                                onClick={() => handleSort('tiempo')}
                            >
                                <div className="flex items-center justify-end">
                                    Horas
                                    {renderSortIcon('tiempo')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.map((item, idx) => {
                            const name = 'vendedor_nombre' in item 
                                ? item.vendedor_nombre 
                                : 'cliente' in item 
                                ? item.cliente 
                                : (item as StageMetric).etapa_actual;

                            const isTopThree = idx < 3;

                            return (
                                <tr
                                    key={idx}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                        isTopThree ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                                    }`}
                                >
                                    <td className="px-2 py-3 whitespace-nowrap text-center">
                                        {isTopThree ? (
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                idx === 1 ? 'bg-gray-300 text-gray-800' :
                                                'bg-orange-300 text-orange-900'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {idx + 1}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {isTopThree && (
                                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            )}
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {name || 'Sin especificar'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                                        {Number(item.total_pedidos).toLocaleString('es-ES')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                                        {formatMetros(item.metros_totales)} m
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                                        {formatDecimalHoursToHHMM(Number(item.tiempo_total_horas))}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Rankings de Producción
                    <InfoTooltip 
                        content="Tablas comparativas de rendimiento. Alterna entre rankings de Vendedores, Clientes y Etapas. Haz clic en las columnas para ordenar por diferentes métricas."
                        position="right"
                    />
                </h3>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${
                                activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab.label}
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                activeTab === tab.id
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                                {tab.count}
                            </span>
                            {activeTab === tab.id && (
                                <InfoTooltip 
                                    content={tab.tooltip}
                                    position="bottom"
                                    size="sm"
                                />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {renderTable()}
        </div>
    );
};
