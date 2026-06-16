import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Pedido, TrackingAuditEntry } from '../../types';
import { DateFilterOption, getDateRange } from '../../utils/date';
import type { TrackingAuditPDFOptions, TrackingAuditPDFPayload } from '../../utils/kpi';
import { actionHistoryDB } from '../../services/actionHistory';
import webSocketService from '../../services/websocket';
import TrackingAuditFilters from './TrackingAuditFilters';
import TrackingAuditTimeline from './TrackingAuditTimeline';

interface TrackingAuditSectionProps {
    onExport?: (payload: TrackingAuditPDFPayload) => void;
    onNavigateToPedido?: (pedido: Pedido) => void;
}

const AUDIT_PAGE_SIZE = 20;
const SOCKET_REFRESH_COOLDOWN_MS = 3000;

const TrackingAuditSection: React.FC<TrackingAuditSectionProps> = ({ onExport, onNavigateToPedido }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [stageValue, setStageValue] = useState('');
    const [dateField, setDateField] = useState<'timestamp'>('timestamp');
    const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [actions, setActions] = useState<TrackingAuditEntry[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const requestInFlightRef = useRef(false);
    const pendingRefreshRef = useRef(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(searchValue.trim());
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [searchValue]);

    const apiDateRange = useMemo(() => {
        if (dateFilter === 'custom') {
            return { dateFrom: customDateRange.start, dateTo: customDateRange.end };
        }

        if (dateFilter !== 'all') {
            const range = getDateRange(dateFilter);
            if (range) {
                return {
                    dateFrom: range.start.toISOString().slice(0, 10),
                    dateTo: range.end.toISOString().slice(0, 10),
                };
            }
        }

        return { dateFrom: '', dateTo: '' };
    }, [customDateRange.end, customDateRange.start, dateFilter]);

    const hasActiveFilters = useMemo(
        () => Boolean(debouncedSearch || stageValue || dateFilter !== 'all' || customDateRange.start || customDateRange.end),
        [customDateRange.end, customDateRange.start, dateFilter, debouncedSearch, stageValue],
    );

    const fetchAudit = useCallback(
        async (mode: 'replace' | 'append' = 'replace', cursor?: string | null) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;
            requestInFlightRef.current = true;
            setError(null);

            if (mode === 'append') {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }

            try {
                const response = await actionHistoryDB.getTrackingAudit(
                    {
                        search: debouncedSearch || undefined,
                        stage: stageValue || undefined,
                        dateField,
                        dateFrom: apiDateRange.dateFrom || undefined,
                        dateTo: apiDateRange.dateTo || undefined,
                        cursor: mode === 'append' ? cursor || undefined : undefined,
                        limit: AUDIT_PAGE_SIZE,
                    },
                    controller.signal,
                );

                if (controller.signal.aborted) {
                    return;
                }

                setActions((previous) => (mode === 'append' ? [...previous, ...response.actions] : response.actions));
                setNextCursor(response.nextCursor);
                setHasMore(response.hasMore);
            } catch (fetchError) {
                if (controller.signal.aborted) {
                    return;
                }

                const message = fetchError instanceof Error ? fetchError.message : 'No se pudo cargar el historial de auditoría.';
                setError(message);
            } finally {
                if (!controller.signal.aborted) {
                    requestInFlightRef.current = false;
                    setIsLoading(false);
                    setIsLoadingMore(false);

                    if (pendingRefreshRef.current) {
                        pendingRefreshRef.current = false;
                        fetchAudit('replace');
                    }
                }
            }
        },
        [apiDateRange.dateFrom, apiDateRange.dateTo, dateField, debouncedSearch, stageValue],
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        fetchAudit('replace');
    }, [fetchAudit, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let cooldown = false;
        const unsubscribe = webSocketService.subscribeToActionHistoryUpdate(() => {
            if (cooldown) {
                return;
            }

            if (requestInFlightRef.current) {
                pendingRefreshRef.current = true;
                return;
            }

            cooldown = true;
            window.setTimeout(() => {
                cooldown = false;
            }, SOCKET_REFRESH_COOLDOWN_MS);

            fetchAudit('replace');
        });

        return unsubscribe;
    }, [fetchAudit, isOpen]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleLoadMore = useCallback(() => {
        if (!nextCursor || requestInFlightRef.current) {
            return;
        }

        fetchAudit('append', nextCursor);
    }, [fetchAudit, nextCursor]);

    const handleCustomDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setCustomDateRange((previous) => ({ ...previous, [name]: value }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearchValue('');
        setDebouncedSearch('');
        setStageValue('');
        setDateField('timestamp');
        setDateFilter('all');
        setCustomDateRange({ start: '', end: '' });
    }, []);

    const handleExport = useCallback(() => {
        if (!onExport || actions.length === 0) {
            return;
        }

        try {
            onExport({
                actions,
                filters: {
                    search: debouncedSearch || undefined,
                    stage: stageValue || undefined,
                    dateField,
                    dateFilter,
                    dateFrom: apiDateRange.dateFrom || undefined,
                    dateTo: apiDateRange.dateTo || undefined,
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo exportar el historial visible.';
            window.alert(message);
        }
    }, [actions, apiDateRange.dateFrom, apiDateRange.dateTo, dateField, dateFilter, debouncedSearch, stageValue, onExport]);

    const exportDisabledReason = !onExport
        ? 'La exportación PDF se habilita en el siguiente slice.'
        : actions.length === 0
            ? 'No hay resultados visibles para exportar.'
            : undefined;

    return (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/80"
            >
                <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Historial y Auditoría</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Revisá movimientos de producción con filtros server-driven y resúmenes legibles.
                    </p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300">
                    {isOpen ? '−' : '+'}
                </span>
            </button>

            {isOpen && (
                <div className="space-y-4 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
                    <TrackingAuditFilters
                        searchValue={searchValue}
                        onSearchValueChange={setSearchValue}
                        stageValue={stageValue}
                        onStageValueChange={setStageValue}
                        dateField={dateField}
                        dateFilter={dateFilter}
                        customDateRange={customDateRange}
                        onDateFieldChange={setDateField}
                        onDateFilterChange={setDateFilter}
                        onCustomDateChange={handleCustomDateChange}
                        onClearFilters={handleClearFilters}
                        hasActiveFilters={hasActiveFilters}
                        canExport={actions.length > 0 && !isLoading && !isLoadingMore}
                        onExport={onExport ? handleExport : undefined}
                        exportDisabledReason={exportDisabledReason}
                        isLoading={isLoading || isLoadingMore}
                    />

                    <TrackingAuditTimeline
                        actions={actions}
                        isLoading={isLoading}
                        isLoadingMore={isLoadingMore}
                        hasMore={hasMore}
                        hasActiveFilters={hasActiveFilters}
                        error={error}
                        onLoadMore={handleLoadMore}
                        onRetry={() => fetchAudit('replace')}
                        onNavigateToPedido={onNavigateToPedido}
                    />
                </div>
            )}
        </section>
    );
};

export default TrackingAuditSection;
