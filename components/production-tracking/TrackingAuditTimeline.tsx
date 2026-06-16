import React from 'react';
import type { Pedido, TrackingAuditEntry } from '../../types';
import { formatDateTimeDDMMYYYY } from '../../utils/date';

interface TrackingAuditTimelineProps {
    actions: TrackingAuditEntry[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    hasActiveFilters: boolean;
    error: string | null;
    onLoadMore: () => void;
    onRetry: () => void;
    onNavigateToPedido?: (pedido: Pedido) => void;
}

const TrackingAuditTimeline: React.FC<TrackingAuditTimelineProps> = ({
    actions,
    isLoading,
    isLoadingMore,
    hasMore,
    hasActiveFilters,
    error,
    onLoadMore,
    onRetry,
    onNavigateToPedido,
}) => {
    if (isLoading && actions.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Cargando historial de auditoría...</p>
            </div>
        );
    }

    if (error && actions.length === 0) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/60 dark:bg-red-950/30">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">No se pudo cargar el historial.</p>
                <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">{error}</p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (actions.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {hasActiveFilters ? 'No hay movimientos que coincidan con los filtros aplicados.' : 'Todavía no hay movimientos de auditoría para mostrar.'}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {hasActiveFilters ? 'Probá ajustando la búsqueda, la máquina o el rango de registro.' : 'Abrí esta sección más tarde para revisar cambios recientes en producción.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {actions.map((action) => (
                    <article
                        key={action.id}
                        onClick={() => {
                            if (onNavigateToPedido) {
                                const scrollY = window.scrollY;
                                onNavigateToPedido({ id: action.pedidoId } as Pedido);
                                requestAnimationFrame(() => window.scrollTo(0, scrollY));
                            }
                        }}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-700"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200">
                                        {action.numeroPedidoCliente}
                                    </span>
                                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        {action.cliente}
                                    </span>
                                    {action.maquinaImpresion && (
                                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                            {action.maquinaImpresion}
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{action.title}</h4>
                                <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">{action.details}</p>
                            </div>

                            <div className="shrink-0 text-left sm:text-right">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    {formatDateTimeDDMMYYYY(action.timestamp)}
                                </p>
                                <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{action.userName || 'Sistema'}</p>
                                {action.source && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Origen: {action.source}</p>
                                )}
                            </div>
                        </div>

                        {action.changes && action.changes.length > 0 && (
                            <div className="mt-3 rounded-lg bg-gray-50 px-3 py-3 dark:bg-gray-800/80">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Cambios destacados
                                </p>
                                <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                    {action.changes.map((change, index) => (
                                        <li key={`${action.id}-change-${index}`} className="flex gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                            <span>{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </article>
                ))}
            </div>

            <div className="flex flex-col items-center gap-3">
                {error && actions.length > 0 && (
                    <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                )}

                {hasMore ? (
                    <button
                        type="button"
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        {isLoadingMore ? 'Cargando más movimientos...' : 'Cargar más movimientos'}
                    </button>
                ) : (
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        No hay más movimientos para mostrar.
                    </p>
                )}
            </div>
        </div>
    );
};

export default TrackingAuditTimeline;
