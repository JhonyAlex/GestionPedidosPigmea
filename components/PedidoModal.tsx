import React, { useState, useEffect, useMemo } from 'react';
import { Pedido, Prioridad, Etapa, UserRole, TipoImpresion, EstadoCliché } from '../types';
import { calcularTiempoRealProduccion, parseTimeToMinutes, formatMinutesToHHMM } from '../utils/kpi';
import { puedeAvanzarSecuencia, estaFueraDeSecuencia } from '../utils/etapaLogic';
import { ETAPAS, KANBAN_FUNNELS } from '../constants';
import SequenceBuilder from './SequenceBuilder';
import SeccionDatosTecnicosDeMaterial from './SeccionDatosTecnicosDeMaterial';
import CommentSystem from './comments/CommentSystem';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';

const DuplicateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.75 0h-3.375c-.621 0-1.125.504-1.125 1.125v6.75c0 .621.504 1.125 1.125 1.125h3.375c.621 0 1.125-.504 1.125-1.125v-6.75a1.125 1.125 0 0 0-1.125-1.125Z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const ArrowPathIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.696v4.992h-4.992m0 0-3.181-3.183a8.25 8.25 0 0 1 11.667 0l3.181 3.183" /></svg>;
const ArchiveBoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>;
const PaperAirplaneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>;

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
    currentUserRole: UserRole;
    onAdvanceStage: (pedido: Pedido) => void;
    onSendToPrint: (pedido: Pedido) => void;
    onUpdateEtapa: (pedido: Pedido, newEtapa: Etapa) => void;
}

const PedidoModal: React.FC<PedidoModalProps> = ({ pedido, onClose, onSave, onArchiveToggle, currentUserRole, onAdvanceStage, onSendToPrint, onDuplicate, onDelete, onUpdateEtapa }) => {
    const [formData, setFormData] = useState<Pedido>(JSON.parse(JSON.stringify(pedido)));
    const [activeTab, setActiveTab] = useState<'detalles' | 'historial' | 'comentarios'>('detalles');
    const { user } = useAuth();
    const { 
        canEditPedidos, 
        canDeletePedidos, 
        canArchivePedidos, 
        canMovePedidos 
    } = usePermissions();
    
    // Determinar si el modal es de solo lectura basado en permisos
    const isReadOnly = !canEditPedidos();

    useEffect(() => {
        // Hacer una copia profunda para evitar modificar el pedido original
        setFormData(JSON.parse(JSON.stringify(pedido)));
    }, [pedido]);

    const handleDataChange = (field: keyof Pedido, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            const valueToSet = type === 'number' ? parseInt(value, 10) || 0 : value;
            setFormData(prev => ({ ...prev, [name]: valueToSet }));
        }
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
        onSave({ ...formData, metros: metrosValue });
    };
    
    const handleArchiveClick = () => {
        onArchiveToggle(pedido);
    };
    
    const handleAdvanceClick = () => {
        onAdvanceStage(pedido);
        onClose();
    };

    const handleSendToPrintClick = () => {
        // Asegurar que se guarden los cambios antes de enviar a impresión
        const updatedPedido = { ...pedido, ...formData };
        onSendToPrint(updatedPedido);
        onClose();
    }

    const handleDuplicateClick = () => {
        if (window.confirm(`¿Está seguro de que desea duplicar el pedido ${pedido.numeroPedidoCliente}?`)) {
            onDuplicate(pedido);
            onClose();
        }
    };

    const handleDeleteClick = () => {
        if (window.confirm(`¿Está seguro de que desea ELIMINAR PERMANENTEMENTE el pedido ${pedido.numeroPedidoCliente}? Esta acción no se puede deshacer.`)) {
            onDelete(pedido.id);
            onClose();
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
        const lastPrintingStageInHistory = formData.etapasSecuencia
            .slice()
            .reverse()
            .find(e => printingStages.includes(e.etapa))?.etapa;

        return lastPrintingStageInHistory || '';
    }, [formData, printingStages, isCurrentlyInPrinting]);

    const handlePrintingStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStage = e.target.value as Etapa;
        if (newStage) {
             setFormData(prev => ({
                ...prev,
                etapaActual: newStage,
                maquinaImpresion: ETAPAS[newStage]?.title || prev.maquinaImpresion,
            }));
        }
    };
    
    const handleRevertToPrinting = (newStage: Etapa) => {
        if (!printingStages.includes(newStage)) return;
        onUpdateEtapa(pedido, newStage);
        onClose();
    }

    const sortedHistory = useMemo(() => {
        return [...(pedido.historial || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [pedido.historial]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-2xl p-8 w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold">Pedido: {pedido.numeroPedidoCliente}</h2>
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
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-3xl leading-none">&times;</button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono">Registro Interno: {pedido.numeroRegistro}</p>
                
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button 
                        onClick={() => setActiveTab('detalles')} 
                        className={`py-2 px-4 text-sm font-medium transition-colors duration-200 ${activeTab === 'detalles' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Detalles del Pedido
                    </button>
                    <button 
                        onClick={() => setActiveTab('historial')} 
                        className={`py-2 px-4 text-sm font-medium transition-colors duration-200 ${activeTab === 'historial' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Historial de Actividad
                    </button>
                    <button 
                        onClick={() => setActiveTab('comentarios')} 
                        className={`py-2 px-4 text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${activeTab === 'comentarios' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Comentarios</span>
                    </button>
                </div>

                <div className="overflow-y-auto flex-grow">
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
                                        <div className="text-base font-semibold">{pedido.fechaFinalizacion ? new Date(pedido.fechaFinalizacion).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</div>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <fieldset disabled={isReadOnly}>
                                {pedido.etapaActual === Etapa.PREPARACION && (
                                    <div className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6">
                                        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Configuración de Preparación</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Estado del Cliché</label>
                                                <select name="estadoCliché" value={formData.estadoCliché} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5">
                                                    {Object.values(EstadoCliché).map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-y-4 pt-6">
                                                <div className="flex items-center">
                                                    <input type="checkbox" id="materialDisponible" name="materialDisponible" checked={!!formData.materialDisponible} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                    <label htmlFor="materialDisponible" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Material Disponible</label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input type="checkbox" id="clicheDisponible" name="clicheDisponible" checked={!!formData.clicheDisponible} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                    <label htmlFor="clicheDisponible" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Cliché Disponible</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Columna Izquierda */}
                                    <div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Cliente</label>
                                                <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"/>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">N° Pedido Cliente</label>
                                                <input type="text" name="numeroPedidoCliente" value={formData.numeroPedidoCliente} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50"/>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 items-center">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Máquina de Impresión</label>
                                                <select
                                                    value={printingStageValue}
                                                    onChange={handlePrintingStageChange}
                                                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                                    disabled={isReadOnly || !isCurrentlyInPrinting}
                                                >
                                                    <option value="" disabled>Seleccione una máquina</option>
                                                    {printingStages.map(stageId => (
                                                        <option key={stageId} value={stageId}>
                                                            {ETAPAS[stageId].title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-start pt-6">
                                                <input type="checkbox" id="antivaho" name="antivaho" checked={!!formData.antivaho} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <label htmlFor="antivaho" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Antivaho</label>
                                            </div>
                                        </div>

                                        <label className="block mt-4 mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Tipo de Impresión</label>
                                        <select name="tipoImpresion" value={formData.tipoImpresion} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50">
                                            {Object.values(TipoImpresion).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    {/* Columna Derecha */}
                                    <div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Desarrollo</label>
                                                <input type="text" name="desarrollo" value={formData.desarrollo} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50"/>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Capa</label>
                                                <input type="text" name="capa" value={formData.capa} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50" placeholder="Número o texto de capa"/>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Prioridad</label>
                                                <select name="prioridad" value={formData.prioridad} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50">
                                                    {Object.values(Prioridad).map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Camisa</label>
                                                <input type="text" name="camisa" value={formData.camisa || ''} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50" placeholder="Información de la camisa"/>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Metros</label>
                                                <input type="text" inputMode="numeric" pattern="[0-9]*" name="metros" value={formData.metros} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50"/>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Tiempo Prod. (HH:mm)</label>
                                                <input type="text" name="tiempoProduccionPlanificado" value={formData.tiempoProduccionPlanificado} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Fecha de Creación</label>
                                        <p className="w-full bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm">
                                            {new Date(formData.fechaCreacion).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Fecha de Entrega</label>
                                        <input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50"/>
                                    </div>
                                </div>

                                <div className="md:col-span-2 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h3 className="text-xl font-semibold mb-4">Secuencia de Trabajo Post-Impresión</h3>
                                    <SequenceBuilder sequence={formData.secuenciaTrabajo || []} onChange={handleSequenceChange} isReadOnly={isReadOnly} />
                                </div>

                                <SeccionDatosTecnicosDeMaterial
                                    formData={formData}
                                    onDataChange={handleDataChange}
                                    isReadOnly={isReadOnly}
                                />

                                <div className="md:col-span-2 mt-6">
                                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Observaciones</label>
                                    <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows={3} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 disabled:opacity-50"></textarea>
                                </div>
                            </fieldset>

                            <div className="mt-8 flex justify-between items-center">
                                {isReadOnly ? (
                                    <span className="text-sm text-gray-500">Modo de solo lectura - No tiene permisos de edición.</span>
                                ) : (
                                    <div className="flex gap-2">
                                        {canArchivePedidos() && (
                                            <button type="button" onClick={handleArchiveClick} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={pedido.etapaActual !== Etapa.COMPLETADO && pedido.etapaActual !== Etapa.ARCHIVADO}>
                                                {pedido.etapaActual === Etapa.ARCHIVADO ? 'Desarchivar' : 'Archivar'}
                                            </button>
                                        )}
                                        {canMovePedidos() && pedido.etapaActual === Etapa.PREPARACION && (
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
                                        {canMovePedidos() && pedido.etapaActual !== Etapa.PREPARACION && !printingStages.includes(pedido.etapaActual) && (
                                            <select onChange={(e) => handleRevertToPrinting(e.target.value as Etapa)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200" value="">
                                                <option value="" disabled>Volver a Impresión...</option>
                                                {printingStages.map(stage => <option key={stage} value={stage}>{ETAPAS[stage].title}</option>)}
                                            </select>
                                        )}
                                    </div>
                                )}
                            
                                <div className="flex gap-4">
                                    <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-400 text-white dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded transition-colors duration-200">Cancelar</button>
                                    {!isReadOnly && (
                                        <>
                                            {canMovePedidos() && canAdvance && (
                                                <button type="button" onClick={handleAdvanceClick} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                                                    {advanceButtonTitle}
                                                </button>
                                            )}
                                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">Guardar Cambios</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </form>
                        </>
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
                                                            {new Date(item.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
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
                    
                    {activeTab === 'comentarios' && (
                        <div className="h-full">
                            <CommentSystem
                                pedidoId={pedido.id}
                                currentUserId={user?.id}
                                currentUserRole={user?.role}
                                canDeleteComments={user?.role === 'Administrador' || user?.role === 'Supervisor'}
                                className="h-full border-0 shadow-none"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PedidoModal;
