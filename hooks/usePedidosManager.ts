import { useState, useEffect } from 'react';
import { Pedido, UserRole, Etapa, HistorialEntry } from '../types';
import { store } from '../services/storage';
import { ETAPAS, KANBAN_FUNNELS, PREPARACION_SUB_ETAPAS_IDS } from '../constants';
import { determinarEtapaPreparacion } from '../utils/preparacionLogic';
import AntivahoConfirmationModal from '../components/AntivahoConfirmationModal';

export const usePedidosManager = (
    currentUserRole: UserRole,
    generarEntradaHistorial: (usuarioRole: UserRole, accion: string, detalles: string) => HistorialEntry,
    setPedidoToSend: React.Dispatch<React.SetStateAction<Pedido | null>>,
    // Agregamos los callbacks de sincronización
    subscribeToPedidoCreated?: (callback: (pedido: Pedido) => void) => () => void,
    subscribeToPedidoUpdated?: (callback: (pedido: Pedido) => void) => () => void,
    subscribeToPedidoDeleted?: (callback: (pedidoId: string) => void) => () => void
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

    // Configurar listeners para sincronización en tiempo real
    useEffect(() => {
        const unsubscribeFunctions: (() => void)[] = [];

        if (subscribeToPedidoCreated) {
            const unsubscribeCreated = subscribeToPedidoCreated((newPedido: Pedido) => {
                console.log('🔄 Sincronizando nuevo pedido:', newPedido.numeroPedidoCliente);
                
                // Pequeño delay para permitir que el estado local se actualice primero
                setTimeout(() => {
                    setPedidos(current => {
                        // Verificar si el pedido ya existe para evitar duplicados
                        const exists = current.some(p => p.id === newPedido.id);
                        if (!exists) {
                            return [...current, newPedido];
                        } else {
                            return current;
                        }
                    });
                }, 100); // 100ms delay para que el estado local se procese primero
            });
            unsubscribeFunctions.push(unsubscribeCreated);
        }

        if (subscribeToPedidoUpdated) {
            const unsubscribeUpdated = subscribeToPedidoUpdated((updatedPedido: Pedido) => {
                console.log('🔄 Sincronizando pedido actualizado:', updatedPedido.numeroPedidoCliente);
                setPedidos(current => 
                    current.map(p => p.id === updatedPedido.id ? updatedPedido : p)
                );
            });
            unsubscribeFunctions.push(unsubscribeUpdated);
        }

        if (subscribeToPedidoDeleted) {
            const unsubscribeDeleted = subscribeToPedidoDeleted((deletedPedidoId: string) => {
                console.log('🔄 Sincronizando pedido eliminado:', deletedPedidoId);
                setPedidos(current => 
                    current.filter(p => p.id !== deletedPedidoId)
                );
            });
            unsubscribeFunctions.push(unsubscribeDeleted);
        }

        // Cleanup function
        return () => {
            unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribeToPedidoCreated, subscribeToPedidoUpdated, subscribeToPedidoDeleted]);

    const handleSavePedido = async (updatedPedido: Pedido, generateHistory = true) => {
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado: Solo los administradores pueden modificar pedidos.');
            return;
        }

        const originalPedido = pedidos.find(p => p.id === updatedPedido.id);
        if (!originalPedido) return;

        // Hacer una copia profunda del pedido original ANTES de cualquier modificación
        const originalPedidoCopy = JSON.parse(JSON.stringify(originalPedido));

        let modifiedPedido = { ...updatedPedido };
        let hasChanges = false;

        if (modifiedPedido.etapaActual === Etapa.PREPARACION) {
            modifiedPedido.subEtapaActual = determinarEtapaPreparacion(modifiedPedido);
        }
        
        if (generateHistory) {
            const newHistoryEntries: HistorialEntry[] = [];
            const fieldsToCompare: Array<keyof Pedido> = [
                // Información básica
                'numeroPedidoCliente', 'cliente', 'metros', 'fechaEntrega', 'nuevaFechaEntrega', 'fechaFinalizacion', 'prioridad', 
                'maquinaImpresion', 'orden', 'vendedor',
                // Información de producción
                'tipoImpresion', 'desarrollo', 'capa', 'tiempoProduccionPlanificado', 'tiempoTotalProduccion',
                'observaciones', 
                // Secuencia y etapas
                'secuenciaTrabajo', 'subEtapaActual', 'etapasSecuencia',
                // Datos de preparación
                'materialDisponible', 'clicheDisponible', 'estadoCliché', 'clicheInfoAdicional', 'camisa', 'antivaho', 'antivahoRealizado',
                // Datos técnicos de material (excluimos materialCapas, materialConsumo y numerosCompra para manejarlos por separado)
                'producto', 'materialCapasCantidad', 'materialConsumoCantidad', 
                'bobinaMadre', 'bobinaFinal', 'minAdap', 'colores', 'minColor'
            ];

            // Variables para controlar si se registraron cambios granulares
            let hasGranularMaterialCapasChanges = false;
            let hasGranularMaterialConsumoChanges = false;
            let hasGranularNumerosCompraChanges = false;

            // Manejar campos virtuales para auditoría específica de arrays anidados PRIMERO
            const checkNestedFields = (arrayName: 'materialCapas' | 'materialConsumo') => {
                const originalArray = originalPedidoCopy[arrayName] || [];
                const modifiedArray = modifiedPedido[arrayName] || [];
                const maxLength = Math.max(originalArray.length, modifiedArray.length);
                let hasChanges = false;

                for (let i = 0; i < maxLength; i++) {
                    const originalItem = originalArray[i] || {};
                    const modifiedItem = modifiedArray[i] || {};
                    
                    // Verificar cada campo del objeto
                    const fieldsToCheck = arrayName === 'materialCapas' 
                        ? ['micras', 'densidad'] 
                        : ['necesario', 'recibido'];
                    
                    fieldsToCheck.forEach(field => {
                        const originalValue = originalItem[field];
                        const modifiedValue = modifiedItem[field];
                        
                        if (JSON.stringify(originalValue) !== JSON.stringify(modifiedValue)) {
                            const itemType = arrayName === 'materialCapas' ? 'Lámina' : 'Material';
                            const fieldDisplayName = field === 'micras' ? 'Micras' 
                                : field === 'densidad' ? 'Densidad'
                                : field === 'necesario' ? 'Necesario' 
                                : 'Recibido';
                            
                            const formatNestedValue = (val: any) => {
                                if (val === null || val === undefined || val === '') return 'N/A';
                                return val.toString();
                            };
                            
                            newHistoryEntries.push(generarEntradaHistorial(
                                currentUserRole, 
                                `${itemType} ${i + 1} - ${fieldDisplayName}`, 
                                `Cambiado de '${formatNestedValue(originalValue)}' a '${formatNestedValue(modifiedValue)}'.`
                            ));
                            hasChanges = true;
                        }
                    });
                }

                return hasChanges;
            };

            // Verificar cambios granulares en materialCapas y materialConsumo
            hasGranularMaterialCapasChanges = checkNestedFields('materialCapas');
            hasGranularMaterialConsumoChanges = checkNestedFields('materialConsumo');

            // Verificar cambios granulares en numerosCompra (array de strings)
            const checkNumerosCompraChanges = () => {
                const originalArray = originalPedidoCopy.numerosCompra || [];
                const modifiedArray = modifiedPedido.numerosCompra || [];
                const maxLength = Math.max(originalArray.length, modifiedArray.length);
                let hasChanges = false;

                for (let i = 0; i < maxLength; i++) {
                    const originalValue = originalArray[i] || '';
                    const modifiedValue = modifiedArray[i] || '';
                    
                    if (originalValue !== modifiedValue) {
                        const action = !originalValue ? 'agregado' 
                            : !modifiedValue ? 'eliminado' 
                            : 'modificado';
                        
                        const details = !originalValue 
                            ? `Nº Compra #${i + 1} agregado: '${modifiedValue}'`
                            : !modifiedValue 
                            ? `Nº Compra #${i + 1} eliminado: '${originalValue}'`
                            : `Nº Compra #${i + 1} cambiado de '${originalValue}' a '${modifiedValue}'`;
                        
                        newHistoryEntries.push(generarEntradaHistorial(
                            currentUserRole, 
                            `Nº Compra #${i + 1}`, 
                            details
                        ));
                        hasChanges = true;
                    }
                }

                return hasChanges;
            };

            hasGranularNumerosCompraChanges = checkNumerosCompraChanges();

            // Comparar campos principales
            fieldsToCompare.forEach(key => {
                 if (JSON.stringify(originalPedidoCopy[key]) !== JSON.stringify(modifiedPedido[key])) {
                    const formatValue = (val: any, fieldName: string) => {
                        if (val === true) return 'Sí';
                        if (val === false) return 'No';
                        if (val === null || val === undefined) return 'N/A';
                        
                        // Manejar arrays de objetos específicamente para materialCapas y materialConsumo
                        if (Array.isArray(val)) {
                            if (fieldName.includes('materialCapas')) {
                                return val.map((item, idx) => 
                                    `Lámina ${idx + 1}: ${item.micras || 'N/A'} micras, ${item.densidad || 'N/A'} densidad`
                                ).join('; ') || 'Vacía';
                            } else if (fieldName.includes('materialConsumo')) {
                                return val.map((item, idx) => 
                                    `Material ${idx + 1}: ${item.necesario || 'N/A'} necesario, ${item.recibido || 'N/A'} recibido`
                                ).join('; ') || 'Vacía';
                            } else if (fieldName === 'etapasSecuencia') {
                                return val.map(v => ETAPAS[v]?.title || v).join(', ') || 'Vacía';
                            } else {
                                return val.join(', ') || 'Vacía';
                            }
                        }
                        
                        return val.toString();
                    };
                    
                    newHistoryEntries.push(generarEntradaHistorial(currentUserRole, `Campo Actualizado: ${key}`, `Cambiado de '${formatValue(originalPedidoCopy[key], key)}' a '${formatValue(modifiedPedido[key], key)}'.`));
                }
            });

            // Solo registrar cambios en materialCapas/materialConsumo si NO se registraron cambios granulares
            if (!hasGranularMaterialCapasChanges && JSON.stringify(originalPedidoCopy.materialCapas) !== JSON.stringify(modifiedPedido.materialCapas)) {
                const formatValue = (val: any) => {
                    if (val === null || val === undefined) return 'N/A';
                    if (Array.isArray(val)) {
                        return val.map((item, idx) => 
                            `Lámina ${idx + 1}: ${item.micras || 'N/A'} micras, ${item.densidad || 'N/A'} densidad`
                        ).join('; ') || 'Vacía';
                    }
                    return val.toString();
                };
                
                newHistoryEntries.push(generarEntradaHistorial(
                    currentUserRole, 
                    'Campo Actualizado: materialCapas', 
                    `Cambiado de '${formatValue(originalPedidoCopy.materialCapas)}' a '${formatValue(modifiedPedido.materialCapas)}'.`
                ));
            }

            if (!hasGranularMaterialConsumoChanges && JSON.stringify(originalPedidoCopy.materialConsumo) !== JSON.stringify(modifiedPedido.materialConsumo)) {
                const formatValue = (val: any) => {
                    if (val === null || val === undefined) return 'N/A';
                    if (Array.isArray(val)) {
                        return val.map((item, idx) => 
                            `Material ${idx + 1}: ${item.necesario || 'N/A'} necesario, ${item.recibido || 'N/A'} recibido`
                        ).join('; ') || 'Vacía';
                    }
                    return val.toString();
                };
                
                newHistoryEntries.push(generarEntradaHistorial(
                    currentUserRole, 
                    'Campo Actualizado: materialConsumo', 
                    `Cambiado de '${formatValue(originalPedidoCopy.materialConsumo)}' a '${formatValue(modifiedPedido.materialConsumo)}'.`
                ));
            }

            // Solo registrar cambios en numerosCompra si NO se registraron cambios granulares
            if (!hasGranularNumerosCompraChanges && JSON.stringify(originalPedidoCopy.numerosCompra) !== JSON.stringify(modifiedPedido.numerosCompra)) {
                const formatValue = (val: any) => {
                    if (val === null || val === undefined) return 'N/A';
                    if (Array.isArray(val)) {
                        return val.filter(n => n).map((n, idx) => `#${idx + 1}: ${n}`).join(', ') || 'Vacío';
                    }
                    return val.toString();
                };
                
                newHistoryEntries.push(generarEntradaHistorial(
                    currentUserRole, 
                    'Campo Actualizado: numerosCompra', 
                    `Cambiado de '${formatValue(originalPedidoCopy.numerosCompra)}' a '${formatValue(modifiedPedido.numerosCompra)}'.`
                ));
            }
            
            if (originalPedidoCopy.etapaActual !== modifiedPedido.etapaActual) {
                newHistoryEntries.push(generarEntradaHistorial(currentUserRole, 'Cambio de Etapa', `Movido de '${ETAPAS[originalPedidoCopy.etapaActual].title}' a '${ETAPAS[modifiedPedido.etapaActual].title}'.`));
            }
            
            if (newHistoryEntries.length > 0) {
                modifiedPedido.historial = [...(modifiedPedido.historial || []), ...newHistoryEntries];
            }
            hasChanges = newHistoryEntries.length > 0;
        } else {
             hasChanges = JSON.stringify(originalPedidoCopy) !== JSON.stringify(modifiedPedido);
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
            setPedidos(prev => prev.map(p => p.id === modifiedPedido.id ? originalPedidoCopy : p));
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
        
        // SOLO marcar antivahoRealizado en reconfirmaciones desde post-impresión
        // NO marcar cuando se envía por primera vez desde preparación
        if (pedidoToUpdate.antivaho && isReconfirmationFromPostImpresion) {
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

        // SOLO mostrar modal de confirmación si el antivaho NO está realizado
        // Si ya está realizado, debe comportarse como pedido normal
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

    const handleSetReadyForProduction = async (pedido: Pedido) => {
        if (pedido.etapaActual !== Etapa.PREPARACION) return;

        const updatedPedido = {
            ...pedido,
            subEtapaActual: PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION,
        };

        await handleSavePedido(updatedPedido, true);
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
      handleSetReadyForProduction,
    };
};