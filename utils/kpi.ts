
import { Pedido, EtapaInfo, Etapa } from '../types';

const ETAPAS_PRODUCCION = [Etapa.IMPRESION, Etapa.LAMINADO, Etapa.CORTE];

/**
 * Parses a time string in HH:mm format to total minutes.
 * @param timeStr The time string, e.g., "04:30".
 * @returns Total minutes.
 */
export const parseTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
        return 0;
    }
    return hours * 60 + minutes;
};

/**
 * Formats total minutes into a HH:mm string format.
 * @param totalMinutes The total minutes.
 * @returns A string in HH:mm format.
 */
export const formatMinutesToHHMM = (totalMinutes: number): string => {
    if (totalMinutes < 0) totalMinutes = 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};


/**
 * Calculates the total real production time in minutes for an order.
 * It sums the time spent in production stages based on the `etapasSecuencia` timeline.
 * If the order is currently in a production stage, it calculates the time up to now.
 * @param pedido The order object.
 * @returns Total production time in minutes.
 */
export const calcularTiempoRealProduccion = (pedido: Pedido): number => {
    let totalMinutes = 0;
    const sortedTimeline = [...pedido.etapasSecuencia].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    for (let i = 0; i < sortedTimeline.length; i++) {
        const currentStageInfo = sortedTimeline[i];
        
        // Only calculate time for production stages
        if (ETAPAS_PRODUCCION.includes(currentStageInfo.etapa)) {
            const startTime = new Date(currentStageInfo.fecha).getTime();
            let endTime: number;

            // Find the next stage to determine the end time
            const nextStageInfo = sortedTimeline[i + 1];

            if (nextStageInfo) {
                endTime = new Date(nextStageInfo.fecha).getTime();
            } else {
                // If it's the last stage in the timeline and it's a production one,
                // it means the order is currently in this stage. Calculate up to now.
                endTime = new Date().getTime();
            }

            const durationMillis = endTime - startTime;
            totalMinutes += durationMillis / (1000 * 60);
        }
    }

    return Math.round(totalMinutes);
};
