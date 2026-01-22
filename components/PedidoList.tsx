

import React, { useMemo, useState, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Pedido, Etapa, UserRole, Prioridad } from '../types';
import { ETAPAS, PRIORIDAD_COLORS, KANBAN_FUNNELS } from '../constants';
import { puedeAvanzarSecuencia, estaFueraDeSecuencia } from '../utils/etapaLogic';
import { SparklesIcon } from './Icons';
import { usePermissions } from '../hooks/usePermissions';
import { formatDateDDMMYYYY, formatMetros } from '../utils/date';

interface PedidoListProps {
    pedidos: Pedido[];
    onSelectPedido: (pedido: Pedido) => void;
    onArchiveToggle: (pedido: Pedido) => void;
    isArchivedView: boolean;
    currentUserRole: UserRole;
    onAdvanceStage: (pedido: Pedido) => void;
    sortConfig: { key: keyof Pedido, direction: 'ascending' | 'descending' };
    onSort: (key: keyof Pedido) => void;
    highlightedPedidoId: string | null;
    selectedIds?: string[];
    onToggleSelection?: (id: string) => void;
    onSelectAll?: (ids: string[]) => void;
}

const ArchiveBoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>;
const UnarchiveBoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
const ArrowRightCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
    if (!direction) return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400/50"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>;
    return direction === 'ascending' ?
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>;
};

const SortableHeader = ({
    label,
    sortKey,
    onSort,
    sortConfig,
    className = ""
}: {
    label: string,
    sortKey: keyof Pedido,
    onSort: (key: keyof Pedido) => void,
    sortConfig: { key: keyof Pedido, direction: 'ascending' | 'descending' },
    className?: string
}) => {
    const isSorting = sortConfig.key === sortKey;
    const direction = isSorting ? sortConfig.direction : null;
    return (
        <div role="columnheader" className={`px-6 py-3 ${className}`}>
            <button onClick={() => onSort(sortKey)} className="flex items-center gap-2 group">
                {label}
                <SortIcon direction={direction} />
            </button>
        </div>
    );
};

const SortableHeaderTh = ({
    label,
    sortKey,
    onSort,
    sortConfig,
    width = "",
    className = ""
}: {
    label: string,
    sortKey: keyof Pedido,
    onSort: (key: keyof Pedido) => void,
    sortConfig: { key: keyof Pedido, direction: 'ascending' | 'descending' },
    width?: string,
    className?: string
}) => {
    const isSorting = sortConfig.key === sortKey;
    const direction = isSorting ? sortConfig.direction : null;
    return (
        <th className={`px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${width} ${className}`}>
            <button onClick={() => onSort(sortKey)} className="flex items-center gap-2 group w-full justify-start">
                {label}
                <SortIcon direction={direction} />
            </button>
        </th>
    );
};

const PedidoRow: React.FC<{ 
    pedido: Pedido, 
    index: number, 
    onSelectPedido: (pedido: Pedido) => void, 
    onArchiveToggle: (pedido: Pedido) => void, 
    isArchivedView: boolean, 
    currentUserRole: UserRole, 
    onAdvanceStage: (pedido: Pedido) => void, 
    isHighlighted: boolean,
    provided: any,
    snapshot: any,
    highlightedPedidoId: string | null,
    isSelected?: boolean,
    onToggleSelection?: (id: string) => void
}> = ({ pedido, index, onSelectPedido, onArchiveToggle, isArchivedView, currentUserRole, onAdvanceStage, isHighlighted, provided, snapshot, highlightedPedidoId, isSelected, onToggleSelection }) => {
    const { canMovePedidos, canArchivePedidos } = usePermissions();
    
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

    return (
        <tr
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => onSelectPedido(pedido)}
            className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${pedido.id === highlightedPedidoId ? 'card-highlight' : ''}`}
        >
            {onToggleSelection && (
                <td className="px-2 py-2 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected || false}
                        onChange={() => onToggleSelection(pedido.id)}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                </td>
            )}
            <td className="px-2 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap text-sm w-24">{pedido.numeroPedidoCliente}</td>
            <td className="px-2 py-2 text-gray-900 dark:text-white text-sm w-28 truncate" title={pedido.cliente}>{pedido.cliente}</td>
            <td className="px-2 py-2 text-gray-900 dark:text-white text-sm w-28 truncate" title={pedido.desarrollo}>{pedido.desarrollo}</td>
            <td className="px-2 py-2 text-center text-gray-900 dark:text-white text-sm w-16">{pedido.capa || '-'}</td>
            <td className="px-2 py-2 text-gray-900 dark:text-white text-sm w-24 truncate" title={pedido.camisa}>{pedido.camisa || '-'}</td>
            <td className="px-2 py-2 text-center w-16">
                {pedido.antivaho && <SparklesIcon className="w-5 h-5 text-blue-500 mx-auto" />}
            </td>
            <td className="px-6 py-4 w-28">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${(PRIORIDAD_COLORS[pedido.prioridad] || PRIORIDAD_COLORS[Prioridad.NORMAL] || 'border-blue-500').replace('border', 'bg').replace('-500', '-900')}`}>
                    {pedido.prioridad}
                </span>
            </td>
            <td className="px-6 py-4 text-gray-900 dark:text-white w-36">{ETAPAS[pedido.etapaActual].title}</td>
            <td className="px-6 py-4 text-right text-gray-900 dark:text-white w-24">{formatMetros(pedido.metros)} m</td>
            <td className="px-6 py-4 text-center text-gray-900 dark:text-white w-28">{pedido.tiempoProduccionPlanificado}</td>
            <td className="px-6 py-4 text-center text-gray-900 dark:text-white w-28">{formatDateDDMMYYYY(pedido.fechaEntrega)}</td>
            <td className="px-6 py-4 text-center text-gray-900 dark:text-white w-32">{pedido.nuevaFechaEntrega ? formatDateDDMMYYYY(pedido.nuevaFechaEntrega) : '-'}</td>
            <td className="px-6 py-4 text-center w-28" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center items-center space-x-2">
                    {canMovePedidos() && canAdvance && (
                        <button onClick={() => onAdvanceStage(pedido)} className="text-green-500 hover:text-green-400" title={advanceButtonTitle}>
                            <ArrowRightCircleIcon />
                        </button>
                    )}
                    {canArchivePedidos() && (
                        <>
                            {isArchivedView ? (
                                <button onClick={() => onArchiveToggle(pedido)} className="text-green-500 hover:text-green-400 dark:text-green-400 dark:hover:text-green-300" title="Desarchivar">
                                    <UnarchiveBoxIcon />
                                </button>
                            ) : (
                                (pedido.etapaActual === Etapa.COMPLETADO || pedido.etapaActual === Etapa.PREPARACION) && (
                                    <button onClick={() => onArchiveToggle(pedido)} className="text-yellow-500 hover:text-yellow-400 dark:text-yellow-400 dark:hover:text-yellow-300" title="Archivar">
                                        <ArchiveBoxIcon />
                                    </button>
                                )
                            )}
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};


const PedidoList: React.FC<PedidoListProps> = ({ pedidos, onSelectPedido, onArchiveToggle, isArchivedView, currentUserRole, onAdvanceStage, sortConfig, onSort, highlightedPedidoId, selectedIds, onToggleSelection, onSelectAll }) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <main className="flex-grow p-2 md:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {onSelectAll && (
                                    <th className="px-2 py-2 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={pedidos.length > 0 && pedidos.every(p => selectedIds?.includes(p.id))}
                                            onChange={() => onSelectAll(pedidos.map(p => p.id))}
                                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </th>
                                )}
                                <SortableHeaderTh label="N° Pedido" sortKey="numeroPedidoCliente" onSort={onSort} sortConfig={sortConfig} width="w-24" />
                                <SortableHeaderTh label="Cliente" sortKey="cliente" onSort={onSort} sortConfig={sortConfig} width="w-28" />
                                <SortableHeaderTh label="Desarrollo" sortKey="desarrollo" onSort={onSort} sortConfig={sortConfig} width="w-28" />
                                <SortableHeaderTh label="Capa" sortKey="capa" onSort={onSort} sortConfig={sortConfig} width="w-16" className="text-center" />
                                <SortableHeaderTh label="Camisa" sortKey="camisa" onSort={onSort} sortConfig={sortConfig} width="w-24" />
                                <SortableHeaderTh label="Antivaho" sortKey="antivaho" onSort={onSort} sortConfig={sortConfig} width="w-16" className="text-center" />
                                <SortableHeaderTh label="Prioridad" sortKey="prioridad" onSort={onSort} sortConfig={sortConfig} width="w-24" />
                                <SortableHeaderTh label="Etapa Actual" sortKey="etapaActual" onSort={onSort} sortConfig={sortConfig} width="w-32" />
                                <SortableHeaderTh label="Metros" sortKey="metros" onSort={onSort} sortConfig={sortConfig} width="w-20" className="text-right" />
                                <SortableHeaderTh label="T. Planificado" sortKey="tiempoProduccionPlanificado" onSort={onSort} sortConfig={sortConfig} width="w-24" className="text-center" />
                                <SortableHeaderTh label="F. Entrega" sortKey="fechaEntrega" onSort={onSort} sortConfig={sortConfig} width="w-24" className="text-center" />
                                <SortableHeaderTh label="Nueva F. Entrega" sortKey="nuevaFechaEntrega" onSort={onSort} sortConfig={sortConfig} width="w-28" className="text-center" />
                                <th className="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-24">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        {isMounted && (
                            <Droppable droppableId="pedido-list">
                                {(provided) => (
                                    <tbody
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                                    >
                                        {pedidos.length === 0 ? (
                                            <tr>
                                                <td colSpan={14} className="text-center py-10 text-gray-500">
                                                    No se encontraron pedidos con los filtros actuales.
                                                </td>
                                            </tr>
                                        ) : (
                                            pedidos.map((pedido, index) => (
                                                <Draggable key={pedido.id} draggableId={pedido.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <PedidoRow
                                                            key={pedido.id}
                                                            pedido={pedido}
                                                            index={index}
                                                            onSelectPedido={onSelectPedido}
                                                            onArchiveToggle={onArchiveToggle}
                                                            isArchivedView={isArchivedView}
                                                            currentUserRole={currentUserRole}
                                                            onAdvanceStage={onAdvanceStage}
                                                            isHighlighted={pedido.id === highlightedPedidoId}
                                                            provided={provided}
                                                            snapshot={snapshot}
                                                            highlightedPedidoId={highlightedPedidoId}
                                                            isSelected={selectedIds?.includes(pedido.id)}
                                                            onToggleSelection={onToggleSelection}
                                                        />
                                                    )}
                                                </Draggable>
                                            ))
                                        )}
                                        {provided.placeholder}
                                    </tbody>
                                )}
                            </Droppable>
                        )}
                    </table>
                    {!isMounted && (
                        <div className="text-center py-10 text-gray-500">Cargando...</div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default PedidoList;