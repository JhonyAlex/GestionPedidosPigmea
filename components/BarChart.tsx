
import React from 'react';

interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string | ((value: number, index: number) => string);
    }[];
}

interface BarChartProps {
    data: ChartData;
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
    if (!data.labels || data.labels.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No hay datos para mostrar.</div>;
    }

    const maxValue = Math.max(...data.datasets.flatMap(ds => ds.data));
    const yAxisSteps = 5;
    const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => 
        Math.round((maxValue / yAxisSteps) * i)
    );

    return (
        <div className="w-full h-full flex flex-col p-4 bg-gray-900/50 rounded-lg">
            {/* Legend */}
            <div className="flex justify-center gap-4 mb-4 text-xs">
                <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-blue-500/70 mr-2"></span>
                    <span>Planificado</span>
                </div>
                 <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-green-500/70 mr-2"></span>
                    <span>Real (A tiempo)</span>
                </div>
                <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-red-500/70 mr-2"></span>
                    <span>Real (Retrasado)</span>
                </div>
            </div>

            <div className="flex-grow flex">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between text-xs text-gray-400 pr-4 text-right">
                    {yAxisLabels.reverse().map(label => <span key={label}>{label}</span>)}
                </div>
                
                {/* Chart Area */}
                <div className="w-full grid grid-cols-10 gap-2 border-l border-gray-700 pl-4 relative">
                     {/* Y-Axis Grid Lines */}
                    {yAxisLabels.slice(1).map((_, index) => (
                        <div key={index} className="col-span-10 border-t border-gray-700/50 absolute w-full" style={{ bottom: `${(index + 1) * (100 / yAxisSteps)}%` }}></div>
                    ))}
                    
                    {/* Bars */}
                    {data.labels.map((label, index) => (
                        <div key={label} className="col-span-1 flex flex-col items-center justify-end relative h-full">
                            <div className="w-full flex justify-around items-end gap-1 h-full">
                                {data.datasets.map(dataset => {
                                    const value = dataset.data[index];
                                    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                                    const color = typeof dataset.backgroundColor === 'function' 
                                        ? dataset.backgroundColor(value, index) 
                                        : dataset.backgroundColor;
                                    return (
                                        <div 
                                            key={dataset.label} 
                                            className="w-full rounded-t-sm hover:opacity-80 transition-opacity" 
                                            style={{ height: `${height}%`, backgroundColor: color }}
                                            title={`${dataset.label}: ${value} min`}
                                        ></div>
                                    );
                                })}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 transform -rotate-45 whitespace-nowrap">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BarChart;
