

import React, { useState, useEffect, useRef } from 'react';
import { ViewType, Prioridad, Etapa, UserRole, Pedido, DateField, WeekFilter as WeekFilterType, EstadoCliché } from '../types';
import { ETAPAS_KANBAN, ETAPAS, STAGE_GROUPS, MAQUINAS_IMPRESION } from '../constants';
import { DateFilterOption, formatMetros } from '../utils/date';
import UserInfo from './UserInfo';
import WeekFilter from './WeekFilter';
import DateFilterCombined from './DateFilterCombined';
import GlobalSearchDropdown from './GlobalSearchDropdown';
import SearchableMultiSelect from './SearchableMultiSelect';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import ActivityPanel from './ActivityPanel';
import { normalizeSearchValue, pedidoMatchesSearch } from '../utils/search';
import { useVendedoresManager } from '../hooks/useVendedoresManager';
import { useClientesManager } from '../hooks/useClientesManager';
import { searchArchivedPedidos } from '../services/storage';
import { useDebounce } from '../hooks/useDebounce';


interface HeaderProps {
    searchTerm: string; // Añadido para controlar el valor del input
    onSearch: (term: string) => void;
    allPedidos: Pedido[]; // Añadido para la búsqueda global
    onNavigateToPedido?: (pedido: Pedido) => void; // Añadido para navegación
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onFilterChange: (name: string, value: string) => void;
    activeFilters: { priority: string, stage: string, dateField: keyof Pedido };
    selectedStages: string[];
    onStageToggle: (stageId: string) => void;
    listViewMetrics?: {
        totalPedidos: number;
        totalMetros: number;
        totalTiempo: string;
    };
    selectedVendedores?: string[];
    onVendedorToggle?: (vendedorId: string) => void;
    selectedClientes?: string[];
    onClienteToggle?: (clienteId: string) => void;
    selectedMaquinas?: string[];
    onMaquinaToggle?: (maquinaId: string) => void;
    antivahoFilter: 'all' | 'con' | 'sin' | 'hecho';
    onAntivahoFilterChange: (value: 'all' | 'con' | 'sin' | 'hecho') => void;
    preparacionFilter?: 'all' | 'sin-material' | 'sin-cliche' | 'listo';
    onPreparacionFilterChange?: (value: 'all' | 'sin-material' | 'sin-cliche' | 'listo') => void;
    estadoClicheFilter?: EstadoCliché | 'all';
    onEstadoClicheFilterChange?: (value: EstadoCliché | 'all') => void;
    anonimoFilter?: 'all' | 'si' | 'no';
    onAnonimoFilterChange?: (value: 'all' | 'si' | 'no') => void;
    weekFilter: WeekFilterType;
    onWeekFilterToggle: () => void;
    onWeekChange: (year: number, week: number) => void;
    onWeekDateFieldChange: (dateField: DateField) => void;
    onDateFilterChange: (value: DateFilterOption) => void;
    activeDateFilter: DateFilterOption;
    customDateRange: { start: string; end: string };
    onCustomDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddPedido: () => void;
    onAddPedidoPrueba?: () => void;
    onBulkImport: () => void; // Nueva prop para importación masiva
    onPdfImport: () => void; // Nueva prop para importación desde PDF
    onExportPDF: () => void;
    onExportData: () => void;
    onImportData: () => void;
    onUserManagement?: () => void;
    onResetAllFilters?: () => void; // Nueva prop para resetear filtros

}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
);

const ResetFiltersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({
    searchTerm,
    onSearch,
    allPedidos,
    onNavigateToPedido,
    currentView,
    onViewChange,
    onFilterChange,
    activeFilters,
    selectedStages,
    onStageToggle,
    listViewMetrics,
    selectedVendedores = [],
    onVendedorToggle,
    selectedClientes = [],
    onClienteToggle,
    selectedMaquinas = [],
    onMaquinaToggle,
    antivahoFilter,
    onAntivahoFilterChange,
    preparacionFilter = 'all',
    onPreparacionFilterChange,
    estadoClicheFilter = 'all',
    onEstadoClicheFilterChange,
    anonimoFilter = 'all',
    onAnonimoFilterChange,
    weekFilter,
    onWeekFilterToggle,
    onWeekChange,
    onWeekDateFieldChange,
    onDateFilterChange,
    activeDateFilter,
    customDateRange,
    onCustomDateChange,
    onAddPedido,
    onAddPedidoPrueba,
    onBulkImport,
    onPdfImport,
    onExportPDF,
    onExportData,
    onImportData,
    onUserManagement,
    onResetAllFilters
}) => {
    const { user } = useAuth();
    const {
        canViewReportes,
        canViewPedidos,
        canManageUsers,
        canManageConfig,
        isAdmin
    } = usePermissions();

    // Cargar vendedores y clientes para los filtros
    const { vendedores, loading: vendedoresLoading } = useVendedoresManager();
    const { clientes, isLoading: clientesLoading } = useClientesManager();

    // Compatibilidad: Header usa nombres históricos (en inglés)
    const canViewReports = canViewReportes;
    const canCreatePedidos = canViewPedidos;
    const canViewConfig = canManageConfig;
    const canAccessAdmin = () => isAdmin() || canManageUsers() || canManageConfig();
    const currentUserRole = user?.role || 'Visualizador';
    const [isStageFiltersCollapsed, setIsStageFiltersCollapsed] = useState(true);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [showBurgerMenu, setShowBurgerMenu] = useState(false);
    const [showActivityPanel, setShowActivityPanel] = useState(false);
    const [showMaquinaDropdown, setShowMaquinaDropdown] = useState(false);
    const [archivedSearchResults, setArchivedSearchResults] = useState<Pedido[]>([]);
    const [isSearchingArchived, setIsSearchingArchived] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    const searchContainerRef = useRef<HTMLDivElement>(null);
    const burgerMenuRef = useRef<HTMLDivElement>(null);
    const maquinaDropdownRef = useRef<HTMLDivElement>(null);

    const toggleStageFiltersCollapsed = () => {
        setIsStageFiltersCollapsed(prev => !prev);
    };

    // Resetear el estado cuando cambie la vista
    useEffect(() => {
        if (currentView !== 'list') {
            setIsStageFiltersCollapsed(false);
        }
        // Cerrar dropdown de máquina cuando cambia la vista
        setShowMaquinaDropdown(false);
    }, [currentView]);

    // Cerrar dropdown y menú hamburguesa al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // No cerrar si el clic es dentro del dropdown (buscar por clases del GlobalSearchDropdown)
            if (target.closest('.global-search-dropdown')) {
                return;
            }

            if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
                handleHideSearchDropdown();
            }

            // Cerrar menú hamburguesa
            if (burgerMenuRef.current && !burgerMenuRef.current.contains(target)) {
                setShowBurgerMenu(false);
            }

            // Cerrar dropdown de máquina
            if (maquinaDropdownRef.current && !maquinaDropdownRef.current.contains(target)) {
                setShowMaquinaDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Buscar pedidos archivados en el backend cuando cambia el término de búsqueda
    useEffect(() => {
        const normalizedTerm = normalizeSearchValue(debouncedSearchTerm);
        if (!normalizedTerm || normalizedTerm.length < 2) {
            setArchivedSearchResults([]);
            setIsSearchingArchived(false);
            return;
        }

        let cancelled = false;
        setIsSearchingArchived(true);

        searchArchivedPedidos(debouncedSearchTerm, 30)
            .then((results) => {
                if (!cancelled) {
                    setArchivedSearchResults(results);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setArchivedSearchResults([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsSearchingArchived(false);
                }
            });

        return () => { cancelled = true; };
    }, [debouncedSearchTerm]);

    // Función para filtrar pedidos basada en el término de búsqueda
    const searchResults = React.useMemo(() => {
        const normalizedTerm = normalizeSearchValue(searchTerm);
        if (!normalizedTerm) {
            return [];
        }

        const matchedPedidos = allPedidos.filter((pedido) => pedidoMatchesSearch(pedido, normalizedTerm));
        const dedupedPedidos = new Map<string, Pedido>();

        matchedPedidos.forEach((pedido) => {
            const numeroPedidoKey = normalizeSearchValue(pedido.numeroPedidoCliente);
            const dedupeKey = numeroPedidoKey || normalizeSearchValue(pedido.id);
            const existingPedido = dedupedPedidos.get(dedupeKey);

            if (!existingPedido) {
                dedupedPedidos.set(dedupeKey, pedido);
                return;
            }

            const existingIsArchived = existingPedido.etapaActual === Etapa.ARCHIVADO;
            const currentIsArchived = pedido.etapaActual === Etapa.ARCHIVADO;

            if (existingIsArchived && !currentIsArchived) {
                dedupedPedidos.set(dedupeKey, pedido);
            }
        });

        // Agregar resultados archivados del backend que no estén ya presentes
        archivedSearchResults.forEach((pedido) => {
            const numeroPedidoKey = normalizeSearchValue(pedido.numeroPedidoCliente);
            const dedupeKey = numeroPedidoKey || normalizeSearchValue(pedido.id);
            if (!dedupedPedidos.has(dedupeKey)) {
                dedupedPedidos.set(dedupeKey, pedido);
            }
        });

        return Array.from(dedupedPedidos.values());
    }, [searchTerm, allPedidos, archivedSearchResults]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const normalizedValue = normalizeSearchValue(value);
        onSearch(value);
        setShowSearchDropdown(prev => prev || normalizedValue.length > 0);
    };

    const handleSelectPedido = (pedido: Pedido) => {
        setShowSearchDropdown(false);
        onSearch(''); // Limpiar el término de búsqueda
        if (onNavigateToPedido) {
            onNavigateToPedido(pedido);
        }
    };

    const handleCloseSearchDropdown = () => {
        onSearch('');
        setShowSearchDropdown(false);
    };

    const handleHideSearchDropdown = () => {
        setShowSearchDropdown(false);
    };

    const { canViewClientes } = usePermissions();

    // Vistas principales (etapas de trabajo)
    const workViews: { id: ViewType; label: string }[] = [
        { id: 'preparacion', label: 'Preparación' },
        { id: 'listoProduccion', label: 'Listo Prod.' },
        { id: 'kanban', label: 'Producción' },
    ];

    // Vistas secundarias (operación)
    const operationViews: { id: ViewType; label: string }[] = [
        { id: 'list', label: 'Lista' },
    ];

    // Vistas de gestión (requieren permisos)
    const managementViews: { id: ViewType; label: string, permission?: () => boolean }[] = [
        { id: 'clientes', label: 'Clientes', permission: canViewClientes },
        { id: 'vendedores', label: 'Comerciales', permission: canViewClientes },
        { id: 'permissions-debug', label: '🔍 Debug Permisos', permission: canAccessAdmin },
    ];

    const baseButtonClass = "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-200 dark:focus:ring-offset-gray-700 focus:ring-indigo-500";
    const activeButtonClass = "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm";
    const inactiveButtonClass = "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10";

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 py-3">
                {/* Primera fila: Logo + Navegación Principal */}
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Planning Pigmea" className="h-10 md:h-12 w-auto" />
                        <UserInfo />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Navegación Principal - Etapas de Trabajo */}
                        <div className="hidden lg:flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            {workViews.map(view => (
                                <button
                                    key={view.id}
                                    onClick={() => onViewChange(view.id)}
                                    className={`${baseButtonClass} ${currentView === view.id ? activeButtonClass : inactiveButtonClass}`}
                                >
                                    {view.label}
                                </button>
                            ))}
                        </div>

                        {/* Separador visual */}
                        <div className="hidden lg:block w-px h-8 bg-gray-300 dark:bg-gray-600"></div>

                        {/* Vistas Secundarias */}
                        <div className="hidden md:flex items-center gap-1.5">
                            {operationViews.map(view => (
                                <button
                                    key={view.id}
                                    onClick={() => onViewChange(view.id)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentView === view.id ? 'bg-gray-800 dark:bg-gray-700 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {view.label}
                                </button>
                            ))}

                            {/* Botón Archivados - Más visible */}
                            <button
                                onClick={() => onViewChange('archived')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${currentView === 'archived'
                                    ? 'bg-gray-800 dark:bg-gray-700 text-white shadow'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                </svg>
                                Archivados
                            </button>

                            {/* Botón Reportes - Destacado */}
                            {canViewReports() && (
                                <button
                                    onClick={() => onViewChange('report')}
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${currentView === 'report'
                                        ? 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-lg'
                                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-md'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                                    </svg>
                                    Reportes
                                </button>
                            )}
                        </div>

                        {/* Activity Log */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    setShowActivityPanel(!showActivityPanel);
                                }}
                                className={`relative p-2 rounded-md transition-colors ${showActivityPanel
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                title="Activity Log"
                                aria-label="Activity Log"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </button>
                        </div>

                        {/* Botón Añadir Pedido */}
                        {canCreatePedidos() && (
                            <div className="flex gap-2">
                                <button
                                    onClick={onAddPedido}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
                                    title="Añadir nuevo pedido"
                                >
                                    <PlusIcon />
                                    <span className="hidden md:inline">Añadir</span>
                                </button>
                                {/* Botón Añadir Muestra (solo en Producción) */}
                                {currentView === 'kanban' && onAddPedidoPrueba && (
                                    <button
                                        onClick={onAddPedidoPrueba}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors"
                                        title="Añadir Muestra"
                                    >
                                        <PlusIcon />
                                        <span className="hidden md:inline">Muestra</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Botón Importación Masiva - Dropdown */}
                        {canCreatePedidos() && (
                            <div className="relative group">
                                <button
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors"
                                    title="Importar pedidos"
                                >
                                    <UploadIcon />
                                    <span className="hidden md:inline">Importar</span>
                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                    <button
                                        onClick={onBulkImport}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Desde Excel
                                    </button>
                                    <button
                                        onClick={onPdfImport}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        Desde PDF
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Exportar PDF destacado en vista de Lista */}
                        {currentView === 'list' && (
                            <button
                                onClick={onExportPDF}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-md font-semibold hover:bg-amber-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-amber-500"
                                title="Exportar la lista a PDF"
                                aria-label="Exportar PDF"
                            >
                                <DownloadIcon />
                                <span className="hidden md:inline">Exportar PDF</span>
                            </button>
                        )}

                        {/* Menú Hamburguesa */}
                        <div className="relative" ref={burgerMenuRef}>
                            <button
                                onClick={() => setShowBurgerMenu(!showBurgerMenu)}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                title="Más opciones"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            {/* Dropdown del Menú */}
                            {showBurgerMenu && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                                    {/* Vistas Rápidas - Visible en móvil */}
                                    <div className="md:hidden">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Vistas</div>
                                        {workViews.map(view => (
                                            <button
                                                key={view.id}
                                                onClick={() => {
                                                    onViewChange(view.id);
                                                    setShowBurgerMenu(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentView === view.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {view.label}
                                            </button>
                                        ))}
                                        {operationViews.map(view => (
                                            <button
                                                key={view.id}
                                                onClick={() => {
                                                    onViewChange(view.id);
                                                    setShowBurgerMenu(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentView === view.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {view.label}
                                            </button>
                                        ))}

                                        {/* Archivados en móvil */}
                                        <button
                                            onClick={() => {
                                                onViewChange('archived');
                                                setShowBurgerMenu(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${currentView === 'archived' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                            </svg>
                                            Archivados
                                        </button>

                                        {/* Reportes en móvil */}
                                        {canViewReports() && (
                                            <button
                                                onClick={() => {
                                                    onViewChange('report');
                                                    setShowBurgerMenu(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center gap-2 ${currentView === 'report' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold' : 'text-indigo-600 dark:text-indigo-400 font-medium'
                                                    }`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                                                </svg>
                                                Reportes
                                            </button>
                                        )}

                                        <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                                    </div>

                                    {/* Vistas de Gestión */}
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Gestión</div>
                                    {managementViews.map(view => {
                                        if (view.permission && !view.permission()) return null;
                                        return (
                                            <button
                                                key={view.id}
                                                onClick={() => {
                                                    onViewChange(view.id);
                                                    setShowBurgerMenu(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentView === view.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {view.label}
                                            </button>
                                        );
                                    })}

                                    <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>

                                    {/* Opciones de Admin */}
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Acciones</div>

                                    {(currentView === 'archived') && (
                                        <button
                                            onClick={() => {
                                                onExportPDF();
                                                setShowBurgerMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                        >
                                            <DownloadIcon />
                                            Exportar PDF
                                        </button>
                                    )}

                                    {canAccessAdmin() && onUserManagement && (
                                        <button
                                            onClick={() => {
                                                onUserManagement();
                                                setShowBurgerMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                        >
                                            <UsersIcon />
                                            Gestión de Usuarios
                                        </button>
                                    )}

                                    {canViewConfig() && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    onImportData();
                                                    setShowBurgerMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                            >
                                                <UploadIcon />
                                                Importar Datos
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onExportData();
                                                    setShowBurgerMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                            >
                                                <DownloadIcon />
                                                Exportar Datos
                                            </button>
                                        </>
                                    )}

                                    {onResetAllFilters && (
                                        <>
                                            <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                                            <button
                                                onClick={() => {
                                                    if (confirm('¿Desea resetear todos los filtros y ordenamientos a sus valores por defecto?')) {
                                                        onResetAllFilters();
                                                        setShowBurgerMenu(false);
                                                    }
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-2"
                                            >
                                                <ResetFiltersIcon />
                                                Resetear Filtros
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Segunda fila: Filtros y Búsqueda */}
                {(currentView !== 'report' && currentView !== 'permissions-debug' && currentView !== 'clientes' && currentView !== 'vendedores') && (
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Filtro de Fecha Combinado */}
                        <DateFilterCombined
                            dateField={activeFilters.dateField}
                            dateFilter={activeDateFilter}
                            customDateRange={customDateRange}
                            onDateFieldChange={(field) => onFilterChange('dateField', field)}
                            onDateFilterChange={onDateFilterChange}
                            onCustomDateChange={onCustomDateChange}
                        />

                        {/* Filtro de Semana */}
                        <WeekFilter
                            weekFilter={weekFilter}
                            onToggle={onWeekFilterToggle}
                            onWeekChange={onWeekChange}
                            onDateFieldChange={onWeekDateFieldChange}
                        />

                        {/* Grupo de Filtros Básicos (responsivo) */}
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                name="priority"
                                value={activeFilters.priority}
                                onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                                className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">🎯 Prioridad</option>
                                {Object.values(Prioridad).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>

                            <select
                                name="antivaho"
                                value={antivahoFilter}
                                onChange={(e) => onAntivahoFilterChange(e.target.value as 'all' | 'con' | 'sin' | 'hecho')}
                                className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">💨 Antivaho</option>
                                <option value="con">Con Antivaho</option>
                                <option value="sin">Sin Antivaho</option>
                                <option value="hecho">Hecho</option>
                            </select>

                            {/* Filtro de Anónimo */}
                            {onAnonimoFilterChange && (
                                <select
                                    name="anonimo"
                                    value={anonimoFilter}
                                    onChange={(e) => onAnonimoFilterChange(e.target.value as 'all' | 'si' | 'no')}
                                    className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">👤 Anónimo</option>
                                    <option value="si">Sí</option>
                                    <option value="no">No</option>
                                </select>
                            )}

                            {/* Filtro de Estado de Cliché */}
                            {onEstadoClicheFilterChange && (
                                <select
                                    name="estadoCliche"
                                    value={estadoClicheFilter}
                                    onChange={(e) => onEstadoClicheFilterChange(e.target.value as EstadoCliché | 'all')}
                                    className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">🎨 Cliché</option>
                                    <option value={EstadoCliché.PENDIENTE_CLIENTE}>Repetición</option>
                                    <option value={EstadoCliché.REPETICION_CAMBIO}>Rep. c/Cambio</option>
                                    <option value={EstadoCliché.NUEVO}>Nuevo</option>
                                </select>
                            )}
                        </div>

                        {/* Filtro Multi-Select de Vendedor */}
                        {onVendedorToggle && (
                            <SearchableMultiSelect
                                selectedIds={selectedVendedores}
                                onToggle={onVendedorToggle}
                                options={vendedores.map(v => ({
                                    id: v.id,
                                    label: v.nombre,
                                    isInactive: !v.activo
                                }))}
                                placeholder="Comercial"
                                icon="👤"
                                disabled={vendedoresLoading}
                                allowSelectAll={true}
                                allowUnassigned={true}
                                unassignedLabel="Sin asignar"
                            />
                        )}

                        {/* Filtro Multi-Select de Cliente */}
                        {onClienteToggle && (
                            <SearchableMultiSelect
                                selectedIds={selectedClientes}
                                onToggle={onClienteToggle}
                                options={clientes.map(c => ({
                                    id: c.id,
                                    label: c.nombre,
                                    isInactive: (c.estado || '').toLowerCase() !== 'activo'
                                }))}
                                placeholder="Cliente"
                                icon="🏢"
                                disabled={clientesLoading}
                                allowSelectAll={true}
                                allowUnassigned={true}
                                unassignedLabel="Sin asignar"
                            />
                        )}

                        {/* Filtro Multi-Select de Máquina (solo en preparacion y listoProduccion) */}
                        {onMaquinaToggle && (currentView === 'preparacion' || currentView === 'listoProduccion') && (
                            <div ref={maquinaDropdownRef} className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMaquinaDropdown(prev => !prev);
                                    }}
                                    className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                                >
                                    <span>🖨️ Máquina</span>
                                    {selectedMaquinas.length > 0 && (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 dark:bg-indigo-500 rounded-full">
                                            {selectedMaquinas.length}
                                        </span>
                                    )}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showMaquinaDropdown && (
                                    <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto">
                                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                            <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMaquinas.length === 0}
                                                    onChange={() => onMaquinaToggle('all')}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">Todas</span>
                                            </label>
                                        </div>
                                        <div className="p-2">
                                            <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMaquinas.includes('sin_maquina')}
                                                    onChange={() => onMaquinaToggle('sin_maquina')}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 italic">Sin máquina</span>
                                            </label>
                                            {MAQUINAS_IMPRESION.map(maquina => (
                                                <label
                                                    key={`maquina-${maquina.id}`}
                                                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMaquinas.includes(maquina.id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            onMaquinaToggle(maquina.id);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        {maquina.nombre}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Filtro de estado de preparación (visible solo en vista preparacion) */}
                        {currentView === 'preparacion' && onPreparacionFilterChange && (
                            <select
                                name="preparacion"
                                value={preparacionFilter}
                                onChange={(e) => onPreparacionFilterChange(e.target.value as 'all' | 'sin-material' | 'sin-cliche' | 'listo')}
                                className="px-2 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-gray-900 dark:text-yellow-200 border border-yellow-400 dark:border-yellow-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-medium"
                            >
                                <option value="all">📋 Estado</option>
                                <option value="sin-material">❌ Sin Material</option>
                                <option value="sin-cliche">⚠️ Sin Cliché</option>
                                <option value="listo">✅ Listo</option>
                            </select>
                        )}

                        {/* Filtro de etapas como select para vistas que no son lista */}
                        {currentView === 'kanban' && (
                            <select
                                name="stage"
                                value={activeFilters.stage}
                                onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                                className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">🏭 Etapa</option>
                                {ETAPAS_KANBAN.map(etapaId => <option key={etapaId} value={etapaId}>{ETAPAS[etapaId].title}</option>)}
                            </select>
                        )}

                        <div ref={searchContainerRef} className="relative flex-grow max-w-xs">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar..."
                                    value={searchTerm}
                                    className="w-full px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    onChange={handleSearchChange}
                                    onFocus={() => normalizeSearchValue(searchTerm).length > 0 && setShowSearchDropdown(true)}
                                />
                            </div>
                        </div>
                        {showSearchDropdown && (
                            <GlobalSearchDropdown
                                searchTerm={searchTerm}
                                onSearchChange={(value) => {
                                    const normalizedValue = normalizeSearchValue(value);
                                    onSearch(value);
                                    setShowSearchDropdown(prev => prev || normalizedValue.length > 0);
                                }}
                                results={searchResults}
                                onSelectPedido={handleSelectPedido}
                                onClose={handleHideSearchDropdown}
                                onCloseAndClear={handleCloseSearchDropdown}
                                isSearchingArchived={isSearchingArchived}
                            />
                        )}
                    </div>
                )}

                {/* Tercera fila: Grid de botones de etapas solo para vista de lista */}
                {currentView === 'list' && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 via-white to-gray-50 px-3 py-3 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-800 md:px-4">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                Filtro por etapa
                                            </span>
                                            <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                {selectedStages.length === 0 ? 'Todas activas' : `${selectedStages.length} activas`}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            La tabla y el resumen cambian en tiempo real según los filtros aplicados.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={toggleStageFiltersCollapsed}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-white"
                                            title={isStageFiltersCollapsed ? 'Expandir filtros' : 'Contraer filtros'}
                                        >
                                            <svg
                                                className={`h-4 w-4 transition-transform duration-200 ${isStageFiltersCollapsed ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                            {isStageFiltersCollapsed ? 'Mostrar filtros' : 'Ocultar filtros'}
                                        </button>
                                        <button
                                            onClick={() => onStageToggle('all')}
                                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedStages.length === 0
                                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                                : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80"></span>
                                            Todas las etapas
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    <div className="rounded-xl border border-gray-200 bg-white/90 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/80">
                                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Pedidos visibles</div>
                                        <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{listViewMetrics?.totalPedidos ?? 0}</div>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 bg-white/90 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/80">
                                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Metros totales</div>
                                        <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{formatMetros(listViewMetrics?.totalMetros ?? 0)} m</div>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 bg-white/90 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/80">
                                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Tiempo planificado</div>
                                        <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{listViewMetrics?.totalTiempo ?? '00:00'}</div>
                                    </div>
                                </div>

                                <div
                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isStageFiltersCollapsed
                                        ? 'max-h-0 opacity-0'
                                        : 'max-h-[40rem] opacity-100'
                                        }`}
                                >
                                    <div className="grid grid-cols-1 gap-3 pt-1 lg:grid-cols-2 xl:grid-cols-4">
                                        {Object.values(STAGE_GROUPS).map(group => (
                                            <div key={group.title} className="rounded-xl border border-gray-200 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                                                <div className="mb-2 flex items-center justify-between gap-2">
                                                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                                                        {group.title}
                                                    </h4>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">{group.stages.length}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {group.stages.map(etapaId => (
                                                        <button
                                                            key={etapaId}
                                                            onClick={() => onStageToggle(etapaId)}
                                                            className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedStages.includes(etapaId)
                                                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-700'
                                                                }`}
                                                            title={ETAPAS[etapaId].title}
                                                        >
                                                            <span className={`h-1.5 w-1.5 rounded-full ${selectedStages.includes(etapaId) ? 'bg-white' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                                                            <span className="truncate">
                                                                {ETAPAS[etapaId].title.length > 18
                                                                    ? `${ETAPAS[etapaId].title.substring(0, 18)}...`
                                                                    : ETAPAS[etapaId].title
                                                                }
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Activity panel — global action history feed */}
            <ActivityPanel
                isOpen={showActivityPanel}
                onClose={() => setShowActivityPanel(false)}
                onNavigateToPedido={(pedidoId) => {
                    const pedido = allPedidos.find(p => p.id === pedidoId);
                    if (pedido && onNavigateToPedido) {
                        setShowActivityPanel(false);
                        onNavigateToPedido(pedido);
                    }
                }}
            />
        </header>
    );
};

export default Header;
