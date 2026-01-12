

import React, { useState, useEffect, useRef } from 'react';
import { ViewType, Prioridad, Etapa, UserRole, Pedido, DateField, WeekFilter as WeekFilterType, EstadoCliché } from '../types';
import { ETAPAS_KANBAN, ETAPAS, STAGE_GROUPS, MAQUINAS_IMPRESION } from '../constants';
import { DateFilterOption } from '../utils/date';
import UserInfo from './UserInfo';
import WeekFilter from './WeekFilter';
import DateFilterCombined from './DateFilterCombined';
import GlobalSearchDropdown from './GlobalSearchDropdown';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNotifications } from '../contexts/NotificationContext';
import { useActionHistory } from '../hooks/useActionHistory';
import ActionHistoryPanel from './ActionHistoryPanel';
import { normalizeSearchValue, pedidoMatchesSearch } from '../utils/search';
import { useVendedoresManager } from '../hooks/useVendedoresManager';
import { useClientesManager } from '../hooks/useClientesManager';


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
    onExportPDF: () => void;
    onExportData: () => void;
    onImportData: () => void;
    onUserManagement?: () => void;
    onResetAllFilters?: () => void; // Nueva prop para resetear filtros
    onToggleNotificationPanel?: () => void; // Nueva prop para abrir/cerrar panel de notificaciones
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
    const { state: actionHistoryState, markAllAsRead } = useActionHistory();
    const currentUserRole = user?.role || 'Operador';
    const [isStageFiltersCollapsed, setIsStageFiltersCollapsed] = useState(true);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [showBurgerMenu, setShowBurgerMenu] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [showMaquinaDropdown, setShowMaquinaDropdown] = useState(false);
    const [showVendedorDropdown, setShowVendedorDropdown] = useState(false);
    const [showClienteDropdown, setShowClienteDropdown] = useState(false);
        // Al abrir (y mientras esté abierto), marcar como leído para que el badge baje a 0
        useEffect(() => {
            if (!showHistoryPanel) return;
            if (actionHistoryState.unreadCount <= 0) return;
            markAllAsRead();
        }, [showHistoryPanel, actionHistoryState.unreadCount, markAllAsRead]);

    const searchContainerRef = useRef<HTMLDivElement>(null);
    const burgerMenuRef = useRef<HTMLDivElement>(null);
    const vendedorDropdownRef = useRef<HTMLDivElement>(null)
    const maquinaDropdownRef = useRef<HTMLDivElement>(null);;
    const clienteDropdownRef = useRef<HTMLDivElement>(null);

    // Resetear el estado cuando cambie la vista
    useEffect(() => {
        if (currentView !== 'list') {
            setIsStageFiltersCollapsed(false);
        }
        // Cerrar dropdowns cuando cambia la vista
        setShowMaquinaDropdown(false);
        setShowVendedorDropdown(false);
        setShowClienteDropdown(false);
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
                setShowSearchDropdown(false);
            }
            
            // Cerrar menú hamburguesa
            if (burgerMenuRef.current && !burgerMenuRef.current.contains(target)) {
                setShowBurgerMenu(false);
            }

            // Cerrar dropdowns de vendedor y cliente
            if (vendedorDropdownRef.current && !vendedorDropdownRef.current.contains(target)) {
                setShowVendedorDropdown(false);
            }
            if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(target)) {
                setShowClienteDropdown(false);
            }
            if (maquinaDropdownRef.current && !maquinaDropdownRef.current.contains(target)) {
                setShowMaquinaDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Función para filtrar pedidos basada en el término de búsqueda
    const searchResults = React.useMemo(() => {
        const normalizedTerm = normalizeSearchValue(searchTerm);
        if (!normalizedTerm) {
            return [];
        }

        return allPedidos.filter(pedido => pedidoMatchesSearch(pedido, normalizedTerm));
    }, [searchTerm, allPedidos]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onSearch(value);
        setShowSearchDropdown(normalizeSearchValue(value).length > 0);
    };

    const handleSelectPedido = (pedido: Pedido) => {
        setShowSearchDropdown(false);
        onSearch(''); // Limpiar el término de búsqueda
        if (onNavigateToPedido) {
            onNavigateToPedido(pedido);
        }
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
        { id: 'operador', label: 'Operador' },
        { id: 'list', label: 'Lista' },
        { id: 'archived', label: 'Archivados' },
    ];

    // Vistas de gestión (requieren permisos)
    const managementViews: { id: ViewType; label: string, permission?: () => boolean }[] = [
        { id: 'clientes', label: 'Clientes', permission: canViewClientes },
        { id: 'vendedores', label: 'Vendedores', permission: canViewClientes },
        { id: 'report', label: 'Reportes', permission: canViewReports },
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
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Planning Pigmea</h1>
                        <UserInfo />
                    </div>

                    <div className="flex items-center gap-2">
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

                        {/* Vistas Secundarias */}
                        <div className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            {operationViews.map(view => (
                                <button
                                    key={view.id}
                                    onClick={() => onViewChange(view.id)}
                                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${currentView === view.id ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'}`}
                                >
                                    {view.label}
                                </button>
                            ))}
                        </div>

                        {/* Historial de acciones */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    const next = !showHistoryPanel;
                                    setShowHistoryPanel(next);
                                    if (next) {
                                        markAllAsRead();
                                    }
                                }}
                                className={`relative p-2 rounded-md transition-colors ${
                                    showHistoryPanel 
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                title="Historial de acciones"
                                aria-label="Historial de acciones"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                {actionHistoryState.unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                                        {actionHistoryState.unreadCount > 9 ? '9+' : actionHistoryState.unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Botón Añadir Pedido */}
                        {canCreatePedidos() && (
                            <button 
                                onClick={onAddPedido}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
                                title="Añadir nuevo pedido"
                            >
                                <PlusIcon />
                                <span className="hidden md:inline">Añadir</span>
                            </button>
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
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
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
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                    currentView === view.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300'
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
                                    {Object.values(EstadoCliché).map(estado => (
                                        <option key={estado} value={estado}>{estado}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Filtro Multi-Select de Vendedor */}
                        {onVendedorToggle && (
                            <div ref={vendedorDropdownRef} className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowVendedorDropdown(prev => !prev);
                                    }}
                                    className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                                    disabled={vendedoresLoading}
                                >
                                    <span>👤 Vendedor</span>
                                    {selectedVendedores.length > 0 && (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 dark:bg-indigo-500 rounded-full">
                                            {selectedVendedores.length}
                                        </span>
                                    )}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showVendedorDropdown && (
                                    <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto">
                                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                            <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedVendedores.length === 0}
                                                    onChange={() => onVendedorToggle('all')}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">Todos</span>
                                            </label>
                                        </div>
                                        <div className="p-2">
                                            <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedVendedores.includes('sin_asignar')}
                                                    onChange={() => onVendedorToggle('sin_asignar')}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 italic">Sin asignar</span>
                                            </label>
                                            {vendedores
                                                .sort((a, b) => {
                                                    // Primero activos, luego inactivos, ambos alfabéticamente
                                                    if (a.activo !== b.activo) return a.activo ? -1 : 1;
                                                    return a.nombre.localeCompare(b.nombre);
                                                })
                                                .map(vendedor => (
                                                    <label 
                                                        key={`vendedor-${vendedor.id}`} 
                                                        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedVendedores.includes(vendedor.id)}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                onVendedorToggle(vendedor.id);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                        />
                                                        <span className={`text-sm ${
                                                            vendedor.activo 
                                                                ? 'text-gray-900 dark:text-white' 
                                                                : 'text-gray-500 dark:text-gray-500 italic line-through'
                                                        }`}>
                                                            {vendedor.nombre}{!vendedor.activo && ' (Inactivo)'}
                                                        </span>
                                                    </label>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Filtro Multi-Select de Cliente */}
                        {onClienteToggle && (
                            <div ref={clienteDropdownRef} className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowClienteDropdown(prev => !prev);
                                    }}
                                    className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                                    disabled={clientesLoading}
                                >
                                    <span>🏢 Cliente</span>
                                    {selectedClientes.length > 0 && (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 dark:bg-indigo-500 rounded-full">
                                            {selectedClientes.length}
                                        </span>
                                    )}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showClienteDropdown && (
                                    <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto">
                                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                            <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedClientes.length === 0}
                                                    onChange={() => onClienteToggle('all')}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">Todos</span>
                                            </label>
                                        </div>
                                        <div className="p-2">
                                            <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedClientes.includes('sin_asignar')}
                                                    onChange={() => onClienteToggle('sin_asignar')}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 italic">Sin asignar</span>
                                            </label>
                                            {clientes
                                                .sort((a, b) => {
                                                    // Primero activos, luego inactivos, ambos alfabéticamente
                                                    const aActivo = (a.estado || '').toLowerCase() === 'activo' ? 0 : 1;
                                                    const bActivo = (b.estado || '').toLowerCase() === 'activo' ? 0 : 1;
                                                    if (aActivo !== bActivo) return aActivo - bActivo;
                                                    return a.nombre.localeCompare(b.nombre);
                                                })
                                                .map(cliente => {
                                                    const esActivo = (cliente.estado || '').toLowerCase() === 'activo';
                                                    return (
                                                        <label 
                                                            key={`cliente-${cliente.id}`} 
                                                            className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedClientes.includes(cliente.id)}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    onClienteToggle(cliente.id);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                            />
                                                            <span className={`text-sm ${
                                                                esActivo
                                                                    ? 'text-gray-900 dark:text-white' 
                                                                    : 'text-gray-500 dark:text-gray-500 italic line-through'
                                                            }`}>
                                                                {cliente.nombre}{!esActivo && ' (Inactivo)'}
                                                            </span>
                                                        </label>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                    onSearch(value);
                                    setShowSearchDropdown(normalizeSearchValue(value).length > 0);
                                }}
                                results={searchResults}
                                onSelectPedido={handleSelectPedido}
                                onClose={() => setShowSearchDropdown(false)}
                            />
                        )}
                    </div>
                )}

                {/* Tercera fila: Grid de botones de etapas solo para vista de lista */}
                {currentView === 'list' && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Filtrar por Etapa {selectedStages.length > 0 && `(${selectedStages.length} seleccionadas)`}:
                                    </span>
                                    <button
                                        onClick={() => setIsStageFiltersCollapsed(!isStageFiltersCollapsed)}
                                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 flex items-center gap-1"
                                        title={isStageFiltersCollapsed ? 'Expandir filtros' : 'Contraer filtros'}
                                    >
                                        <svg 
                                            className={`w-4 h-4 transition-transform duration-200 ${isStageFiltersCollapsed ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        {isStageFiltersCollapsed ? 'Mostrar' : 'Ocultar'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => onStageToggle('all')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                        selectedStages.length === 0
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    ✨ Todas las Etapas
                                </button>
                            </div>
                            
                            {/* Grupos de etapas con animación de colapso */}
                            <div 
                                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                    isStageFiltersCollapsed 
                                        ? 'max-h-0 opacity-0' 
                                        : 'max-h-96 opacity-100'
                                }`}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {Object.values(STAGE_GROUPS).map(group => (
                                        <div key={group.title} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                                                {group.title}
                                            </h4>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                {group.stages.map(etapaId => (
                                                    <button
                                                        key={etapaId}
                                                        onClick={() => onStageToggle(etapaId)}
                                                        className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left ${
                                                            selectedStages.includes(etapaId)
                                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                                        }`}
                                                        title={ETAPAS[etapaId].title}
                                                    >
                                                        {ETAPAS[etapaId].title.length > 18 
                                                            ? `${ETAPAS[etapaId].title.substring(0, 18)}...` 
                                                            : ETAPAS[etapaId].title
                                                        }
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Panel lateral de historial */}
            {showHistoryPanel && (
                <div
                    className="fixed inset-0 z-50 flex justify-end"
                    onClick={() => setShowHistoryPanel(false)}
                    role="presentation"
                >
                    <div className="absolute inset-0 bg-black bg-opacity-30" />

                    <div
                        className="relative w-80 animate-slide-in-right shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        role="presentation"
                    >
                        <ActionHistoryPanel
                            onClose={() => setShowHistoryPanel(false)}
                            onNavigateToPedidoId={(pedidoId) => {
                                const pedido = allPedidos.find(p => p.id === pedidoId);
                                if (pedido && onNavigateToPedido) {
                                    setShowHistoryPanel(false);
                                    onNavigateToPedido(pedido);
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
