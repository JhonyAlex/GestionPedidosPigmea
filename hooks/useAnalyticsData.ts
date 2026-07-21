import { useState, useEffect, useCallback } from 'react';
import { DateFilterOption } from '../utils/date';

export interface AnalyticsSummary {
    total_pedidos: number;
    pedidos_completados: number;
    metros_totales: number;
    metros_promedio: number;
    tiempo_total_horas: number;
    tiempo_promedio_horas: number;
    pedidos_urgentes: number;
    pedidos_atrasados: number;
}

export interface MachineMetric {
    maquina_impresion: string;
    total_pedidos: number;
    metros_totales: number;
    tiempo_total_horas: number;
}

export interface StageMetric {
    etapa_actual: string;
    total_pedidos: number;
    metros_totales: number;
    tiempo_total_horas: number;
}

export interface VendorMetric {
    vendedor_nombre: string;
    total_pedidos: number;
    metros_totales: number;
    tiempo_total_horas: number;
}

export interface ClientMetric {
    cliente: string;
    total_pedidos: number;
    metros_totales: number;
    tiempo_total_horas: number;
}

export interface TimeSeriesPoint {
    fecha: string;
    total_pedidos: number;
    metros_totales: number;
    tiempo_total_horas: number;
}

export interface AnalyticsData {
    summary: AnalyticsSummary;
    byMachine: MachineMetric[];
    byStage: StageMetric[];
    topVendors: VendorMetric[];
    topClients: ClientMetric[];
    timeSeries: TimeSeriesPoint[];
}

export interface AnalyticsFilters {
    dateFilter: DateFilterOption;
    dateField: string;
    startDate?: string;
    endDate?: string;
    stages?: string[];
    machines?: string[];
    vendors?: string[];
    clients?: string[];
    priority?: string;
    semanas?: string[];
}

const API_BASE = ''; // URL relativa — Vite proxy en dev, servidor real en prod
const ALLOWED_DATE_FILTERS: DateFilterOption[] = ['all', 'this-week', 'last-week', 'next-week', 'this-month', 'last-month', 'next-month', 'custom'];
const ALLOWED_DATE_FIELDS = new Set(['fechaCreacion', 'fechaEntrega', 'nuevaFechaEntrega', 'fechaFinalizacion', 'compraCliche', 'recepcionCliche']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?)?$/;

const getAuthHeaders = () => {
    const savedUser = localStorage.getItem('pigmea_user');
    const user = savedUser ? JSON.parse(savedUser) : null;

    return {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || '',
        'x-user-role': user?.role || 'OPERATOR'
    };
};

export const useAnalyticsData = (filters: AnalyticsFilters) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (!ALLOWED_DATE_FILTERS.includes(filters.dateFilter)) {
                throw new Error(`Filtro de fecha inválido: ${filters.dateFilter}`);
            }

            if (!ALLOWED_DATE_FIELDS.has(filters.dateField)) {
                throw new Error(`Campo de fecha inválido: ${filters.dateField}`);
            }

            if (filters.dateFilter !== 'all' && (!filters.semanas || filters.semanas.length === 0)) {
                if (!filters.startDate || !filters.endDate) {
                    throw new Error('Debes indicar startDate y endDate para el filtro de fecha seleccionado');
                }

                if (!DATE_PATTERN.test(filters.startDate) || !DATE_PATTERN.test(filters.endDate)) {
                    throw new Error('Formato de fecha inválido. Usá YYYY-MM-DD');
                }

                const parsedStartDate = new Date(filters.startDate);
                const parsedEndDate = new Date(filters.endDate);

                if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
                    throw new Error('No se pudo interpretar startDate o endDate');
                }

                if (parsedStartDate > parsedEndDate) {
                    throw new Error('El rango de fechas es inválido: startDate no puede ser mayor que endDate');
                }
            }

            const params = new URLSearchParams();

            // Add filters to query params
            params.append('dateFilter', filters.dateFilter);
            params.append('dateField', filters.dateField);

            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            if (filters.stages && filters.stages.length > 0) {
                params.append('stages', filters.stages.join(','));
            }

            if (filters.machines && filters.machines.length > 0) {
                params.append('machines', filters.machines.join(','));
            }

            if (filters.vendors && filters.vendors.length > 0) {
                params.append('vendors', filters.vendors.join(','));
            }

            if (filters.clients && filters.clients.length > 0) {
                params.append('clients', filters.clients.join(','));
            }

            if (filters.priority && filters.priority !== 'all') {
                params.append('priority', filters.priority);
            }

            if (filters.semanas && filters.semanas.length > 0) {
                params.append('semanas', filters.semanas.join(','));
            }

            const response = await fetch(`/api/analytics/summary?${params.toString()}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                let backendMessage = response.statusText;

                try {
                    const errorBody = await response.json();
                    backendMessage = errorBody?.message || errorBody?.error || backendMessage;
                } catch (_parseError) {
                    // Ignorar errores de parseo y conservar statusText
                }

                throw new Error(`Error ${response.status}: ${backendMessage}`);
            }

            const analyticsData = await response.json();
            setData(analyticsData);

        } catch (err) {
            console.error('Error fetching analytics data:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return {
        data,
        loading,
        error,
        refetch: fetchAnalytics
    };
};
