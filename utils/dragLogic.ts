import React from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { Pedido, Etapa, UserRole, EstadoCliché, HistorialEntry } from '../types';
import { ETAPAS, PREPARACION_SUB_ETAPAS_IDS } from '../constants';
import { store } from '../services/storage';
import { calculateTotalProductionTime } from './kpi';


type ProcessDragEndArgs = {
  result: DropResult;
  pedidos: Pedido[];
  processedPedidos: Pedido[];
  currentUserRole: UserRole;
  generarEntradaHistorial: (usuario: UserRole, accion: string, detalles: string) => HistorialEntry;
  logAction: (action: string) => void;
  setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>;
  setSortConfig: (key: keyof Pedido) => void;
};

export const procesarDragEnd = async (args: ProcessDragEndArgs): Promise<void> => {
    const {
        result,
        pedidos,
        processedPedidos,
        currentUserRole,
        generarEntradaHistorial,
        logAction,
        setPedidos,
        setSortConfig
    } = args;

    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Handle reordering in the list view (session only)
    if (destination.droppableId === 'pedido-list' && source.droppableId === 'pedido-list') {
        const currentActivePedidos = processedPedidos.filter(p => p.etapaActual !== Etapa.ARCHIVADO && p.etapaActual !== Etapa.PREPARACION);

        const reorderedActivePedidos = Array.from(currentActivePedidos);
        const [removed] = reorderedActivePedidos.splice(source.index, 1);
        reorderedActivePedidos.splice(destination.index, 0, removed);

        const newOrderMap = new Map(reorderedActivePedidos.map((p, index) => [p.id, index]));
        const maxActiveOrder = reorderedActivePedidos.length;

        const newFullPedidosList = pedidos.map(p => {
            const newOrder = newOrderMap.get(p.id);
            if (newOrder !== undefined) {
                const originalPedido = pedidos.find(op => op.id === p.id);
                if (originalPedido && originalPedido.orden !== newOrder) {
                    const historialEntry = generarEntradaHistorial(currentUserRole, 'Reordenamiento Manual', `Orden cambiado de ${originalPedido.orden} a ${newOrder}.`);
                    return { ...p, orden: newOrder, historial: [...p.historial, historialEntry] };
                }
                return { ...p, orden: newOrder };
            } else {
                return { ...p, orden: (p.orden || 0) + maxActiveOrder };
            }
        });

        setPedidos(newFullPedidosList);
        setSortConfig('orden');
        logAction('Pedidos reordenados manualmente en la vista de lista.');
        
        // Actualización en background
        const changedPedidos = newFullPedidosList.filter(p => newOrderMap.has(p.id));
        Promise.all(changedPedidos.map(p => store.update(p))).catch(error => {
            console.error("Error al actualizar pedidos reordenados:", error);
            // Opcional: revertir cambios en caso de error
            setPedidos(pedidos);
        });

        return;
    }

    const movedPedido = pedidos.find(p => p.id === draggableId);
    if (!movedPedido) return;

    // Actualización optimista inmediata para evitar el "salto"
    let updatedPedido: Pedido;

    if (source.droppableId.startsWith('PREP_') && destination.droppableId.startsWith('PREP_')) {
        const destId = destination.droppableId.replace('PREP_', '');
        updatedPedido = { ...movedPedido, historial: [...movedPedido.historial] };
        let logDetails = '';

        if (destId === PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE) {
            if (updatedPedido.materialDisponible) {
                updatedPedido.materialDisponible = false;
                logDetails = 'Cambiado a "Material No Disponible"';
            }
        } else if (destId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE) {
            if (!updatedPedido.materialDisponible) updatedPedido.materialDisponible = true;
            if (updatedPedido.clicheDisponible) {
                updatedPedido.clicheDisponible = false;
                logDetails = 'Cambiado a "Cliché no disponible"';
            }
        } else {
            if (!updatedPedido.materialDisponible) {
                updatedPedido.materialDisponible = true;
                logDetails = 'Cambiado a "Material Disponible"';
            }
            if (!updatedPedido.clicheDisponible) {
                updatedPedido.clicheDisponible = true;
                logDetails = logDetails ? `${logDetails} y "Cliché Disponible"` : 'Cambiado a "Cliché Disponible"';
            }
            if (destId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_PENDIENTE && updatedPedido.estadoCliché !== EstadoCliché.PENDIENTE_CLIENTE) {
                updatedPedido.estadoCliché = EstadoCliché.PENDIENTE_CLIENTE;
            } else if (destId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_REPETICION && updatedPedido.estadoCliché !== EstadoCliché.REPETICION_CAMBIO) {
                updatedPedido.estadoCliché = EstadoCliché.REPETICION_CAMBIO;
            } else if (destId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_NUEVO && updatedPedido.estadoCliché !== EstadoCliché.NUEVO) {
                updatedPedido.estadoCliché = EstadoCliché.NUEVO;
            }
        }
        const historialEntry = generarEntradaHistorial(currentUserRole, 'Actualización en Preparación', logDetails || 'Movido en vista de preparación');
        updatedPedido.historial.push(historialEntry);

        // Actualización optimista primero
        setPedidos(prev => prev.map(p => p.id === draggableId ? updatedPedido : p));
        
        // Luego actualización en almacenamiento (en background)
        try {
            await store.update(updatedPedido);
            logAction(`Pedido ${movedPedido.numeroPedidoCliente} actualizado en Preparación.`);
        } catch (error) {
            console.error('Error al actualizar el pedido:', error);
            // Revertir en caso de error
            setPedidos(prev => prev.map(p => p.id === draggableId ? movedPedido : p));
        }
        return;
    }

    const newEtapa = destination.droppableId as Etapa;
    const oldEtapa = source.droppableId as Etapa;
    const historialEntry = generarEntradaHistorial(currentUserRole, 'Cambio de Etapa', `Movido de '${ETAPAS[oldEtapa].title}' a '${ETAPAS[newEtapa].title}'.`);
    
    const isMovingToCompleted = newEtapa === Etapa.COMPLETADO;
    const wasCompleted = movedPedido.etapaActual === Etapa.COMPLETADO;
    const fechaFinalizacion = isMovingToCompleted ? new Date().toISOString() : (wasCompleted ? undefined : movedPedido.fechaFinalizacion);

    updatedPedido = { 
        ...movedPedido,
        etapaActual: newEtapa,
        etapasSecuencia: [...movedPedido.etapasSecuencia, { etapa: newEtapa, fecha: new Date().toISOString() }],
        historial: [...movedPedido.historial, historialEntry],
        fechaFinalizacion,
        tiempoTotalProduccion: fechaFinalizacion ? calculateTotalProductionTime(movedPedido.fechaCreacion, fechaFinalizacion) : undefined
    };

    // Actualización optimista primero
    setPedidos(prev => prev.map(p => p.id === draggableId ? updatedPedido : p));
    
    // Luego actualización en almacenamiento (en background)
    try {
        await store.update(updatedPedido);
        logAction(`Pedido ${movedPedido.numeroPedidoCliente} movido (manual) de ${ETAPAS[oldEtapa].title} a ${ETAPAS[newEtapa].title}.`);
    } catch (error) {
        console.error('Error al actualizar el pedido:', error);
        // Revertir en caso de error
        setPedidos(prev => prev.map(p => p.id === draggableId ? movedPedido : p));
    }
};