import React from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { Pedido, Etapa, UserRole, HistorialEntry } from '../types';
import { Material } from '../types/material';
import { ETAPAS, PREPARACION_SUB_ETAPAS_IDS, KANBAN_FUNNELS } from '../constants';
import { calculateTotalProductionTime } from './kpi';
import {
    isProduccionKanbanStage,
    mergeVisibleKanbanReorder,
    parseKanbanDraggableId,
} from './kanbanManualOrder';

type ProcessDragEndArgs = {
    result: DropResult;
    pedidos: Pedido[];
    processedPedidos: Pedido[];
    currentUserRole: UserRole;
    generarEntradaHistorial: (usuarioRole: UserRole, accion: string, detalles: string) => HistorialEntry;
    logAction: (action: string, pedidoId?: string) => void;
    setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>;
    handleSavePedido: (pedido: Pedido) => Promise<any>;
    handleUpdatePedidoEtapa: (pedido: Pedido, newEtapa: Etapa, newSubEtapa?: string | null) => Promise<any>;
    setSortConfig: (key: keyof Pedido, direction?: 'ascending' | 'descending') => void;
    getMaterialesByPedidoId: (pedidoId: string) => Promise<Material[]>;
    kanbanAllPedidosByStage: Partial<Record<Etapa, Pedido[]>>;
    kanbanVisiblePedidosByStage: Partial<Record<Etapa, Pedido[]>>;
    setKanbanManualOrderForStage: (stageId: Etapa, orderedIds: string[]) => void;
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
        setSortConfig,
        getMaterialesByPedidoId,
        kanbanAllPedidosByStage,
        kanbanVisiblePedidosByStage,
        setKanbanManualOrderForStage,
    } = args;

    const { destination, source, draggableId } = result;
    const { pedidoId } = parseKanbanDraggableId(draggableId);

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const movedPedido = pedidos.find(p => p.id === pedidoId);
    if (!movedPedido) return;

    const sourceEsEtapaProduccion = isProduccionKanbanStage(source.droppableId);
    const destinationEsEtapaProduccion = isProduccionKanbanStage(destination.droppableId);

    if (
        sourceEsEtapaProduccion &&
        destinationEsEtapaProduccion &&
        source.droppableId !== destination.droppableId &&
        movedPedido.etapaActual !== source.droppableId
    ) {
        return;
    }

    // Actualización optimista inmediata para evitar el "salto"
    let updatedPedido: Pedido;

    if (source.droppableId.startsWith('PREP_') && destination.droppableId.startsWith('PREP_')) {
        const destId = destination.droppableId.replace('PREP_', '');
        const sourceId = source.droppableId.replace('PREP_', '');

        // 🚫 VALIDACIÓN: Si el pedido está en "Sin Gestión Iniciada" y tiene materiales con
        // "Pendiente Gestión", NO puede ser movido a ninguna otra sub-etapa.
        // El campo está en pedido.materialConsumo[i].gestionado (dentro del propio pedido)
        if (
            sourceId === PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA &&
            destId !== PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA
        ) {
            const cantidad = movedPedido.materialConsumoCantidad ?? 0;
            const consumo = movedPedido.materialConsumo ?? [];
            const materialesSinGestionar: number[] = [];

            for (let i = 0; i < cantidad; i++) {
                if (consumo[i]?.gestionado !== true) {
                    materialesSinGestionar.push(i + 1);
                }
            }

            if (materialesSinGestionar.length > 0) {
                alert(
                    '🚫 No se puede mover el pedido\n\n' +
                    `Este pedido tiene ${materialesSinGestionar.length} material(es) con estado "Pendiente Gestión":\n\n` +
                    materialesSinGestionar.map(n => `   • Material ${n}`).join('\n') +
                    '\n\nDebes completar la gestión de todos los materiales antes de mover\neste pedido de "Sin Gestión Iniciada".'
                );
                return; // ⛔ Bloquear el movimiento
            }
        }

        // ✅ NUEVO: Solo actualizar subEtapaActual, NO modificar flags de material/cliché
        // Los flags se mantienen tal como están para preservar el estado real del pedido
        const tempUpdatedPedido = {
            ...movedPedido,
            subEtapaActual: destId,
        };

        // ⚠️ Validaciones de consistencia: Advertir si el estado no coincide con la columna destino
        let showWarning = false;
        let warningMessage = '';

        if (destId === PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE && movedPedido.materialDisponible === true) {
            warningMessage =
                '⚠️ Advertencia de Inconsistencia\n\n' +
                'El material está marcado como DISPONIBLE en este pedido, ' +
                'pero lo estás moviendo a "Material No Disponible".\n\n' +
                '¿Deseas continuar con este movimiento?\n\n' +
                '(El estado del material en el pedido no se modificará automáticamente)';
            showWarning = true;
        } else if (destId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE && movedPedido.clicheDisponible === true) {
            warningMessage =
                '⚠️ Advertencia de Inconsistencia\n\n' +
                'El cliché está marcado como DISPONIBLE en este pedido, ' +
                'pero lo estás moviendo a "Cliché No Disponible".\n\n' +
                '¿Deseas continuar con este movimiento?\n\n' +
                '(El estado del cliché en el pedido no se modificará automáticamente)';
            showWarning = true;
        }

        // Mostrar confirmación si hay inconsistencia
        if (showWarning) {
            const confirmed = window.confirm(warningMessage);
            if (!confirmed) {
                // Usuario canceló - no hacer nada, el pedido se queda donde estaba
                return;
            }
        }

        // ⚠️ VALIDAR MATERIAL DISPONIBLE Y MATERIALES PENDIENTES:
        // Bloquear movimiento si el material no está disponible o hay materiales pendientes de recibir
        // Solo aplica cuando se intenta mover a "Cliché no disponible" o etapas posteriores
        const esMovimientoPostMaterial =
            destId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE ||
            destId === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION ||
            KANBAN_FUNNELS.IMPRESION.stages.includes(destId as Etapa) ||
            KANBAN_FUNNELS.POST_IMPRESION.stages.includes(destId as Etapa);

        if (esMovimientoPostMaterial) {
            const errores: string[] = [];

            // Validación 1: Flag materialDisponible del pedido
            if (!movedPedido.materialDisponible) {
                errores.push('❌ El material NO está marcado como disponible en este pedido.');
            }

            // Validación 2: Verificar materiales pendientes de recibir desde la API
            try {
                const materialesPedido = await getMaterialesByPedidoId(movedPedido.id);
                const materialesPendientes = materialesPedido.filter(m => m.pendienteRecibir === true);

                if (materialesPendientes.length > 0) {
                    errores.push(
                        `⏳ Hay ${materialesPendientes.length} material(es) pendiente(s) de recibir:\n` +
                        materialesPendientes.map(m => `   - ${m.numero}${m.descripcion ? ` (${m.descripcion})` : ''}`).join('\n')
                    );
                }
            } catch (error) {
                console.error('Error al verificar materiales pendientes:', error);
                // No agregar error adicional, la validación principal (materialDisponible) ya cubre
            }

            if (errores.length > 0) {
                alert(
                    '🚫 No se puede mover el pedido\n\n' +
                    'Problemas encontrados:\n\n' +
                    errores.join('\n\n') +
                    '\n\nPor favor, asegúrese de que el material esté disponible y todos los materiales hayan sido recibidos antes de continuar.'
                );
                return; // ⛔ Bloquear el cambio - NO actualizar el estado
            }
        }

        // Actualización optimista inmediata para experiencia fluida
        setPedidos(prev => prev.map(p => p.id === pedidoId ? tempUpdatedPedido : p));

        // Persistir cambio - el hook aplicará determinarEtapaPreparacion basado en los flags
        await handleSavePedido(tempUpdatedPedido);

        return;
    }

    // ✅ Reordenamiento dentro de la MISMA columna Kanban (no lista, no preparación)
    if (source.droppableId === destination.droppableId && sourceEsEtapaProduccion) {
        const etapaId = source.droppableId as Etapa;
        const fullColumnPedidos = kanbanAllPedidosByStage[etapaId] || [];
        const visibleColumnPedidos = kanbanVisiblePedidosByStage[etapaId] || fullColumnPedidos;

        if (visibleColumnPedidos.length === 0) {
            return;
        }

        const orderedIds = mergeVisibleKanbanReorder(
            fullColumnPedidos,
            visibleColumnPedidos,
            source.index,
            destination.index,
            etapaId
        );
        const moved = visibleColumnPedidos[source.index] || movedPedido;

        // El orden visual del Kanban vive en kanban_manual_order.
        // Do not update pedido.posicionEnEtapa here: it triggers pedido-updated notifications
        // and it does not model temporary mirror cards correctly.
        setKanbanManualOrderForStage(etapaId, orderedIds);
        setSortConfig('posicionEnEtapa', 'ascending');

        logAction(`Pedido ${moved.numeroPedidoCliente} reordenado visualmente en ${ETAPAS[etapaId]?.title ?? etapaId}.`, moved.id);
        return;
    }

    // Movimiento entre columnas de producci�n o etapas diferentes
    const newEtapa = destination.droppableId as Etapa;
    const oldEtapa = source.droppableId as Etapa;

    // Calcular posici�n final en la columna destino
    const destColumnPedidos = kanbanAllPedidosByStage[newEtapa] || [];
    const existingRealPedidos = destColumnPedidos.filter(p => p.etapaActual === newEtapa);
    const maxPosicion = existingRealPedidos.length > 0
        ? Math.max(...existingRealPedidos.map(p => p.posicionEnEtapa || 0))
        : 0;
    const nuevaPosicion = maxPosicion + 1;

    // Crear pedido actualizado con posici�n al final
    const pedidoCrossColumn = {
        ...movedPedido,
        posicionEnEtapa: nuevaPosicion,
    };

    // Actualizaci�n optimista
    setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoCrossColumn : p));

    // Aplicar cambio de etapa
    await handleUpdatePedidoEtapa(movedPedido, newEtapa);

    logAction(`Pedido ${movedPedido.numeroPedidoCliente} movido al final de ${ETAPAS[newEtapa]?.title ?? newEtapa}.`, movedPedido.id);

};
