import { useState, useCallback } from 'react';
import { Cliente, EstadisticasCliente } from '../types';

// Datos de ejemplo para desarrollo - en producción vendrían de la base de datos
const clientesEjemplo: Cliente[] = [
    {
        id: '1',
        nombre: 'Corporación Tech Solutions',
        contacto: 'María García',
        email: 'maria.garcia@techsolutions.com',
        telefono: '+34 912 345 678',
        ciudad: 'Madrid',
        direccion: 'Calle Gran Vía, 123',
        pais: 'España',
        codigoPostal: '28013',
        fechaRegistro: '2023-01-15T10:30:00Z',
        ultimaActividad: '2024-12-15T14:22:00Z',
        activo: true,
        totalPedidos: 45,
        pedidosActivos: 3,
        volumenTotal: 2500,
        montoTotal: 125000,
        notas: 'Cliente premium con descuentos especiales.'
    },
    {
        id: '2',
        nombre: 'Industrias del Packaging SA',
        contacto: 'Carlos Mendoza',
        email: 'carlos@packaging.es',
        telefono: '+34 934 567 890',
        ciudad: 'Barcelona',
        direccion: 'Passeig de Gràcia, 85',
        pais: 'España',
        codigoPostal: '08008',
        fechaRegistro: '2023-03-22T09:15:00Z',
        ultimaActividad: '2024-12-10T11:45:00Z',
        activo: true,
        totalPedidos: 28,
        pedidosActivos: 1,
        volumenTotal: 1800,
        montoTotal: 89000
    },
    {
        id: '3',
        nombre: 'Distribuidora Valencia',
        contacto: 'Ana Rodríguez',
        email: 'ana.rodriguez@distvalencia.com',
        telefono: '+34 963 123 456',
        ciudad: 'Valencia',
        direccion: 'Avenida del Puerto, 45',
        pais: 'España',
        codigoPostal: '46021',
        fechaRegistro: '2023-07-10T16:00:00Z',
        ultimaActividad: '2024-11-28T09:30:00Z',
        activo: false,
        totalPedidos: 12,
        pedidosActivos: 0,
        volumenTotal: 650,
        montoTotal: 32000,
        notas: 'Cliente inactivo desde noviembre 2024.'
    }
];

export const useClientesManager = () => {
    const [clientes, setClientes] = useState<Cliente[]>(clientesEjemplo);

    // Buscar cliente por nombre exacto
    const findClienteByName = useCallback((nombre: string): Cliente | undefined => {
        return clientes.find(cliente => 
            cliente.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
        );
    }, [clientes]);

    // Crear cliente automáticamente si no existe
    const createClienteIfNotExists = useCallback((nombreCliente: string): Cliente => {
        const existingCliente = findClienteByName(nombreCliente);
        
        if (existingCliente) {
            return existingCliente;
        }

        // Crear nuevo cliente con datos básicos
        const nuevoCliente: Cliente = {
            id: `auto-${Date.now()}`, // ID temporal - en producción sería generado por el backend
            nombre: nombreCliente.trim(),
            fechaRegistro: new Date().toISOString(),
            ultimaActividad: new Date().toISOString(),
            activo: true,
            totalPedidos: 0,
            pedidosActivos: 0,
            volumenTotal: 0,
            montoTotal: 0
        };

        // Agregar a la lista de clientes
        setClientes(prev => [...prev, nuevoCliente]);

        console.log(`🆕 Cliente creado automáticamente: ${nombreCliente}`);
        
        return nuevoCliente;
    }, [findClienteByName]);

    // Actualizar estadísticas de cliente después de crear/modificar pedido
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
    const createCliente = useCallback((clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
        const nuevoCliente: Cliente = {
            ...clienteData,
            id: `manual-${Date.now()}`,
            fechaRegistro: new Date().toISOString(),
            ultimaActividad: new Date().toISOString()
        };

        setClientes(prev => [...prev, nuevoCliente]);
        return nuevoCliente;
    }, []);

    // Actualizar cliente
    const updateCliente = useCallback((id: string, updates: Partial<Cliente>) => {
        setClientes(prev => prev.map(cliente => 
            cliente.id === id 
                ? { ...cliente, ...updates, ultimaActividad: new Date().toISOString() }
                : cliente
        ));
    }, []);

    // Eliminar cliente
    const deleteCliente = useCallback((id: string) => {
        setClientes(prev => prev.filter(cliente => cliente.id !== id));
    }, []);

    // Obtener estadísticas detalladas de un cliente
    const getClienteEstadisticas = useCallback((clienteId: string, pedidos: any[]): EstadisticasCliente => {
        const cliente = clientes.find(c => c.id === clienteId);
        if (!cliente) {
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
        
        // Calcular estadísticas detalladas
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

    return {
        clientes,
        findClienteByName,
        createClienteIfNotExists,
        updateClienteStats,
        createCliente,
        updateCliente,
        deleteCliente,
        getClienteEstadisticas
    };
};