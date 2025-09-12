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
  generarEntradaHistorial: (usuarioRole: UserRole, accion: string, detalles: string) => HistorialEntry;
  logAction: (action: string, pedidoId?: string) => void;
  setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>;
  handleSavePedido: (pedido: Pedido) => Promise<any>;
  handleUpdatePedidoEtapa: (pedido: Pedido, newEtapa: Etapa) => Promise<void>;
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
        handleSavePedido,
        handleUpdatePedidoEtapa,
        setSortConfig
    } = args;

    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Handle reordering in the list view (session only)
    if (destination.droppableId === 'pedido-list' && source.droppableId === 'pedido-list') {
        // Obtener solo los pedidos activos (los que se muestran en la lista)
        const currentActivePedidos = processedPedidos.filter(p => 
            p.etapaActual !== Etapa.ARCHIVADO && p.etapaActual !== Etapa.PREPARACION
        );

        // Crear una copia para reordenar
        const reorderedActivePedidos = Array.from(currentActivePedidos);
        const [movedPedido] = reorderedActivePedidos.splice(source.index, 1);
        reorderedActivePedidos.splice(destination.index, 0, movedPedido);

        // Crear un mapa de orden actualizado solo para los pedidos activos
        const updatedOrders = new Map<string, number>();
        reorderedActivePedidos.forEach((pedido, index) => {
            updatedOrders.set(pedido.id, index);
        });

        // Actualizar solo los pedidos que realmente cambiaron de orden
        const newPedidosList = pedidos.map(pedido => {
            const newOrder = updatedOrders.get(pedido.id);
            if (newOrder !== undefined && newOrder !== pedido.orden) {
                const historialEntry = generarEntradaHistorial(
                    currentUserRole, 
                    'Reordenamiento Manual', 
                    `Orden cambiado de ${pedido.orden || 'sin orden'} a ${newOrder}.`
                );
                return { 
                    ...pedido, 
                    orden: newOrder, 
                    historial: [...pedido.historial, historialEntry] 
                };
            }
            // Para pedidos activos que no cambiaron de orden, mantener su orden actual
            if (newOrder !== undefined) {
                return { ...pedido, orden: newOrder };
            }
            // Para pedidos no activos, mantener su orden original
            return pedido;
        });

        // Actualizar el estado inmediatamente
        setPedidos(newPedidosList);
        
        // NO llamar a setSortConfig para evitar re-sorting automático
        // setSortConfig('orden'); // ← Esto causaba el problema
        
        logAction(`Pedido ${movedPedido.numeroPedidoCliente} reordenado manualmente en la lista.`, movedPedido.id);
        
        // Actualización en background (solo para los pedidos que cambiaron)
        const changedPedidos = newPedidosList.filter(p => {
            const originalPedido = pedidos.find(op => op.id === p.id);
            return originalPedido && originalPedido.orden !== p.orden;
        });
        
        if (changedPedidos.length > 0) {
            Promise.all(changedPedidos.map(p => store.update(p))).catch(error => {
                console.error("Error al actualizar pedidos reordenados:", error);
                // En caso de error, no revertir automáticamente para evitar confusión
                // El usuario puede recargar la página si es necesario
            });
        }

        return;
    }

    const movedPedido = pedidos.find(p => p.id === draggableId);
    if (!movedPedido) return;

    // Actualización optimista inmediata para evitar el "salto"
    let updatedPedido: Pedido;

    if (source.droppableId.startsWith('PREP_') && destination.droppableId.startsWith('PREP_')) {
        const destId = destination.droppableId.replace('PREP_', '');

        let tempUpdatedPedido = {
            ...movedPedido,
            subEtapaActual: destId,
        };

        switch (destId) {
            case PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE:
                tempUpdatedPedido.materialDisponible = false;
                break;
            case PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE:
                tempUpdatedPedido.materialDisponible = true;
                tempUpdatedPedido.clicheDisponible = false;
                break;
            case PREPARACION_SUB_ETAPAS_IDS.CLICHE_PENDIENTE:
                tempUpdatedPedido.materialDisponible = true;
                tempUpdatedPedido.clicheDisponible = true;
                tempUpdatedPedido.estadoCliché = EstadoCliché.PENDIENTE_CLIENTE;
                break;
            case PREPARACION_SUB_ETAPAS_IDS.CLICHE_REPETICION:
                tempUpdatedPedido.materialDisponible = true;
                tempUpdatedPedido.clicheDisponible = true;
                tempUpdatedPedido.estadoCliché = EstadoCliché.REPETICION_CAMBIO;
                break;
            case PREPARACION_SUB_ETAPAS_IDS.CLICHE_NUEVO:
                tempUpdatedPedido.materialDisponible = true;
                tempUpdatedPedido.clicheDisponible = true;
                tempUpdatedPedido.estadoCliché = EstadoCliché.NUEVO;
                break;
        }

        // Immediately update the UI for a smooth drag-and-drop experience.
        setPedidos(prev => prev.map(p => p.id === draggableId ? tempUpdatedPedido : p));

        // Persist the change and let the hook's logic handle the final state.
        await handleSavePedido(tempUpdatedPedido);
        
        return;
    }

    const newEtapa = destination.droppableId as Etapa;
    const oldEtapa = source.droppableId as Etapa;
    
    // Use the centralized stage change handler
    await handleUpdatePedidoEtapa(movedPedido, newEtapa);
    
    logAction(`Pedido ${movedPedido.numeroPedidoCliente} movido (manual) de ${ETAPAS[oldEtapa].title} a ${ETAPAS[newEtapa].title}.`, movedPedido.id);
};