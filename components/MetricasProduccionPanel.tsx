import React from 'react';
import { EstadisticasOperador } from '../types';
import { formatMetros } from '../utils/date';

interface MetricasProduccionPanelProps {
    estadisticas: EstadisticasOperador;
}

export function MetricasProduccionPanel({ estadisticas }: MetricasProduccionPanelProps) {
    const formatearTiempo = (segundos: number) => {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        
        if (horas > 0) {
            return `${horas}h ${minutos}m`;
        }
        return `${minutos}m`;
    };

    const metricas = [
        {
            titulo: 'Operaciones Hoy',
            valor: estadisticas.totalOperaciones,
            icon: '📋',
            color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
        },
        {
            titulo: 'Completadas',
            valor: estadisticas.operacionesCompletadas,
            icon: '✅',
            color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
        },
        {
            titulo: 'En Progreso',
            valor: estadisticas.operacionesEnProgreso,
            icon: '🔧',
            color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
        },
        {
            titulo: 'Pausadas',
            valor: estadisticas.operacionesPausadas,
            icon: '⏸️',
            color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700'
        },
        {
            titulo: 'Metros Producidos',
            valor: `${formatMetros(estadisticas.metrosProducidosHoy)} m`,
            icon: '📏',
            color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
        },
        {
            titulo: 'Tiempo Trabajado',
            valor: formatearTiempo(estadisticas.tiempoTrabajadoSegundos),
            icon: '⏱️',
            color: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
        }
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📊</span>
                Métricas del Día - {estadisticas.operadorNombre}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {metricas.map((metrica, index) => (
                    <div
                        key={index}
                        className={`${metrica.color} border rounded-lg p-4 transition-transform hover:scale-105`}
                    >
                        <div className="text-2xl mb-2">{metrica.icon}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {metrica.titulo}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {metrica.valor}
                        </p>
                    </div>
                ))}
            </div>

            {/* Promedio de tiempo por operación */}
            {estadisticas.tiempoPromedioOperacion > 0 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Tiempo promedio por operación:
                        <span className="ml-2 font-bold text-gray-900 dark:text-white">
                            {formatearTiempo(estadisticas.tiempoPromedioOperacion)}
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
}
