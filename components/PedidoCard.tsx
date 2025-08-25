import React, { useMemo } from 'react';
import { Pedido, Etapa, UserRole, EstadoCliché } from '../types';
import { PRIORIDAD_COLORS, KANBAN_FUNNELS } from '../constants';

interface PedidoCardProps {
    pedido: Pedido;
    onArchiveToggle: (pedido: Pedido) => void;
    onSelectPedido: (pedido: Pedido) => void;
    currentUserRole: UserRole;
    onAdvanceStage: (pedido: Pedido) => void;
    onSendToPrint?: (pedido: Pedido) => void; // Optional: for PreparacionView
}

const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" /></svg>;
const RulerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>;
const ArchiveBoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>;
const LayersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L12 15.25l5.571-3m-5.571 0V3.375c0-.621-.504-1.125-1.125-1.125H9.75c-.621 0-1.125.504-1.125 1.125v11.875" /></svg>;
const CodeBracketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>;
const ArrowRightCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3.375 3.375 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" /></svg>;


const PedidoCard: React.FC<PedidoCardProps> = ({ pedido, onArchiveToggle, onSelectPedido, currentUserRole, onAdvanceStage, onSendToPrint }) => {
    const priorityColor = PRIORIDAD_COLORS[pedido.prioridad];

    const handleArchiveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onArchiveToggle(pedido);
    }
    
    const handleAdvanceClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (pedido.etapaActual === Etapa.PREPARACION && onSendToPrint) {
            onSendToPrint(pedido);
        } else {
            onAdvanceStage(pedido);
        }
    }

    const { canAdvance, advanceButtonTitle } = useMemo(() => {
        if (pedido.etapaActual === Etapa.PREPARACION && !!pedido.materialDisponible) {
            return { canAdvance: true, advanceButtonTitle: 'Enviar a Impresión' };
        }

        const isPrinting = KANBAN_FUNNELS.IMPRESION.stages.includes(pedido.etapaActual);
        const isPostPrinting = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedido.etapaActual);

        if (isPrinting && pedido.secuenciaTrabajo?.length > 0) {
            return { canAdvance: true, advanceButtonTitle: 'Iniciar Post-Impresión' };
        }
        if (isPostPrinting) {
            const currentIndex = pedido.secuenciaTrabajo?.indexOf(pedido.etapaActual) ?? -1;
            if (currentIndex > -1 && currentIndex < pedido.secuenciaTrabajo.length - 1) {
                return { canAdvance: true, advanceButtonTitle: 'Siguiente Etapa' };
            }
             if (currentIndex > -1 && currentIndex === pedido.secuenciaTrabajo.length -1) {
                return { canAdvance: true, advanceButtonTitle: 'Marcar como Completado' };
            }
        }
        return { canAdvance: false, advanceButtonTitle: '' };
    }, [pedido]);

    return (
        <div 
            onClick={() => onSelectPedido(pedido)}
            className={`bg-white dark:bg-gray-900 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 border-l-4 ${priorityColor} shadow-md`}>
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{pedido.numeroPedidoCliente}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${priorityColor.replace('border', 'bg').replace('-500','-900')} text-white`}>
                    {pedido.prioridad}
                </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{pedido.cliente}</p>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-3 grid grid-cols-2 gap-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                 <span className="flex items-center" title="Desarrollo"><CodeBracketIcon /> {pedido.desarrollo}</span>
                 <span className="flex items-center" title="Capa"><LayersIcon /> {pedido.capa}</span>
                 <span className="flex items-center" title="Metros"><RulerIcon /> {pedido.metros} m</span>
                 <span className="flex items-center" title="Fecha Entrega"><CalendarIcon /> {pedido.fechaEntrega}</span>
                 {pedido.etapaActual === Etapa.PREPARACION && (
                     <span className="col-span-2 flex items-center" title="Estado del Cliché">
                        <PaperClipIcon /> {pedido.estadoCliché || EstadoCliché.PENDIENTE_CLIENTE}
                     </span>
                 )}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 mt-3 flex justify-between items-center">
                <span className="flex items-center"><ClockIcon /> {pedido.tiempoProduccionPlanificado}</span>
                <div className="flex items-center gap-2">
                     {canAdvance && currentUserRole === 'Administrador' && (
                        <button 
                            onClick={handleAdvanceClick} 
                            className="text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors"
                            aria-label={advanceButtonTitle}
                            title={advanceButtonTitle}
                        >
                            <ArrowRightCircleIcon />
                        </button>
                    )}
                     {pedido.etapaActual === Etapa.COMPLETADO && currentUserRole === 'Administrador' && (
                        <button 
                            onClick={handleArchiveClick} 
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                            aria-label="Archivar Pedido"
                            title="Archivar Pedido"
                        >
                            <ArchiveBoxIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PedidoCard;