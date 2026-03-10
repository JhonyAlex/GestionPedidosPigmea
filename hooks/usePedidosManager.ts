import { useState, useEffect, useCallback } from 'react';
import { Pedido, UserRole, Etapa, HistorialEntry } from '../types';
import { store } from '../services/storage';
import { ETAPAS, KANBAN_FUNNELS, PREPARACION_SUB_ETAPAS_IDS } from '../constants';
import { determinarEtapaPreparacion } from '../utils/preparacionLogic';
import AntivahoConfirmationModal from '../components/AntivahoConfirmationModal';

// 🚀 Configuración de optimización
const USE_PAGINATION = false; // Desactivado: evita que la búsqueda omita pedidos no cargados
const ITEMS_PER_PAGE = 100; // Cargar 100 pedidos por página

export const usePedidosManager = (
    currentUserRole: UserRole,
    generarEntradaHistorial: (usuarioRole: UserRole, accion: string, detalles: string) => HistorialEntry,
    setPedidoToSend: React.Dispatch<React.SetStateAction<Pedido | null>>,
    // Agregamos los callbacks de sincronización
    subscribeToPedidoCreated?: (callback: (pedido: Pedido) => void) => () => void,
    subscribeToPedidoUpdated?: (callback: (pedido: Pedido) => void) => () => void,
    subscribeToPedidoDeleted?: (callback: (pedidoId: string) => void) => () => void,
    subscribeToPedidosByVendedorUpdated?: (callback: (data: any) => void) => () => void,
    subscribeToPedidosByClienteUpdated?: (callback: (data: any) => void) => () => void
) => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [antivahoModalState, setAntivahoModalState] = useState<{ isOpen: boolean; pedido: Pedido | null; toEtapa: Etapa | null }>({ isOpen: false, pedido: null, toEtapa: null });
    const [antivahoDestinationModalState, setAntivahoDestinationModalState] = useState<{ isOpen: boolean; pedido: Pedido | null }>({ isOpen: false, pedido: null });

    // 🚀 Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalPedidos, setTotalPedidos] = useState(0);

    // ✅ Set para trackear IDs de pedidos que están siendo creados localmente
    const [creatingPedidoIds] = useState<Set<string>>(new Set());

    // 🚀 Función para cargar pedidos (paginado o completo)
    const loadPedidos = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            setIsLoading(true);
            const startTime = Date.now();
            const timestamp = new Date().toISOString();

            console.log(`📊 [${timestamp}] Iniciando carga de pedidos (página ${page})...`);

            if (USE_PAGINATION && 'getPaginated' in store) {
                // Modo paginado - ✅ SIEMPRE cargar TODOS los pedidos (sin filtro de fecha)
                const { pedidos: newPedidos, pagination } = await (store as any).getPaginated({
                    page,
                    limit: ITEMS_PER_PAGE,
                    sinFiltroFecha: true, // 🔥 Cargar todos sin restricción de fecha
                });

                if (append) {
                    // Agregar a la lista existente (infinite scroll)
                    setPedidos(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const uniqueNew = newPedidos.filter((p: Pedido) => !existingIds.has(p.id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    // Reemplazar lista completa
                    setPedidos(newPedidos);
                }

                setTotalPedidos(pagination.total);
                setHasMore(page < pagination.totalPages);
                setCurrentPage(page);

                const loadTime = Date.now() - startTime;
                console.log(`✅ [${new Date().toISOString()}] Pedidos cargados (modo paginado):`);
                console.log(`   - Cargados: ${newPedidos.length} pedidos`);
                console.log(`   - Página: ${page}/${pagination.totalPages}`);
                console.log(`   - Total en sistema: ${pagination.total}`);
                console.log(`   - Tiempo de carga: ${loadTime}ms`);
            } else {
                // Modo legacy: cargar todo
                const currentPedidos = await store.getAll();
                const loadTime = Date.now() - startTime;

                setPedidos(currentPedidos);
                setTotalPedidos(currentPedidos.length);
                setHasMore(false);

                console.log(`✅ [${new Date().toISOString()}] Pedidos cargados (modo legacy):`);
                console.log(`   - Total: ${currentPedidos.length} pedidos`);
                console.log(`   - Tiempo de carga: ${loadTime}ms`);
            }
        } catch (error) {
            console.error("❌ Failed to fetch data from backend:", error);
            alert("No se pudo conectar al servidor. Por favor, asegúrese de que el backend esté en ejecución y sea accesible.");
        } finally {
            setIsLoading(false);
        }
    }, [setPedidos, setTotalPedidos, setHasMore, setCurrentPage, setIsLoading]);

    // Carga inicial
    useEffect(() => {
        loadPedidos(1, false);
    }, [loadPedidos]);

    // Configurar listeners para sincronización en tiempo real
    useEffect(() => {
        const unsubscribeFunctions: (() => void)[] = [];

        if (subscribeToPedidoCreated) {
            const unsubscribeCreated = subscribeToPedidoCreated((newPedido: Pedido) => {
                console.log('🔄 Sincronizando nuevo pedido desde WebSocket:', newPedido.numeroPedidoCliente, 'ID:', newPedido.id);

                // Verificar si este pedido está siendo creado localmente
                if (creatingPedidoIds.has(newPedido.id)) {
                    console.log('⚠️ Pedido en proceso de creación local, omitiendo evento WebSocket:', newPedido.numeroPedidoCliente);
                    // Remover del Set después de un delay para limpiar
                    setTimeout(() => {
                        creatingPedidoIds.delete(newPedido.id);
                    }, 1000);
                    return;
                }

                setPedidos(current => {
                    // Verificar si el pedido ya existe para evitar duplicados
                    const exists = current.some(p => p.id === newPedido.id);
                    if (!exists) {
                        console.log('✅ Añadiendo pedido desde WebSocket:', newPedido.numeroPedidoCliente);
                        return [newPedido, ...current];
                    } else {
                        console.log('⚠️ Pedido ya existe localmente, omitiendo duplicado:', newPedido.numeroPedidoCliente);
                        return current;
                    }
                });
            });
            unsubscribeFunctions.push(unsubscribeCreated);
        }

        if (subscribeToPedidoUpdated) {
            const unsubscribeUpdated = subscribeToPedidoUpdated((updatedPedido: Pedido) => {
                console.log('🔄 Sincronizando pedido actualizado:', updatedPedido.numeroPedidoCliente);

                // Verificar si cambió de etapa o sub-etapa (para debug de ordenamiento)
                const currentPedido = pedidos.find(p => p.id === updatedPedido.id);
                if (currentPedido) {
                    if (currentPedido.etapaActual !== updatedPedido.etapaActual) {
                        console.log(`📍 Etapa cambiada: ${currentPedido.etapaActual} → ${updatedPedido.etapaActual}`);
                    }
                    if (currentPedido.subEtapaActual !== updatedPedido.subEtapaActual) {
                        console.log(`📍 Sub-etapa cambiada: ${currentPedido.subEtapaActual} → ${updatedPedido.subEtapaActual}`);
                    }
                }

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

        if (subscribeToPedidosByVendedorUpdated) {
            const unsubscribeVendedorUpdated = subscribeToPedidosByVendedorUpdated((data: any) => {
                console.log('🔄 Vendedor actualizado, recargando pedidos:', data);
                // Recargar todos los pedidos porque el nombre del vendedor puede haber cambiado
                loadPedidos(1, false);
            });
            unsubscribeFunctions.push(unsubscribeVendedorUpdated);
        }

        if (subscribeToPedidosByClienteUpdated) {
            const unsubscribeClienteUpdated = subscribeToPedidosByClienteUpdated((data: any) => {
                console.log('🔄 Cliente actualizado, recargando pedidos:', data);
                loadPedidos(1, false);
            });
            unsubscribeFunctions.push(unsubscribeClienteUpdated);
        }

        // Cleanup function
        return () => {
            unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribeToPedidoCreated, subscribeToPedidoUpdated, subscribeToPedidoDeleted, subscribeToPedidosByVendedorUpdated, subscribeToPedidosByClienteUpdated, loadPedidos]);

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

        // ✅ ACTUALIZADO: Solo aplicar cambios automáticos si NO está en "SIN GESTION INICIADA"
        // Si está en "SIN GESTION INICIADA", el usuario tiene control total y el pedido NO se mueve automáticamente
        const isGestionNoIniciada = modifiedPedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA;

        if (modifiedPedido.etapaActual === Etapa.PREPARACION && !isGestionNoIniciada) {
            // Solo preguntar si NO está en "SIN GESTION INICIADA" y ambos están disponibles
            const shouldAskForConfirmation =
                modifiedPedido.subEtapaActual !== PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION &&
                modifiedPedido.materialDisponible === true &&
                modifiedPedido.clicheDisponible === true;

            if (shouldAskForConfirmation) {
                const confirmed = window.confirm(
                    '✅ Material y Cliché están listos\n\n' +
                    'Ambos requisitos están disponibles. ¿Desea mover el pedido a "Listo para Producción"?\n\n' +
                    'Si selecciona "Cancelar", el pedido se guardará pero permanecerá en su posición actual.'
                );

                if (!confirmed) {
                    // Usuario rechazó - mantener posición actual sin recalcular
                    modifiedPedido.subEtapaActual = originalPedidoCopy.subEtapaActual;
                } else {
                    // Usuario aceptó - aplicar movimiento automático
                    modifiedPedido.subEtapaActual = determinarEtapaPreparacion(modifiedPedido);
                }
            } else {
                // Aplicar lógica automática solo si NO está en "SIN GESTION INICIADA"
                modifiedPedido.subEtapaActual = determinarEtapaPreparacion(modifiedPedido);
            }
        } else if (modifiedPedido.etapaActual === Etapa.PREPARACION && isGestionNoIniciada) {
            // Si está en "SIN GESTION INICIADA", mantener ahí sin importar el estado del material/cliché
            modifiedPedido.subEtapaActual = PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA;
        }

        if (generateHistory) {
            const newHistoryEntries: HistorialEntry[] = [];
            const fieldsToCompare: Array<keyof Pedido> = [
                // Información básica
                'numeroPedidoCliente', 'cliente', 'clienteId', 'metros', 'fechaEntrega', 'nuevaFechaEntrega', 'fechaFinalizacion', 'prioridad',
                'maquinaImpresion', 'orden', 'vendedorId', 'vendedorNombre',
                // Información de producción
                'tipoImpresion', 'desarrollo', 'capa', 'tiempoProduccionDecimal', 'tiempoProduccionPlanificado', 'tiempoTotalProduccion',
                'observaciones',
                // Secuencia y etapas
                'secuenciaTrabajo', 'subEtapaActual', 'etapasSecuencia',
                // Datos de preparación
                'materialDisponible', 'clicheDisponible', 'estadoCliché', 'clicheInfoAdicional', 'compraCliche', 'recepcionCliche', 'camisa', 'antivaho', 'antivahoRealizado', 'anonimo', 'anonimoPostImpresion', 'atencionObservaciones',
                // Datos técnicos de material (excluimos materialCapas, materialConsumo y numerosCompra para manejarlos por separado)
                'producto', 'materialCapasCantidad', 'materialConsumoCantidad', 'observacionesMaterial',
                'bobinaMadre', 'bobinaFinal', 'minAdap', 'colores', 'minColor', 'microperforado', 'macroperforado'
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
                        : ['necesario', 'recibido', 'gestionado', 'micras', 'densidad'];

                    fieldsToCheck.forEach(field => {
                        const originalValue = originalItem[field];
                        const modifiedValue = modifiedItem[field];

                        if (JSON.stringify(originalValue) !== JSON.stringify(modifiedValue)) {
                            const itemType = arrayName === 'materialCapas' ? 'Lámina' : 'Material';
                            const fieldDisplayName = field === 'micras' ? 'Micras'
                                : field === 'densidad' ? 'Densidad'
                                    : field === 'necesario' ? 'Necesario'
                                        : field === 'recibido' ? 'Recibido'
                                            : field === 'gestionado' ? 'Gestionado'
                                                : field;

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
                                    `Material ${idx + 1}: ${item.necesario || 'N/A'} necesario, ${item.recibido ? 'Recibido' : 'Pendiente'}, ${item.gestionado ? 'Gestionado' : 'No gestionado'}`
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
                            `Material ${idx + 1}: ${item.necesario || 'N/A'} necesario, ${item.recibido ? 'Recibido' : 'Pendiente'}, ${item.gestionado ? 'Gestionado' : 'No gestionado'}`
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

                // ✅ SIEMPRE actualizar/crear entrada en etapasSecuencia con timestamp GARANTIZADO como el más reciente
                // Agregamos milisegundos para asegurar que sea ÚNICO y el pedido se coloque AL FINAL (FIFO)
                const existingEtapaIndex = modifiedPedido.etapasSecuencia.findIndex(
                    e => e.etapa === modifiedPedido.etapaActual
                );

                // Obtener el timestamp más reciente de TODAS las etapas y agregar 1ms para garantizar que sea el más nuevo
                const latestTimestamp = Math.max(
                    ...modifiedPedido.etapasSecuencia.map(e => new Date(e.fecha).getTime()),
                    Date.now()
                );
                const now = new Date(latestTimestamp + 1).toISOString();

                if (existingEtapaIndex === -1) {
                    // Si la etapa no existe en la secuencia, agregarla al final
                    modifiedPedido.etapasSecuencia = [
                        ...modifiedPedido.etapasSecuencia,
                        { etapa: modifiedPedido.etapaActual, fecha: now }
                    ];
                } else {
                    // Si ya existe (pedido regresando), actualizar la fecha a AHORA
                    // para que se coloque al final de la cola
                    modifiedPedido.etapasSecuencia = modifiedPedido.etapasSecuencia.map((e, idx) =>
                        idx === existingEtapaIndex
                            ? { ...e, fecha: now }
                            : e
                    );
                }

                // ✅ Establecer fecha de finalización cuando el pedido pasa a COMPLETADO
                if (modifiedPedido.etapaActual === Etapa.COMPLETADO && !modifiedPedido.fechaFinalizacion) {
                    modifiedPedido.fechaFinalizacion = new Date().toISOString();
                }
            }

            // ✅ Actualizar subEtapasSecuencia cuando cambia la sub-etapa (dentro de Preparación)
            if (modifiedPedido.etapaActual === Etapa.PREPARACION &&
                originalPedidoCopy.subEtapaActual !== modifiedPedido.subEtapaActual &&
                modifiedPedido.subEtapaActual) {

                const subEtapasSecuencia = modifiedPedido.subEtapasSecuencia || [];

                // Obtener el timestamp más reciente de TODAS las sub-etapas y agregar 1ms para garantizar que sea el más nuevo
                const latestTimestamp = subEtapasSecuencia.length > 0
                    ? Math.max(
                        ...subEtapasSecuencia.map(e => new Date(e.fecha).getTime()),
                        Date.now()
                    )
                    : Date.now();
                const now = new Date(latestTimestamp + 1).toISOString();

                const existingSubEtapaIndex = subEtapasSecuencia.findIndex(
                    e => e.subEtapa === modifiedPedido.subEtapaActual
                );

                if (existingSubEtapaIndex === -1) {
                    // Si la sub-etapa no existe, agregarla al final
                    modifiedPedido.subEtapasSecuencia = [
                        ...subEtapasSecuencia,
                        { subEtapa: modifiedPedido.subEtapaActual, fecha: now }
                    ];
                } else {
                    // Si ya existe (pedido regresando), actualizar la fecha a AHORA
                    // para que se coloque al final de la cola
                    modifiedPedido.subEtapasSecuencia = subEtapasSecuencia.map((e, idx) =>
                        idx === existingSubEtapaIndex
                            ? { ...e, fecha: now }
                            : e
                    );
                }
            }

            if (newHistoryEntries.length > 0) {
                modifiedPedido.historial = [...(modifiedPedido.historial || []), ...newHistoryEntries];
            }
            hasChanges = newHistoryEntries.length > 0;
        } else {
            hasChanges = JSON.stringify(originalPedidoCopy) !== JSON.stringify(modifiedPedido);
        }

        // Actualización optimista primero
        // Eliminamos la actualización optimista para confiar en el WebSocket
        // y evitar conflictos de estado.

        // Sanitizar secuenciaTrabajo: solo etapas de Post-Impresión son válidas
        if (modifiedPedido.secuenciaTrabajo) {
            modifiedPedido.secuenciaTrabajo = modifiedPedido.secuenciaTrabajo.filter(
                (etapa: Etapa) => KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapa)
            );
        }

        try {
            await store.update(modifiedPedido);
            // El estado se actualizará vía WebSocket (evento 'pedido-updated')
            return { modifiedPedido, hasChanges };
        } catch (error) {
            console.error('Error al actualizar el pedido:', error);
            return undefined;
        }
    };

    const handleAddPedido = async (data: { pedidoData: Omit<Pedido, 'id' | 'secuenciaPedido' | 'numeroRegistro' | 'fechaCreacion' | 'etapasSecuencia' | 'subEtapasSecuencia' | 'etapaActual' | 'subEtapaActual' | 'secuenciaTrabajo' | 'orden' | 'historial'>; secuenciaTrabajo: Etapa[]; }) => {
        const { pedidoData, secuenciaTrabajo } = data;
        const now = new Date();
        const newId = now.getTime().toString();
        const numeroRegistro = `REG-${now.toISOString().slice(0, 19).replace(/[-:T]/g, '')}-${newId.slice(-4)}`;
        const initialStage = Etapa.PREPARACION; // ✅ Los pedidos nuevos van a "Preparación" con sub-etapa "Sin Gestión Iniciada"
        const maxOrder = Math.max(...pedidos.map(p => p.orden), 0);

        // ✅ Calcular posición al final de la etapa PREPARACION
        const maxPosInPrep = pedidos
            .filter(p => p.etapaActual === Etapa.PREPARACION)
            .reduce((max, p) => Math.max(max, p.posicionEnEtapa || 0), 0);

        // ✅ Determinar la sub-etapa inicial basándose en los datos del pedido
        const initialSubEtapa = PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA; // Por defecto, todos los pedidos nuevos van a "Sin Gestión Iniciada"

        const newPedido: Pedido = {
            ...pedidoData,
            id: newId,
            secuenciaPedido: parseInt(newId.slice(-6)),
            orden: maxOrder + 1,
            numeroRegistro: numeroRegistro,
            fechaCreacion: now.toISOString(),
            etapaActual: initialStage,
            subEtapaActual: initialSubEtapa,
            etapasSecuencia: [{ etapa: initialStage, fecha: now.toISOString() }],
            subEtapasSecuencia: [{ subEtapa: initialSubEtapa, fecha: now.toISOString() }],
            historial: [generarEntradaHistorial(currentUserRole, 'Creación', 'Pedido creado en Preparación - Sin Gestión Iniciada.')],
            maquinaImpresion: pedidoData.maquinaImpresion || '',
            secuenciaTrabajo,
            antivaho: pedidoData.antivaho || false,
            antivahoRealizado: false,
            anonimo: pedidoData.anonimo || false,
            posicionEnEtapa: maxPosInPrep + 1,
        };

        // ✅ Marcar este ID como "en proceso de creación" ANTES de llamar al backend
        creatingPedidoIds.add(newId);

        try {
            const createdPedido = await store.create(newPedido);

            // ✅ Fix: Actualizar estado local INMEDIATAMENTE para feedback instantáneo
            setPedidos(current => [createdPedido, ...current]);

            // ✅ Remover del Set despues de un delay para permitir que el WS procese el evento
            setTimeout(() => {
                creatingPedidoIds.delete(newId);
            }, 2000);

            return createdPedido;
        } catch (error) {
            console.error("Error creating pedido:", error);
            creatingPedidoIds.delete(newId);
            throw error;
        }
    };

    const handleConfirmSendToPrint = async (pedidoToUpdate: Pedido, impresionEtapa: Etapa, postImpresionSequence: Etapa[]) => {
        let updatedPedido = {
            ...pedidoToUpdate,
            secuenciaTrabajo: postImpresionSequence,
        };

        // Determinar si es una reconfirmación desde post-impresión o desde listo para producción
        const isReconfirmationFromPostImpresion = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedidoToUpdate.etapaActual);
        const isFromListoProduccion = pedidoToUpdate.etapaActual === Etapa.PREPARACION &&
                                       pedidoToUpdate.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;

        // SOLO marcar antivahoRealizado en reconfirmaciones desde post-impresión o listo para producción
        // NO marcar cuando se envía por primera vez desde preparación (otras subetapas)
        if (pedidoToUpdate.antivaho && (isReconfirmationFromPostImpresion || isFromListoProduccion)) {
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
        // No actualizamos estado local, esperamos al WebSocket
        return { updatedPedido, actionText };
    };

    const handleDeletePedido = async (pedidoId: string) => {
        if (currentUserRole !== 'Administrador') {
            alert('Permiso denegado: Solo los administradores pueden eliminar pedidos.');
            return;
        }

        const pedidoToDelete = pedidos.find(p => p.id === pedidoId);
        if (!pedidoToDelete) return;

        try {
            await store.delete(pedidoId);
            // Pedido eliminado permanentemente. Esperamos evento WebSocket 'pedido-deleted'
            return pedidoToDelete;
        } catch (error) {
            console.error('Error al eliminar el pedido:', error);
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

        // ✅ Calcular posición al final de la etapa PREPARACION
        const maxPosDup = pedidos
            .filter(p => p.etapaActual === Etapa.PREPARACION)
            .reduce((max, p) => Math.max(max, p.posicionEnEtapa || 0), 0);

        // ✅ Guardar el numeroPedidoCliente ORIGINAL para el historial ANTES de cualquier modificación
        const numeroPedidoOriginal = pedidoToDuplicate.numeroPedidoCliente || '(sin número)';
        const idOriginal = pedidoToDuplicate.id;

        // ✅ FIX CRÍTICO: Hacer una copia profunda (deep copy) para evitar referencias compartidas
        // El operador spread solo hace copia superficial, lo que causa que arrays como
        // materialConsumo, etapasSecuencia, historial, etc. se compartan entre pedidos duplicados
        const pedidoClonado = JSON.parse(JSON.stringify(pedidoToDuplicate));

        const newPedido: Pedido = {
            ...pedidoClonado, // Ahora usamos la copia profunda
            id: newId,
            secuenciaPedido: parseInt(newId.slice(-6)),
            orden: maxOrder + 1,
            numeroRegistro: numeroRegistro,
            fechaCreacion: now.toISOString(),
            // ✅ FIX: Generar un numeroPedidoCliente temporal que indica que es un duplicado
            // El usuario DEBE cambiarlo, pero al menos no queda vacío en la BD
            numeroPedidoCliente: `COPIA-${numeroPedidoOriginal}`,
            etapaActual: initialStage,
            subEtapaActual: PREPARACION_SUB_ETAPAS_IDS.GESTION_NO_INICIADA, // ✅ Resetear sub-etapa a "Sin Gestión Iniciada"
            etapasSecuencia: [{ etapa: initialStage, fecha: now.toISOString() }],
            historial: [generarEntradaHistorial(currentUserRole, 'Creación', `Pedido duplicado desde ${numeroPedidoOriginal} (ID: ${idOriginal}).`)],
            maquinaImpresion: pedidoClonado.maquinaImpresion, // ✅ Mantener máquina de impresión (campo obligatorio)
            fechaFinalizacion: undefined,
            tiempoTotalProduccion: undefined,
            antivahoRealizado: false, // Reset antivaho status
            // ✅ CRÍTICO: Resetear campos de gestión de cliché y preparación
            // Estos campos afectan directamente la clasificación en reportes (CALCULO_REPORTES.md)
            horasConfirmadas: false, // ✅ Resetear horas confirmadas
            compraCliche: undefined, // ✅ Limpiar fecha de compra de cliché
            recepcionCliche: undefined, // ✅ Limpiar fecha de recepción de cliché
            estadoCliché: pedidoClonado.estadoCliché, // ✅ Mantener estado de cliché original (NUEVO, REPETICIÓN, etc.)
            clicheDisponible: false, // ✅ Resetear disponibilidad de cliché
            materialDisponible: false, // ✅ Resetear disponibilidad de material
            clicheInfoAdicional: undefined, // ✅ Limpiar información adicional de cliché
            posicionEnEtapa: maxPosDup + 1, // ✅ Posición al final de Preparación
        };

        // ✅ Marcar este ID como "en proceso de creación"
        creatingPedidoIds.add(newId);

        try {
            const createdPedido = await store.create(newPedido);

            // ✅ Fix: Actualizar estado local INMEDIATAMENTE para feedback instantáneo
            setPedidos(current => [createdPedido, ...current]);

            setTimeout(() => {
                creatingPedidoIds.delete(newId);
            }, 2000);

            return createdPedido;
        } catch (error) {
            console.error("Error duplicating pedido:", error);
            creatingPedidoIds.delete(newId);
            throw error;
        }
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

    const handleImportSelectedPedidos = async (selectedPedidos: Pedido[]) => {
        try {
            setIsLoading(true);
            await store.clear();
            await store.bulkInsert(selectedPedidos);
            const freshData = await store.getAll();
            setPedidos(freshData);
            setIsLoading(false);
            alert(`✅ ${selectedPedidos.length} pedidos importados con éxito.`);
        } catch (error) {
            console.error("Failed to import selected pedidos:", error);
            alert(`Error al importar los datos: ${(error as Error).message}`);
            setIsLoading(false);
        }
    };

    const handleUpdatePedidoEtapa = async (pedido: Pedido, newEtapa: Etapa, newSubEtapa?: string | null) => {
        const fromPostImpresion = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedido.etapaActual);
        const fromListoProduccion = pedido.etapaActual === Etapa.PREPARACION && 
                                     pedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;
        const toImpresion = KANBAN_FUNNELS.IMPRESION.stages.includes(newEtapa);

        // SOLO mostrar modal de confirmación si el antivaho NO está realizado
        // Si ya está realizado, debe comportarse como pedido normal
        // 🆕 EXTENDIDO: También aplica para pedidos desde "Listo para Producción"
        if (pedido.antivaho && !pedido.antivahoRealizado && (fromPostImpresion || fromListoProduccion) && toImpresion) {
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
        // Sub-etapa solo aplica a PreparaciÃ³n
        if (newEtapa === Etapa.PREPARACION) {
            updatedPedido.subEtapaActual = newSubEtapa ?? pedido.subEtapaActual;
        } else {
            updatedPedido.subEtapaActual = undefined;
        }
        // ✅ Asignar posicionEnEtapa: siempre al final de la etapa destino
        const maxPosInNewEtapa = pedidos
            .filter(p => p.etapaActual === newEtapa && p.id !== pedido.id)
            .reduce((max, p) => Math.max(max, p.posicionEnEtapa || 0), 0);
        updatedPedido.posicionEnEtapa = maxPosInNewEtapa + 1;
        await handleSavePedido(updatedPedido);
    };

    const handleConfirmAntivaho = async () => {
        if (!antivahoModalState.pedido || !antivahoModalState.toEtapa) return;

        // Determinar si es una reconfirmación desde post-impresión o desde listo para producción
        const isReconfirmationFromPostImpresion = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(antivahoModalState.pedido.etapaActual);
        const isFromListoProduccion = antivahoModalState.pedido.etapaActual === Etapa.PREPARACION &&
                                       antivahoModalState.pedido.subEtapaActual === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION;

        const updatedPedido = {
            ...antivahoModalState.pedido,
            antivahoRealizado: true, // Siempre marcar como realizado al confirmar
        };

        // Si se está moviendo a preparación, resetear el estado de antivaho
        if (antivahoModalState.toEtapa === Etapa.PREPARACION) {
            updatedPedido.antivahoRealizado = false;
        }

        const result = await handleSavePedido(updatedPedido);

        // Después de actualizar el pedido, verificar si viene de post-impresión y va a impresión
        if (result?.modifiedPedido) {
            const finalUpdatedPedido = { ...result.modifiedPedido };

            // Si viene de post-impresión y va a impresión, abrir modal de destino
            // ⚠️ MODIFICADO: El usuario solicitó que si antivaho está hecho, ya puede irse como un pedido normal
            // Se elimina la apertura del modal de destino y se deja fluir normal hacia la etapa destino
            /*
            if (isReconfirmationFromPostImpresion && KANBAN_FUNNELS.IMPRESION.stages.includes(antivahoModalState.toEtapa)) {
                // Cerrar el modal de confirmación de antivaho
                setAntivahoModalState({ isOpen: false, pedido: null, toEtapa: null });
                // Abrir el modal de selección de destino
                setAntivahoDestinationModalState({ isOpen: true, pedido: finalUpdatedPedido });
                return;
            }
            */

            // Si no, proceder con el flujo normal
            finalUpdatedPedido.etapaActual = antivahoModalState.toEtapa;

            if (KANBAN_FUNNELS.IMPRESION.stages.includes(antivahoModalState.toEtapa)) {
                finalUpdatedPedido.maquinaImpresion = ETAPAS[antivahoModalState.toEtapa]?.title;
            }

            // ✅ Asignar posicionEnEtapa: siempre al final de la etapa destino
            finalUpdatedPedido.posicionEnEtapa = Date.now();

            await handleSavePedido(finalUpdatedPedido);

            // Si es una reconfirmación desde post-impresión o desde listo para producción, no abrir el modal de envío
            // Solo abrir el modal si se está enviando a impresión desde preparación (otras subetapas)
            const shouldOpenSendModal = !isReconfirmationFromPostImpresion && 
                                        !isFromListoProduccion && 
                                        KANBAN_FUNNELS.IMPRESION.stages.includes(antivahoModalState.toEtapa);
            
            if (shouldOpenSendModal) {
                setPedidoToSend(finalUpdatedPedido);
            }
        }

        setAntivahoModalState({ isOpen: false, pedido: null, toEtapa: null });
    };

    const handleCancelAntivaho = () => {
        setAntivahoModalState({ isOpen: false, pedido: null, toEtapa: null });
    };

    const handleAntivahoDestinationImpresion = async () => {
        if (!antivahoDestinationModalState.pedido) return;

        const pedido = antivahoDestinationModalState.pedido;

        // Regresar a impresión - abrir el modal de envío a impresión
        setAntivahoDestinationModalState({ isOpen: false, pedido: null });
        setPedidoToSend(pedido);
    };

    const handleAntivahoDestinationListoProduccion = async () => {
        if (!antivahoDestinationModalState.pedido) return;

        const pedido = antivahoDestinationModalState.pedido;

        // Mover a Listo a Producción (sub-etapa de Preparación)
        const updatedPedido = {
            ...pedido,
            etapaActual: Etapa.PREPARACION,
            subEtapaActual: PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION,
        };

        await handleSavePedido(updatedPedido);
        setAntivahoDestinationModalState({ isOpen: false, pedido: null });
    };

    const handleCancelAntivahoDestination = () => {
        setAntivahoDestinationModalState({ isOpen: false, pedido: null });
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
        handleImportSelectedPedidos,
        handleUpdatePedidoEtapa,
        antivahoModalState,
        handleConfirmAntivaho,
        handleCancelAntivaho,
        antivahoDestinationModalState,
        setAntivahoDestinationModalState,
        handleAntivahoDestinationImpresion,
        handleAntivahoDestinationListoProduccion,
        handleCancelAntivahoDestination,
        handleSetReadyForProduction,
        // 🚀 Nuevas propiedades de paginación
        currentPage,
        hasMore,
        totalPedidos,
        loadMore: useCallback(() => {
            if (!isLoading && hasMore && USE_PAGINATION) {
                loadPedidos(currentPage + 1, true);
            }
        }, [currentPage, hasMore, isLoading, loadPedidos]),
        reloadPedidos: useCallback(() => {
            loadPedidos(1, false);
        }, [loadPedidos]),
    };
};
