import { useState, useEffect, useCallback } from 'react';
import { Pedido, UserRole, Etapa, HistorialEntry, EstadoCliché } from '../types';
import { initialPedidos } from '../data/seedData';
import { IndexedDBStore } from '../services/storage';
import { ETAPAS } from '../constants';

export const usePedidosManager = (currentUserRole: UserRole, generarEntradaHistorial: (usuario: UserRole, accion: string, detalles: string) => HistorialEntry) => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [store, setStore] = useState<IndexedDBStore<Pedido> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initStore = async () => {
            setIsLoading(true);
            const pedidoStore = new IndexedDBStore<Pedido>('GestorPedidosDB', 'pedidos');
            await pedidoStore.init();
            setStore(pedidoStore);
    
            let currentPedidos = await pedidoStore.getAll();
            if (currentPedidos.length === 0) {
                console.log("No data found in IndexedDB, populating with seed data.");
                await pedidoStore.bulkInsert(initialPedidos);
                currentPedidos = await pedidoStore.getAll();
            }
            setPedidos(currentPedidos);
            setIsLoading(false);
        };
        initStore().catch(console.error);
    }, []);

    const handleSavePedido = async (updatedPedido: Pedido) => {
        if (!store) return;
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado: Solo los administradores pueden modificar pedidos.');
            return;
        }

        const originalPedido = pedidos.find(p => p.id === updatedPedido.id);
        if (!originalPedido) return;

        let modifiedPedido = { ...updatedPedido };
        const newHistoryEntries: HistorialEntry[] = [];
        const fieldsToCompare: Array<keyof Pedido> = ['numeroPedidoCliente', 'cliente', 'metros', 'fechaEntrega', 'prioridad', 'tipoImpresion', 'desarrollo', 'capa', 'tiempoProduccionPlanificado', 'observaciones', 'materialDisponible', 'estadoCliché', 'secuenciaTrabajo'];

        fieldsToCompare.forEach(key => {
             if (JSON.stringify(originalPedido[key]) !== JSON.stringify(modifiedPedido[key])) {
                const formatValue = (val: any) => val === true ? 'Sí' : (val === false ? 'No' : (Array.isArray(val) ? val.map(v => ETAPAS[v]?.title || v).join(', ') || 'Vacía' : val || 'N/A'));
                newHistoryEntries.push(generarEntradaHistorial(currentUserRole, `Campo Actualizado: ${key}`, `Cambiado de '${formatValue(originalPedido[key])}' a '${formatValue(modifiedPedido[key])}'.`));
            }
        });
        
        const originalEtapa = originalPedido.etapaActual;
        const modifiedEtapa = modifiedPedido.etapaActual;
        if (originalEtapa !== modifiedEtapa) {
            newHistoryEntries.push(generarEntradaHistorial(currentUserRole, 'Cambio de Etapa', `Movido de '${ETAPAS[originalEtapa].title}' a '${ETAPAS[modifiedEtapa].title}'.`));
        }
        
        if (newHistoryEntries.length > 0) {
            modifiedPedido.historial = [...(modifiedPedido.historial || []), ...newHistoryEntries];
        }

        await store.update(modifiedPedido);
        setPedidos(prev => prev.map(p => p.id === modifiedPedido.id ? modifiedPedido : p));
        return { modifiedPedido, hasChanges: newHistoryEntries.length > 0 };
    };

    const handleAddPedido = async (data: { pedidoData: Omit<Pedido, 'id' | 'secuenciaPedido' | 'numeroRegistro' | 'fechaCreacion' | 'etapasSecuencia' | 'etapaActual' | 'maquinaImpresion' | 'secuenciaTrabajo' | 'orden' | 'historial'>; secuenciaTrabajo: Etapa[]; }) => {
        if (!store) return;
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

        await store.create(newPedido);
        setPedidos(prev => [newPedido, ...prev]);
        return newPedido;
    };

    const handleConfirmSendToPrint = async (pedidoToUpdate: Pedido, impresionEtapa: Etapa, postImpresionSequence: Etapa[]) => {
        if (!store) return;
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
        
        await store.update(updatedPedido);
        setPedidos(prev => prev.map(p => p.id === updatedPedido.id ? updatedPedido : p));
        return updatedPedido;
    };

    const handleArchiveToggle = async (pedido: Pedido) => {
        if (!store) return;
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado.');
            return;
        }

        const isArchived = pedido.etapaActual === Etapa.ARCHIVADO;
        const newEtapa = isArchived ? Etapa.COMPLETADO : Etapa.ARCHIVADO;
        const actionText = isArchived ? 'desarchivado' : 'archivado';
        const historialAction = isArchived ? 'Desarchivado' : 'Archivado';
        
        const historialEntry = generarEntradaHistorial(currentUserRole, historialAction, `Pedido ${actionText}.`);
        const updatedPedido = { ...pedido, etapaActual: newEtapa, historial: [...pedido.historial, historialEntry] };
        
        await store.update(updatedPedido);
        setPedidos(prev => prev.map(p => p.id === pedido.id ? updatedPedido : p));
        return { updatedPedido, actionText };
    };

    return {
      pedidos,
      setPedidos,
      store,
      isLoading,
      setIsLoading,
      handleSavePedido,
      handleAddPedido,
      handleConfirmSendToPrint,
      handleArchiveToggle,
    };
};