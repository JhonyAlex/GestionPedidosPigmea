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
    const maxVisibleDates = 12; // Máximo de fechas visibles sin scroll
    const needsScroll = totalLabels > maxVisibleDates;
    const minWidthPerLabel = needsScroll ? 60 : 0; // 60px mínimo por etiqueta cuando hay scroll

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
                {needsScroll && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        Desliza para ver más
                    </div>
                )}
            </div>

            <style>{`
                .scrollbar-thin::-webkit-scrollbar {
                    height: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #9ca3af;
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #6b7280;
                }
                @media (prefers-color-scheme: dark) {
                    .scrollbar-thin::-webkit-scrollbar-track {
                        background: #374151;
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb {
                        background: #6b7280;
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                        background: #9ca3af;
                    }
                }
            `}</style>

            <div 
                className={`flex-grow flex ${needsScroll ? 'overflow-x-auto overflow-y-visible scrollbar-thin' : ''}`}
                style={needsScroll ? {
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#9ca3af #f3f4f6'
                } : {}}
            >
                {/* Y-Axis */}
                <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-4 text-right">
                    {yAxisLabels.reverse().map(label => <span key={label}>{label}</span>)}
                </div>

                {/* Chart Area */}
                <div 
                    className="relative pl-4"
                    style={{ 
                        width: needsScroll ? `${totalLabels * minWidthPerLabel}px` : '100%',
                        minWidth: '100%'
                    }}
                >
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
                        {data.labels.map((label, index) => (
                            <span 
                                key={index} 
                                className="transform -rotate-45 whitespace-nowrap origin-top-left"
                                style={{ 
                                    fontSize: needsScroll ? '9px' : (totalLabels > 8 ? '8px' : '9px')
                                }}
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LineChart;
