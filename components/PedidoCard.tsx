import React from 'react';
import { Pedido, Etapa, UserRole } from '../types';
import { PRIORIDAD_COLORS } from '../constants';

interface PedidoCardProps {
    pedido: Pedido;
    onArchiveToggle: (pedido: Pedido) => void;
    onSelectPedido: (pedido: Pedido) => void;
    currentUserRole: UserRole;
}

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const RulerIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
);

const ArchiveBoxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
);


const PedidoCard: React.FC<PedidoCardProps> = ({ pedido, onArchiveToggle, onSelectPedido, currentUserRole }) => {
    const priorityColor = PRIORIDAD_COLORS[pedido.prioridad];

    const handleArchiveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onArchiveToggle(pedido);
    }

    return (
        <div 
            onClick={() => onSelectPedido(pedido)}
            className={`bg-gray-900 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors duration-200 border-l-4 ${priorityColor} shadow-md`}>
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-gray-100">{pedido.numeroPedido}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${priorityColor.replace('border', 'bg').replace('-500','-900')} text-white`}>
                    {pedido.prioridad}
                </span>
            </div>
            <p className="text-gray-300 mt-1">{pedido.cliente}</p>
            <div className="text-sm text-gray-400 mt-3 flex justify-between items-center">
                <span className="flex items-center"><RulerIcon /> {pedido.metros} m</span>
                <span className="flex items-center"><ClockIcon /> {pedido.tiempoProduccionPlanificado}</span>
                 {pedido.etapaActual === Etapa.COMPLETADO && currentUserRole === 'Administrador' && (
                    <button 
                        onClick={handleArchiveClick} 
                        className="text-gray-400 hover:text-white transition-colors"
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