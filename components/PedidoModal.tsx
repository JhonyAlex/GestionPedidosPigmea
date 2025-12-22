import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Pedido, Prioridad, Etapa, UserRole, TipoImpresion, EstadoCliché } from '../types';
import { calcularTiempoRealProduccion, parseTimeToMinutes, formatMinutesToHHMM } from '../utils/kpi';
import { formatDateTimeDDMMYYYY } from '../utils/date';
import { puedeAvanzarSecuencia, estaFueraDeSecuencia } from '../utils/etapaLogic';
import { ETAPAS, KANBAN_FUNNELS, PREPARACION_COLUMNS, PREPARACION_SUB_ETAPAS_IDS } from '../constants';
import SequenceBuilder from './SequenceBuilder';
import SeccionDatosTecnicosDeMaterial from './SeccionDatosTecnicosDeMaterial';
import CommentSystem from './comments/CommentSystem';
// import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { useVendedoresManager } from '../hooks/useVendedoresManager';
import { useClientesManager, type Cliente } from '../hooks/useClientesManager';
import { usePedidoLock } from '../hooks/usePedidoLock';
import { useMaterialesManager } from '../hooks/useMaterialesManager';
import type { Material } from '../types/material';
import ClienteModalMejorado from './ClienteModalMejorado';
import { useActionRecorder } from '../hooks/useActionRecorder';

const DuplicateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.75 0h-3.375c-.621 0-1.125.504-1.125 1.125v6.75c0 .621.504 1.125 1.125 1.125h3.375c.621 0 1.125-.504 1.125-1.125v-6.75a1.125 1.125 0 0 0-1.125-1.125Z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const ArrowPathIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.696v4.992h-4.992m0 0-3.181-3.183a8.25 8.25 0 0 1 11.667 0l3.181 3.183" /></svg>;
const ArchiveBoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>;
const PaperAirplaneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>;

const decimalToHHMM = (decimal: number): string => {
    if (!Number.isFinite(decimal) || decimal < 0) {
        return '00:00';
    }

    const totalMinutes = Math.max(0, Math.round(decimal * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const hhmmToDecimal = (value: string | null | undefined): number | null => {
    if (!value || !value.includes(':')) {
        return null;
    }

    const [hoursStr, minutesStr] = value.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || minutes < 0) {
        return null;
    }

    const totalMinutes = hours * 60 + minutes;
    return parseFloat((Math.max(0, totalMinutes) / 60).toFixed(2));
};

const formatDecimalForInput = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '';
    }

    return value.toString();
};

const sanitizeDecimalInput = (value: string): string => value.replace(',', '.');

// Icons for history
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;

const getHistoryIcon = (action: string) => {
    if (action.includes('Creación')) return <PlusCircleIcon />;
    if (action.includes('Etapa') || action.includes('Enviado')) return <ArrowPathIcon />;
    if (action.includes('Archivado') || action.includes('Desarchivado')) return <ArchiveBoxIcon />;
    if (action.includes('Preparación') || action.includes('Actualización en Preparación')) return <PaperAirplaneIcon />;
    return <PencilIcon />;
};


interface PedidoModalProps {
    pedido: Pedido;
    onClose: () => void;
    onSave: (pedido: Pedido) => void;
    onArchiveToggle: (pedido: Pedido) => void;
    onDuplicate: (pedido: Pedido) => void;
    onDelete: (pedidoId: string) => void;
    // currentUserRole: UserRole;
    onAdvanceStage: (pedido: Pedido) => void;
    onSendToPrint: (pedido: Pedido) => void;
    onSetReadyForProduction: (pedido: Pedido) => void;
    onUpdateEtapa: (pedido: Pedido, newEtapa: Etapa) => void;
    isConnected?: boolean;
}

const PedidoModal: React.FC<PedidoModalProps> = ({ pedido, onClose, onSave, onArchiveToggle, onAdvanceStage, onSendToPrint, onDuplicate, onDelete, onSetReadyForProduction, onUpdateEtapa, isConnected = false }) => {
    const [formData, setFormData] = useState<Pedido>(JSON.parse(JSON.stringify(pedido)));
    const [tiempoProduccionDecimalInput, setTiempoProduccionDecimalInput] = useState<string>(() => formatDecimalForInput(pedido.tiempoProduccionDecimal));
    const [activeTab, setActiveTab] = useState<'detalles' | 'gestion' | 'historial'>('detalles');
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [nuevoVendedor, setNuevoVendedor] = useState('');
    const [showVendedorInput, setShowVendedorInput] = useState(false);
    const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
    const [showLockWarning, setShowLockWarning] = useState(false);
    const [lockWarningMessage, setLockWarningMessage] = useState('');
    const [isEtapaDropdownOpen, setIsEtapaDropdownOpen] = useState(false);
    const [pedidoMateriales, setPedidoMateriales] = useState<Material[]>([]);
    
    const { user } = useAuth();
    const { vendedores, addVendedor, fetchVendedores } = useVendedoresManager();
    const { clientes, addCliente, fetchClientes, isLoading: isLoadingClientes } = useClientesManager();
    const { materiales, updateMaterial, getMaterialesByPedidoId } = useMaterialesManager();
    const { recordPedidoUpdate } = useActionRecorder();
    // const permissions = usePermissions();
    
    // Permisos eliminados: todos los usuarios pueden editar, borrar, archivar y mover pedidos
    const canEditPedidos = () => true;
    const canDeletePedidos = () => true;
    const canArchivePedidos = () => true;
    const canMovePedidos = () => true;
    
    // Sistema de bloqueo de pedidos
    const {
        isLocked,
        isLockedByMe,
        lockedBy,
        lockPedido,
        unlockPedido
    } = usePedidoLock({
        pedidoId: pedido.id,
        onLockDenied: (lockedByUser) => {
            setLockWarningMessage(`Este pedido está siendo editado por ${lockedByUser}`);
            setShowLockWarning(true);
        },
        onLockLost: () => {
            alert('⚠️ Has perdido el bloqueo de este pedido por inactividad. Los cambios no guardados se perderán.');
            if (typeof onClose === 'function') {
                onClose();
            } else {
                console.warn('PedidoModal: onClose no es una función, no se puede cerrar automáticamente.');
            }
        },
        autoUnlock: true
    });
    
    // El modal nunca es de solo lectura (todos pueden editar)
    const isReadOnly = false;

    // Función para detectar si hay cambios no guardados
    const hasUnsavedChanges = useMemo(() => {
        return JSON.stringify(formData) !== JSON.stringify(pedido);
    }, [formData, pedido]);

    useEffect(() => {
        // Hacer una copia profunda para evitar modificar el pedido original
        const clonedPedido: Pedido = JSON.parse(JSON.stringify(pedido));

        if (typeof clonedPedido.tiempoProduccionDecimal === 'number') {
            const normalizedDecimal = parseFloat(clonedPedido.tiempoProduccionDecimal.toFixed(2));
            clonedPedido.tiempoProduccionDecimal = normalizedDecimal;
            clonedPedido.tiempoProduccionPlanificado = decimalToHHMM(normalizedDecimal);
        } else if (clonedPedido.tiempoProduccionPlanificado) {
            const derivedDecimal = hhmmToDecimal(clonedPedido.tiempoProduccionPlanificado);
            if (derivedDecimal !== null) {
                clonedPedido.tiempoProduccionDecimal = derivedDecimal;
                clonedPedido.tiempoProduccionPlanificado = decimalToHHMM(derivedDecimal);
            }
        } else {
            clonedPedido.tiempoProduccionPlanificado = '00:00';
        }

        setFormData(clonedPedido);
        setTiempoProduccionDecimalInput(formatDecimalForInput(clonedPedido.tiempoProduccionDecimal));
    }, [pedido]);

    useEffect(() => {
        const derivedDecimal = hhmmToDecimal(formData.tiempoProduccionPlanificado);
        if (derivedDecimal === null) {
            return;
        }

        if (
            formData.tiempoProduccionDecimal === null ||
            formData.tiempoProduccionDecimal === undefined ||
            Math.abs(formData.tiempoProduccionDecimal - derivedDecimal) > 0.009
        ) {
            setFormData(prev => ({
                ...prev,
                tiempoProduccionDecimal: derivedDecimal,
            }));
            setTiempoProduccionDecimalInput(formatDecimalForInput(derivedDecimal));
        }
    }, [formData.tiempoProduccionPlanificado]);

    const handleDecimalTimeChange = useCallback((rawValue: string) => {
        const sanitizedValue = sanitizeDecimalInput(rawValue);
        setTiempoProduccionDecimalInput(rawValue);

        if (sanitizedValue.trim() === '') {
            setFormData(prev => ({
                ...prev,
                tiempoProduccionDecimal: null,
                tiempoProduccionPlanificado: '00:00',
            }));
            return;
        }

        const parsed = Number(sanitizedValue);
        if (!Number.isFinite(parsed) || parsed < 0) {
            return;
        }

        const normalized = parseFloat(parsed.toFixed(2));
        const hhmmValue = decimalToHHMM(normalized);

        setFormData(prev => ({
            ...prev,
            tiempoProduccionDecimal: normalized,
            tiempoProduccionPlanificado: hhmmValue,
        }));
    }, [setFormData]);

    const handleDecimalTimeBlur = useCallback(() => {
        const sanitizedValue = sanitizeDecimalInput(tiempoProduccionDecimalInput);
        if (sanitizedValue.trim() === '') {
            setTiempoProduccionDecimalInput(formatDecimalForInput(formData.tiempoProduccionDecimal));
            return;
        }

        const parsed = Number(sanitizedValue);
        if (!Number.isFinite(parsed) || parsed < 0) {
            setTiempoProduccionDecimalInput(formatDecimalForInput(formData.tiempoProduccionDecimal));
            return;
        }

        const normalized = parseFloat(parsed.toFixed(2));
        const formatted = formatDecimalForInput(normalized);
        setTiempoProduccionDecimalInput(formatted);

        setFormData(prev => ({
            ...prev,
            tiempoProduccionDecimal: normalized,
            tiempoProduccionPlanificado: decimalToHHMM(normalized),
        }));
    }, [formData.tiempoProduccionDecimal, setFormData, tiempoProduccionDecimalInput]);

    // Solicitar bloqueo al abrir el modal (solo una vez al montar)
    useEffect(() => {
        console.log('🔒 [MODAL] Modal montado - verificando permisos para bloqueo');
        if (canEditPedidos()) {
            console.log('✅ [MODAL] Tiene permisos - solicitando bloqueo');
            lockPedido();
        } else {
            console.log('⚠️ [MODAL] Sin permisos de edición - no se solicita bloqueo');
        }
        // Solo ejecutar al montar, NO agregar lockPedido a las dependencias
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ✅ Array vacío = solo al montar

    // Cargar materiales asociados al pedido
    useEffect(() => {
        let isMounted = true;
        
        const loadMateriales = async () => {
            try {
                const mats = await getMaterialesByPedidoId(pedido.id);
                if (isMounted) {
                    setPedidoMateriales(mats);
                }
            } catch (error) {
                console.error('Error cargando materiales:', error);
            }
        };
        
        loadMateriales();
        
        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pedido.id]); // ⚠️ CRÍTICO: Solo depender de pedido.id

    // Limpiar el warning cuando el pedido se desbloquea
    useEffect(() => {
        if (!isLocked || isLockedByMe) {
            // Si el pedido no está bloqueado O si soy yo quien lo tiene bloqueado, ocultar el warning
            if (showLockWarning) {
                console.log('🔓 [MODAL] Pedido desbloqueado - ocultando warning');
                setShowLockWarning(false);
                setLockWarningMessage('');
            }
        } else if (isLocked && !isLockedByMe && lockedBy) {
            // Si está bloqueado por otro usuario, mostrar el warning
            if (!showLockWarning) {
                console.log('🔒 [MODAL] Pedido bloqueado por otro usuario - mostrando warning');
                setLockWarningMessage(`Este pedido está siendo editado por ${lockedBy}`);
                setShowLockWarning(true);
            }
        }
    }, [isLocked, isLockedByMe, lockedBy, showLockWarning]);

    // Cargar vendedores al montar el componente
    useEffect(() => {
        fetchVendedores();
    }, [fetchVendedores]);

    // Cargar clientes al montar el componente
    useEffect(() => {
        fetchClientes();
    }, [fetchClientes]);

    // Efecto para resolver clienteId si solo tenemos el nombre del cliente
    useEffect(() => {
        if (formData.cliente && !formData.clienteId && clientes.length > 0) {
            console.log('🔍 Buscando clienteId para:', formData.cliente);
            const clienteEncontrado = clientes.find(c => 
                c.nombre.toLowerCase() === formData.cliente.toLowerCase()
            );
            if (clienteEncontrado) {
                console.log('✅ Cliente encontrado:', clienteEncontrado);
                setFormData(prev => ({
                    ...prev,
                    clienteId: clienteEncontrado.id,
                    cliente: clienteEncontrado.nombre
                }));
            } else {
                console.warn('⚠️ Cliente no encontrado en la lista:', formData.cliente);
            }
        }
    }, [formData.cliente, formData.clienteId, clientes]);

    // Efecto para controlar el scroll del body
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    // Manejar tecla Escape
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !showConfirmClose) {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [hasUnsavedChanges, isReadOnly, showConfirmClose]);

    // ✅ Función centralizada para cerrar el modal y desbloquear el pedido
    const closeModalAndUnlock = useCallback(() => {
        console.log('🔓 [MODAL] Cerrando modal - desbloqueando pedido:', pedido.id);
        if (isLockedByMe) {
            unlockPedido();
        }
        // Delay para asegurar que el desbloqueo se envíe
        setTimeout(() => {
            onClose();
        }, 100);
    }, [pedido.id, isLockedByMe, unlockPedido, onClose]);

        // ✅ Desbloquear, guardar cambios y cerrar modal (usado por submits directos)
        const savePedidoAndClose = useCallback(async (pedidoActualizado: Pedido) => {
            console.log('🔓 [MODAL] Desbloqueando antes de guardar pedido:', pedidoActualizado.id);
            
            // 📝 Registrar acción en el historial ANTES de guardar
            try {
                await recordPedidoUpdate(pedido, pedidoActualizado);
            } catch (error) {
                console.error('Error al registrar acción en historial:', error);
                // No bloqueamos el guardado por errores de historial
            }
            
            if (isLockedByMe) {
                unlockPedido();
            }

            onSave(pedidoActualizado);

            // Cerrar el modal después de un pequeño delay para garantizar que el unlock llegue al servidor
            setTimeout(() => {
                onClose();
            }, 100);
        }, [isLockedByMe, unlockPedido, onSave, onClose, pedido, recordPedidoUpdate]);

    // ✅ NUEVO: Guardar automáticamente SIN cerrar el modal (para cambios de material)
    const handleAutoSave = useCallback(() => {
        console.log('💾 [AUTO-SAVE] Guardando cambios automáticamente:', formData.id);
        
        // Validar metros - si no es válido, usar el valor del pedido original
        let metrosValue = Number(formData.metros);
        if (isNaN(metrosValue) || metrosValue <= 0) {
            console.warn('⚠️ [AUTO-SAVE] Metros inválidos, usando valor original del pedido');
            metrosValue = Number(pedido.metros);
            
            // Si el original tampoco es válido, no guardar
            if (isNaN(metrosValue) || metrosValue <= 0) {
                console.error('❌ [AUTO-SAVE] No se puede guardar: metros inválidos');
                return;
            }
        }
        
        const pedidoActualizado = { ...formData, metros: metrosValue } as Pedido;
        console.log('✅ [AUTO-SAVE] Guardando pedido:', { 
            id: pedidoActualizado.id, 
            materialDisponible: pedidoActualizado.materialDisponible,
            materialConsumo: pedidoActualizado.materialConsumo 
        });
        onSave(pedidoActualizado);
    }, [formData, pedido.metros, onSave]);

    // Manejar el cierre del modal con confirmación si hay cambios
    const handleClose = useCallback(() => {
        if (hasUnsavedChanges && !isReadOnly) {
            setShowConfirmClose(true);
        } else {
            closeModalAndUnlock();
        }
    }, [hasUnsavedChanges, isReadOnly, closeModalAndUnlock]);

    // Manejar tecla Escape
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !showConfirmClose) {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [handleClose, showConfirmClose]);

    const handleReadyForProductionClick = () => {
        const errors: string[] = [];
        
        if (!formData.materialDisponible) {
            errors.push('❌ Material NO está disponible');
        }
        if (!formData.clicheDisponible) {
            errors.push(`⚠️ Cliché NO está disponible${formData.estadoCliché ? ` (Estado: ${formData.estadoCliché})` : ''}`);
        }
        
        if (errors.length > 0) {
            alert(
                '🚫 No se puede marcar como "Listo para Producción"\n\n' +
                'Problemas encontrados:\n' +
                errors.join('\n') +
                '\n\nPor favor, asegúrese de que tanto el material como el cliché estén disponibles antes de continuar.'
            );
            return;
        }
        
        // ✅ IMPORTANTE: Desbloquear ANTES de guardar
        console.log('🔓 [MODAL] Desbloqueando antes de marcar como listo para producción');
        if (isLockedByMe) {
            unlockPedido();
        }
        
        onSetReadyForProduction(formData);
        
        // Cerrar después de un pequeño delay
        setTimeout(() => {
            onClose();
        }, 100);
    };

    // Guardar cambios y cerrar
    const handleSaveAndClose = () => {
        const metrosValue = Number(formData.metros);
        if (isNaN(metrosValue) || metrosValue <= 0) {
            alert('Metros debe ser un número mayor a 0.');
            return;
        }

        const pedidoActualizado = { ...formData, metros: metrosValue } as Pedido;
        savePedidoAndClose(pedidoActualizado);
    };

    // Descartar cambios y cerrar
    const handleDiscardAndClose = () => {
        setShowConfirmClose(false);
        closeModalAndUnlock();
    };

    // Cancelar el cierre
    const handleCancelClose = () => {
        setShowConfirmClose(false);
    };

    const handleDataChange = (field: keyof Pedido, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Manejar cambios en el estado de los materiales
    const handleMaterialStateChange = async (materialId: number, field: 'pendienteRecibir' | 'pendienteGestion', value: boolean) => {
        try {
            const material = pedidoMateriales.find(m => m.id === materialId);
            if (!material) return;

            const updates: Partial<Material> = { [field]: value };

            // Aplicar regla de transición: Si marcan pendienteRecibir=false, automáticamente pendienteGestion=false
            if (field === 'pendienteRecibir' && value === false) {
                updates.pendienteGestion = false;
            }

            await updateMaterial(materialId, updates);
            
            // Actualizar estado local
            setPedidoMateriales(prev => prev.map(m => 
                m.id === materialId ? { ...m, ...updates } : m
            ));
        } catch (error) {
            console.error('Error actualizando estado del material:', error);
            alert('Error al actualizar el estado del material');
        }
    };

    // Determinar el tema visual del material según su estado
    const getMaterialTheme = (material: Material) => {
        const { pendienteRecibir, pendienteGestion } = material;

        // VERDE: Material recibido (pendienteRecibir = false)
        if (!pendienteRecibir) {
            return {
                bg: 'bg-green-100 dark:bg-green-900/30',
                text: 'text-green-800 dark:text-green-200',
                border: 'border-green-300 dark:border-green-700',
                icon: '✅',
                label: 'Material Recibido'
            };
        }

        // AZUL: Pendiente de gestión (ambos true)
        if (pendienteGestion && pendienteRecibir) {
            return {
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                text: 'text-blue-800 dark:text-blue-200',
                border: 'border-blue-300 dark:border-blue-700',
                icon: '🕑',
                label: 'Pendiente Gestión'
            };
        }

        // ROJO: Gestionado pero no recibido (pendienteGestion=false, pendienteRecibir=true)
        return {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-800 dark:text-red-200',
            border: 'border-red-300 dark:border-red-700',
            icon: '⏳',
            label: 'Pendiente Recibir'
        };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (name === "etapaActual") {
            // Verificar si es una etapa principal o una sub-etapa de Preparación
            const isSubEtapa = Object.values(PREPARACION_SUB_ETAPAS_IDS).includes(value as any);
            
            // ✅ VALIDACIONES: Aplicar reglas antes de permitir el cambio de etapa
            
            // 1. ⚠️ NUEVO: Validar inconsistencias al mover manualmente a columnas de preparación
            if (value === PREPARACION_SUB_ETAPAS_IDS.MATERIAL_NO_DISPONIBLE && formData.materialDisponible === true) {
                const confirmed = window.confirm(
                    '⚠️ Advertencia de Inconsistencia\n\n' +
                    'El material está marcado como DISPONIBLE en este pedido, ' +
                    'pero intentas moverlo a "Material No Disponible".\n\n' +
                    '¿Deseas continuar con este movimiento?\n\n' +
                    '(El estado del material en el pedido no se modificará automáticamente)'
                );
                if (!confirmed) {
                    return; // Usuario canceló - no hacer el cambio
                }
            }
            
            if (value === PREPARACION_SUB_ETAPAS_IDS.CLICHE_NO_DISPONIBLE && formData.clicheDisponible === true) {
                const confirmed = window.confirm(
                    '⚠️ Advertencia de Inconsistencia\n\n' +
                    'El cliché está marcado como DISPONIBLE en este pedido, ' +
                    'pero intentas moverlo a "Cliché No Disponible".\n\n' +
                    '¿Deseas continuar con este movimiento?\n\n' +
                    '(El estado del cliché en el pedido no se modificará automáticamente)'
                );
                if (!confirmed) {
                    return; // Usuario canceló - no hacer el cambio
                }
            }
            
            // 2. Validar si intenta mover a "Listo para Producción"
            if (value === PREPARACION_SUB_ETAPAS_IDS.LISTO_PARA_PRODUCCION) {
                const errors: string[] = [];
                
                if (!formData.materialDisponible) {
                    errors.push('❌ Material NO está disponible');
                }
                if (!formData.clicheDisponible) {
                    errors.push(`⚠️ Cliché NO está disponible${formData.estadoCliché ? ` (Estado: ${formData.estadoCliché})` : ''}`);
                }
                
                if (errors.length > 0) {
                    alert(
                        '🚫 No se puede mover a "Listo para Producción"\n\n' +
                        'Problemas encontrados:\n' +
                        errors.join('\n') +
                        '\n\nPor favor, asegúrese de que tanto el material como el cliché estén disponibles antes de continuar.'
                    );
                    return; // ⛔ Bloquear el cambio
                }
            }
            
            // 3. ✅ ACTUALIZADO: Validar si intenta mover a Impresión/Post-Impresión desde Preparación
            // Ya NO se requiere estar en "Listo para Producción", solo material + cliché disponibles
            const isPrintingStage = KANBAN_FUNNELS.IMPRESION.stages.includes(value as Etapa);
            const isPostPrintingStage = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(value as Etapa);
            const isCurrentlyInPreparacion = formData.etapaActual === Etapa.PREPARACION;
            
            if (isCurrentlyInPreparacion && (isPrintingStage || isPostPrintingStage)) {
                // Solo validar material y cliché disponibles
                if (!formData.materialDisponible || !formData.clicheDisponible) {
                    alert(
                        '🚫 No se puede mover a Impresión/Post-Impresión\n\n' +
                        'Requisitos no cumplidos:\n' +
                        (!formData.materialDisponible ? '❌ Material NO disponible\n' : '') +
                        (!formData.clicheDisponible ? '❌ Cliché NO disponible\n' : '') +
                        '\n\nPor favor, asegúrese de que tanto el material como el cliché estén disponibles antes de continuar.'
                    );
                    return; // ⛔ Bloquear el cambio
                }
            }
            
            // 4. Validar secuencia de trabajo para antivaho
            if (formData.antivaho && (isPrintingStage || isPostPrintingStage)) {
                if (!formData.secuenciaTrabajo || formData.secuenciaTrabajo.length === 0) {
                    alert(
                        '⚠️ Secuencia de trabajo requerida\n\n' +
                        'Este pedido tiene Antivaho marcado. Debe definir la secuencia de trabajo de post-impresión antes de mover a Impresión o Post-Impresión.'
                    );
                    return; // ⛔ Bloquear el cambio
                }
            }
            
            // ✅ Si pasa todas las validaciones, proceder con el cambio
            if (isSubEtapa) {
                // Es una sub-etapa, establecer etapaActual como PREPARACION y subEtapaActual con el valor
                setFormData(prev => ({ 
                    ...prev, 
                    etapaActual: Etapa.PREPARACION,
                    subEtapaActual: value
                }));
            } else {
                // Es una etapa principal, actualizar etapaActual y limpiar subEtapaActual
                setFormData(prev => ({ 
                    ...prev, 
                    etapaActual: value as Etapa,
                    subEtapaActual: undefined
                }));
            }
        } else if (name === "vendedorId" && value === "add_new_vendedor") {
            setShowVendedorInput(true);
            setFormData(prev => ({ ...prev, vendedorId: '', vendedorNombre: '' }));
        } else if (name === "vendedorId" && value !== "add_new_vendedor") {
            // Cuando se selecciona un vendedor, guardar tanto el ID como el nombre
            const vendedorSeleccionado = vendedores.find(v => v.id === value);
            setFormData(prev => ({ 
                ...prev, 
                vendedorId: value,
                vendedorNombre: vendedorSeleccionado?.nombre || '' 
            }));
        } else if (name === "clienteId" && value === "add_new_cliente") {
            // Abrir modal de creación de cliente
            setIsClienteModalOpen(true);
        } else if (name === "clienteId" && value !== "add_new_cliente") {
            // Cuando se selecciona un cliente, guardar tanto el ID como el nombre
            const clienteSeleccionado = clientes.find(c => c.id === value);
            setFormData(prev => ({ 
                ...prev, 
                clienteId: value,
                cliente: clienteSeleccionado?.nombre || '' 
            }));
        } else if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            const valueToSet = type === 'number' ? parseInt(value, 10) || 0 : value;
            setFormData(prev => ({ ...prev, [name]: valueToSet }));
        }
    };

    const handleAddVendedor = async () => {
        if (!nuevoVendedor.trim()) {
            alert('Por favor, ingrese un nombre para el vendedor.');
            return;
        }
        
        try {
            const vendedorCreado = await addVendedor({ nombre: nuevoVendedor.trim(), activo: true });
            setFormData(prev => ({ 
                ...prev, 
                vendedorId: vendedorCreado.id,
                vendedorNombre: vendedorCreado.nombre 
            }));
            setNuevoVendedor('');
            setShowVendedorInput(false);
        } catch (error) {
            console.error("Error al crear vendedor:", error);
            alert('Error al crear el vendedor. Por favor, intente de nuevo.');
        }
    };

    const handleCancelVendedor = () => {
        setNuevoVendedor('');
        setShowVendedorInput(false);
    };

    const handleClienteModalSave = async (clienteData: any) => {
        try {
            const nuevoCliente = await addCliente(clienteData);
            // Asignar el cliente recién creado al formulario
            setFormData(prev => ({ 
                ...prev, 
                clienteId: nuevoCliente.id,
                cliente: nuevoCliente.nombre 
            }));
            setIsClienteModalOpen(false);
            // Refrescar la lista de clientes para que aparezca el nuevo
            fetchClientes();
        } catch (error) {
            console.error("Error al crear cliente:", error);
        }
    };

    const handleClienteModalClose = () => {
        setIsClienteModalOpen(false);
    };

    const handleSequenceChange = (newSequence: Etapa[]) => {
        setFormData(prev => ({ ...prev, secuenciaTrabajo: newSequence }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const metrosValue = Number(formData.metros);
        if (isNaN(metrosValue) || metrosValue <= 0) {
            alert('Metros debe ser un número mayor a 0.');
            return;
        }
        const pedidoActualizado = { ...formData, metros: metrosValue } as Pedido;
        savePedidoAndClose(pedidoActualizado);
    };
    
    const handleArchiveClick = () => {
        onArchiveToggle(pedido);
    };
    
    const handleAdvanceClick = () => {
        onAdvanceStage(pedido);
        closeModalAndUnlock();
    };

    const handleSendToPrintClick = () => {
        // Validaciones
        if (!formData.materialDisponible) {
            alert('⚠️ No se puede enviar a impresión\n\nEl material NO está disponible. Por favor, marque el material como disponible antes de continuar.');
            return;
        }
        
        if (formData.antivaho && (!formData.secuenciaTrabajo || formData.secuenciaTrabajo.length === 0)) {
            alert('⚠️ Secuencia de trabajo requerida\n\nEste pedido tiene Antivaho marcado. Debe definir la secuencia de trabajo de post-impresión antes de continuar.');
            return;
        }
        
        // Asegurar que se guarden los cambios antes de enviar a impresión
        const updatedPedido = { ...pedido, ...formData };
        onSendToPrint(updatedPedido);
        closeModalAndUnlock();
    }

    const handleDuplicateClick = () => {
        if (window.confirm(`¿Está seguro de que desea duplicar el pedido ${pedido.numeroPedidoCliente}?`)) {
            onDuplicate(pedido);
            closeModalAndUnlock();
        }
    };

    const handleDeleteClick = () => {
        if (window.confirm(`¿Está seguro de que desea ELIMINAR PERMANENTEMENTE el pedido ${pedido.numeroPedidoCliente}? Esta acción no se puede deshacer.`)) {
            onDelete(pedido.id);
            closeModalAndUnlock();
        }
    };

    const performanceData = useMemo(() => {
        const tiempoRealMin = calcularTiempoRealProduccion(pedido);
        const tiempoPlanificadoMin = parseTimeToMinutes(pedido.tiempoProduccionPlanificado);
        const desviacionMin = tiempoRealMin - tiempoPlanificadoMin;

        return {
            realTrabajo: formatMinutesToHHMM(tiempoRealMin),
            planificado: pedido.tiempoProduccionPlanificado,
            desviacion: desviacionMin,
            desviacionColor: desviacionMin <= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400',
        }
    }, [pedido]);
    
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

    const printingStages = useMemo(() => KANBAN_FUNNELS.IMPRESION.stages, []);
    const isCurrentlyInPrinting = useMemo(() => printingStages.includes(formData.etapaActual), [formData.etapaActual, printingStages]);

    const printingStageValue = useMemo(() => {
        if (isCurrentlyInPrinting) {
            return formData.etapaActual;
        }
        
        // Si está en PREPARACION, buscar la etapa que corresponde a maquinaImpresion
        if (formData.etapaActual === Etapa.PREPARACION && formData.maquinaImpresion) {
            const matchingStage = printingStages.find(stage => 
                ETAPAS[stage]?.title === formData.maquinaImpresion
            );
            if (matchingStage) {
                return matchingStage;
            }
        }
        
        const lastPrintingStageInHistory = formData.etapasSecuencia
            .slice()
            .reverse()
            .find(e => printingStages.includes(e.etapa))?.etapa;

        return lastPrintingStageInHistory || '';
    }, [formData, printingStages, isCurrentlyInPrinting]);

    const handlePrintingStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStage = e.target.value as Etapa;
        if (newStage) {
            // Si está en PREPARACION, solo actualizar maquinaImpresion sin cambiar la etapa
            if (formData.etapaActual === Etapa.PREPARACION) {
                setFormData(prev => ({
                    ...prev,
                    maquinaImpresion: ETAPAS[newStage]?.title || prev.maquinaImpresion,
                }));
            } else {
                // Si está en impresión, cambiar tanto la etapa como la máquina
                setFormData(prev => ({
                    ...prev,
                    etapaActual: newStage,
                    maquinaImpresion: ETAPAS[newStage]?.title || prev.maquinaImpresion,
                }));
            }
        }
    };
    
    const handleRevertToPrinting = (newStage: Etapa) => {
        if (!printingStages.includes(newStage)) return;
        onUpdateEtapa(pedido, newStage);
        closeModalAndUnlock();
    }

    const sortedHistory = useMemo(() => {
        return [...(pedido.historial || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [pedido.historial]);

    return (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-8 pb-4 bg-gradient-to-r from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-t-lg border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold">Pedido: {pedido.numeroPedidoCliente}</h2>
                        
                        {/* Indicador de bloqueo */}
                        {isLocked && (
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                isLockedByMe 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                                {isLockedByMe ? 'Editando' : `Bloqueado por ${lockedBy}`}
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                            {canDeletePedidos() && (
                                <>
                                    <button onClick={handleDuplicateClick} title="Duplicar Pedido" className="text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                                        <DuplicateIcon />
                                    </button>
                                    <button onClick={handleDeleteClick} title="Eliminar Pedido" className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
                                        <TrashIcon />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {pedido.etapaActual === Etapa.PREPARACION && pedido.subEtapaActual !== 'LISTO_PARA_PRODUCCION' && canMovePedidos() && (
                            <button onClick={handleReadyForProductionClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                                Listo para Producción
                            </button>
                        )}
                        <button onClick={handleClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-3xl leading-none">&times;</button>
                    </div>
                </div>
                
                {/* Warning de bloqueo */}
                {showLockWarning && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-8 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-600 dark:text-yellow-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                {lockWarningMessage}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowLockWarning(false)}
                            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                
                <p className="text-sm text-gray-500 dark:text-gray-400 px-8 pb-6 font-mono bg-gradient-to-r from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">Registro Interno: {pedido.numeroRegistro}</p>
                
                {/* Acordeón de Etapa Actual */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => setIsEtapaDropdownOpen(!isEtapaDropdownOpen)}
                        className="w-full px-8 py-3 flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-colors duration-200"
                        disabled={isReadOnly || !canMovePedidos()}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                🔄 Etapa Actual del Pedido: 
                            </span>
                            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                {ETAPAS[formData.etapaActual]?.title || formData.etapaActual}
                                {formData.etapaActual === Etapa.PREPARACION && formData.subEtapaActual && (
                                    <span className="ml-1 text-xs font-normal text-gray-600 dark:text-gray-400">
                                        ({PREPARACION_COLUMNS.find(col => col.id === formData.subEtapaActual)?.title})
                                    </span>
                                )}
                            </span>
                        </div>
                        <svg 
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isEtapaDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {isEtapaDropdownOpen && (
                        <div className="px-8 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t border-blue-200 dark:border-blue-800">
                            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Cambiar etapa:
                            </label>
                            <select 
                                name="etapaActual" 
                                value={formData.etapaActual === Etapa.PREPARACION && formData.subEtapaActual ? formData.subEtapaActual : formData.etapaActual} 
                                onChange={handleChange} 
                                className="w-full max-w-md bg-white dark:bg-gray-700 border-2 border-blue-400 dark:border-blue-600 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isReadOnly || !canMovePedidos()}
                            >
                                <optgroup label="📋 Preparación">
                                    {PREPARACION_COLUMNS.map(col => (
                                        <option key={col.id} value={col.id}>
                                            {col.title}
                                        </option>
                                    ))}
                                </optgroup>
                                
                                <optgroup label="🖨️ Impresión">
                                    {KANBAN_FUNNELS.IMPRESION.stages.map(etapa => (
                                        <option key={etapa} value={etapa}>
                                            {ETAPAS[etapa].title}
                                        </option>
                                    ))}
                                </optgroup>
                                
                                <optgroup label="📦 Post-Impresión">
                                    {KANBAN_FUNNELS.POST_IMPRESION.stages.map(etapa => (
                                        <option key={etapa} value={etapa}>
                                            {ETAPAS[etapa].title}
                                        </option>
                                    ))}
                                </optgroup>
                                
                                <optgroup label="✅ Estado Final">
                                    <option value={Etapa.COMPLETADO}>Completado</option>
                                    <option value={Etapa.ARCHIVADO}>Archivado</option>
                                </optgroup>
                            </select>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                                ℹ️ Cambiar la etapa moverá el pedido a la columna correspondiente al guardar
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Two-column layout */}
                <div className="flex flex-1 min-h-0">
                    {/* Main content - Left column */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex border-b border-gray-200 dark:border-gray-700 px-8">
                            <button 
                                onClick={() => setActiveTab('detalles')} 
                                className={`py-3 px-6 text-sm font-medium transition-colors duration-200 ${activeTab === 'detalles' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                📋 Detalles del Pedido
                            </button>
                            <button 
                                onClick={() => setActiveTab('gestion')} 
                                className={`py-3 px-6 text-sm font-medium transition-colors duration-200 ${activeTab === 'gestion' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                ⚙️ Gestión y Preparación
                            </button>
                            <button 
                                onClick={() => setActiveTab('historial')} 
                                className={`py-3 px-6 text-sm font-medium transition-colors duration-200 ${activeTab === 'historial' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                📜 Historial de Actividad
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-8">
                            {activeTab === 'detalles' && (
                        <>
                         {pedido.etapaActual !== Etapa.PREPARACION && (
                             <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                                <h3 className="text-lg font-semibold text-indigo-500 dark:text-indigo-300 mb-3">Análisis de Rendimiento y Tiempos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                                    <div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">T. Planificado</div>
                                        <div className="text-xl font-bold">{performanceData.planificado}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">T. de Trabajo Real</div>
                                        <div className="text-xl font-bold">{performanceData.realTrabajo}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Desviación (min)</div>
                                        <div className={`text-xl font-bold ${performanceData.desviacionColor}`}>{performanceData.desviacion}</div>
                                    </div>
                                    <div className="col-span-2 md:col-span-3 lg:col-span-2 grid grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 mt-2 pt-2 lg:mt-0 lg:pt-0 lg:pl-4">
                                        <div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">T. Total de Producción</div>
                                            <div className="text-xl font-bold">{pedido.tiempoTotalProduccion || 'En Progreso'}</div>
                                        </div>
                                        <div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Fecha Finalización</div>
                                        <div className="text-base font-semibold">{pedido.fechaFinalizacion ? formatDateTimeDDMMYYYY(pedido.fechaFinalizacion) : 'N/A'}</div>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <fieldset disabled={isReadOnly}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Columna Izquierda */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Cliente</label>
                                                <select 
                                                    name="clienteId" 
                                                    value={formData.clienteId || ''} 
                                                    onChange={handleChange} 
                                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                                    disabled={isReadOnly || isLoadingClientes}
                                                >
                                                    <option value="">
                                                        {isLoadingClientes ? 'Cargando clientes...' : 'Seleccione un cliente'}
                                                    </option>
                                                    {clientes
                                                        .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                                        .map(cliente => (
                                                            <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                                                        ))
                                                    }
                                                    {!isReadOnly && <option value="add_new_cliente">-- Crear nuevo cliente --</option>}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">N° Pedido Cliente</label>
                                                <input type="text" name="numeroPedidoCliente" value={formData.numeroPedidoCliente} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"/>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Desarrollo</label>
                                                <input type="text" name="desarrollo" value={formData.desarrollo} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"/>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Capa</label>
                                                <input type="text" name="capa" value={formData.capa} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50" placeholder="Número o texto de capa"/>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Máquina de Impresión</label>
                                            <select
                                                value={printingStageValue}
                                                onChange={handlePrintingStageChange}
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                                disabled={isReadOnly || (!isCurrentlyInPrinting && formData.etapaActual !== Etapa.PREPARACION)}
                                            >
                                                <option value="" disabled>Seleccione una máquina</option>
                                                {printingStages.map(stageId => (
                                                    <option key={stageId} value={stageId}>
                                                        {ETAPAS[stageId].title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Tipo de Impresión</label>
                                            <select name="tipoImpresion" value={formData.tipoImpresion} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50">
                                                {Object.values(TipoImpresion).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Características del Pedido</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex items-center">
                                                    <input type="checkbox" id="antivaho" name="antivaho" checked={!!formData.antivaho} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                    <label htmlFor="antivaho" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Antivaho</label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input type="checkbox" id="microperforado" name="microperforado" checked={!!formData.microperforado} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                                    <label htmlFor="microperforado" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Microperforado</label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input type="checkbox" id="macroperforado" name="macroperforado" checked={!!formData.macroperforado} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                                                    <label htmlFor="macroperforado" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Macroperforado</label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input type="checkbox" id="anonimo" name="anonimo" checked={!!formData.anonimo} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                    <label htmlFor="anonimo" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Anónimo</label>
                                                </div>
                                            </div>

                                            {/* Select de Post-Impresión para Anónimos */}
                                            {formData.anonimo && (
                                                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                                                    <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        📦 Post-Impresión (Anónimo) <span className="text-red-500">*</span>
                                                    </label>
                                                    <select 
                                                        name="anonimoPostImpresion" 
                                                        value={formData.anonimoPostImpresion || ''} 
                                                        onChange={handleChange} 
                                                        className="w-full bg-white dark:bg-gray-700 border border-yellow-400 dark:border-yellow-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-yellow-500"
                                                        required
                                                    >
                                                        <option value="">Seleccione una opción</option>
                                                        <option value="Rebobinado">Rebobinado</option>
                                                        <option value="Laminación y rebobinado">Laminación y rebobinado</option>
                                                        <option value="MacroPerforado y Rebobinado">MacroPerforado y Rebobinado</option>
                                                        <option value="MicroPerforado y Rebobinado">MicroPerforado y Rebobinado</option>
                                                    </select>
                                                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                                        ⚠️ Requerido para pedidos anónimos
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Columna Derecha */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Metros</label>
                                                <input type="text" inputMode="numeric" pattern="[0-9]*" name="metros" value={formData.metros} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"/>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    Tiempo Producción {formData.anonimo && <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">(Auto)</span>}
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <input 
                                                            type="text" 
                                                            inputMode="decimal"
                                                            name="tiempoProduccionDecimal" 
                                                            value={tiempoProduccionDecimalInput}
                                                            onChange={(e) => handleDecimalTimeChange(e.target.value)}
                                                            onBlur={handleDecimalTimeBlur}
                                                            disabled={formData.anonimo}
                                                            placeholder="Horas"
                                                            title="Tiempo en formato decimal (ej: 1.5 = 1h 30m)"
                                                            className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <input 
                                                            type="text" 
                                                            name="tiempoProduccionPlanificado" 
                                                            value={formData.tiempoProduccionPlanificado} 
                                                            readOnly
                                                            placeholder="HH:mm"
                                                            title="Tiempo en formato HH:mm (solo lectura)"
                                                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 cursor-not-allowed opacity-70 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Prioridad</label>
                                                <select name="prioridad" value={formData.prioridad} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50">
                                                    {Object.values(Prioridad).map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Camisa</label>
                                                <input type="text" name="camisa" value={formData.camisa || ''} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50" placeholder="Info de la camisa"/>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">🔰 Desarrollo</label>
                                            <input type="text" name="desarrollo" value={formData.desarrollo} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50" placeholder="Desarrollo"/>
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Fecha de Creación</label>
                                            <div className="w-full bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm">
                                                {formatDateTimeDDMMYYYY(formData.fechaCreacion)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Fecha de Entrega</label>
                                                <input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"/>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Nueva Fecha Entrega</label>
                                                <input type="date" name="nuevaFechaEntrega" value={formData.nuevaFechaEntrega || ''} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"/>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Vendedor</label>
                                            {!showVendedorInput ? (
                                                <select name="vendedorId" value={formData.vendedorId || ''} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50">
                                                    <option value="">Seleccione un vendedor</option>
                                                    {vendedores.filter(v => v.activo).map(vendedor => (
                                                        <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>
                                                    ))}
                                                    {!isReadOnly && <option value="add_new_vendedor">-- Crear nuevo vendedor --</option>}
                                                </select>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={nuevoVendedor} 
                                                        onChange={(e) => setNuevoVendedor(e.target.value)}
                                                        placeholder="Nombre del vendedor"
                                                        className="flex-1 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
                                                        autoFocus
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={handleAddVendedor}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                                                        title="Guardar vendedor"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={handleCancelVendedor}
                                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                                                        title="Cancelar"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">📝 Observaciones</label>
                                            <textarea 
                                                name="observaciones" 
                                                value={formData.observaciones} 
                                                onChange={handleChange} 
                                                rows={4} 
                                                placeholder="Notas importantes, instrucciones especiales..."
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Secuencia de Trabajo */}
                                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                            🔄 Secuencia de Trabajo Post-Impresión
                                        </h3>
                                        {formData.antivaho && (!formData.secuenciaTrabajo || formData.secuenciaTrabajo.length === 0) && (
                                            <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                                                ⚠️ Requerido para pedidos con Antivaho
                                            </span>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                                        <SequenceBuilder 
                                            sequence={formData.secuenciaTrabajo || []} 
                                            onChange={handleSequenceChange} 
                                            isReadOnly={isReadOnly} 
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        </form>
                        </>
                    )}
                    {activeTab === 'gestion' && (
                        <form onSubmit={handleSubmit}>
                            <fieldset disabled={isReadOnly}>
                                {/* Resumen del estado */}
                                <div className={`rounded-lg p-4 mb-6 border-2 ${
                                    formData.materialDisponible && formData.clicheDisponible 
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                                }`}>
                                    <h3 className={`text-lg font-semibold mb-2 ${
                                        formData.materialDisponible && formData.clicheDisponible 
                                            ? 'text-green-800 dark:text-green-200' 
                                            : 'text-yellow-800 dark:text-yellow-200'
                                    }`}>
                                        📋 Resumen del Estado
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium ${formData.materialDisponible ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {formData.materialDisponible ? '✓' : '○'} Material:
                                            </span>
                                            <span className={formData.materialDisponible ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-500'}>
                                                {formData.materialDisponible ? 'Disponible' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium ${formData.clicheDisponible ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {formData.clicheDisponible ? '✓' : '○'} Cliché:
                                            </span>
                                            <span className={formData.clicheDisponible ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-500'}>
                                                {formData.clicheDisponible ? 'Disponible' : formData.estadoCliché || 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Configuración de Preparación */}
                                <div className={`rounded-lg p-4 mb-6 border ${
                                    formData.materialDisponible && formData.clicheDisponible 
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700' 
                                        : 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700'
                                }`}>
                                    <h3 className={`text-lg font-semibold mb-3 ${
                                        formData.materialDisponible && formData.clicheDisponible 
                                            ? 'text-green-800 dark:text-green-200' 
                                            : 'text-yellow-800 dark:text-yellow-200'
                                    }`}>
                                        ⚙️ Configuración de Preparación
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Estado del Cliché</label>
                                            <select name="estadoCliché" value={formData.estadoCliché} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5">
                                                {Object.values(EstadoCliché).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                Información Adicional Cliché
                                            </label>
                                            <input 
                                                type="text" 
                                                name="clicheInfoAdicional" 
                                                value={formData.clicheInfoAdicional || ''} 
                                                onChange={handleChange} 
                                                placeholder="Ej: Recibido 27/10, ID: CLH-123, Aprobado por cliente"
                                                maxLength={200}
                                                disabled={isReadOnly}
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                            />
                                            {formData.clicheInfoAdicional && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formData.clicheInfoAdicional.length}/200 caracteres
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Compra Cliché</label>
                                            <input 
                                                type="date" 
                                                name="compraCliche" 
                                                value={formData.compraCliche || ''} 
                                                onChange={handleChange} 
                                                disabled={isReadOnly}
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Recepción Cliché</label>
                                            <input 
                                                type="date" 
                                                name="recepcionCliche" 
                                                value={formData.recepcionCliche || ''} 
                                                onChange={handleChange} 
                                                disabled={isReadOnly}
                                                className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="flex items-center pt-2">
                                            <input type="checkbox" id="clicheDisponible" name="clicheDisponible" checked={!!formData.clicheDisponible} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                            <label htmlFor="clicheDisponible" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Cliché Disponible</label>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección de Materiales */}
                                <SeccionDatosTecnicosDeMaterial
                                    formData={formData}
                                    onDataChange={handleDataChange}
                                    isReadOnly={isReadOnly}
                                    handleChange={handleChange}
                                    onAutoSave={handleAutoSave}
                                />

                                {/* Nueva Sección: Gestión de Estados de Materiales */}
                                {pedidoMateriales.length > 0 && (
                                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                                            📦 Gestión de Estados de Materiales
                                        </h3>
                                        
                                        {/* Leyenda de colores */}
                                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Flujo de Estados:</p>
                                            <div className="flex flex-wrap gap-4 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-block w-4 h-4 rounded bg-blue-500"></span>
                                                    <span className="text-gray-600 dark:text-gray-400">🕑 Pendiente Gestión</span>
                                                </div>
                                                <span className="text-gray-400">→</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-block w-4 h-4 rounded bg-red-500"></span>
                                                    <span className="text-gray-600 dark:text-gray-400">⏳ Pendiente Recibir</span>
                                                </div>
                                                <span className="text-gray-400">→</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-block w-4 h-4 rounded bg-green-500"></span>
                                                    <span className="text-gray-600 dark:text-gray-400">✅ Recibido</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lista de materiales */}
                                        <div className="space-y-3">
                                            {pedidoMateriales.map((material) => {
                                                const theme = getMaterialTheme(material);
                                                return (
                                                    <div
                                                        key={material.id}
                                                        className={`p-4 rounded-lg border-2 ${theme.bg} ${theme.border} ${theme.text}`}
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <p className="font-semibold text-sm flex items-center gap-2">
                                                                    <span>{theme.icon}</span>
                                                                    <span>N° {material.numero}</span>
                                                                    <span className={`text-xs px-2 py-0.5 rounded ${theme.bg} ${theme.border} border`}>
                                                                        {theme.label}
                                                                    </span>
                                                                </p>
                                                                {material.descripcion && (
                                                                    <p className="text-xs mt-1 opacity-80">{material.descripcion}</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Controles de estado */}
                                                        {!isReadOnly && (
                                                            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-current/20">
                                                                {/* Checkbox: Pendiente Gestión */}
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={material.pendienteGestion}
                                                                        onChange={(e) => handleMaterialStateChange(material.id, 'pendienteGestion', e.target.checked)}
                                                                        disabled={!material.pendienteRecibir} // Solo se puede desmarcar si ya fue recibido
                                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                                                    />
                                                                    <span className="text-sm">
                                                                        {material.pendienteGestion ? '🕑 Pendiente Gestión' : '✅ Gestionado'}
                                                                    </span>
                                                                </label>

                                                                {/* Checkbox: Pendiente Recibir */}
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={material.pendienteRecibir}
                                                                        onChange={(e) => handleMaterialStateChange(material.id, 'pendienteRecibir', e.target.checked)}
                                                                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                                    />
                                                                    <span className="text-sm">
                                                                        {material.pendienteRecibir ? '⏳ Pendiente Recibir' : '✅ Material Recibido'}
                                                                    </span>
                                                                </label>

                                                                {material.pendienteRecibir && (
                                                                    <p className="text-xs mt-1 opacity-70 italic">
                                                                        💡 Al marcar como "Recibido", se marcará automáticamente como "Gestionado"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Vista readonly */}
                                                        {isReadOnly && (
                                                            <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-current/20 text-xs">
                                                                <p>Estado Gestión: {material.pendienteGestion ? '🕑 Pendiente' : '✅ Gestionado'}</p>
                                                                <p>Estado Recepción: {material.pendienteRecibir ? '⏳ Pendiente' : '✅ Recibido'}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Observaciones */}
                                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">📝 Observaciones del Pedido</label>
                                    <textarea 
                                        name="observaciones" 
                                        value={formData.observaciones} 
                                        onChange={handleChange} 
                                        rows={4} 
                                        placeholder="Notas importantes sobre el pedido, instrucciones especiales, etc."
                                        className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50"
                                    ></textarea>
                                </div>
                            </fieldset>
                        </form>
                    )}
                    {activeTab === 'historial' && (
                        <div className="flow-root">
                           <ul role="list" className="-mb-8">
                                {sortedHistory.map((item, itemIdx) => (
                                    <li key={item.timestamp + itemIdx}>
                                        <div className="relative pb-8">
                                            {itemIdx !== sortedHistory.length - 1 ? (
                                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-8 ring-white dark:ring-gray-800 text-gray-600 dark:text-gray-300">
                                                        {getHistoryIcon(item.accion)}
                                                    </span>
                                                </div>
                                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium text-gray-900 dark:text-white">{item.accion}</span> por {item.usuario}
                                                        </p>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{item.detalles}</p>
                                                    </div>
                                                    <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                                                        <time dateTime={item.timestamp}>
                                                            {formatDateTimeDDMMYYYY(item.timestamp)}
                                                        </time>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Comments panel - Right column */}
                    <div className="w-80 xl:w-96 border-l-2 border-gray-300 dark:border-gray-600 flex flex-col bg-gray-50 dark:bg-gray-900">
                        <div className="p-4 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/80">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                Comentarios
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                                Actividades y comentarios en tiempo real
                            </p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-gray-800 min-h-0"> 
                            <CommentSystem
                                pedidoId={pedido.id}
                                currentUserId={user?.id}
                                currentUserRole={user?.role}
                                canDeleteComments={false}
                                className="h-full"
                                isConnected={isConnected}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer fijo con botones de acción */}
                <div className="border-t-2 border-gray-300 dark:border-gray-600 bg-gradient-to-r from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 px-8 py-4 flex justify-between items-center flex-shrink-0">
                    <div className="flex gap-2">
                        <button type="button" onClick={handleArchiveClick} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={pedido.etapaActual !== Etapa.COMPLETADO && pedido.etapaActual !== Etapa.ARCHIVADO && pedido.etapaActual !== Etapa.PREPARACION}>
                            {pedido.etapaActual === Etapa.ARCHIVADO ? 'Desarchivar' : 'Archivar'}
                        </button>
                        {pedido.etapaActual === Etapa.PREPARACION && (
                            <button
                                type="button"
                                onClick={handleSendToPrintClick}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!formData.materialDisponible || (!!formData.antivaho && (!formData.secuenciaTrabajo || formData.secuenciaTrabajo.length === 0))}
                                title={
                                    !formData.materialDisponible
                                        ? "El material debe estar disponible para enviar a impresión"
                                        : (!!formData.antivaho && (!formData.secuenciaTrabajo || formData.secuenciaTrabajo.length === 0))
                                        ? "Debe definir la secuencia de trabajo para pedidos con Antivaho"
                                        : !!formData.antivaho
                                        ? "Enviar a Post-Impresión (Antivaho)"
                                        : "Enviar a Impresión"
                                }
                            >
                                {!!formData.antivaho ? "Enviar a Post-Impresión" : "Enviar a Impresión"}
                            </button>
                        )}
                        {pedido.etapaActual !== Etapa.PREPARACION && !printingStages.includes(pedido.etapaActual) && (
                            <select onChange={(e) => handleRevertToPrinting(e.target.value as Etapa)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200" value="">
                                <option value="" disabled>Volver a Impresión...</option>
                                {printingStages.map(stage => <option key={stage} value={stage}>{ETAPAS[stage].title}</option>)}
                            </select>
                        )}
                    </div>
                    
                    <div className="flex gap-4">
                        <button type="button" onClick={handleClose} className="bg-gray-500 hover:bg-gray-400 text-white dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded transition-colors duration-200">Cancelar</button>
                        {!isReadOnly && (
                            <>
                                {canMovePedidos() && canAdvance && (
                                    <button type="button" onClick={handleAdvanceClick} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                                        {advanceButtonTitle}
                                    </button>
                                )}
                                <button type="button" onClick={(e) => {
                                    e.preventDefault();
                                    const form = document.querySelector('form') as HTMLFormElement;
                                    if (form) form.requestSubmit();
                                }} className={`font-bold py-2 px-4 rounded transition-colors duration-200 ${
                                    hasUnsavedChanges 
                                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}>
                                    {hasUnsavedChanges ? '● Guardar Cambios' : 'Guardar Cambios'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de confirmación para cambios no guardados */}
            {showConfirmClose && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-60">
                    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-2xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Cambios no guardados</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Tienes cambios sin guardar que se perderán si cierras el modal.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleSaveAndClose}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Guardar y cerrar
                                </button>
                                <button
                                    onClick={handleDiscardAndClose}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Descartar cambios y cerrar
                                </button>
                                <button
                                    onClick={handleCancelClose}
                                    className="w-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Continuar editando
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de creación de cliente */}
            <ClienteModalMejorado
                isOpen={isClienteModalOpen}
                onClose={handleClienteModalClose}
                onSave={handleClienteModalSave}
                cliente={null}
                isEmbedded={true}
            />
        </div>
    );
};

export default PedidoModal;
