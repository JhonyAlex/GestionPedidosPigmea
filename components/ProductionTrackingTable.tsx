import React, { useState, useMemo, useCallback } from 'react';
import { Pedido, Etapa, EtapaInfo } from '../types';
import { ETAPAS, PREPARACION_COLUMNS, STAGE_GROUPS } from '../constants';
import { DateFilterOption, getDateRange } from '../utils/date';
import DateFilterCombined from './DateFilterCombined';

// --- Stage sets for exit date computation ---
const IMPRESION_STAGES = new Set<Etapa>(STAGE_GROUPS.IMPRESION.stages);
const LAMINACION_STAGES = new Set<Etapa>(STAGE_GROUPS.LAMINACION.stages);
const REBOBINADO_STAGES = new Set<Etapa>(STAGE_GROUPS.REBOBINADO.stages);
const PERFORACION_STAGES = new Set<Etapa>(STAGE_GROUPS.PERFORACION.stages);

// --- Helpers ---

function getStageExitDate(etapasSecuencia: EtapaInfo[], stageSet: Set<Etapa>): string | null {
    let lastIndex = -1;
    for (let i = 0; i < etapasSecuencia.length; i++) {
        if (stageSet.has(etapasSecuencia[i].etapa)) {
            lastIndex = i;
        }
    }
    if (lastIndex === -1) return null;
    const nextEntry = etapasSecuencia[lastIndex + 1];
    return nextEntry ? nextEntry.fecha : null;
}

function getStageEntryDate(etapasSecuencia: EtapaInfo[], stage: Etapa): string | null {
    const entry = etapasSecuencia.find((e) => e.etapa === stage);
    return entry ? entry.fecha : null;
}

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// --- Tracking row data ---

interface TrackingRow {
    pedido: Pedido;
    fechaImpreso: string | null;
    fechaRebobinado: string | null;
    fechaLaminado: string | null;
    fechaPerforado: string | null;
    fechaCompletado: string | null;
}

function buildTrackingRow(pedido: Pedido): TrackingRow {
    const seq = pedido.etapasSecuencia;
    return {
        pedido,
        fechaImpreso: getStageExitDate(seq, IMPRESION_STAGES),
        fechaRebobinado: getStageExitDate(seq, REBOBINADO_STAGES),
        fechaLaminado: getStageExitDate(seq, LAMINACION_STAGES),
        fechaPerforado: getStageExitDate(seq, PERFORACION_STAGES),
        fechaCompletado:
            getStageEntryDate(seq, Etapa.COMPLETADO) || pedido.fechaFinalizacion || null,
    };
}

// --- Sort helpers ---

type SortKey =
    | 'numeroPedidoCliente'
    | 'etapaActual'
    | 'cliente'
    | 'vendedorNombre'
    | 'metros'
    | 'fechaImpreso'
    | 'fechaRebobinado'
    | 'fechaLaminado'
    | 'fechaPerforado'
    | 'fechaCompletado';

type SortDir = 'asc' | 'desc';

function compareDates(a: string | null, b: string | null): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return new Date(a).getTime() - new Date(b).getTime();
}

function compareRows(a: TrackingRow, b: TrackingRow, key: SortKey, dir: SortDir): number {
    let cmp = 0;
    switch (key) {
        case 'numeroPedidoCliente':
            cmp = a.pedido.numeroPedidoCliente.localeCompare(b.pedido.numeroPedidoCliente, 'es', { numeric: true });
            break;
        case 'etapaActual':
            cmp = (ETAPAS[a.pedido.etapaActual]?.title ?? '').localeCompare(
                ETAPAS[b.pedido.etapaActual]?.title ?? '',
                'es',
            );
            break;
        case 'cliente':
            cmp = a.pedido.cliente.localeCompare(b.pedido.cliente, 'es');
            break;
        case 'vendedorNombre':
            cmp = (a.pedido.vendedorNombre ?? '').localeCompare(b.pedido.vendedorNombre ?? '', 'es');
            break;
        case 'metros': {
            const ma = typeof a.pedido.metros === 'number' ? a.pedido.metros : Number(a.pedido.metros) || 0;
            const mb = typeof b.pedido.metros === 'number' ? b.pedido.metros : Number(b.pedido.metros) || 0;
            cmp = ma - mb;
            break;
        }
        case 'fechaImpreso':
            cmp = compareDates(a.fechaImpreso, b.fechaImpreso);
            break;
        case 'fechaRebobinado':
            cmp = compareDates(a.fechaRebobinado, b.fechaRebobinado);
            break;
        case 'fechaLaminado':
            cmp = compareDates(a.fechaLaminado, b.fechaLaminado);
            break;
        case 'fechaPerforado':
            cmp = compareDates(a.fechaPerforado, b.fechaPerforado);
            break;
        case 'fechaCompletado':
            cmp = compareDates(a.fechaCompletado, b.fechaCompletado);
            break;
    }
    return dir === 'asc' ? cmp : -cmp;
}

// --- Sub-stage display ---

function getSubEtapaLabel(subEtapaId: string | undefined): string | null {
    if (!subEtapaId) return null;
    const col = PREPARACION_COLUMNS.find((c) => c.id === subEtapaId);
    return col ? col.title : null;
}

// --- Icons ---

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const SortArrow: React.FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => {
    if (!active) return <span className="ml-1 text-gray-400 dark:text-gray-600">?</span>;
    return <span className="ml-1">{dir === 'asc' ? '?' : '?'}</span>;
};

// --- Props ---

interface ProductionTrackingTableProps {
    pedidos: Pedido[];
    onNavigateToPedido?: (pedido: Pedido) => void;
}

// --- Component ---

const ProductionTrackingTable: React.FC<ProductionTrackingTableProps> = ({ pedidos, onNavigateToPedido }) => {
    // --- Filter state (persisted in localStorage) ---
    const [dateFilter, setDateFilter] = useState<DateFilterOption>(
        () => (localStorage.getItem('tracking_date_filter') as DateFilterOption) || 'all',
    );
    const [dateField, setDateField] = useState<keyof Pedido>(
        () => (localStorage.getItem('tracking_date_field') as keyof Pedido) || 'fechaCreacion',
    );
    const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>(() => {
        const stored = localStorage.getItem('tracking_custom_date_range');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch { /* ignore */ }
        }
        return { start: '', end: '' };
    });
    const [searchText, setSearchText] = useState('');
    const [stageFilter, setStageFilter] = useState<Etapa | ''>('');

    // --- Sort state ---
    const [sortKey, setSortKey] = useState<SortKey>('numeroPedidoCliente');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // --- localStorage sync ---
    const handleDateFilterChange = useCallback((value: DateFilterOption) => {
        setDateFilter(value);
        localStorage.setItem('tracking_date_filter', value);
    }, []);

    const handleDateFieldChange = useCallback((field: keyof Pedido) => {
        setDateField(field);
        localStorage.setItem('tracking_date_field', field as string);
    }, []);

    const handleCustomDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomDateRange((prev) => {
            const next = { ...prev, [name]: value };
            localStorage.setItem('tracking_custom_date_range', JSON.stringify(next));
            return next;
        });
    }, []);

    // --- Sort toggle ---
    const handleSort = useCallback((key: SortKey) => {
        setSortKey((prev) => {
            if (prev === key) {
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
            } else {
                setSortDir('asc');
            }
            return key;
        });
    }, []);

    // --- Compute tracking data (solo completados y archivados) ---
    const trackingRows = useMemo<TrackingRow[]>(() => {
        return pedidos
            .filter((p) => p.etapaActual === Etapa.COMPLETADO || p.etapaActual === Etapa.ARCHIVADO)
            .map(buildTrackingRow);
    }, [pedidos]);

    // --- Filter ---
    const filteredRows = useMemo<TrackingRow[]>(() => {
        let rows = trackingRows;

        // Date filter
        if (dateFilter === 'custom') {
            if (customDateRange.start || customDateRange.end) {
                const startMs = customDateRange.start ? new Date(customDateRange.start + 'T00:00:00').getTime() : -Infinity;
                const endMs = customDateRange.end ? new Date(customDateRange.end + 'T23:59:59.999').getTime() : Infinity;
                rows = rows.filter((r) => {
                    const val = r.pedido[dateField];
                    if (!val || typeof val !== 'string') return false;
                    const t = new Date(val).getTime();
                    return t >= startMs && t <= endMs;
                });
            }
        } else if (dateFilter !== 'all') {
            const range = getDateRange(dateFilter);
            if (range) {
                rows = rows.filter((r) => {
                    const val = r.pedido[dateField];
                    if (!val || typeof val !== 'string') return false;
                    const t = new Date(val).getTime();
                    return t >= range.start.getTime() && t <= range.end.getTime();
                });
            }
        }

        // Text search
        if (searchText.trim()) {
            const lower = searchText.trim().toLowerCase();
            rows = rows.filter(
                (r) =>
                    r.pedido.numeroPedidoCliente.toLowerCase().includes(lower) ||
                    r.pedido.cliente.toLowerCase().includes(lower) ||
                    (r.pedido.vendedorNombre ?? '').toLowerCase().includes(lower),
            );
        }

        // Stage filter
        if (stageFilter) {
            rows = rows.filter((r) => r.pedido.etapaActual === stageFilter);
        }

        return rows;
    }, [trackingRows, dateFilter, dateField, customDateRange, searchText, stageFilter]);

    // --- Sort ---
    const sortedRows = useMemo<TrackingRow[]>(() => {
        return [...filteredRows].sort((a, b) => compareRows(a, b, sortKey, sortDir));
    }, [filteredRows, sortKey, sortDir]);

    // --- Column definitions ---
    const columns: { key: SortKey; label: string }[] = [
        { key: 'numeroPedidoCliente', label: 'N� Pedido' },
        { key: 'etapaActual', label: 'Etapa Actual' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'vendedorNombre', label: 'Vendedor' },
        { key: 'metros', label: 'Metros' },
        { key: 'fechaImpreso', label: 'F. Impreso' },
        { key: 'fechaRebobinado', label: 'F. Rebobinado' },
        { key: 'fechaLaminado', label: 'F. Laminado' },
        { key: 'fechaPerforado', label: 'F. Perforado' },
        { key: 'fechaCompletado', label: 'F. Completado' },
    ];

    // --- Stage options for filter dropdown ---
    const stageOptions = useMemo(() => {
        const all = Object.values(Etapa);
        return all.map((e) => ({ value: e, label: ETAPAS[e]?.title ?? e }));
    }, []);

    // --- Render ---
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Seguimiento de Producci�n
                    </h2>
                    <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        {sortedRows.length}
                    </span>
                </div>
            </div>

            {/* Filters row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <DateFilterCombined
                    dateField={dateField}
                    dateFilter={dateFilter}
                    customDateRange={customDateRange}
                    onDateFieldChange={handleDateFieldChange}
                    onDateFilterChange={handleDateFilterChange}
                    onCustomDateChange={handleCustomDateChange}
                    align="left"
                />

                {/* Text search */}
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar pedido, cliente o vendedor..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                    />
                </div>

                {/* Stage filter */}
                <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value as Etapa | '')}
                    className="py-1.5 px-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Todas las etapas</option>
                    {stageOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                                    onClick={() => handleSort(col.key)}
                                >
                                    <span className="inline-flex items-center">
                                        {col.label}
                                        <SortArrow active={sortKey === col.key} dir={sortDir} />
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedRows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-3 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No se encontraron pedidos con los filtros seleccionados.
                                </td>
                            </tr>
                        ) : (
                            sortedRows.map((row) => {
                                const p = row.pedido;
                                const subLabel =
                                    p.etapaActual === Etapa.PREPARACION
                                        ? getSubEtapaLabel(p.subEtapaActual)
                                        : null;

                                return (
                                    <tr
                                        key={p.id}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${onNavigateToPedido ? 'cursor-pointer' : ''}`}
                                        onClick={onNavigateToPedido ? () => onNavigateToPedido(p) : undefined}
                                    >
                                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {p.numeroPedidoCliente}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white ${ETAPAS[p.etapaActual]?.color ?? 'bg-gray-500'}`}
                                            >
                                                {ETAPAS[p.etapaActual]?.title ?? p.etapaActual}
                                            </span>
                                            {subLabel && (
                                                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                                    ({subLabel})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {p.cliente}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {p.vendedorNombre || '-'}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                                            {Number(p.metros).toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {formatDate(row.fechaImpreso)}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {formatDate(row.fechaRebobinado)}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {formatDate(row.fechaLaminado)}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {formatDate(row.fechaPerforado)}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {formatDate(row.fechaCompletado)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductionTrackingTable;
