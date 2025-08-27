import { useState, useEffect } from 'react';
import { Pedido, UserRole, Etapa, HistorialEntry } from '../types';
import { store } from '../services/storage';
import { ETAPAS } from '../constants';
import { determinarSubEtapaPreparacion } from '../utils/preparacionLogic';

export const usePedidosManager = (currentUserRole: UserRole, generarEntradaHistorial: (usuario: UserRole, accion: string, detalles: string) => HistorialEntry) => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
        
        if (generateHistory) {
            const newHistoryEntries: HistorialEntry[] = [];
            const fieldsToCompare: Array<keyof Pedido> = [
                'numeroPedidoCliente', 'cliente', 'metros', 'fechaEntrega', 'prioridad', 
                'tipoImpresion', 'desarrollo', 'capa', 'tiempoProduccionPlanificado', 
                'observaciones', 'materialDisponible', 'estadoCliché', 'secuenciaTrabajo',
                'camisa', 'producto', 'materialCapasCantidad', 'materialCapas', 
                'materialConsumoCantidad', 'materialConsumo', 'bobinaMadre', 'bobinaFinal', 
                'minAdap', 'colores', 'maquinaImpresion', 'orden', 'minColor', 'clicheDisponible'
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

        // Lógica de enrutamiento automático para preparación
        if (modifiedPedido.etapaActual === Etapa.PREPARACION) {
            const subEtapa = determinarSubEtapaPreparacion(modifiedPedido);
            // Aquí no se actualiza la etapa, se asume que el dragLogic lo maneja
            // o que el estado ya es correcto. El guardado es para persistir los checkboxes.
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

    const handleAddPedido = async (data: { pedidoData: Omit<Pedido, 'id' | 'secuenciaPedido' | 'numeroRegistro' | 'fechaCreacion' | 'etapasSecuencia' | 'etapaActual' | 'maquinaImpresion' | 'secuenciaTrabajo' | 'orden' | 'historial'>; secuenciaTrabajo: Etapa[]; }) => {
        const { pedidoData, secuenciaTrabajo } = data;
        const now = new Date();
        const newId = now.getTime().toString();
        const numeroRegistro = `REG-${now.toISOString().slice(0, 19).replace(/[-:T]/g, '')}-${newId.slice(-4)}`;
        const initialStage = Etapa.PREPARACION;
        const maxOrder = Math.max(...pedidos.map(p => p.orden), 0);

        const newPedido: Pedido = {
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
        };

        const createdPedido = await store.create(newPedido);
        setPedidos(prev => [createdPedido, ...prev]);
        return createdPedido;
    };

    const handleConfirmSendToPrint = async (pedidoToUpdate: Pedido, impresionEtapa: Etapa, postImpresionSequence: Etapa[]) => {
        const detalles = `Movido de 'Preparación' a '${ETAPAS[impresionEtapa].title}'.`;
        const historialEntry = generarEntradaHistorial(currentUserRole, 'Enviado a Impresión', detalles);
        
        const updatedPedido = {
            ...pedidoToUpdate,
            etapaActual: impresionEtapa,
            maquinaImpresion: ETAPAS[impresionEtapa].title,
            secuenciaTrabajo: postImpresionSequence,
            etapasSecuencia: [...pedidoToUpdate.etapasSecuencia, { etapa: impresionEtapa, fecha: new Date().toISOString() }],
            historial: [...pedidoToUpdate.historial, historialEntry],
        };
        
        // Actualización optimista primero
        setPedidos(prev => prev.map(p => p.id === updatedPedido.id ? updatedPedido : p));
        
        // Luego actualización en almacenamiento (en background)
        try {
            const savedPedido = await store.update(updatedPedido);
            return savedPedido;
        } catch (error) {
            console.error('Error al enviar a impresión:', error);
            // Revertir en caso de error
            setPedidos(prev => prev.map(p => p.id === updatedPedido.id ? pedidoToUpdate : p));
            return undefined;
        }
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
    };
};