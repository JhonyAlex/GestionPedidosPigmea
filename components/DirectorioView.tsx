import React, { useState, useMemo } from 'react';
import { Cliente } from '../types';
import ClienteCard from './ClienteCard';

interface DirectorioViewProps {
    clientes: Cliente[];
    onSelectCliente: (cliente: Cliente) => void;
    onCreateCliente: () => void;
}

const DirectorioView: React.FC<DirectorioViewProps> = ({ 
    clientes, 
    onSelectCliente, 
    onCreateCliente 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'nombre' | 'ultimaActividad' | 'totalPedidos'>('nombre');
    const [filterActivo, setFilterActivo] = useState<'todos' | 'activos' | 'inactivos'>('activos');

    // Filtrar y ordenar clientes
    const clientesFiltrados = useMemo(() => {
        let filtered = clientes.filter(cliente => {
            // Filtro de búsqueda
            const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                cliente.ciudad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                cliente.email?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Filtro de estado activo
            const matchesActive = filterActivo === 'todos' || 
                                (filterActivo === 'activos' && cliente.activo) ||
                                (filterActivo === 'inactivos' && !cliente.activo);
            
            return matchesSearch && matchesActive;
        });

        // Ordenar
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'nombre':
                    return a.nombre.localeCompare(b.nombre);
                case 'ultimaActividad':
                    const dateA = new Date(a.ultimaActividad || 0);
                    const dateB = new Date(b.ultimaActividad || 0);
                    return dateB.getTime() - dateA.getTime(); // Más reciente primero
                case 'totalPedidos':
                    return (b.totalPedidos || 0) - (a.totalPedidos || 0); // Mayor cantidad primero
                default:
                    return 0;
            }
        });

        return filtered;
    }, [clientes, searchTerm, sortBy, filterActivo]);

    return (
        <main className="flex-grow p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white border-l-4 border-blue-500 pl-4">
                        Directorio de Clientes
                    </h1>
                    <button
                        onClick={onCreateCliente}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg 
                                 transition-colors duration-200 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nuevo Cliente
                    </button>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clientes</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{clientes.length}</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clientes Activos</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {clientes.filter(c => c.activo).length}
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Con Pedidos Activos</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {clientes.filter(c => (c.pedidosActivos || 0) > 0).length}
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pedidos</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {clientes.reduce((sum, c) => sum + (c.totalPedidos || 0), 0)}
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controles de filtrado y búsqueda */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Búsqueda */}
                        <div className="flex-1 relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar por nombre, ciudad o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
                                         rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Filtro por estado */}
                        <select
                            value={filterActivo}
                            onChange={(e) => setFilterActivo(e.target.value as 'todos' | 'activos' | 'inactivos')}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="todos">Todos los clientes</option>
                            <option value="activos">Solo activos</option>
                            <option value="inactivos">Solo inactivos</option>
                        </select>

                        {/* Ordenar por */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'nombre' | 'ultimaActividad' | 'totalPedidos')}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="nombre">Ordenar por nombre</option>
                            <option value="ultimaActividad">Última actividad</option>
                            <option value="totalPedidos">Total de pedidos</option>
                        </select>

                        {/* Resultados */}
                        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {clientesFiltrados.length} de {clientes.length} clientes
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de clientes */}
            {clientesFiltrados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {clientesFiltrados.map(cliente => (
                        <ClienteCard
                            key={cliente.id}
                            cliente={cliente}
                            onClick={() => onSelectCliente(cliente)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                        <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9M19 21H5V3H13V9H19V21Z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No se encontraron clientes
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        {searchTerm || filterActivo !== 'todos' 
                            ? 'Prueba ajustando los filtros de búsqueda' 
                            : 'Comienza agregando tu primer cliente'}
                    </p>
                    {(!searchTerm && filterActivo === 'todos') && (
                        <button
                            onClick={onCreateCliente}
                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            Crear primer cliente
                        </button>
                    )}
                </div>
            )}
        </main>
    );
};

export default DirectorioView;