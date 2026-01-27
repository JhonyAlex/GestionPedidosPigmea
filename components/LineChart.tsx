import React from 'react';

interface LineChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
    }[];
}

interface LineChartProps {
    data: LineChartData;
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
    if (!data.labels || data.labels.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No hay datos para mostrar.</div>;
    }

    const allData = data.datasets.flatMap(ds => ds.data).filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));
    
    if (allData.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No hay datos válidos para mostrar.</div>;
    }
    
    const maxValue = Math.max(...allData);
    const minValue = Math.min(...allData);
    const range = maxValue - minValue || 1;
    const yAxisSteps = 5;
    const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) =>
        Math.round(minValue + (range / yAxisSteps) * i)
    );

    // Determinar cuántas etiquetas mostrar según la cantidad de datos
    const totalLabels = data.labels.length;
    const maxLabelsToShow = 15; // Máximo de etiquetas antes de empezar a reducir
    const labelInterval = totalLabels > maxLabelsToShow ? Math.ceil(totalLabels / maxLabelsToShow) : 1;

    return (
        <div className="w-full h-full flex flex-col p-4 pb-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            {/* Legend */}
            <div className="flex justify-center gap-4 mb-4 text-xs text-gray-600 dark:text-gray-300">
                {data.datasets.map((dataset, index) => (
                    <div key={index} className="flex items-center">
                        <div
                            className="w-3 h-0.5 mr-2"
                            style={{ backgroundColor: dataset.borderColor }}
                        ></div>
                        <span>{dataset.label}</span>
                    </div>
                ))}
            </div>

            <div className="flex-grow flex">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-4 text-right">
                    {yAxisLabels.reverse().map(label => <span key={label}>{label}</span>)}
                </div>

                {/* Chart Area */}
                <div className="w-full relative pl-4">
                    {/* Y-Axis Grid Lines */}
                    {yAxisLabels.slice(1).map((_, index) => (
                        <div key={index} className="border-t border-gray-300/50 dark:border-gray-700/50 absolute w-full" style={{ bottom: `${(index + 1) * (100 / yAxisSteps)}%` }}></div>
                    ))}

                    {/* Lines */}
                    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 100 100`} preserveAspectRatio="none">
                        {data.datasets.map((dataset, datasetIndex) => {
                            const points = dataset.data.map((value, index) => {
                                if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
                                    return null;
                                }
                                const x = data.labels.length > 1 ? (index / (data.labels.length - 1)) * 100 : 50;
                                const y = range > 0 ? 100 - ((value - minValue) / range) * 100 : 50;
                                return `${x},${y}`;
                            }).filter(p => p !== null).join(' ');
                            
                            if (!points) return null;
                            
                            return (
                                <polyline
                                    key={datasetIndex}
                                    fill="none"
                                    stroke={dataset.borderColor}
                                    strokeWidth="0.5"
                                    points={points}
                                />
                            );
                        })}
                    </svg>

                    {/* X-Axis Labels */}
                    <div className="absolute -bottom-6 w-full flex justify-between text-[9px] text-gray-500 dark:text-gray-400">
                        {data.labels.map((label, index) => {
                            // Mostrar solo cada N etiquetas para evitar desbordamiento
                            const shouldShow = index % labelInterval === 0 || index === totalLabels - 1;
                            return (
                                <span 
                                    key={index} 
                                    className={`transform -rotate-45 whitespace-nowrap origin-top-left ${
                                        shouldShow ? 'opacity-100' : 'opacity-0'
                                    }`}
                                    style={{ 
                                        fontSize: totalLabels > 20 ? '7px' : totalLabels > 10 ? '8px' : '9px'
                                    }}
                                >
                                    {label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LineChart;
