import { useState, useCallback, useEffect } from 'react';
import { Cliente, EstadisticasCliente } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const useClientesManager = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar clientes desde la API
    const loadClientes = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch(`${API_BASE_URL}/clientes`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const clientesData = await response.json();
            setClientes(clientesData);
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            setError(error instanceof Error ? error.message : 'Error desconocido');
            // En caso de error, usar datos mock para desarrollo
            setClientes([
                {
                    id: '1',
                    nombre: 'Cliente Demo',
                    fechaRegistro: new Date().toISOString(),
                    ultimaActividad: new Date().toISOString(),
                    activo: true,
                    totalPedidos: 0,
                    pedidosActivos: 0,
                    volumenTotal: 0,
                    montoTotal: 0
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Cargar clientes al inicializar
    useEffect(() => {
        loadClientes();
    }, [loadClientes]);

    // Buscar cliente por nombre exacto
    const findClienteByName = useCallback((nombre: string): Cliente | undefined => {
        return clientes.find(cliente => 
            cliente.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
        );
    }, [clientes]);

    // Crear cliente automáticamente si no existe (solo para el frontend, el backend lo maneja automáticamente)
    const createClienteIfNotExists = useCallback((nombreCliente: string): Cliente => {
        const existingCliente = findClienteByName(nombreCliente);
        
        if (existingCliente) {
            return existingCliente;
        }

        // Si no existe localmente, crear un cliente temporal hasta que se sincronice desde el backend
        const nuevoCliente: Cliente = {
            id: `temp-${Date.now()}`, // ID temporal - será reemplazado por el real del backend
            nombre: nombreCliente.trim(),
            fechaRegistro: new Date().toISOString(),
            ultimaActividad: new Date().toISOString(),
            activo: true,
            totalPedidos: 0,
            pedidosActivos: 0,
            volumenTotal: 0,
            montoTotal: 0
        };

        // Agregar temporalmente a la lista local
        setClientes(prev => [...prev, nuevoCliente]);

        console.log(`🆕 Cliente temporal creado en frontend: ${nombreCliente} (se sincronizará desde backend)`);
        
        return nuevoCliente;
    }, [findClienteByName]);

    // Actualizar estadísticas de cliente (esto será manejado principalmente por el backend)
    const updateClienteStats = useCallback((nombreCliente: string, incrementos: {
        totalPedidos?: number;
        pedidosActivos?: number;
        volumenTotal?: number;
        montoTotal?: number;
    }) => {
        setClientes(prev => prev.map(cliente => {
            if (cliente.nombre.toLowerCase().trim() === nombreCliente.toLowerCase().trim()) {
                return {
                    ...cliente,
                    ultimaActividad: new Date().toISOString(),
                    totalPedidos: (cliente.totalPedidos || 0) + (incrementos.totalPedidos || 0),
                    pedidosActivos: (cliente.pedidosActivos || 0) + (incrementos.pedidosActivos || 0),
                    volumenTotal: (cliente.volumenTotal || 0) + (incrementos.volumenTotal || 0),
                    montoTotal: (cliente.montoTotal || 0) + (incrementos.montoTotal || 0)
                };
            }
            return cliente;
        }));
    }, []);

    // Crear cliente manualmente (para el directorio)
    const createCliente = useCallback(async (clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
        try {
            const response = await fetch(`${API_BASE_URL}/clientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clienteData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear cliente');
            }

            const nuevoCliente = await response.json();
            
            // Actualizar la lista local (también llegará por WebSocket)
            setClientes(prev => [...prev, nuevoCliente]);
            
            return nuevoCliente;
        } catch (error) {
            console.error('Error al crear cliente:', error);
            throw error;
        }
    }, []);

    // Actualizar cliente
    const updateCliente = useCallback(async (id: string, updates: Partial<Cliente>) => {
        try {
            const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar cliente');
            }

            const clienteActualizado = await response.json();
            
            // Actualizar la lista local (también llegará por WebSocket)
            setClientes(prev => prev.map(cliente => 
                cliente.id === id ? clienteActualizado : cliente
            ));
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            throw error;
        }
    }, []);

    // Eliminar cliente
    const deleteCliente = useCallback(async (id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar cliente');
            }

            // Actualizar la lista local (también llegará por WebSocket)
            setClientes(prev => prev.filter(cliente => cliente.id !== id));
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            throw error;
        }
    }, []);

    // Obtener estadísticas detalladas de un cliente
    const getClienteEstadisticas = useCallback(async (clienteId: string, pedidos?: any[]): Promise<EstadisticasCliente> => {
        try {
            const response = await fetch(`${API_BASE_URL}/clientes/${clienteId}/estadisticas`);
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Error al obtener estadísticas del backend, calculando localmente:', error);
        }

        // Fallback: calcular estadísticas localmente si la API no está disponible
        const cliente = clientes.find(c => c.id === clienteId);
        if (!cliente || !pedidos) {
            return {
                totalPedidos: 0,
                pedidosActivos: 0,
                pedidosCompletados: 0,
                volumenTotalMetros: 0,
                tiempoPromedioProduccion: 0,
                productosMasSolicitados: [],
                tendenciaMensual: [],
                etapasMasComunes: []
            };
        }

        const clientePedidos = pedidos.filter(p => p.cliente === cliente.nombre);
        
        // Calcular estadísticas detalladas localmente
        const totalPedidos = clientePedidos.length;
        const pedidosCompletados = clientePedidos.filter(p => p.etapaActual === 'COMPLETADO').length;
        const pedidosActivos = clientePedidos.filter(p => p.etapaActual !== 'COMPLETADO' && p.etapaActual !== 'ARCHIVADO').length;
        const volumenTotalMetros = clientePedidos.reduce((sum, p) => sum + (typeof p.metros === 'number' ? p.metros : parseInt(p.metros) || 0), 0);

        // Productos más solicitados
        const productosCount = clientePedidos.reduce((acc, pedido) => {
            const producto = pedido.producto || pedido.desarrollo || 'Sin especificar';
            if (!acc[producto]) {
                acc[producto] = { cantidad: 0, volumenTotal: 0 };
            }
            acc[producto].cantidad++;
            acc[producto].volumenTotal += typeof pedido.metros === 'number' ? pedido.metros : parseInt(pedido.metros) || 0;
            return acc;
        }, {} as Record<string, { cantidad: number; volumenTotal: number }>);

        const productosMasSolicitados = Object.entries(productosCount)
            .map(([producto, stats]) => ({
                producto,
                cantidad: (stats as { cantidad: number; volumenTotal: number }).cantidad,
                volumenTotal: (stats as { cantidad: number; volumenTotal: number }).volumenTotal
            }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);

        // Tiempo promedio de producción (simplificado)
        const tiempoPromedioProduccion = pedidosCompletados > 0 ? 7 : 0; // Placeholder

        return {
            totalPedidos,
            pedidosActivos,
            pedidosCompletados,
            volumenTotalMetros,
            tiempoPromedioProduccion,
            productosMasSolicitados,
            tendenciaMensual: [], // Se implementaría con datos históricos reales
            etapasMasComunes: []  // Se implementaría con análisis de etapas
        };
    }, [clientes]);

    // Función para manejar eventos WebSocket de clientes
    const handleClienteCreated = useCallback((cliente: Cliente) => {
        setClientes(prev => {
            // Evitar duplicados y reemplazar clientes temporales
            const filtered = prev.filter(c => 
                c.nombre !== cliente.nombre && !c.id.startsWith('temp-')
            );
            return [...filtered, cliente];
        });
    }, []);

    const handleClienteUpdated = useCallback((cliente: Cliente) => {
        setClientes(prev => prev.map(c => 
            c.id === cliente.id ? cliente : c
        ));
    }, []);

    const handleClienteDeleted = useCallback((clienteId: string) => {
        setClientes(prev => prev.filter(c => c.id !== clienteId));
    }, []);

    const handleClienteStatsUpdated = useCallback((data: { clienteNombre: string; pedidoId: string; accion: string }) => {
        // Cuando se actualicen las estadísticas, recargar los datos del cliente
        // Esto podría optimizarse para solo actualizar el cliente específico
        console.log('Estadísticas de cliente actualizadas:', data);
        // Por ahora, recargar todos los clientes para mantener la sincronización
        loadClientes();
    }, [loadClientes]);

    return {
        clientes,
        isLoading,
        error,
        findClienteByName,
        createClienteIfNotExists,
        updateClienteStats,
        createCliente,
        updateCliente,
        deleteCliente,
        getClienteEstadisticas,
        loadClientes,
        // Handlers para eventos WebSocket
        handleClienteCreated,
        handleClienteUpdated,
        handleClienteDeleted,
        handleClienteStatsUpdated
    };
};