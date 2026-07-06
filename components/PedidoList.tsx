

import React, { useMemo, useState, useEffect } from 'react';
import { Pedido, Etapa, UserRole, Prioridad } from '../types';
import { ETAPAS, PRIORIDAD_COLORS, KANBAN_FUNNELS } from '../constants';
import { puedeAvanzarSecuencia, estaFueraDeSecuencia } from '../utils/etapaLogic';
import { normalizePostImpresionSequence } from '../utils/dntWorkflow';
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
    // Vista Lista Temporal: pedidos que se muestran por override
    listasTemporalesMap?: Record<string, import('../types').Etapa[]>;
    selectedStages?: string[];
    // Vista expandida: pedidos con _visualStage y _visualKey (pre-sorted, pre-expanded)
    isExpandedView?: boolean;
    // Paginación para vista archivados
    isLoadingMore?: boolean;
    hasMore?: boolean;
    totalItems?: number;
    onLoadMore?: () => void;
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
    className = "",
    isExpandedView = false,
}: {
    label: string,
    sortKey: keyof Pedido,
    onSort: (key: keyof Pedido) => void,
    sortConfig: { key: keyof Pedido, direction: 'ascending' | 'descending' },
    width?: string,
    className?: string,
    isExpandedView?: boolean,
}) => {
    // In expanded view, the list is pre-sorted by Production kanban order — sort
    // headers are decorative labels only, not interactive controls.
    if (isExpandedView) {
        return (
            <th className={`px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${width} ${className}`}>
                {label}
            </th>
        );
    }

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
    highlightedPedidoId: string | null,
    isSelected?: boolean,
    onToggleSelection?: (id: string) => void,
    isTemporalDisplay?: boolean,
    isExpandedView?: boolean,
}> = ({ pedido, index, onSelectPedido, onArchiveToggle, isArchivedView, currentUserRole, onAdvanceStage, isHighlighted, highlightedPedidoId, isSelected, onToggleSelection, isTemporalDisplay: isTemporalDisplayProp, isExpandedView }) => {
    const { canMovePedidos, canArchivePedidos } = usePermissions();

    const { canAdvance, advanceButtonTitle } = useMemo(() => {
        const normalizedSequence = normalizePostImpresionSequence(pedido.secuenciaTrabajo, pedido.cliente);
        // Usar la nueva lógica centralizada
        const canAdvanceSequence = puedeAvanzarSecuencia(
            pedido.etapaActual,
            normalizedSequence,
            pedido.antivaho,
            pedido.antivahoRealizado,
            pedido.cliente
        );

        if (!canAdvanceSequence) {
            return { canAdvance: false, advanceButtonTitle: '' };
        }

        // Determinar el título del botón basado en la situación
        const isPrinting = KANBAN_FUNNELS.IMPRESION.stages.includes(pedido.etapaActual);
        const isPostPrinting = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(pedido.etapaActual);
        const isOutOfSequence = estaFueraDeSecuencia(pedido.etapaActual, normalizedSequence, pedido.cliente);

        if (isPrinting && normalizedSequence.length > 0) {
            return { canAdvance: true, advanceButtonTitle: 'Iniciar Post-Impresión' };
        }

        if (isPostPrinting) {
            // Para pedidos con antivaho en post-impresión, permitir "continuar" para reconfirmar
            if (pedido.antivaho && !pedido.antivahoRealizado && pedido.etapaActual === Etapa.POST_LAMINACION_NEXUS) {
                return { canAdvance: true, advanceButtonTitle: 'Continuar Secuencia' };
            }

            // Si está fuera de secuencia, ofrecer reordenar
            if (isOutOfSequence) {
                return { canAdvance: true, advanceButtonTitle: 'Reordenar y Continuar' };
            }

            // Lógica normal para pedidos en secuencia
            const currentIndex = normalizedSequence.indexOf(pedido.etapaActual);
            if (currentIndex > -1 && currentIndex < normalizedSequence.length - 1) {
                return { canAdvance: true, advanceButtonTitle: 'Siguiente Etapa' };
            }
            if (currentIndex > -1 && currentIndex === normalizedSequence.length - 1) {
                return { canAdvance: true, advanceButtonTitle: 'Marcar como Completado' };
            }
        }

        return { canAdvance: false, advanceButtonTitle: '' };
    }, [pedido]);

    // In expanded view, derive isTemporalDisplay from the visual stage metadata.
    // In non-expanded view, use the prop (computed from selectedStages + listasTemporalesMap).
    // Same-stage temp duplicates (instanceIndex > 0, visualStage === etapaActual)
    // must also be treated as temporal — they are extra visual copies, not the real pedido.
    const temporalDisplay = isExpandedView
        ? ((pedido as any)._visualStage != null &&
           ((pedido as any)._visualStage !== pedido.etapaActual || ((pedido as any)._kanbanInstanceIndex || 0) > 0))
        : (isTemporalDisplayProp ?? false);

    return (
        <tr
            onClick={() => onSelectPedido(pedido)}
            className={`${
                pedido.atencionObservaciones
                    ? 'bg-red-100 dark:bg-red-950/30 hover:bg-red-200 dark:hover:bg-red-950/40'
                    : temporalDisplay
                        ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            } cursor-pointer ${pedido.id === highlightedPedidoId ? 'card-highlight' : ''} ${
                temporalDisplay ? 'border-l-4 border-amber-400 dark:border-amber-500' : ''
            }`}
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
            <td className="px-6 py-4 text-gray-900 dark:text-white w-36">
                {isExpandedView && (pedido as any)._visualStage
                    ? (ETAPAS[(pedido as any)._visualStage]?.title ?? (pedido as any)._visualStage)
                    : (ETAPAS[pedido.etapaActual]?.title ?? pedido.etapaActual)}
            </td>
            <td className="px-6 py-4 text-right text-gray-900 dark:text-white w-24">{formatMetros(pedido.metros)} m</td>
            <td className="px-6 py-4 text-center text-gray-900 dark:text-white w-28">{pedido.tiempoProduccionPlanificado}</td>
            <td className="px-6 py-4 text-center text-gray-900 dark:text-white w-28">{formatDateDDMMYYYY(pedido.fechaEntrega)}</td>
            <td className="px-6 py-4 text-center text-gray-900 dark:text-white w-32">{pedido.nuevaFechaEntrega ? formatDateDDMMYYYY(pedido.nuevaFechaEntrega) : '-'}</td>
            <td className="px-6 py-4 text-center w-28" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center items-center space-x-2">
                    {/* In expanded view, temporal rows show a visual (not real) stage;
                        advance/archive would operate on the real stage, misleading users. */}
                    {!temporalDisplay && canMovePedidos() && canAdvance && (
                        <button onClick={() => onAdvanceStage(pedido)} className="text-green-500 hover:text-green-400" title={advanceButtonTitle}>
                            <ArrowRightCircleIcon />
                        </button>
                    )}
                    {!temporalDisplay && canArchivePedidos() && (
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

/**
 * Extract the pedido ID from a selection key in expanded view.
 * Visual keys have format: `real:{pedidoId}:{stage}` or `temp:{pedidoId}:{stage}:{index}`.
 * Returns the pedidoId string, or the original key if it doesn't match the pattern.
 */
const extractPedidoIdFromSelectionKey = (key: string): string => {
    if (key.startsWith('real:') || key.startsWith('temp:')) {
        const colonIdx = key.indexOf(':');
        const secondColon = key.indexOf(':', colonIdx + 1);
        if (colonIdx > -1 && secondColon > colonIdx) {
            return key.substring(colonIdx + 1, secondColon);
        }
    }
    return key;
};

const PedidoList: React.FC<PedidoListProps> = ({ pedidos, onSelectPedido, onArchiveToggle, isArchivedView, currentUserRole, onAdvanceStage, sortConfig, onSort, highlightedPedidoId, selectedIds, onToggleSelection, onSelectAll, listasTemporalesMap = {}, selectedStages = [], isExpandedView = false, isLoadingMore, hasMore, totalItems, onLoadMore }) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // In expanded view, a pedido may appear multiple times (real + temp instances).
    // Use _visualKey as the selection identity so rows are independently checkable.
    // The parent selectedIds still tracks pedido IDs for bulk operations.
    const [expandedSelectedKeys, setExpandedSelectedKeys] = useState<Set<string>>(new Set());

    // Sync expanded visual selection with parent: when the parent clears ALL
    // selections (e.g. view change, bulk operation complete), also clear
    // expanded keys to prevent ghost checkboxes on stale visual rows.
    useEffect(() => {
        if (isExpandedView && (!selectedIds || selectedIds.length === 0)) {
            setExpandedSelectedKeys(new Set());
        }
    }, [selectedIds, isExpandedView]);

    // Helper: given a pedido, return the selection identity key.
    const selectionKeyFor = (p: Pedido): string =>
        isExpandedView ? ((p as any)._visualKey || p.id) : p.id;

    // Extract unique pedido IDs from a set of visual keys.
    const pedidoIdsFromKeys = (keys: Iterable<string>): string[] => {
        const ids = new Set<string>();
        for (const key of keys) {
            const pedidoId = extractPedidoIdFromSelectionKey(key);
            if (pedidoId) ids.add(pedidoId);
        }
        return [...ids];
    };

    const isRowSelected = (p: Pedido): boolean =>
        isExpandedView ? expandedSelectedKeys.has(selectionKeyFor(p)) : (selectedIds?.includes(p.id) ?? false);

    // "All selected" check: in expanded view use visual keys; otherwise use pedido IDs.
    const allSelected = pedidos.length > 0 && (isExpandedView
        ? pedidos.every(p => expandedSelectedKeys.has(selectionKeyFor(p)))
        : pedidos.every(p => selectedIds?.includes(p.id)));

    const handleRowToggle = (pedido: Pedido) => {
        if (!onToggleSelection) return;

        if (isExpandedView) {
            const key = selectionKeyFor(pedido);
            const pedidoId = pedido.id;

            // Determine whether the pedido ID membership will change after this toggle.
            // A pedido ID should be "selected" in the parent when AT LEAST ONE of its
            // visual rows is selected. We only call onToggleSelection when the pedido
            // transitions between "has any selected visual rows" and "has none".
            const willBeSelected = !expandedSelectedKeys.has(key);

            // Compute which pedido IDs would be selected AFTER the toggle
            const nextSelectedPedidoIds = new Set<string>();
            for (const k of expandedSelectedKeys) {
                if (k !== key) {
                    const pid = extractPedidoIdFromSelectionKey(k);
                    if (pid) nextSelectedPedidoIds.add(pid);
                }
            }
            if (willBeSelected) {
                nextSelectedPedidoIds.add(pedidoId);
            }

            const wasInParent = selectedIds?.includes(pedidoId) ?? false;
            const willBeInParent = nextSelectedPedidoIds.has(pedidoId);

            // Only notify parent when pedido-ID membership actually changes,
            // preventing odd-toggles from multi-instance rows.
            if (wasInParent !== willBeInParent) {
                onToggleSelection(pedidoId);
            }

            setExpandedSelectedKeys(prev => {
                const next = new Set(prev);
                next.has(key) ? next.delete(key) : next.add(key);
                return next;
            });
        } else {
            onToggleSelection(pedido.id);
        }
    };

    const handleSelectAll = () => {
        if (!onSelectAll) return;

        if (isExpandedView) {
            if (allSelected) {
                setExpandedSelectedKeys(new Set());
                onSelectAll([]);
            } else {
                const keys = new Set(pedidos.map(p => selectionKeyFor(p)));
                setExpandedSelectedKeys(keys);
                const uniqueIds = pedidoIdsFromKeys(keys);
                onSelectAll(uniqueIds);
            }
            return;
        }

        if (allSelected) {
            onSelectAll((selectedIds || []).filter(id => !pedidos.find(p => p.id === id)));
            return;
        }

        onSelectAll([...(selectedIds || []).filter(id => !pedidos.find(p => p.id === id)), ...pedidos.map(p => p.id)]);
    };

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
                                            checked={allSelected}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </th>
                                )}
                                <SortableHeaderTh label="N° Pedido" sortKey="numeroPedidoCliente" onSort={onSort} sortConfig={sortConfig} width="w-24" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="Cliente" sortKey="cliente" onSort={onSort} sortConfig={sortConfig} width="w-28" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="Desarrollo" sortKey="desarrollo" onSort={onSort} sortConfig={sortConfig} width="w-28" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="Capa" sortKey="capa" onSort={onSort} sortConfig={sortConfig} width="w-16" className="text-center" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="Camisa" sortKey="camisa" onSort={onSort} sortConfig={sortConfig} width="w-24" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="Antivaho" sortKey="antivaho" onSort={onSort} sortConfig={sortConfig} width="w-16" className="text-center" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="Prioridad" sortKey="prioridad" onSort={onSort} sortConfig={sortConfig} width="w-24" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="Etapa Actual" sortKey="etapaActual" onSort={onSort} sortConfig={sortConfig} width="w-32" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="Metros" sortKey="metros" onSort={onSort} sortConfig={sortConfig} width="w-20" className="text-right" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="T. Planificado" sortKey="tiempoProduccionPlanificado" onSort={onSort} sortConfig={sortConfig} width="w-24" className="text-center" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="F. Entrega" sortKey="fechaEntrega" onSort={onSort} sortConfig={sortConfig} width="w-24" className="text-center" isExpandedView={isExpandedView} />
                                <SortableHeaderTh label="Nueva F. Entrega" sortKey="nuevaFechaEntrega" onSort={onSort} sortConfig={sortConfig} width="w-28" className="text-center" isExpandedView={isExpandedView} />
                                <th className="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-24">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        {isMounted && (
                            <tbody
                                className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                            >
                                {pedidos.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="text-center py-10 text-gray-500">
                                            No se encontraron pedidos con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : (
                                pedidos.map((pedido, index) => {
                                        // Resaltar cuando el pedido aparece por lista temporal (etapa real ≠ etapas filtradas)
                                        const temporalEtapas = listasTemporalesMap[pedido.id] || [];
                                        const isTemporalDisplay = selectedStages.length > 0
                                            && !selectedStages.includes(pedido.etapaActual)
                                            && selectedStages.some(s => temporalEtapas.includes(s as import('../types').Etapa));
                                        // In expanded view, use _visualKey for unique React keys (pedidos may appear multiple times).
                                        const rowKey = isExpandedView
                                            ? ((pedido as any)._visualKey || `${pedido.id}-${(pedido as any)._visualStage}-${index}`)
                                            : pedido.id;
                                        return (
                                        <PedidoRow
                                            key={rowKey}
                                            pedido={pedido}
                                            index={index}
                                            onSelectPedido={onSelectPedido}
                                            onArchiveToggle={onArchiveToggle}
                                            isArchivedView={isArchivedView}
                                            currentUserRole={currentUserRole}
                                            onAdvanceStage={onAdvanceStage}
                                            isHighlighted={pedido.id === highlightedPedidoId}
                                            highlightedPedidoId={highlightedPedidoId}
                                            isSelected={isRowSelected(pedido)}
                                            onToggleSelection={() => handleRowToggle(pedido)}
                                            isTemporalDisplay={isTemporalDisplay}
                                            isExpandedView={isExpandedView}
                                        />
                                        );
                                    })
                                )}
                            </tbody>
                        )}
                    </table>
                    {!isMounted && (
                        <div className="text-center py-10 text-gray-500">Cargando...</div>
                    )}
                </div>
                {isArchivedView && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Mostrando {pedidos.length}{totalItems !== undefined ? ` de ${totalItems}` : ''} archivados
                        </span>
                        {hasMore && onLoadMore && (
                            <button
                                onClick={onLoadMore}
                                disabled={isLoadingMore}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingMore ? 'Cargando...' : 'Cargar más'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
};

export default PedidoList;