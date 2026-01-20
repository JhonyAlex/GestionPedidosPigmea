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
    'Sin Asignar': '#8064a2', // Purple (or use a blue variant)
    'ANON': '#4bacc6' // Cyan
};

const MACHINE_LABELS: Record<string, string> = {
    'Windmöller 1': 'WH-1',
    'Windmöller 3': 'WH-3',
    'GIAVE': 'SUP GIAVE',
    'DNT': 'DNT',
    'Sin Asignar': 'Pedidos VARIABLES',
    'ANON': 'ANON'
};

export const PlanningChart: React.FC<PlanningChartProps> = ({ data, machineKeys, onBarClick }) => {
    // Determine max value for scaling
    const allValues = data.flatMap(d => Object.values(d.machines));
    const maxValue = Math.max(...allValues, 10);
    const chartHeight = 300;

    // Desired order for bars
    const desiredOrder = ['Windmöller 1', 'Sin Asignar', 'Windmöller 3', 'GIAVE', 'DNT', 'ANON'];
    const sortedKeys = [...machineKeys].sort((a, b) => {
        const indexA = desiredOrder.indexOf(a);
        const indexB = desiredOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    return (
        <div className="bg-white p-4 rounded-lg shadow mt-8 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Carga Semanal por Máquina</h3>
            
            {/* Legend */}
            <div className="flex justify-center gap-6 mb-6 flex-wrap">
                {sortedKeys.map(key => (
                    <div key={key} className="flex items-center gap-2">
                        <span className="w-3 h-3 block" style={{ backgroundColor: MACHINE_COLORS[key] || '#ccc' }}></span>
                        <span className="text-xs font-medium text-gray-600">{MACHINE_LABELS[key] || key}</span>
                    </div>
                ))}
            </div>

            <div className="relative min-w-[800px]" style={{ height: `${chartHeight}px` }}>
                {/* Y-Axis Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                    const value = Math.round(maxValue * (1 - ratio));
                    const top = ratio * 100;
                    return (
                        <div key={ratio} className="absolute w-full flex items-center" style={{ top: `${top}%` }}>
                            <span className="text-xs text-gray-400 w-8 text-right mr-2 -mt-2">{value}</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                    );
                })}

                {/* Bars Area */}
                <div className="absolute inset-0 flex items-end ml-10 pl-4 pb-6 justify-between">
                    {data.map((weekData, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                            {/* Bar Group */}
                            <div className="flex items-end gap-[1px] h-full w-full justify-center px-1">
                                {sortedKeys.map(key => {
                                    const value = weekData.machines[key] || 0;
                                    const heightPercent = (value / maxValue) * 100;
                                    
                                    return (
                                        <div key={key} className="relative flex flex-col justify-end w-full max-w-[24px] h-full group/bar">
                                            {/* Value Label on Top */}
                                            {value > 0 && (
                                                <span className="text-[9px] text-center mb-1 font-semibold text-gray-600 w-full overflow-visible whitespace-nowrap -ml-1">
                                                    {value.toFixed(0)}
                                                </span>
                                            )}
                                            {/* The Bar */}
                                            <div 
                                                className={`w-full transition-all duration-500 hover:opacity-80 ${onBarClick ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-400' : ''}`}
                                                style={{ 
                                                    height: `${heightPercent}%`, 
                                                    backgroundColor: MACHINE_COLORS[key] || '#ccc' 
                                                }}
                                                title={`${MACHINE_LABELS[key]}: ${value.toFixed(2)}h`}
                                                onClick={() => onBarClick && onBarClick(weekData.label, key)}
                                            ></div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* X-Axis Label */}
                            <div className="mt-2 text-xs text-center font-medium text-gray-600 leading-tight">
                                <div>{weekData.dateRange}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
