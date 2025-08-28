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

    const allData = data.datasets.flatMap(ds => ds.data);
    const maxValue = Math.max(...allData);
    const minValue = Math.min(...allData);
    const range = maxValue - minValue || 1;
    const yAxisSteps = 5;
    const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) =>
        Math.round(minValue + (range / yAxisSteps) * i)
    );

    return (
        <div className="w-full h-full flex flex-col p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
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
                        {data.datasets.map((dataset, datasetIndex) => (
                            <polyline
                                key={datasetIndex}
                                fill="none"
                                stroke={dataset.borderColor}
                                strokeWidth="0.5"
                                points={dataset.data.map((value, index) => {
                                    const x = (index / (data.labels.length - 1)) * 100;
                                    const y = 100 - ((value - minValue) / range) * 100;
                                    return `${x},${y}`;
                                }).join(' ')}
                            />
                        ))}
                    </svg>

                    {/* X-Axis Labels */}
                    <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                        {data.labels.map((label, index) => (
                            <span key={index} className="transform -rotate-45 whitespace-nowrap">{label}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LineChart;
