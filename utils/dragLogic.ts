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
  handleSavePedido: (pedido: Pedido) => Promise<any>;
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
        setSortConfig
    } = args;

    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const movedPedido = pedidos.find(p => p.id === draggableId);
    if (!movedPedido) return;

    let updatedPedido: Pedido;

    if (source.droppableId.startsWith('PREP_') && destination.droppableId.startsWith('PREP_')) {
        const destId = destination.droppableId.replace('PREP_', '');

        updatedPedido = { ...movedPedido, subEtapaActual: destId };

        switch (destId) {
            case PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE:
                updatedPedido.materialDisponible = false;
                break;
            case PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE:
                updatedPedido.materialDisponible = true;
                updatedPedido.clicheDisponible = false;
                break;
            case PREPARACION_SUB_ETAPAS_IDS.CLICHE_PENDIENTE:
                updatedPedido.materialDisponible = true;
                updatedPedido.clicheDisponible = true;
                updatedPedido.estadoCliché = EstadoCliché.PENDIENTE_CLIENTE;
                break;
            case PREPARACION_SUB_ETAPAS_IDS.CLICHE_REPETICION:
                updatedPedido.materialDisponible = true;
                updatedPedido.clicheDisponible = true;
                updatedPedido.estadoCliché = EstadoCliché.REPETICION_CAMBIO;
                break;
            case PREPARACION_SUB_ETAPAS_IDS.CLICHE_NUEVO:
                updatedPedido.materialDisponible = true;
                updatedPedido.clicheDisponible = true;
                updatedPedido.estadoCliché = EstadoCliché.NUEVO;
                break;
        }
    } else {
        const newEtapa = destination.droppableId as Etapa;
        const oldEtapa = source.droppableId as Etapa;

        if (!ETAPAS[newEtapa] || !ETAPAS[oldEtapa]) {
            console.warn('Ignored invalid drag-and-drop operation between incompatible columns:', source.droppableId, '->', destination.droppableId);
            return;
        }

        updatedPedido = { ...movedPedido, etapaActual: newEtapa };
    }

    // Centralized save call
    if (updatedPedido) {
        // We do an optimistic update here to make the UI feel instant.
        // The final, validated state will come from the hook after the save.
        setPedidos(prev => prev.map(p => p.id === draggableId ? updatedPedido : p));
        await handleSavePedido(updatedPedido);
    }
};