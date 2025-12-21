import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WebSocketService from '../services/websocket';
import {
    OperacionProduccion,
    OperacionActivaCompleta,
    EstadisticasOperador,
    IniciarOperacionInput,
    CompletarOperacionInput,
    PausarOperacionInput,
    OperacionResponse,
    MetrajeProduccion,
    ObservacionProduccion
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function useOperacionesProduccion() {
    const { user } = useAuth();
    const [operacionesActivas, setOperacionesActivas] = useState<OperacionActivaCompleta[]>([]);
    const [miOperacionActual, setMiOperacionActual] = useState<OperacionActivaCompleta | null>(null);
    const [estadisticas, setEstadisticas] = useState<EstadisticasOperador | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Función para obtener headers de autenticación
    const getAuthHeaders = () => ({
        'x-user-id': String(user?.id || ''),
        'x-user-role': user?.role || 'OPERATOR',
        'Content-Type': 'application/json'
    });

    // ============================================
    // SUSCRIBIRSE A EVENTOS DE SOCKET.IO
    // ============================================
    useEffect(() => {
        const socket = WebSocketService.getSocket();
        if (!socket) return;

        const handleOperacionIniciada = (operacion: OperacionActivaCompleta) => {
            setOperacionesActivas(prev => [...prev, operacion]);
            if (operacion.operadorId === user?.id) {
                setMiOperacionActual(operacion);
            }
        };

        const handleOperacionPausada = (operacion: OperacionProduccion) => {
            setOperacionesActivas(prev =>
                prev.map(op => op.id === operacion.id ? { ...op, ...operacion } : op)
            );
            if (operacion.operadorId === user?.id) {
                setMiOperacionActual(prev => prev ? { ...prev, ...operacion } : null);
            }
        };

        const handleOperacionReanudada = (operacion: OperacionProduccion) => {
            setOperacionesActivas(prev =>
                prev.map(op => op.id === operacion.id ? { ...op, ...operacion } : op)
            );
            if (operacion.operadorId === user?.id) {
                setMiOperacionActual(prev => prev ? { ...prev, ...operacion } : null);
            }
        };

        const handleOperacionCompletada = (operacion: OperacionProduccion) => {
            console.log('✅ Operación completada:', operacion);
            setOperacionesActivas(prev => prev.filter(op => op.id !== operacion.id));
            
            if (operacion.operadorId === user?.id) {
                setMiOperacionActual(null);
            }
            
            // Actualizar estadísticas
            if (user?.id) {
                cargarEstadisticas(user.id);
            }
        };

        const handleOperacionCancelada = (operacion: OperacionProduccion) => {
            console.log('❌ Operación cancelada:', operacion);
            setOperacionesActivas(prev => prev.filter(op => op.id !== operacion.id));
            
            if (operacion.operadorId === user?.id) {
                setMiOperacionActual(null);
            }
        };

        socket.on('operacion-iniciada', handleOperacionIniciada);
        socket.on('operacion-pausada', handleOperacionPausada);
        const handleOperacionCompletada = (operacion: OperacionProduccion) => {
            setOperacionesActivas(prev => prev.filter(op => op.id !== operacion.id));
            if (operacion.operadorId === user?.id) {
                setMiOperacionActual(null);
            }
            if (user?.id) {
                cargarEstadisticas(user.id);
            }
        };

        const handleOperacionCancelada = (operacion: OperacionProduccion) => {
            setOperacionesActivas(prev => prev.filter(op => op.id !== operacion.id));
            if (operacion.operadorId === user?.id) {
                setMiOperacionActual(null);
            }
        };

        socket.on('operacion-iniciada', handleOperacionIniciada);
        socket.on('operacion-pausada', handleOperacionPausada);
        socket.on('operacion-reanudada', handleOperacionReanudada);
        socket.on('operacion-completada', handleOperacionCompletada);
        socket.on('operacion-cancelada', handleOperacionCancelada);

        return () => {
            socket.off('operacion-iniciada', handleOperacionIniciada);
            socket.off('operacion-pausada', handleOperacionPausada);
            socket.off('operacion-reanudada', handleOperacionReanudada);
            socket.off('operacion-completada', handleOperacionCompletada);
            socket.off('operacion-cancelada', handleOperacionCancelada);
        };
    }, [user?.id]);

    // ============================================
    // FUNCIONES DE API
    // ============================================

    const cargarOperacionesActivas = useCallback(async (filtros?: { operadorId?: string; maquina?: string; etapa?: string }) => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (filtros?.operadorId) params.append('operadorId', filtros.operadorId);
            if (filtros?.maquina) params.append('maquina', filtros.maquina);
            if (filtros?.etapa) params.append('etapa', filtros.etapa);
            
            const response = await fetch(`${API_URL}/produccion/operaciones-activas?${params.toString()}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al cargar operaciones activas');
            
            const data = await response.json();
            setOperacionesActivas(data.operaciones || []);
            
            // Buscar mi operación actual
            const miOperacion = data.operaciones?.find((op: OperacionActivaCompleta) => op.operadorId === user?.id);
            setMiOperacionActual(miOperacion || null);
            
        } catch (err) {
            console.error('Error cargando operaciones activas:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const iniciarOperacion = useCallback(async (input: IniciarOperacionInput): Promise<OperacionResponse> => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_URL}/produccion/iniciar`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(input)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al iniciar operación');
            }
            
            const data: OperacionResponse = await response.json();
            
            if (data.success && data.operacion) {
                setMiOperacionActual(data.operacion as OperacionActivaCompleta);
            }
            
            return data;
            
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMsg);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const pausarOperacion = useCallback(async (input: PausarOperacionInput): Promise<OperacionResponse> => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_URL}/produccion/pausar/${input.operacionId}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ motivo: input.motivo })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al pausar operación');
            }
            
            const data: OperacionResponse = await response.json();
            return data;
            
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMsg);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const reanudarOperacion = useCallback(async (operacionId: string): Promise<OperacionResponse> => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_URL}/produccion/reanudar/${operacionId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al reanudar operación');
            }
            
            const data: OperacionResponse = await response.json();
            return data;
            
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMsg);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const completarOperacion = useCallback(async (input: CompletarOperacionInput): Promise<OperacionResponse> => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_URL}/produccion/completar`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(input)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al completar operación');
            }
            
            const data: OperacionResponse = await response.json();
            
            if (data.success) {
                setMiOperacionActual(null);
            }
            
            return data;
            
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMsg);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarEstadisticas = useCallback(async (operadorId: string) => {
        try {
            const response = await fetch(`${API_URL}/produccion/estadisticas/${operadorId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al cargar estadísticas');
            
            const data = await response.json();
            setEstadisticas(data.estadisticas);
            
        } catch (err) {
            console.error('Error cargando estadísticas:', err);
        }
    }, []);

    const obtenerPedidosDisponibles = useCallback(async (filtros?: { etapa?: string }) => {
        try {
            const params = new URLSearchParams();
            if (filtros?.etapa) params.append('etapa', filtros.etapa);
            
            const response = await fetch(`${API_URL}/produccion/pedidos-disponibles?${params.toString()}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al cargar pedidos disponibles');
            
            const data = await response.json();
            return data.pedidos || [];
            
        } catch (err) {
            console.error('Error cargando pedidos disponibles:', err);
            return [];
        }
    }, []);

    const obtenerHistorialPedido = useCallback(async (pedidoId: string): Promise<OperacionProduccion[]> => {
        try {
            const response = await fetch(`${API_URL}/produccion/historial/${pedidoId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Error al cargar historial');
            
            const data = await response.json();
            return data.historial || [];
            
        } catch (err) {
            console.error('Error cargando historial:', err);
            return [];
        }
    }, []);

    // Cargar operaciones activas y estadísticas al montar
    useEffect(() => {
        if (user?.id) {
            cargarOperacionesActivas();
            cargarEstadisticas(user.id);
        }
    }, [user?.id, cargarOperacionesActivas, cargarEstadisticas]);

    return {
        operacionesActivas,
        miOperacionActual,
        estadisticas,
        loading,
        error,
        iniciarOperacion,
        pausarOperacion,
        reanudarOperacion,
        completarOperacion,
        cargarOperacionesActivas,
        cargarEstadisticas,
        obtenerPedidosDisponibles,
        obtenerHistorialPedido
    };
}
