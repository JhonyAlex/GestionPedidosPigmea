import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActionHistoryEntry } from '../types';
import { actionHistoryDB } from '../services/actionHistory';
import webSocketService from '../services/websocket';
import { formatDateDDMMYYYY } from '../utils/date';

interface ActivityPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToPedido?: (pedidoId: string) => void;
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ isOpen, onClose, onNavigateToPedido }) => {
    const [actions, setActions] = useState<ActionHistoryEntry[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // Search state
    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState<string | null>(null);

    // Concurrency guards: abort stale requests + expose loading state to socket callback
    const abortControllerRef = useRef<AbortController | null>(null);
    const loadingRef = useRef(false);

    // Keep loadingRef in sync so the socket callback always reads the current value
    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    // Fetch global actions with optional cursor for pagination
    const fetchActions = useCallback(async (cursor?: string | null, search?: string) => {
        // Abort any in-flight request before starting a new one
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setError(null);
        try {
            const response = await actionHistoryDB.getGlobalActions(cursor, 30, controller.signal, search);
            // If this request was aborted by a newer call, discard results
            if (controller.signal.aborted) return;
            if (cursor) {
                // Append to existing list
                setActions(prev => [...prev, ...response.actions]);
            } else {
                // Initial load or refresh (or search)
                setActions(response.actions);
            }
            setNextCursor(response.nextCursor);
            setHasMore(response.hasMore);
        } catch (err) {
            if (controller.signal.aborted) return;
            const msg = err instanceof Error ? err.message : 'Failed to load activity';
            setError(cursor ? 'Failed to load more entries' : msg);
            console.error('Error loading global action history:', err);
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }, []);

    // Lazy load: fetch only when panel opens for the first time
    useEffect(() => {
        if (isOpen && !initialLoadDone) {
            setInitialLoadDone(true);
            fetchActions(null);
        }
    }, [isOpen, initialLoadDone, fetchActions]);

    // Reset state when panel closes (so next open triggers a fresh load)
    useEffect(() => {
        if (!isOpen) {
            setInitialLoadDone(false);
            setActions([]);
            setNextCursor(null);
            setHasMore(false);
            setError(null);
            setSearchInput('');
            setActiveSearch(null);
        }
    }, [isOpen]);

    // Light refresh on action-history-update socket events (cooldown: 3s)
    // Skips refresh during load-more, initial load, or active search
    useEffect(() => {
        if (!isOpen) return;

        let cooldown = false;
        const unsubscribe = webSocketService.subscribeToActionHistoryUpdate(() => {
            if (cooldown) return;
            if (loadingRef.current) return; // skip when loading — prevents page reset during load-more
            if (activeSearch) return; // skip when a search filter is active
            cooldown = true;
            setTimeout(() => { cooldown = false; }, 3000);
            fetchActions(null, undefined);
        });

        return unsubscribe;
    }, [isOpen, fetchActions, activeSearch]);

    // Search handlers
    const handleSearchSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const term = searchInput.trim();
        if (!term) {
            // Empty search → clear and go back to global feed
            setActiveSearch(null);
            setActions([]);
            fetchActions(null, undefined);
            return;
        }
        setActiveSearch(term);
        setActions([]);
        setNextCursor(null);
        setHasMore(false);
        fetchActions(null, term);
    }, [searchInput, fetchActions]);

    const handleClearSearch = useCallback(() => {
        setSearchInput('');
        setActiveSearch(null);
        setActions([]);
        setNextCursor(null);
        setHasMore(false);
        fetchActions(null, undefined);
    }, [fetchActions]);

    const handleLoadMore = () => {
        if (nextCursor && !loading) {
            fetchActions(nextCursor, activeSearch || undefined);
        }
    };

    const handleRetry = () => {
        if (actions.length === 0) {
            fetchActions(null, activeSearch || undefined);
        } else {
            fetchActions(nextCursor, activeSearch || undefined);
        }
    };

    const handleActionClick = (action: ActionHistoryEntry) => {
        if (action.contextType !== 'pedido') return;
        if (!onNavigateToPedido) return;
        onClose();
        onNavigateToPedido(action.contextId);
    };

    // UI helpers
    const getActionIcon = (type: string) => {
        const icons: Record<string, string> = {
            CREATE: '\u2795',
            UPDATE: '\u270F\uFE0F',
            DELETE: '\uD83D\uDDD1\uFE0F',
            BULK_UPDATE: '\uD83D\uDCDD',
            BULK_DELETE: '\uD83D\uDDD1\uFE0F',
        };
        return icons[type] || '\uD83D\uDCC4';
    };

    const getContextLabel = (contextType: string) => {
        const labels: Record<string, string> = {
            pedido: 'Order',
            cliente: 'Client',
            vendedor: 'Vendor',
            material: 'Material',
        };
        return labels[contextType] || contextType;
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInMs = now.getTime() - date.getTime();
            const diffInMinutes = Math.floor(diffInMs / 60000);
            const diffInHours = Math.floor(diffInMs / 3600000);
            const diffInDays = Math.floor(diffInMs / 86400000);

            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
            if (diffInHours < 24) return `${diffInHours} h ago`;
            if (diffInDays === 1) return 'Yesterday';
            if (diffInDays < 7) return `${diffInDays} days ago`;
            return formatDateDDMMYYYY(timestamp) + ' ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return timestamp;
        }
    };

    return (
        <>
            {/* Dark overlay */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-40 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Side panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Panel header */}
                <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between p-4 pb-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                Activity Log
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            aria-label="Close panel"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search bar */}
                    <div className="px-4 pb-3">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search by order number..."
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    aria-label="Search activity by order number"
                                />
                                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchInput && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearchInput(''); if (activeSearch) handleClearSearch(); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        aria-label="Clear search input"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-1"
                                aria-label="Search"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    'Search'
                                )}
                            </button>
                        </form>
                        {activeSearch && (
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                    Filtered by: <span className="font-medium">{activeSearch}</span>
                                </span>
                                <button
                                    onClick={handleClearSearch}
                                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                                >
                                    Clear filter
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100vh-200px)] p-2">
                    {loading && actions.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Loading activity...</p>
                            </div>
                        </div>
                    ) : error && actions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className="text-5xl mb-3">⚠️</div>
                            <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                                Could not load activity
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                                {error}
                            </p>
                            <button
                                onClick={handleRetry}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : actions.length === 0 && activeSearch ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className="text-5xl mb-4">🔍</div>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                                No results for "{activeSearch}"
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                                Try a different order number or clear the filter
                            </p>
                            <button
                                onClick={handleClearSearch}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                Clear filter
                            </button>
                        </div>
                    ) : actions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className="text-6xl mb-4">📄</div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                No activity recorded yet
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Recent order updates and changes will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {actions.map((action, index) => (
                                <div
                                    key={action.id}
                                    onClick={() => handleActionClick(action)}
                                    role={action.contextType === 'pedido' && onNavigateToPedido ? 'button' : undefined}
                                    tabIndex={action.contextType === 'pedido' && onNavigateToPedido ? 0 : undefined}
                                    className={`p-3 rounded-lg border transition-all duration-200
                                        bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600
                                        ${index === 0 && !activeSearch ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                                        ${action.contextType === 'pedido' && onNavigateToPedido ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600/60' : ''}`}
                                    style={index > 10 ? { contentVisibility: 'auto', containIntrinsicSize: 'auto 100px' } : undefined}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{getActionIcon(action.type)}</span>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {action.payload?.summary?.title || action.description}
                                                </p>
                                                {action.payload?.summary?.details && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                                        {action.payload.summary.details}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {action.userName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>{formatTimestamp(action.timestamp)}</span>
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">
                                            {getContextLabel(action.contextType)}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Inline error retry banner for load-more failures */}
                            {error && actions.length > 0 && (
                                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 min-w-0">
                                        <span className="shrink-0">⚠️</span>
                                        <span className="truncate">{error}</span>
                                    </div>
                                    <button
                                        onClick={handleRetry}
                                        className="shrink-0 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {/* Load more button */}
                            {hasMore && (
                                <div className="flex justify-center py-3">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                                Load more
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        {activeSearch
                            ? `${actions.length} result${actions.length !== 1 ? 's' : ''} for "${activeSearch}"`
                            : `${actions.length} recent actions`
                        }
                        <br />
                        <span className="text-gray-400 dark:text-gray-500">
                            Click an order action to navigate to it
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ActivityPanel;
