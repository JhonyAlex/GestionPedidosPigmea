

import React from 'react';
import { ViewType, Prioridad, Etapa, UserRole, Pedido } from '../types';
import { ETAPAS_KANBAN, ETAPAS } from '../constants';
import { DateFilterOption } from '../utils/date';


interface HeaderProps {
    onSearch: (term: string) => void;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onFilterChange: (name: string, value: string) => void;
    activeFilters: { priority: string, stage: string, dateField: keyof Pedido };
    onDateFilterChange: (value: DateFilterOption) => void;
    activeDateFilter: DateFilterOption;
    customDateRange: { start: string; end: string };
    onCustomDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    currentUserRole: UserRole;
    onRoleChange: (role: UserRole) => void;
    onAddPedido: () => void;
    onExportPDF: () => void;
    onExportData: () => void;
    onImportData: () => void;
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


const Header: React.FC<HeaderProps> = ({ 
    onSearch, 
    currentView, 
    onViewChange, 
    onFilterChange, 
    activeFilters, 
    onDateFilterChange,
    activeDateFilter,
    customDateRange,
    onCustomDateChange,
    currentUserRole, 
    onRoleChange,
    onAddPedido,
    onExportPDF,
    onExportData,
    onImportData
}) => {
    
    const viewOptions: { id: ViewType; label: string, adminOnly: boolean }[] = [
        { id: 'preparacion', label: 'Preparación', adminOnly: false },
        { id: 'kanban', label: 'Kanban', adminOnly: false },
        { id: 'list', label: 'Lista', adminOnly: false },
        { id: 'archived', label: 'Archivados', adminOnly: false },
        { id: 'report', label: 'Reportes', adminOnly: true },
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

    const baseButtonClass = "px-4 py-2 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500";
    const activeButtonClass = "bg-indigo-600 text-white";
    const inactiveButtonClass = "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600";

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-40">
            <div className="container mx-auto flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestor de Pedidos</h1>
                     <select
                        name="role"
                        value={currentUserRole}
                        onChange={(e) => onRoleChange(e.target.value as UserRole)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Administrador">Admin</option>
                        <option value="Operador">Operador</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                        {viewOptions.map(opt => {
                            if (opt.adminOnly && currentUserRole !== 'Administrador') return null;
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
                     {currentUserRole === 'Administrador' && (
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

                 <div className="flex flex-wrap items-center gap-2">
                    {(currentView !== 'report') && (
                        <>
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
                            
                            {currentView !== 'archived' && currentView !== 'preparacion' && (
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
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;