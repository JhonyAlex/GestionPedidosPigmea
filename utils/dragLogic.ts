import React from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { Pedido, Etapa, UserRole, HistorialEntry } from '../types';
import { Material } from '../types/material';
import { ETAPAS, PREPARACION_SUB_ETAPAS_IDS, KANBAN_FUNNELS } from '../constants';
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
    handleUpdatePedidoEtapa: (pedido: Pedido, newEtapa: Etapa, newSubEtapa?: string | null) => Promise<void>;
    setSortConfig: (key: keyof Pedido, direction?: 'ascending' | 'descending') => void;
    getMaterialesByPedidoId: (pedidoId: string) => Promise<Material[]>;
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
        getMaterialesByPedidoId
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

        // Cambiar el sorting a 'orden' para mantener el orden manual
        setSortConfig('orden', 'ascending');

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

        // ⚠️ VALIDAR MATERIALES PENDIENTES: Bloquear movimiento si hay materiales pendientes de recibir
        // Solo aplica cuando se intenta mover a "Cliché no disponible" o etapas posteriores
        const esMovimientoPostMaterial =
            destId === PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE ||
            destId === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION ||
            KANBAN_FUNNELS.IMPRESION.stages.includes(destId as Etapa) ||
            KANBAN_FUNNELS.POST_IMPRESION.stages.includes(destId as Etapa);

        console.log('🔍 Validación de materiales - Destino:', destId, 'esMovimientoPostMaterial:', esMovimientoPostMaterial);

        if (esMovimientoPostMaterial) {
            try {
                console.log('🔍 Obteniendo materiales para pedido:', movedPedido.id);
                // Obtener los materiales del pedido
                const materialesPedido = await getMaterialesByPedidoId(movedPedido.id);
                console.log('🔍 Materiales obtenidos:', materialesPedido);
                const materialesPendientes = materialesPedido.filter(m => m.pendienteRecibir === true);
                console.log('🔍 Materiales pendientes de recibir:', materialesPendientes);

                if (materialesPendientes.length > 0) {
                    console.log('⚠️ Bloqueando movimiento - hay materiales pendientes');
                    alert(
                        '🚫 No se puede mover el pedido\n\n' +
                        `Hay ${materialesPendientes.length} material(es) pendiente(s) de recibir:\n\n` +
                        materialesPendientes.map(m => `⏳ ${m.numero}${m.descripcion ? ` - ${m.descripcion}` : ''}`).join('\n') +
                        '\n\nPor favor, marca todos los materiales como recibidos antes de continuar.'
                    );
                    return; // ⛔ Bloquear el cambio
                }
            } catch (error) {
                console.error('❌ Error al verificar materiales pendientes:', error);
                // Continuar con el movimiento si hay error al obtener materiales
            }
        }

        // Actualización optimista inmediata para experiencia fluida
        setPedidos(prev => prev.map(p => p.id === draggableId ? tempUpdatedPedido : p));

        // Persistir cambio - el hook aplicará determinarEtapaPreparacion basado en los flags
        await handleSavePedido(tempUpdatedPedido);

        return;
    }

    const newEtapa = destination.droppableId as Etapa;
    const oldEtapa = source.droppableId as Etapa;

    // Use the centralized stage change handler
    await handleUpdatePedidoEtapa(movedPedido, newEtapa);

    logAction(`Pedido ${movedPedido.numeroPedidoCliente} movido (manual) de ${ETAPAS[oldEtapa]?.title ?? oldEtapa} a ${ETAPAS[newEtapa]?.title ?? newEtapa}.`, movedPedido.id);
};
