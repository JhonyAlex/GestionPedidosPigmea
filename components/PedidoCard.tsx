import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Pedido, Etapa, UserRole, EstadoCliché, Prioridad } from '../types';
import { Material } from '../types/material';
import { PRIORIDAD_COLORS, KANBAN_FUNNELS } from '../constants';
import { puedeAvanzarSecuencia, estaFueraDeSecuencia } from '../utils/etapaLogic';
import { SparklesIcon } from './Icons';
import { usePermissions } from '../hooks/usePermissions';
import { useMaterialesManager } from '../hooks/useMaterialesManager';
import { formatDateDDMMYYYY } from '../utils/date';
import LockIndicator from './LockIndicator';

const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" /></svg>;
const RulerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>;
const ArchiveBoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>;
const ArrowRightCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3.375 3.375 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" /></svg>;

/**
 * 🎨 FUNCIÓN DE TEMA: Determina el color del badge de material según su estado
 * 
 * Jerarquía de Estados (Especificación del Usuario):
 * 1. VERDE: Material recibido (pendienteRecibir = false)
 * 2. AZUL: Pendiente de gestión (pendienteGestion = true && pendienteRecibir = true)
 * 3. ROJO: Gestionado pero no recibido (pendienteGestion = false && pendienteRecibir = true)
 * 
 * COMPATIBILIDAD: También soporta el sistema antiguo usando materialConsumo[].recibido
 */
const getMaterialTheme = (material: Material | { recibido?: boolean }, legacyMode: boolean = false) => {
    // Modo legacy: usar el campo recibido del sistema antiguo
    if (legacyMode && 'recibido' in material) {
        if (material.recibido === true) {
            return {
                bg: 'bg-green-100 dark:bg-green-900',
                text: 'text-green-800 dark:text-green-200',
                border: 'border-green-400',
                icon: '✅',
                label: 'Material Recibido',
                weight: 'font-medium'
            };
        }
        // Si recibido es false o undefined, mostrar como pendiente (rojo por defecto)
        return {
            bg: 'bg-red-100 dark:bg-red-900',
            text: 'text-red-800 dark:text-red-200',
            border: 'border-red-400',
            icon: '⏳',
            label: 'Pendiente de Recibir',
            weight: 'font-semibold border-2'
        };
    }
    
    // Modo nuevo: usar campos pendienteRecibir y pendienteGestion
    if ('pendienteRecibir' in material && 'pendienteGestion' in material) {
        const isRecibido = material.pendienteRecibir === false;
        const isGestionado = material.pendienteGestion === false;
        
        // ESTADO 1: VERDE (Finalizado - Material recibido)
        if (isRecibido) {
            return {
                bg: 'bg-green-100 dark:bg-green-900',
                text: 'text-green-800 dark:text-green-200',
                border: 'border-green-400',
                icon: '✅',
                label: 'Material Recibido',
                weight: 'font-medium'
            };
        }
        
        // ESTADO 2: AZUL (Inicial - Pendiente de gestionar)
        if (material.pendienteGestion === true) {
            return {
                bg: 'bg-blue-100 dark:bg-blue-900',
                text: 'text-blue-800 dark:text-blue-200',
                border: 'border-blue-400',
                icon: '🕑',
                label: 'Pendiente Gestión',
                weight: 'font-semibold border-2'
            };
        }
        
        // ESTADO 3: ROJO (En camino - Gestionado pero no recibido)
        // Esto ocurre cuando isGestionado === true && material.pendienteRecibir === true
        return {
            bg: 'bg-red-100 dark:bg-red-900',
            text: 'text-red-800 dark:text-red-200',
            border: 'border-red-400',
            icon: '⏳',
            label: 'Pendiente de Recibir',
            weight: 'font-semibold border-2'
        };
    }
                weight: 'font-semibold border-2'
            };
        }
    }
    
    // FALLBACK (Azul por defecto para estado indeterminado)
    return {
        bg: 'bg-blue-100 dark:bg-blue-900',
        text: 'text-blue-800 dark:text-blue-200',
        border: 'border-blue-300',
        icon: '❓',
        label: 'Estado Desconocido',
        weight: 'font-normal'
    };
};


interface PedidoCardProps {
    pedido: Pedido;
    onArchiveToggle: (pedido: Pedido) => void;
    onSelectPedido: (pedido: Pedido) => void;
    currentUserRole: UserRole;
    onAdvanceStage: (pedido: Pedido) => void;
    onSendToPrint?: (pedido: Pedido) => void; // Optional: for PreparacionView
    highlightedPedidoId?: string | null;
    onUpdatePedido?: (updatedPedido: Pedido) => Promise<void>;
    // Bulk selection props
    isSelected?: boolean;
    isSelectionActive?: boolean;
    onToggleSelection?: (id: string) => void;
    // Lock status props
    lockInfo?: {
        isLocked: boolean;
        isLockedByMe: boolean;
        lockedBy: string | null;
    };
}

const PedidoCard: React.FC<PedidoCardProps> = ({ 
    pedido, 
    onArchiveToggle, 
    onSelectPedido, 
    currentUserRole, 
    onAdvanceStage, 
    onSendToPrint, 
    highlightedPedidoId, 
    onUpdatePedido,
    isSelected = false,
    isSelectionActive = false,
    onToggleSelection,
    lockInfo
}) => {
    const { canMovePedidos, canArchivePedidos } = usePermissions();
    const { getMaterialesByPedidoId } = useMaterialesManager();
    const [isEditingFecha, setIsEditingFecha] = useState(false);
    const [tempFecha, setTempFecha] = useState(pedido.nuevaFechaEntrega || '');
    const dateInputRef = useRef<HTMLInputElement>(null);
    const dateContainerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // 🆕 Estado para materiales de la nueva tabla
    const [materialesNuevos, setMaterialesNuevos] = useState<Material[]>([]);
    const [loadingMateriales, setLoadingMateriales] = useState(false);
    
    // Usar valor por defecto si la prioridad no existe en PRIORIDAD_COLORS
    const priorityColor = PRIORIDAD_COLORS[pedido.prioridad] || PRIORIDAD_COLORS[Prioridad.NORMAL] || 'border-blue-500';

    // Detectar si es móvil
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    // 🆕 Cargar materiales de la nueva tabla (si existen)
    useEffect(() => {
        const loadMateriales = async () => {
            try {
                setLoadingMateriales(true);
                const mats = await getMaterialesByPedidoId(pedido.id);
                setMaterialesNuevos(mats);
            } catch (error) {
                // Si falla (ej: tabla no existe aún), usar sistema legacy
                console.log('Usando sistema legacy de materiales para pedido', pedido.id);
                setMaterialesNuevos([]);
            } finally {
                setLoadingMateriales(false);
            }
        };
        
        loadMateriales();
    }, [pedido.id, getMaterialesByPedidoId]);

    // Cerrar el editor al hacer click fuera del contenedor completo
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Solo cerrar si el click es fuera del contenedor completo (no solo el input)
            if (dateContainerRef.current && !dateContainerRef.current.contains(event.target as Node)) {
                handleCancelEdit();
            }
        };

        if (isEditingFecha) {
            // Pequeño delay para evitar que el click de apertura lo cierre inmediatamente
            setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditingFecha, tempFecha]);

    const handleFechaClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isSaving) {
            setIsEditingFecha(true);
            setTempFecha(pedido.nuevaFechaEntrega || '');
            // Enfocar el input después de un pequeño delay
            setTimeout(() => {
                dateInputRef.current?.focus();
                dateInputRef.current?.showPicker?.(); // Mostrar el calendario si está disponible
            }, 50);
        }
    };

    const handleFechaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Solo actualizar el estado temporal, NO guardar aún
        setTempFecha(e.target.value);
    };

    const handleSaveFecha = async () => {
        if (!onUpdatePedido || !tempFecha || tempFecha === pedido.nuevaFechaEntrega || isSaving) {
            setIsEditingFecha(false);
            return;
        }

        setIsSaving(true);
        
        try {
            const fechaAnterior = pedido.nuevaFechaEntrega || 'Sin fecha';
            
            // Actualizar el pedido con la nueva fecha
            const updatedPedido = {
                ...pedido,
                nuevaFechaEntrega: tempFecha,
                historial: [
                    ...(pedido.historial || []),
                    {
                        timestamp: new Date().toISOString(),
                        usuario: currentUserRole,
                        accion: 'Actualización de Nueva Fecha Entrega',
                        detalles: `Cambiado de '${fechaAnterior}' a '${tempFecha}'.`
                    }
                ]
            };

            await onUpdatePedido(updatedPedido);
            setIsEditingFecha(false);
        } catch (error) {
            console.error('Error al actualizar la fecha:', error);
            alert('Error al actualizar la fecha. Por favor, intente de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setTempFecha(pedido.nuevaFechaEntrega || '');
        setIsEditingFecha(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveFecha();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelEdit();
        }
    };

    const handleArchiveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onArchiveToggle(pedido);
    }
    
    const handleAdvanceClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (pedido.etapaActual === Etapa.PREPARACION && onSendToPrint) {
            onSendToPrint(pedido);
        } else if (pedido.antivaho && !pedido.antivahoRealizado && KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedido.etapaActual)) {
            // Para pedidos con antivaho en post-impresión, abrir modal de reconfirmación
            onAdvanceStage(pedido);
        } else {
            onAdvanceStage(pedido);
        }
    }

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleSelection) {
            onToggleSelection(pedido.id);
        }
    };

    const handleCardClick = () => {
        // Si hay selección activa, togglear la selección
        if (isSelectionActive && onToggleSelection) {
            onToggleSelection(pedido.id);
        } else {
            // Si no hay selección activa, abrir el modal de detalle
            onSelectPedido(pedido);
        }
    };

    const { canAdvance, advanceButtonTitle } = useMemo(() => {
        // Usar la nueva lógica centralizada
        const canAdvanceSequence = puedeAvanzarSecuencia(
            pedido.etapaActual, 
            pedido.secuenciaTrabajo, 
            pedido.antivaho, 
            pedido.antivahoRealizado
        );
        
        if (!canAdvanceSequence) {
            return { canAdvance: false, advanceButtonTitle: '' };
        }

        // Determinar el título del botón basado en la situación
        if (pedido.etapaActual === Etapa.PREPARACION && !!pedido.materialDisponible) {
            return { canAdvance: true, advanceButtonTitle: 'Enviar a Impresión' };
        }

        const isPrinting = KANBAN_FUNNELS.IMPRESION.stages.includes(pedido.etapaActual);
        const isPostPrinting = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedido.etapaActual);
        const isOutOfSequence = estaFueraDeSecuencia(pedido.etapaActual, pedido.secuenciaTrabajo);

        if (isPrinting && pedido.secuenciaTrabajo?.length > 0) {
            return { canAdvance: true, advanceButtonTitle: 'Iniciar Post-Impresión' };
        }
        
        if (isPostPrinting) {
            // Para pedidos con antivaho en post-impresión, permitir "continuar" para reconfirmar
            if (pedido.antivaho && !pedido.antivahoRealizado) {
                return { canAdvance: true, advanceButtonTitle: 'Continuar Secuencia' };
            }
            
            // Si está fuera de secuencia, ofrecer reordenar
            if (isOutOfSequence) {
                return { canAdvance: true, advanceButtonTitle: 'Reordenar y Continuar' };
            }
            
            // Lógica normal para pedidos en secuencia
            const currentIndex = pedido.secuenciaTrabajo?.indexOf(pedido.etapaActual) ?? -1;
            if (currentIndex > -1 && currentIndex < pedido.secuenciaTrabajo.length - 1) {
                return { canAdvance: true, advanceButtonTitle: 'Siguiente Etapa' };
            }
            if (currentIndex > -1 && currentIndex === pedido.secuenciaTrabajo.length - 1) {
                return { canAdvance: true, advanceButtonTitle: 'Marcar como Completado' };
            }
        }
        
        return { canAdvance: false, advanceButtonTitle: '' };
    }, [pedido]);

    return (
        <div 
            data-pedido-id={pedido.id}
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`bg-white dark:bg-gray-900 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 ${priorityColor} shadow-md ${pedido.id === highlightedPedidoId ? 'card-highlight' : ''} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''} relative`}>
            
            {/* Checkbox de selección */}
            {onToggleSelection && (
                <div 
                    className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${
                        isMobile || isHovered || isSelectionActive ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={handleCheckboxClick}
                        className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                    />
                </div>
            )}

            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-base text-gray-800 dark:text-gray-100">{pedido.numeroPedidoCliente}</h3>
                <div className="flex items-center gap-2">
                    {/* Indicador de preparación */}
                    {pedido.etapaActual === Etapa.PREPARACION && (
                        <div className="flex items-center gap-1">
                            {!pedido.materialDisponible && (
                                <span 
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 cursor-help" 
                                    title="❌ Material no disponible - Se requiere material para continuar"
                                >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            )}
                            {!pedido.clicheDisponible && (
                                <span 
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 cursor-help" 
                                    title={`⚠️ Cliché no disponible${pedido.estadoCliché ? ` - Estado: ${pedido.estadoCliché}` : ''}${pedido.clicheInfoAdicional ? `\nInfo: ${pedido.clicheInfoAdicional}` : ''}`}
                                >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            )}
                            {/* ✅ ACTUALIZADO: Badge "¡LISTO!" solo se muestra cuando:
                                1. subEtapaActual === LISTO_PARA_PRODUCCION
                                2. materialDisponible === true
                                3. clicheDisponible === true
                            */}
                            {pedido.subEtapaActual === 'LISTO_PARA_PRODUCCION' && 
                             pedido.materialDisponible === true && 
                             pedido.clicheDisponible === true && (
                                <span 
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg animate-pulse cursor-help" 
                                    title={`✅ ¡TODO LISTO! Puedes enviar este pedido a producción\n\nMaterial: Disponible ✓\nCliché: Disponible ✓${pedido.clicheInfoAdicional ? `\n\nInfo Cliché: ${pedido.clicheInfoAdicional}` : ''}\n\n👉 Usa el botón verde "→" para enviar a impresión`}
                                    style={{ animationDuration: '2s' }}
                                >
                                    <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    ¡LISTO!
                                </span>
                            )}
                            {/* ⚠️ NUEVO: Advertencias cuando está en "Listo para Producción" pero faltan requisitos */}
                            {pedido.subEtapaActual === 'LISTO_PARA_PRODUCCION' && !pedido.materialDisponible && (
                                <span 
                                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 cursor-help" 
                                    title="⚠️ En 'Listo para Producción' pero el material NO está disponible"
                                >
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Falta Material
                                </span>
                            )}
                            {pedido.subEtapaActual === 'LISTO_PARA_PRODUCCION' && !pedido.clicheDisponible && (
                                <span 
                                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 cursor-help" 
                                    title="⚠️ En 'Listo para Producción' pero el cliché NO está disponible"
                                >
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Falta Cliché
                                </span>
                            )}
                        </div>
                    )}
                    
                    {/* Indicador de bloqueo */}
                    {lockInfo && lockInfo.isLocked && (
                        <LockIndicator
                            isLocked={lockInfo.isLocked}
                            isLockedByMe={lockInfo.isLockedByMe}
                            lockedBy={lockInfo.lockedBy}
                            size="small"
                        />
                    )}
                    
                    {pedido.antivaho && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            pedido.antivahoRealizado 
                                ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' 
                                : 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                        }`} title={
                            pedido.antivahoRealizado 
                                ? "Antivaho Realizado ✓" 
                                : "Antivaho Pendiente"
                        }>
                            <SparklesIcon className="w-4 h-4 inline-block" />
                            {pedido.antivahoRealizado && <span className="ml-1 text-xs">✓</span>}
                        </span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${priorityColor.replace('border', 'bg').replace('-500','-900')} text-white`}>
                        {pedido.prioridad}
                    </span>
                </div>
            </div>
            
            <div className="mb-3 space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-300">{pedido.cliente}</p>
                {pedido.producto && (
                    <p 
                        className="text-xs text-gray-500 dark:text-gray-400 truncate" 
                        title={pedido.producto}
                    >
                        🏷️ {pedido.producto}
                    </p>
                )}
            </div>
            
            {/* 🆕 SECCIÓN DE MATERIALES - Soporte para nuevo sistema y legacy */}
            {(materialesNuevos.length > 0 || (pedido.numerosCompra && pedido.numerosCompra.length > 0 && pedido.numerosCompra.some(n => n && n.trim()))) && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="font-medium">Materiales:</span>{' '}
                    <span className="inline-flex flex-wrap gap-1">
                        {/* PRIORIDAD 1: Usar materiales de la nueva tabla si existen */}
                        {materialesNuevos.length > 0 ? (
                            materialesNuevos.map((material) => {
                                const theme = getMaterialTheme(material, false);
                                
                                return (
                                    <span 
                                        key={material.id}
                                        className={`${theme.bg} ${theme.text} ${theme.border} px-2 py-0.5 rounded border ${theme.weight}`}
                                        title={`${material.numero} - ${theme.label}`}
                                    >
                                        <span className="mr-1">{theme.icon}</span>
                                        {material.numero}
                                    </span>
                                );
                            })
                        ) : (
                            /* FALLBACK: Usar sistema legacy (numerosCompra + materialConsumo) */
                            pedido.numerosCompra
                                ?.map((numero, index) => {
                                    // Filtrar números vacíos
                                    if (!numero || !numero.trim()) return null;
                                    
                                    // Usar el campo recibido del sistema antiguo
                                    const materialItem = pedido.materialConsumo?.[index];
                                    const theme = getMaterialTheme({ recibido: materialItem?.recibido }, true);
                                    
                                    return (
                                        <span 
                                            key={`${pedido.id}-compra-${index}`} 
                                            className={`${theme.bg} ${theme.text} ${theme.border} px-2 py-0.5 rounded border ${theme.weight}`}
                                            title={`${numero} - ${theme.label} (Sistema Legacy)`}
                                        >
                                            <span className="mr-1">{theme.icon}</span>
                                            {pedido.numerosCompra!.filter(n => n && n.trim()).length === 1 
                                                ? numero 
                                                : `#${pedido.numerosCompra!.filter((n, i) => i <= index && n && n.trim()).length}: ${numero}`
                                            }
                                        </span>
                                    );
                                })
                                .filter(Boolean)
                        )}
                    </span>
                </div>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span className="flex items-center" title="Fecha Entrega">
                    <CalendarIcon /> {formatDateDDMMYYYY(pedido.fechaEntrega)}
                </span>
                <div className="flex flex-col items-end gap-0.5">
                    {pedido.desarrollo && (
                        <span className="flex items-center text-xs" title="Desarrollo">
                            <span className="font-medium mr-1">Desarr:</span> {pedido.desarrollo}
                        </span>
                    )}
                    {pedido.tiempoProduccionPlanificado && (
                        <span className="flex items-center text-xs" title="Tiempo de Producción Planificado">
                            <ClockIcon /> {pedido.tiempoProduccionPlanificado}
                        </span>
                    )}
                    <span className="flex items-center" title="Metros">
                        <RulerIcon /> {pedido.metros} m
                    </span>
                </div>
            </div>
            
            {pedido.nuevaFechaEntrega && (
                <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mb-2" ref={dateContainerRef}>
                    <CalendarIcon />
                    {isEditingFecha ? (
                        <div className="flex items-center gap-1 flex-1">
                            <input
                                ref={dateInputRef}
                                type="date"
                                value={tempFecha}
                                onChange={handleFechaInputChange}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                disabled={isSaving}
                                className="flex-1 font-semibold bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveFecha();
                                }}
                                disabled={isSaving || !tempFecha || tempFecha === pedido.nuevaFechaEntrega}
                                className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Guardar (Enter)"
                            >
                                {isSaving ? '...' : '✓'}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEdit();
                                }}
                                disabled={isSaving}
                                className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Cancelar (Esc)"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <span 
                            className="font-semibold cursor-pointer hover:underline hover:bg-blue-100 dark:hover:bg-blue-900/50 px-1 py-0.5 rounded transition-colors"
                            onClick={handleFechaClick}
                            title="Click para editar la fecha"
                        >
                            Nueva: {formatDateDDMMYYYY(pedido.nuevaFechaEntrega)}
                        </span>
                    )}
                </div>
            )}
            
            <div className="flex items-center justify-end gap-1">
                     {canAdvance && canMovePedidos() && (
                        <button 
                            onClick={handleAdvanceClick} 
                            className="text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 p-1"
                            aria-label={advanceButtonTitle}
                            title={advanceButtonTitle}
                        >
                            <ArrowRightCircleIcon />
                        </button>
                    )}
                     {(pedido.etapaActual === Etapa.COMPLETADO || pedido.etapaActual === Etapa.PREPARACION) && canArchivePedidos() && (
                        <button 
                            onClick={handleArchiveClick} 
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                            aria-label="Archivar Pedido"
                            title="Archivar Pedido"
                        >
                            <ArchiveBoxIcon />
                        </button>
                    )}
                </div>
        </div>
    );
};

export default PedidoCard;