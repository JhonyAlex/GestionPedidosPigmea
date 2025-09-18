import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { useCliente } from '../../contexts/ClienteContext';
import { Cliente } from '../../types/cliente';
import ClienteModal from './ClienteModal';

interface ClienteSelectorProps {
  onClienteSelect: (cliente: Cliente | null) => void;
  selectedCliente: Cliente | null;
}

const ClienteSelector: React.FC<ClienteSelectorProps> = ({ onClienteSelect, selectedCliente }) => {
  const { clientes, buscarClientes } = useCliente();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => {
    if (!searchTerm) return clientes; // Show all initially
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, clientes]);

  // Handle clicks outside the component to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (cliente: Cliente) => {
    onClienteSelect(cliente);
    setSearchTerm(cliente.nombre);
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    onClienteSelect(null);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Cliente
      </label>
      <div className="relative">
        <input
          type="text"
          value={selectedCliente ? selectedCliente.nombre : searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (selectedCliente) handleClear();
            setIsDropdownOpen(true);
          }}
          placeholder="Buscar o seleccionar un cliente..."
          className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          disabled={!!selectedCliente}
        />
        {selectedCliente && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isDropdownOpen && !selectedCliente && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul>
            {searchResults.map(cliente => (
              <li
                key={cliente.id}
                onClick={() => handleSelect(cliente)}
                className="px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
              >
                <p className="font-semibold">{cliente.nombre}</p>
                <p className="text-sm text-gray-500">{cliente.email}</p>
              </li>
            ))}
            <li className="border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                <PlusCircle size={18} className="mr-2" />
                Crear nuevo cliente
              </button>
            </li>
          </ul>
        </div>
      )}

      {isModalOpen && (
        <ClienteModal
          cliente={null}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ClienteSelector;
