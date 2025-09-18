import React, { useState, useEffect } from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useCliente } from '../../contexts/ClienteContext';
import ClienteCard from './ClienteCard';
import ClienteModal from './ClienteModal';
import ClienteSearch from './ClienteSearch';
import { Cliente } from '../../types/cliente';

interface ClientesListProps {
  onSelectCliente: (clienteId: string) => void;
}

const ClientesList: React.FC<ClientesListProps> = ({ onSelectCliente }) => {
  const {
    clientes: clientesFromContext,
    loading,
    error,
    filtros,
    paginacion,
    cargarClientes,
    eliminarCliente,
    hasPermission,
    setFiltros,
    setPaginacion,
  } = useCliente();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState(filtros.busqueda || '');
  const [clientes, setClientes] = useState<Cliente[]>(clientesFromContext);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if the search term has actually changed to avoid unnecessary re-renders
      if (searchTerm !== filtros.busqueda) {
        setFiltros({ ...filtros, busqueda: searchTerm });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filtros, setFiltros]);

  // Load clients on initial render or when filters/pagination change
  useEffect(() => {
    cargarClientes();
  }, [filtros, paginacion.pagina, cargarClientes]);

  // Sync local state with context state
  useEffect(() => {
    setClientes(clientesFromContext);
  }, [clientesFromContext]);

  const handleOpenModal = (cliente: Cliente | null) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCliente(null);
  };

  const handleDelete = (cliente: Cliente) => {
    eliminarCliente?.(cliente.id);
  };

  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md animate-pulse">
      <div className="flex justify-between items-start">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <div className="h-8 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gestión de Clientes</h1>
        <div className="flex items-center gap-2">
          {hasPermission('clientes.create') && (
            <button
              onClick={() => handleOpenModal(null)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              Crear Cliente
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, contacto o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filtros.estado || ''}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value as any })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <SlidersHorizontal size={16} className="mr-2" />
          Avanzada
        </button>
      </div>

      {/* Content */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">
          <p>Error: {error}</p>
          <button onClick={() => cargarClientes(true)} className="mt-2 text-sm font-semibold underline">Reintentar</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading && clientes.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          clientes.map(cliente => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onSelect={() => onSelectCliente(cliente.id)}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {!loading && clientes.length === 0 && !error && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No se encontraron clientes.</p>
          <p className="text-sm">Intenta ajustar tus filtros o crea un nuevo cliente.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-8 flex justify-center items-center gap-4">
        <button
          onClick={() => setPaginacion({ pagina: paginacion.pagina - 1 })}
          disabled={paginacion.pagina <= 1 || loading}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Página {paginacion.pagina}
        </span>
        <button
          onClick={() => setPaginacion({ pagina: paginacion.pagina + 1 })}
          disabled={!paginacion.hasMore || loading}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Siguiente
        </button>
      </div>

      {isModalOpen && (
        <ClienteModal
          cliente={selectedCliente}
          onClose={handleCloseModal}
        />
      )}

      <ClienteSearch
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onResults={(clientesResult) => {
          setClientes(clientesResult);
          // Note: This bypasses the context state. Pagination and filters from context
          // will be out of sync until the user clears the advanced search.
          // A "Clear Search" button would be a good addition.
        }}
      />
    </div>
  );
};

export default ClientesList;
