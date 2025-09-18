import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { clienteService } from '../../services/clienteService';
import { Cliente } from '../../types/cliente';

interface ClienteSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResults: (clientes: Cliente[]) => void;
}

const ClienteSearch: React.FC<ClienteSearchProps> = ({ isOpen, onClose, onResults }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    // Add more advanced filters here in the future
    // fechaDesde: '',
    // fechaHasta: '',
    // conPedidosActivos: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    // @ts-ignore
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setFiltros(prev => ({ ...prev, [name]: val }));
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const resultados = await clienteService.obtenerClientes(filtros);
      onResults(resultados.data);
      onClose();
    } catch (error) {
      console.error("Error en búsqueda avanzada:", error);
      // Optionally, show an error message within the modal
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Búsqueda Avanzada de Clientes</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="busqueda" className="block mb-1 text-sm font-medium">Nombre, Contacto o Email</label>
            <input
              type="text"
              id="busqueda"
              name="busqueda"
              value={filtros.busqueda}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Ej: Pigmea"
            />
          </div>
          <div>
            <label htmlFor="estado" className="block mb-1 text-sm font-medium">Estado</label>
            <select
              id="estado"
              name="estado"
              value={filtros.estado}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">Cualquiera</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          {/* Add more advanced filter inputs here */}
        </div>

        <div className="flex justify-end items-center p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            disabled={isSearching}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSearch}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            disabled={isSearching}
          >
            <Search size={16} className="mr-2" />
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClienteSearch;
