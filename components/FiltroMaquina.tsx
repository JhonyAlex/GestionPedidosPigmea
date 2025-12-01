import React from 'react';

interface Maquina {
    id: string;
    nombre: string;
    icon: string;
}

interface FiltroMaquinaProps {
    maquinas: Maquina[];
    maquinaSeleccionada: string;
    onSeleccionar: (maquinaId: string) => void;
}

export function FiltroMaquina({ maquinas, maquinaSeleccionada, onSeleccionar }: FiltroMaquinaProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Filtrar por Máquina
            </h3>
            <div className="flex flex-wrap gap-2">
                {maquinas.map(maquina => (
                    <button
                        key={maquina.id}
                        onClick={() => onSeleccionar(maquina.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all transform active:scale-95 
                            ${maquinaSeleccionada === maquina.id
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        <span className="mr-2">{maquina.icon}</span>
                        {maquina.nombre}
                    </button>
                ))}
            </div>
        </div>
    );
}
