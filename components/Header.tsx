import React from 'react';
import { ViewType, Prioridad, Etapa, UserRole } from '../types';
import { ETAPAS_KANBAN, ETAPAS } from '../constants';
import { DateFilterOption } from '../utils/date';


interface HeaderProps {
    onSearch: (term: string) => void;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onFilterChange: (name: string, value: string) => void;
    activeFilters: { priority: string, stage: string };
    onDateFilterChange: (value: DateFilterOption) => void;
    activeDateFilter: DateFilterOption;
    currentUserRole: UserRole;
    onRoleChange: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onSearch, 
    currentView, 
    onViewChange, 
    onFilterChange, 
    activeFilters, 
    onDateFilterChange,
    activeDateFilter,
    currentUserRole, 
    onRoleChange 
}) => {
    
    const viewOptions: { id: ViewType; label: string, adminOnly: boolean }[] = [
        { id: 'kanban', label: 'Kanban', adminOnly: false },
        { id: 'list', label: 'Lista', adminOnly: false },
        { id: 'archived', label: 'Archivados', adminOnly: false },
        { id: 'report', label: 'Reportes', adminOnly: true },
    ];

    const dateFilterOptions: { value: DateFilterOption, label: string }[] = [
        { value: 'all', label: 'Todas las Fechas' },
        { value: 'this-week', label: 'Esta Semana' },
        { value: 'last-week', label: 'Semana Pasada' },
        { value: 'this-month', label: 'Este Mes' },
        { value: 'last-month', label: 'Mes Pasado' },
    ];

    const baseButtonClass = "px-4 py-2 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500";
    const activeButtonClass = "bg-indigo-600 text-white";
    const inactiveButtonClass = "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600";

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-10">
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

                 <div className="flex flex-wrap items-center gap-2">
                    {(currentView === 'kanban' || currentView === 'list' || currentView === 'archived') && (
                        <>
                            <select
                                name="date"
                                value={activeDateFilter}
                                onChange={(e) => onDateFilterChange(e.target.value as DateFilterOption)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {dateFilterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>

                            <select
                                name="priority"
                                value={activeFilters.priority}
                                onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">Toda Prioridad</option>
                                {Object.values(Prioridad).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            
                            {currentView !== 'archived' && (
                                <select
                                    name="stage"
                                    value={activeFilters.stage}
                                    onChange={(e) => onFilterChange(e.target.name, e.target.value)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">Toda Etapa</option>
                                    {ETAPAS_KANBAN.map(etapaId => <option key={etapaId} value={etapaId}>{ETAPAS[etapaId].title}</option>)}
                                </select>
                            )}

                            <input
                                type="text"
                                placeholder="Buscar..."
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