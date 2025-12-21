import React, { useState, useEffect, useRef } from 'react';
import { useClientesManager, Cliente, ClienteCreateRequest, ClienteUpdateRequest } from '../hooks/useClientesManager';
import ClienteCard from './ClienteCard';
import ClienteModalMejorado from './ClienteModalMejorado';
import ClienteDetailModal from './ClienteDetailModal';
import DeleteClienteModal from './DeleteClienteModal';
import ClienteSearchDropdown from './ClienteSearchDropdown';
import { Icons } from './Icons';
import { clienteService } from '../services/clienteService';

interface ClientesListProps {
    onCrearPedido?: (cliente: { id: string; nombre: string }) => void; // ✅ Prop opcional para crear pedido
    onNavigateToPedido?: (pedidoId: string) => void; // ✅ Prop opcional para navegar a un pedido
}

const ClientesList: React.FC<ClientesListProps> = ({ onCrearPedido, onNavigateToPedido }) => {
    const {
        clientes,
        isLoading,
        error,
        addCliente,
        updateCliente,
        deleteCliente,
        deleteClientePermanently,
    } = useClientesManager();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
    
    // � Estado para búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    
    // �🚀 NUEVO: Estado para estadísticas en batch
    const [clientesStats, setClientesStats] = useState<Record<string, any>>({});
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    // 🚀 NUEVO: Ca

    // 🔍 Cerrar dropdown de búsqueda al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            
            // No cerrar si el clic es dentro del dropdown
            if (target.closest('.cliente-search-dropdown')) {
                return;
            }
            
            if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
                setShowSearchDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
      

    // 🔍 Función para filtrar clientes basada en el término de búsqueda
    const searchResults = React.useMemo(() => {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return [];
        }

        const searchTermLower = searchTerm.toLowerCase();
        return clientes.filter(c => {
            return (
                c.nombre.toLowerCase().includes(searchTermLower) ||
                (c.razon_social && c.razon_social.toLowerCase().includes(searchTermLower)) ||
                (c.cif && c.cif.toLowerCase().includes(searchTermLower)) ||
                (c.telefono && c.telefono.toLowerCase().includes(searchTermLower)) ||
                (c.email && c.email.toLowerCase().includes(searchTermLower)) ||
                (c.poblacion && c.poblacion.toLowerCase().includes(searchTermLower)) ||
                (c.provincia && c.provincia.toLowerCase().includes(searchTermLower)) ||
                (c.observaciones && c.observaciones.toLowerCase().includes(searchTermLower))
            );
        });
    }, [searchTerm, clientes]);

    // 🔍 Manejar cambio en el campo de búsqueda
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setShowSearchDropdown(value.trim().length > 0);
    };

    // 🔍 Manejar selección de cliente desde el dropdown
    const handleSelectCliente = (cliente: Cliente) => {
        setShowSearchDropdown(false);
        setSearchTerm('');
        handleClienteClick(cliente);
    };      document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);rgar estadísticas de todos los clientes en batch
    useEffect(() => {
        if (clientes.length > 0) {
            loadClientesStats();
        }
    }, [clientes]);

    const loadClientesStats = async () => {
        setIsLoadingStats(true);
        try {
            const clienteIds = clientes.map(c => c.id);
            const stats = await clienteService.obtenerEstadisticasClientesBatch(clienteIds);
            setClientesStats(stats);
            console.log('✅ Estadísticas batch cargadas para', clienteIds.length, 'clientes');
        } catch (error) {
            console.error('Error al cargar estadísticas en batch:', error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleOpenModal = (cliente: Cliente | null = null) => {
        setEditingCliente(cliente);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCliente(null);
    };

    const handleClienteClick = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedCliente(null);
    };

    const handlePedidoClick = (pedidoId: string) => {
        if (onNavigateToPedido) {
            onNavigateToPedido(pedidoId);
        } else {
            console.log('Navegar al pedido:', pedidoId);
        }
    };

    const handleCrearPedido = (cliente: Cliente) => {
        // ✅ Si se proporciona la función desde el padre, usarla
        if (onCrearPedido) {
            onCrearPedido({
                id: cliente.id,
                nombre: cliente.nombre
            });
            // Cerrar el modal de detalle
            setIsDetailModalOpen(false);
        } else {
            // Fallback: mostrar mensaje si no se proporciona la función
            alert(`Funcionalidad en desarrollo: Crear pedido para ${cliente.nombre}`);
        }
    };

    const handleSave = async (data: ClienteCreateRequest | ClienteUpdateRequest, id?: string) => {
        if (id) {
            await updateCliente(id, data as ClienteUpdateRequest);
        } else {
            await addCliente(data as ClienteCreateRequest);
        }
    };

    const handleDelete = async (cliente: Cliente) => {
        setClienteToDelete(cliente);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async (clienteId: string, deleteWithPedidos: boolean) => {
        try {
            if (deleteWithPedidos) {
                await deleteClientePermanently(clienteId, true);
            } else {
                // Si no se quiere eliminar con pedidos, puede ser archivado o eliminado sin pedidos
                await deleteCliente(clienteId);
            }
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            throw error;
        }
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setClienteToDelete(null);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center p-10">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                </div>flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Listado de Clientes
                    </h1>
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Icons.Plus className="-ml-1 mr-2 h-5 w-5" />
                        Añadir Cliente
                    </button>
                </div>
                
                {/* 🔍 Campo de búsqueda */}
                <div ref={searchContainerRef} className="relative max-w-md">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="🔍 Buscar clientes..."
                            value={searchTerm}
                            className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            onChange={handleSearchChange}
                            onFocus={() => searchTerm.trim().length > 0 && setShowSearchDropdown(true)}
                        />
                    </div>
                </div>
            </div>
            
            {/* 🔍 Dropdown de búsqueda */}
            {showSearchDropdown && (
                <ClienteSearchDropdown
                    searchTerm={searchTerm}
                    onSearchChange={(value) => {
                        setSearchTerm(value);
                        setShowSearchDropdown(value.trim().length > 0);
                    }}
                    results={searchResults}
                    onSelectCliente={handleSelectCliente}
                    onClose={() => setShowSearchDropdown(false)}
                />
            )}

        if (clientes.length === 0) {
            return (
                <div className="text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <Icons.NoData className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay clientes</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Empieza por añadir un nuevo cliente.</p>
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Icons.Plus className="-ml-1 mr-2 h-5 w-5" />
                            Añadir Cliente
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {clientes.map(cliente => (
                    <ClienteCard
                        key={cliente.id}
                        cliente={cliente}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                        onClick={handleClienteClick}
                        stats={clientesStats[cliente.id]}
                        isLoadingStats={isLoadingStats}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Listado de Clientes
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Icons.Plus className="-ml-1 mr-2 h-5 w-5" />
                    Añadir Cliente
                </button>
            </div>

            {renderContent()}

            {isModalOpen && (
                <ClienteModalMejorado
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    cliente={editingCliente}
                />
            )}

            {isDetailModalOpen && selectedCliente && (
                <ClienteDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetailModal}
                    cliente={selectedCliente}
                    onPedidoClick={handlePedidoClick}
                    onCrearPedido={handleCrearPedido}
                />
            )}

            {isDeleteModalOpen && clienteToDelete && (
                <DeleteClienteModal
                    isOpen={isDeleteModalOpen}
                    cliente={clienteToDelete}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
    );
};

export default ClientesList;
