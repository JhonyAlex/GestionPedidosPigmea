

import React, { useState, useEffect } from 'react';
import { ViewType, Prioridad, Etapa, UserRole, Pedido } from '../types';
import { ETAPAS_KANBAN, ETAPAS, STAGE_GROUPS } from '../constants';
import { DateFilterOption } from '../utils/date';
import UserInfo from './UserInfo';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';


interface HeaderProps {
    onSearch: (term: string) => void;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onFilterChange: (name: string, value: string) => void;
    activeFilters: { priority: string, stage: string, dateField: keyof Pedido };
    selectedStages: string[];
    onStageToggle: (stageId: string) => void;
    antivahoFilter: 'all' | 'con' | 'sin' | 'hecho';
    onAntivahoFilterChange: (value: 'all' | 'con' | 'sin' | 'hecho') => void;
    onDateFilterChange: (value: DateFilterOption) => void;
    activeDateFilter: DateFilterOption;
    customDateRange: { start: string; end: string };
    onCustomDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddPedido: () => void;
    onExportPDF: () => void;
    onExportData: () => void;
    onImportData: () => void;
    onUserManagement?: () => void;
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


const Header: React.FC<HeaderProps> = ({ 
    onSearch, 
    currentView, 
    onViewChange, 
    onFilterChange, 
    activeFilters,
    selectedStages,
    onStageToggle,
    antivahoFilter,
    onAntivahoFilterChange,
    onDateFilterChange,
    activeDateFilter,
    customDateRange,
    onCustomDateChange,
    onAddPedido,
    onExportPDF,
    onExportData,
    onImportData,
    onUserManagement
}) => {
    const { user } = useAuth();
    const { 
        canViewReports, 
        canCreatePedidos, 
        canAccessAdmin, 
        canViewConfig 
    } = usePermissions();
    const currentUserRole = user?.role || 'Operador';
    const [isStageFiltersCollapsed, setIsStageFiltersCollapsed] = useState(false);

    // Resetear el estado cuando cambie la vista
    useEffect(() => {
        if (currentView !== 'list') {
            setIsStageFiltersCollapsed(false);
        }
    }, [currentView]);
    
    const viewOptions: { id: ViewType; label: string, adminOnly: boolean }[] = [
        { id: 'preparacion', label: 'Preparación', adminOnly: false },
        { id: 'kanban', label: 'Producción', adminOnly: false },
        { id: 'list', label: 'Lista', adminOnly: false },
        { id: 'archived', label: 'Archivados', adminOnly: false },
        { id: 'report', label: 'Reportes', adminOnly: !canViewReports() },
        { id: 'permissions-debug', label: '🔍 Debug Permisos', adminOnly: !canAccessAdmin() },
    ];

    const dateFieldOptions: { value: keyof Pedido, label: string }[] = [
        { value: 'fechaCreacion', label: 'F. Creación' },
        { value: 'fechaEntrega', label: 'F. Entrega' },
        { value: 'fechaFinalizacion', label: 'F. Finalización' },
    ];

    const dateFilterOptions: { value: DateFilterOption, label: string }[] = [
        { value: 'all', label: 'Todas las Fechas' },
        { value: 'this-week', label: 'Esta Semana' },
        { value: 'last-week', label: 'Semana Pasada' },
        { value: 'this-month', label: 'Este Mes' },
        { value: 'last-month', label: 'Mes Pasado' },
        { value: 'custom', label: 'Personalizado' },
    ];

    const baseButtonClass = "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-200 dark:focus:ring-offset-gray-700 focus:ring-indigo-500";
    const activeButtonClass = "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm";
    const inactiveButtonClass = "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10";

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-40">
            <div className="container mx-auto">
                {/* Primera fila: título, navegación y botones de acción */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-3">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planning Pigmea</h1>
                        <UserInfo />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                            {viewOptions.map(opt => {
                                // Para reportes, verificar permiso específico en lugar de solo rol de administrador
                                if (opt.id === 'report' && !canViewReports()) return null;
                                if (opt.id === 'permissions-debug' && !canAccessAdmin()) return null;
                                if (opt.adminOnly && !canAccessAdmin()) return null;
                                return (
                                     <button
                                        key={opt.id}
                                        onClick={() => onViewChange(opt.id)}
                                        className={`${baseButtonClass} ${currentView === opt.id ? activeButtonClass : inactiveButtonClass}`}
                                    >
                                        {opt.label}
                                    </button>
                                )
                            })}
                        </div>
                        {(currentView === 'list' || currentView === 'archived') && (
                             <button 
                                onClick={onExportPDF}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-green-500"
                                aria-label="Exportar a PDF"
                                title="Exportar a PDF"
                            >
                                <DownloadIcon />
                                <span className="hidden sm:inline">Exportar PDF</span>
                            </button>
                        )}
                         {canCreatePedidos() && (
                            <>
                                <button 
                                    onClick={onAddPedido}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-blue-500"
                                    aria-label="Añadir nuevo pedido"
                                    title="Añadir nuevo pedido"
                                >
                                    <PlusIcon />
                                    <span className="hidden sm:inline">Añadir Pedido</span>
                                </button>
                            </>
                        )}
                        {canAccessAdmin() && onUserManagement && (
                            <button 
                                onClick={onUserManagement}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors duration-200"
                                title="Gestionar usuarios del sistema"
                            >
                                <UsersIcon />
                                <span className="hidden sm:inline">Usuarios</span>
                            </button>
                        )}
                        {canViewConfig() && (
                            <>
                                <button 
                                    onClick={onImportData}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-md font-semibold hover:bg-teal-700 transition-colors duration-200"
                                    title="Importar datos desde archivo JSON"
                                >
                                    <UploadIcon />
                                    <span className="hidden sm:inline">Importar</span>
                                </button>
                                <button 
                                    onClick={onExportData}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-700 transition-colors duration-200"
                                    title="Exportar todos los datos a un archivo JSON"
                                >
                                    <DownloadIcon />
                                    <span className="hidden sm:inline">Exportar</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Segunda fila: filtros generales */}
                {(currentView !== 'report' && currentView !== 'permissions-debug') && (
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <select
                            name="dateField"
                            value={activeFilters.dateField}
                            onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {dateFieldOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>

                        <select
                            name="date"
                            value={activeDateFilter}
                            onChange={(e) => onDateFilterChange(e.target.value as DateFilterOption)}
                            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {dateFilterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        
                         {activeDateFilter === 'custom' && (
                            <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1">
                                <input
                                    type="date"
                                    name="start"
                                    aria-label="Fecha de inicio"
                                    value={customDateRange.start}
                                    onChange={onCustomDateChange}
                                    className="px-2 py-1 bg-transparent text-sm w-32 focus:outline-none"
                                />
                                <span className="text-gray-500 dark:text-gray-400">-</span>
                                <input
                                    type="date"
                                    name="end"
                                    aria-label="Fecha de fin"
                                    value={customDateRange.end}
                                    onChange={onCustomDateChange}
                                    className="px-2 py-1 bg-transparent text-sm w-32 focus:outline-none"
                                />
                            </div>
                        )}

                        <select
                            name="priority"
                            value={activeFilters.priority}
                            onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">Toda Prioridad</option>
                            {Object.values(Prioridad).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>

                        <select
                            name="antivaho"
                            value={antivahoFilter}
                            onChange={(e) => onAntivahoFilterChange(e.target.value as 'all' | 'con' | 'sin' | 'hecho')}
                            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">Antivaho (Todos)</option>
                            <option value="con">Con Antivaho</option>
                            <option value="sin">Sin Antivaho</option>
                            <option value="hecho">Antivaho Hecho</option>
                        </select>
                        
                        {/* Filtro de etapas como select para vistas que no son lista */}
                        {currentView === 'kanban' && (
                            <select
                                name="stage"
                                value={activeFilters.stage}
                                onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">Toda Etapa</option>
                                {ETAPAS_KANBAN.map(etapaId => <option key={etapaId} value={etapaId}>{ETAPAS[etapaId].title}</option>)}
                            </select>
                        )}

                        <input
                            type="text"
                            placeholder="Buscar en todo..."
                            className="w-48 sm:w-64 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                )}

                {/* Tercera fila: Grid de botones de etapas solo para vista de lista */}
                {currentView === 'list' && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <div className="flex flex-col gap-3">
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
        </header>
    );
};

export default Header;