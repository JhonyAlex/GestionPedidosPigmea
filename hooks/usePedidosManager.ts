import { useState, useEffect } from 'react';
import { Pedido, UserRole, Etapa, HistorialEntry } from '../types';
import { store } from '../services/storage';
import { ETAPAS, KANBAN_FUNNELS } from '../constants';
import { determinarEtapaPreparacion } from '../utils/preparacionLogic';
import AntivahoConfirmationModal from '../components/AntivahoConfirmationModal';

export const usePedidosManager = (
    currentUserRole: UserRole,
    generarEntradaHistorial: (usuario: UserRole, accion: string, detalles: string) => HistorialEntry,
    setPedidoToSend: React.Dispatch<React.SetStateAction<Pedido | null>>
) => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [antivahoModalState, setAntivahoModalState] = useState<{ isOpen: boolean; pedido: Pedido | null; toEtapa: Etapa | null }>({ isOpen: false, pedido: null, toEtapa: null });

    useEffect(() => {
        const initStore = async () => {
            setIsLoading(true);
            try {
                const currentPedidos = await store.getAll();
                setPedidos(currentPedidos);
            } catch (error) {
                console.error("Failed to fetch data from backend:", error);
                alert("No se pudo conectar al servidor. Por favor, asegúrese de que el backend esté en ejecución y sea accesible.");
            } finally {
                setIsLoading(false);
            }
        };
        initStore();
    }, []);

    const handleSavePedido = async (updatedPedido: Pedido, generateHistory = true) => {
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado: Solo los administradores pueden modificar pedidos.');
            return;
        }

        const originalPedido = pedidos.find(p => p.id === updatedPedido.id);
        if (!originalPedido) return;

        let modifiedPedido = { ...updatedPedido };
        let hasChanges = false;

        if (modifiedPedido.etapaActual === Etapa.PREPARACION) {
            modifiedPedido.subEtapaActual = determinarEtapaPreparacion(modifiedPedido);
        }
        
        if (generateHistory) {
            const newHistoryEntries: HistorialEntry[] = [];
            const fieldsToCompare: Array<keyof Pedido> = [
                'numeroPedidoCliente', 'cliente', 'metros', 'fechaEntrega', 'prioridad', 
                'tipoImpresion', 'desarrollo', 'capa', 'tiempoProduccionPlanificado', 
                'observaciones', 'materialDisponible', 'clicheDisponible', 'estadoCliché', 'secuenciaTrabajo',
                'camisa', 'producto', 'materialCapasCantidad', 'materialCapas', 
                'materialConsumoCantidad', 'materialConsumo', 'bobinaMadre', 'bobinaFinal', 
                'minAdap', 'colores', 'maquinaImpresion', 'orden', 'minColor', 'subEtapaActual', 'antivaho', 'antivahoRealizado'
            ];

            fieldsToCompare.forEach(key => {
                 if (JSON.stringify(originalPedido[key]) !== JSON.stringify(modifiedPedido[key])) {
                    const formatValue = (val: any) => val === true ? 'Sí' : (val === false ? 'No' : (Array.isArray(val) ? val.map(v => ETAPAS[v]?.title || v).join(', ') || 'Vacía' : val || 'N/A'));
                    newHistoryEntries.push(generarEntradaHistorial(currentUserRole, `Campo Actualizado: ${key}`, `Cambiado de '${formatValue(originalPedido[key])}' a '${formatValue(modifiedPedido[key])}'.`));
                }
            });
            
            if (originalPedido.etapaActual !== modifiedPedido.etapaActual) {
                newHistoryEntries.push(generarEntradaHistorial(currentUserRole, 'Cambio de Etapa', `Movido de '${ETAPAS[originalPedido.etapaActual].title}' a '${ETAPAS[modifiedPedido.etapaActual].title}'.`));
            }
            
            if (newHistoryEntries.length > 0) {
                modifiedPedido.historial = [...(modifiedPedido.historial || []), ...newHistoryEntries];
            }
            hasChanges = newHistoryEntries.length > 0;
        } else {
             hasChanges = JSON.stringify(originalPedido) !== JSON.stringify(modifiedPedido);
        }

        // Actualización optimista primero
        if (hasChanges) {
            setPedidos(prev => prev.map(p => p.id === modifiedPedido.id ? modifiedPedido : p));
        }

        // Luego actualización en almacenamiento (en background)
        try {
            await store.update(modifiedPedido);
            return { modifiedPedido, hasChanges };
        } catch (error) {
            console.error('Error al actualizar el pedido:', error);
            // Revertir en caso de error
            setPedidos(prev => prev.map(p => p.id === modifiedPedido.id ? originalPedido : p));
            return undefined;
        }
    };

    const handleAddPedido = async (data: { pedidoData: Omit<Pedido, 'id' | 'secuenciaPedido' | 'numeroRegistro' | 'fechaCreacion' | 'etapasSecuencia' | 'etapaActual' | 'subEtapaActual' | 'maquinaImpresion' | 'secuenciaTrabajo' | 'orden' | 'historial'>; secuenciaTrabajo: Etapa[]; }) => {
        const { pedidoData, secuenciaTrabajo } = data;
        const now = new Date();
        const newId = now.getTime().toString();
        const numeroRegistro = `REG-${now.toISOString().slice(0, 19).replace(/[-:T]/g, '')}-${newId.slice(-4)}`;
        const initialStage = Etapa.PREPARACION;
        const maxOrder = Math.max(...pedidos.map(p => p.orden), 0);

        const tempPedido: Pedido = {
            ...pedidoData,
            id: newId,
            secuenciaPedido: parseInt(newId.slice(-6)),
            orden: maxOrder + 1,
            numeroRegistro: numeroRegistro,
            fechaCreacion: now.toISOString(),
            etapaActual: initialStage,
            etapasSecuencia: [{ etapa: initialStage, fecha: now.toISOString() }],
            historial: [generarEntradaHistorial(currentUserRole, 'Creación', 'Pedido creado en Preparación.')],
            maquinaImpresion: '',
            secuenciaTrabajo,
            antivaho: pedidoData.antivaho || false,
            antivahoRealizado: false,
        };

        const initialSubEtapa = determinarEtapaPreparacion(tempPedido);

        const newPedido: Pedido = {
            ...tempPedido,
            subEtapaActual: initialSubEtapa,
        };

        const createdPedido = await store.create(newPedido);
        setPedidos(prev => [createdPedido, ...prev]);
        return createdPedido;
    };

    const handleConfirmSendToPrint = async (pedidoToUpdate: Pedido, impresionEtapa: Etapa, postImpresionSequence: Etapa[]) => {
        let updatedPedido = {
            ...pedidoToUpdate,
            secuenciaTrabajo: postImpresionSequence,
        };
        
        // Determinar si es una reconfirmación desde post-impresión
        const isReconfirmationFromPostImpresion = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedidoToUpdate.etapaActual);
        
        // Marcar antivahoRealizado en dos casos:
        // 1. Primera vez desde preparación a post-impresión
        // 2. Reconfirmación desde post-impresión (cualquier destino)
        if (pedidoToUpdate.antivaho && 
            ((pedidoToUpdate.etapaActual === 'PREPARACION' && KANBAN_FUNNELS.POST_IMPRESION.stages.includes(impresionEtapa)) ||
             isReconfirmationFromPostImpresion)) {
            updatedPedido.antivahoRealizado = true;
        }
        
        // Use the centralized stage update handler
        await handleUpdatePedidoEtapa(updatedPedido, impresionEtapa);
        
        // Find the latest version of the pedido after update
        const finalPedido = pedidos.find(p => p.id === pedidoToUpdate.id);
        return finalPedido || updatedPedido;
    };

    const handleArchiveToggle = async (pedido: Pedido) => {
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado.');
            return;
        }

        const isArchived = pedido.etapaActual === Etapa.ARCHIVADO;
        const newEtapa = isArchived ? Etapa.COMPLETADO : Etapa.ARCHIVADO;
        const actionText = isArchived ? 'desarchivado' : 'archivado';
        const historialAction = isArchived ? 'Desarchivado' : 'Archivado';
        
        const historialEntry = generarEntradaHistorial(currentUserRole, historialAction, `Pedido ${actionText}.`);
        const updatedPedidoData = { ...pedido, etapaActual: newEtapa, historial: [...pedido.historial, historialEntry] };
        
        const updatedPedido = await store.update(updatedPedidoData);
        setPedidos(prev => prev.map(p => p.id === pedido.id ? updatedPedido : p));
        return { updatedPedido, actionText };
    };

    const handleDeletePedido = async (pedidoId: string) => {
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado: Solo los administradores pueden eliminar pedidos.');
            return;
        }
        
        const pedidoToDelete = pedidos.find(p => p.id === pedidoId);
        if (!pedidoToDelete) return;

        // Optimistic deletion
        setPedidos(prev => prev.filter(p => p.id !== pedidoId));

        try {
            await store.delete(pedidoId);
            // Pedido eliminado permanentemente.
            return pedidoToDelete;
        } catch (error) {
            console.error('Error al eliminar el pedido:', error);
            // Revert on error
            setPedidos(prev => [...prev, pedidoToDelete].sort((a, b) => b.orden - a.orden));
            return undefined;
        }
    };

    const handleDuplicatePedido = async (pedidoToDuplicate: Pedido) => {
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado: Solo los administradores pueden duplicar pedidos.');
            return;
        }
    
        const now = new Date();
        const newId = now.getTime().toString();
        const numeroRegistro = `REG-${now.toISOString().slice(0, 19).replace(/[-:T]/g, '')}-${newId.slice(-4)}`;
        const initialStage = Etapa.PREPARACION;
        const maxOrder = Math.max(...pedidos.map(p => p.orden), 0);
    
        const newPedido: Pedido = {
            ...pedidoToDuplicate,
            id: newId,
            secuenciaPedido: parseInt(newId.slice(-6)),
            orden: maxOrder + 1,
            numeroRegistro: numeroRegistro,
            fechaCreacion: now.toISOString(),
            etapaActual: initialStage,
            etapasSecuencia: [{ etapa: initialStage, fecha: now.toISOString() }],
            historial: [generarEntradaHistorial(currentUserRole, 'Creación', `Pedido duplicado desde ${pedidoToDuplicate.numeroPedidoCliente} (ID: ${pedidoToDuplicate.id}).`)],
            maquinaImpresion: '', // Reset machine
            fechaFinalizacion: undefined,
            tiempoTotalProduccion: undefined,
            antivahoRealizado: false, // Reset antivaho status
        };
    
        const createdPedido = await store.create(newPedido);
        setPedidos(prev => [createdPedido, ...prev]);
        return createdPedido;
    };
    
    const handleExportData = async (pedidosToExport: Pedido[]) => {
        try {
            const jsonData = JSON.stringify(pedidosToExport, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStr = new Date().toISOString().slice(0, 10);
            a.download = `pedidos_backup_${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export data:", error);
            alert("Error al exportar los datos.");
        }
    };
    
    const handleImportData = (confirmCallback: (data: Pedido[]) => boolean) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error("File content is not text.");
                    
                    const importedPedidos: Pedido[] = JSON.parse(text);
                    if (!Array.isArray(importedPedidos) || !importedPedidos.every(p => p.id && p.numeroPedidoCliente)) {
                        throw new Error("Invalid JSON format. Expected an array of orders.");
                    }
                    
                    if (confirmCallback(importedPedidos)) {
                        setIsLoading(true);
                        await store.clear();
                        await store.bulkInsert(importedPedidos);
                        const freshData = await store.getAll();
                        setPedidos(freshData);
                        setIsLoading(false);
                        alert("Datos importados con éxito.");
                    }
                } catch (error) {
                    console.error("Failed to import data:", error);
                    alert(`Error al importar los datos: ${(error as Error).message}`);
                    setIsLoading(false);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleUpdatePedidoEtapa = async (pedido: Pedido, newEtapa: Etapa) => {
        const fromPostImpresion = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedido.etapaActual);
        const toImpresion = KANBAN_FUNNELS.IMPRESION.stages.includes(newEtapa);

        // Si el pedido tiene antivaho realizado y se intenta mover desde post-impresión a impresión,
        // mostrar el modal de confirmación
        if (pedido.antivaho && pedido.antivahoRealizado && fromPostImpresion && toImpresion) {
            setAntivahoModalState({ isOpen: true, pedido: pedido, toEtapa: newEtapa });
            return;
        }

        // Si el pedido tiene antivaho pero no está realizado y se mueve de post-impresión a impresión
        if (pedido.antivaho && !pedido.antivahoRealizado && fromPostImpresion && toImpresion) {
            setAntivahoModalState({ isOpen: true, pedido: pedido, toEtapa: newEtapa });
            return;
        }

        // Logic to reset antivahoRealizado if moving to PREPARACION
        let updatedPedido = { ...pedido };
        if (newEtapa === Etapa.PREPARACION) {
            updatedPedido.antivahoRealizado = false;
        }

        if (toImpresion) {
            updatedPedido.maquinaImpresion = ETAPAS[newEtapa]?.title;
        }

        // Proceed with the stage change
        updatedPedido.etapaActual = newEtapa;
        await handleSavePedido(updatedPedido);
    };

    const handleConfirmAntivaho = async () => {
        if (!antivahoModalState.pedido || !antivahoModalState.toEtapa) return;

        // Determinar si es una reconfirmación desde post-impresión
        const isReconfirmationFromPostImpresion = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(antivahoModalState.pedido.etapaActual);

        const updatedPedido = {
            ...antivahoModalState.pedido,
            antivahoRealizado: true, // Siempre marcar como realizado al confirmar
        };

        // Si se está moviendo a preparación, resetear el estado de antivaho
        if (antivahoModalState.toEtapa === Etapa.PREPARACION) {
            updatedPedido.antivahoRealizado = false;
        }

        const result = await handleSavePedido(updatedPedido);
        
        // Después de actualizar el pedido, proceder con el cambio de etapa
        if (result?.modifiedPedido) {
            const finalUpdatedPedido = { ...result.modifiedPedido, etapaActual: antivahoModalState.toEtapa };
            
            if (KANBAN_FUNNELS.IMPRESION.stages.includes(antivahoModalState.toEtapa)) {
                finalUpdatedPedido.maquinaImpresion = ETAPAS[antivahoModalState.toEtapa]?.title;
            }
            
            await handleSavePedido(finalUpdatedPedido);
            
            // Si es una reconfirmación desde post-impresión, no abrir el modal de envío
            // Solo abrir el modal si se está enviando a impresión desde preparación
            if (!isReconfirmationFromPostImpresion && KANBAN_FUNNELS.IMPRESION.stages.includes(antivahoModalState.toEtapa)) {
                setPedidoToSend(finalUpdatedPedido);
            }
        }

        setAntivahoModalState({ isOpen: false, pedido: null, toEtapa: null });
    };

    const handleCancelAntivaho = () => {
        setAntivahoModalState({ isOpen: false, pedido: null, toEtapa: null });
    };

    return {
      pedidos,
      setPedidos,
      isLoading,
      setIsLoading,
      handleSavePedido,
      handleAddPedido,
      handleConfirmSendToPrint,
      handleArchiveToggle,
      handleDuplicatePedido,
      handleDeletePedido,
      handleExportData,
      handleImportData,
      handleUpdatePedidoEtapa,
      antivahoModalState,
      handleConfirmAntivaho,
      handleCancelAntivaho,
    };
};