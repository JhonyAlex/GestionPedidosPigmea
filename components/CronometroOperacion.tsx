import React, { useState, useEffect } from 'react';

interface CronometroOperacionProps {
    fechaInicio: string;
}

export function CronometroOperacion({ fechaInicio }: CronometroOperacionProps) {
    const [tiempoTranscurrido, setTiempoTranscurrido] = useState('00:00:00');

    useEffect(() => {
        const calcularTiempo = () => {
            const inicio = new Date(fechaInicio).getTime();
            const ahora = Date.now();
            const diferencia = Math.floor((ahora - inicio) / 1000); // segundos

            const horas = Math.floor(diferencia / 3600);
            const minutos = Math.floor((diferencia % 3600) / 60);
            const segundos = diferencia % 60;

            setTiempoTranscurrido(
                `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
            );
        };

        calcularTiempo();
        const interval = setInterval(calcularTiempo, 1000);

        return () => clearInterval(interval);
    }, [fechaInicio]);

    return (
        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg">
            <span className="text-green-600 dark:text-green-400 animate-pulse">⏱️</span>
            <span className="font-mono font-bold text-lg text-green-700 dark:text-green-300">
                {tiempoTranscurrido}
            </span>
        </div>
    );
}
