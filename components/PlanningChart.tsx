import React from 'react';
import { WeeklyData } from './PlanningTable';

interface PlanningChartProps {
    data: WeeklyData[];
    machineKeys: string[];
    onBarClick?: (weekLabel: string, machineKey: string) => void;
}

const MACHINE_COLORS: Record<string, string> = {
    'Windmöller 1': '#4f81bd', // Blue (Excel-like)
    'Windmöller 3': '#c0504d', // Red
    'GIAVE': '#f79646', // Orange
    'DNT': '#9bbb59', // Green
    'VARIABLES': '#8064a2', // Purple
    'ANON': '#4bacc6' // Cyan
};

const MACHINE_LABELS: Record<string, string> = {
    'Windmöller 1': 'WH-1',
    'Windmöller 3': 'WH-3',
    'GIAVE': 'SUP GIAVE',
    'DNT': 'DNT',
    'VARIABLES': 'VARIABLES',
    'ANON': 'ANON'
};

export const PlanningChart: React.FC<PlanningChartProps> = ({ data, machineKeys, onBarClick }) => {
    // Determine max value for scaling
    const allValues = data.flatMap(d => Object.values(d.machines));
    const maxValue = Math.max(...allValues, 10);
    const chartHeight = 450; // Increased from 300
    const weekWidth = 140; // Fixed width per week for better spacing
    const chartWidth = Math.max(data.length * weekWidth, 900); // Minimum 900px
    const topPadding = 50; // Espacio para los valores superiores

    // Desired order for bars
    const desiredOrder = ['Windmöller 1', 'VARIABLES', 'Windmöller 3', 'GIAVE', 'DNT', 'ANON'];
    const sortedKeys = [...machineKeys].sort((a, b) => {
        const indexA = desiredOrder.indexOf(a);
        const indexB = desiredOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Carga Semanal por Máquina (Horas)
                </h3>
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded">
                    {data.length} {data.length === 1 ? 'semana' : 'semanas'}
                </div>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-4 mb-6 flex-wrap bg-gray-50 p-4 rounded-lg">
                {sortedKeys.map(key => (
                    <div key={key} className="flex items-center gap-2 px-3 py-1 bg-white rounded-md shadow-sm">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: MACHINE_COLORS[key] || '#ccc' }}></span>
                        <span className="text-sm font-semibold text-gray-700">{MACHINE_LABELS[key] || key}</span>
                    </div>
                ))}
            </div>

            {/* Scrollable Chart Container */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg bg-gray-50 p-4">
                <div className="relative" style={{ width: `${chartWidth}px`, height: `${chartHeight + topPadding + 60}px`, paddingTop: `${topPadding}px`, paddingBottom: '60px' }}>
                    {/* Y-Axis Grid Lines */}
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map(ratio => {
                        const value = (maxValue * (1 - ratio)).toFixed(1);
                        const top = ratio * 100;
                        return (
                            <div key={ratio} className="absolute w-full flex items-center" style={{ top: `calc(${top}% + ${topPadding}px)` }}>
                                <span className="text-sm font-mono font-semibold text-gray-600 bg-white px-2 py-1 rounded shadow-sm w-16 text-right mr-3 -mt-2">
                                    {value}h
                                </span>
                                <div className="flex-1 h-px bg-gray-300" style={{ borderTop: ratio === 1 ? '2px solid #9ca3af' : '1px dashed #d1d5db' }}></div>
                            </div>
                        );
                    })}

                    {/* Bars Area */}
                    <div className="absolute flex items-end ml-20 pl-4 gap-2" style={{ top: `${topPadding}px`, bottom: '60px', left: '0', right: '0' }}>
                        {data.map((weekData, idx) => (
                            <div key={idx} className="flex flex-col items-center h-full justify-end" style={{ width: `${weekWidth - 8}px` }}>
                                {/* Bar Group */}
                                <div className="flex items-end gap-1 h-full w-full justify-center relative">
                                    {sortedKeys.map((key, keyIdx) => {
                                        const value = weekData.machines[key] || 0;
                                        const heightPercent = (value / maxValue) * 100;
                                        
                                        return (
                                            <div key={key} className="relative flex flex-col justify-end h-full group" style={{ width: `${100 / sortedKeys.length}%` }}>
                                                {/* Value Label on Top - Positioned absolutely to avoid overlap */}
                                                {value > 0 && (
                                                    <div 
                                                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-10"
                                                        style={{ 
                                                            bottom: `calc(${Math.max(heightPercent, 3)}% + 4px)`,
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        <div className="relative">
                                                            <span className="text-[10px] font-bold text-gray-700 bg-white px-1.5 py-0.5 rounded shadow-md inline-block border border-gray-200 group-hover:bg-blue-50 group-hover:scale-110 transition-all">
                                                                {value.toFixed(2)}
                                                            </span>
                                                            {/* Small arrow pointing down */}
                                                            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-white"></div>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* The Bar */}
                                                <div 
                                                    className={`w-full rounded-t-md transition-all duration-300 hover:brightness-110 border-2 border-opacity-50 relative ${
                                                        onBarClick ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''
                                                    }`}
                                                    style={{ 
                                                        height: `${Math.max(heightPercent, value > 0 ? 3 : 0)}%`,
                                                        backgroundColor: MACHINE_COLORS[key] || '#ccc',
                                                        borderColor: MACHINE_COLORS[key] || '#ccc',
                                                        minHeight: value > 0 ? '8px' : '0'
                                                    }}
                                                    title={`${MACHINE_LABELS[key]}: ${value.toFixed(2)}h`}
                                                    onClick={() => onBarClick && value > 0 && onBarClick(weekData.label, key)}
                                                ></div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* X-Axis Label */}
                                <div className="mt-3 text-center w-full">
                                    <div className="text-xs font-bold text-gray-700 mb-0.5">
                                        Semana {weekData.week}
                                    </div>
                                    <div className="text-xs text-gray-500 leading-tight">
                                        {weekData.dateRange}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Scroll Hint */}
            {data.length > 6 && (
                <div className="text-center mt-3 text-xs text-gray-500 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Desplázate horizontalmente para ver todas las semanas
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            )}
        </div>
    );
};
