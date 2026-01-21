import React from 'react';
import { formatDateDDMMYYYY } from '../utils/date';

export interface WeeklyData {
    week: number;
    year: number;
    label: string;
    dateRange: string;
    machines: {
        [key: string]: number; // e.g. "Windmöller 1": 120.5
    };
    machinePedidos?: {
        [key: string]: any[]; // Store related orders
    };
    totalCapacity: number;
    totalLoad: number;
    freeCapacity: number;
}

interface PlanningTableProps {
    data: WeeklyData[];
    machineKeys: string[]; // List of machine keys to display columns for
}

const MACHINE_COLUMN_HEADERS: Record<string, string> = {
    'Windmöller 1': 'WH-1',
    'Windmöller 3': 'WH-3',
    'GIAVE': 'SUP GIAVE',
    'DNT': 'DNT',
    'VARIABLES': 'VARIABLES',
};

// Define colors for each machine column header
const MACHINE_COLORS: Record<string, string> = {
    'Windmöller 1': 'bg-blue-900 text-white border-blue-950',      // Azul muy oscuro
    'Windmöller 3': 'bg-blue-800 text-white border-blue-900',      // Azul oscuro
    'GIAVE': 'bg-blue-600 text-white border-blue-700',             // Azul medio
    'DNT': 'bg-blue-500 text-white border-blue-600',               // Azul estándar
    'VARIABLES': 'bg-blue-400 text-white border-blue-500',         // Azul claro
};

export const PlanningTable: React.FC<PlanningTableProps> = ({ data, machineKeys }) => {
    // Sort machine keys to match desired order: WH-1, VARIABLES, WH-3, GIAVE, DNT
    const desiredOrder = ['Windmöller 1', 'VARIABLES', 'Windmöller 3', 'GIAVE', 'DNT'];
    const sortedKeys = [...machineKeys].sort((a, b) => {
        const indexA = desiredOrder.indexOf(a);
        const indexB = desiredOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    // Calculate totals
    const totals: Record<string, number> = {};
    let totalFree = 0;
    
    // Initialize totals
    sortedKeys.forEach(k => totals[k] = 0);
    
    data.forEach(row => {
        sortedKeys.forEach(key => {
            totals[key] += row.machines[key] || 0;
        });
        totalFree += row.freeCapacity;
    });

    return (
        <div className="overflow-x-auto rounded-lg shadow ring-1 ring-black ring-opacity-5">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 border-r border-gray-200">
                            Semana
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">
                            Fechas
                        </th>
                        {sortedKeys.map(key => (
                            <th 
                                key={key} 
                                scope="col" 
                                className={`px-3 py-3.5 text-center text-sm font-bold border-r border-gray-200 ${MACHINE_COLORS[key] || 'bg-gray-100 text-gray-900'}`}
                            >
                                {MACHINE_COLUMN_HEADERS[key] || key}
                            </th>
                        ))}
                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-gray-900 bg-white border-l-2 border-gray-300">
                            LIBRES
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {data.map((row) => (
                        <tr key={`${row.year}-${row.week}`} className={row.freeCapacity < 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900 sm:pl-6 border-r border-gray-200">
                                {row.label}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-r border-gray-200">
                                {row.dateRange}
                            </td>
                            {sortedKeys.map(key => (
                                <td key={key} className="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-900 border-r border-gray-200 font-mono">
                                    {row.machines[key]?.toFixed(2) || '0.00'}
                                </td>
                            ))}
                            <td className={`whitespace-nowrap px-3 py-4 text-sm text-center font-bold border-l-2 border-gray-300 font-mono ${
                                row.freeCapacity < 0 ? 'text-red-600 bg-red-100' : 'text-green-600'
                            }`}>
                                {row.freeCapacity.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <tr>
                        <td colSpan={2} className="py-4 pl-4 pr-3 text-right text-sm text-gray-900 sm:pl-6 border-r border-gray-200">
                            TOTALES:
                        </td>
                        {sortedKeys.map(key => (
                            <td key={key} className="px-3 py-4 text-sm text-center text-gray-900 border-r border-gray-200 font-mono">
                                {totals[key]?.toFixed(2) || '0.00'}
                            </td>
                        ))}
                        <td className={`px-3 py-4 text-sm text-center border-l-2 border-gray-300 font-mono ${totalFree < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {totalFree.toFixed(2)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};
