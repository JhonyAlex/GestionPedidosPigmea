import React, { useState, useEffect, useRef } from 'react';
import { useVendedoresManager } from '../hooks/useVendedoresManager';
import { Vendedor, VendedorCreateRequest, VendedorUpdateRequest } from '../types/vendedor';
import VendedorCard from './VendedorCard';
import VendedorModal from './VendedorModal';
import VendedorDetailModal from './VendedorDetailModal';
import VendedorSearchDropdown from './VendedorSearchDropdown';
import { Icons } from './Icons';

interface VendedoresListProps {
    onCrearPedido?: (vendedor: { id: string; nombre: string }) => void;
    onNavigateToPedido?: (pedidoId: string) => void; // ✅ Prop opcional para navegar a un pedido
}

const VendedoresList: React.FC<VendedoresListProps> = ({ onCrearPedido, onNavigateToPedido }) => {
    const {
        vendedores,
        loading,
        error,
        addVendedor,
        updateVendedor,
        deleteVendedor,
        fetchVendedoresStatsBatch, // 🚀 NUEVO
    } = useVendedoresManager();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
    const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    // � Estado para búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    
    // �🚀 NUEVO: Estado para estadísticas en batch
    const [vendedoresStats, setVendedoresStats] = useState<Record<string, any>>({});
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    // 🚀 NUEVO: Carg

    // 🔍 Cerrar dropdown de búsqueda al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            
            // No cerrar si el clic es dentro del dropdown
            if (target.closest('.vendedor-search-dropdown')) {
                return;
            }
            
            if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
                setShowSearchDropdown(false);
      

    // 🔍 Función para filtrar vendedores basada en el término de búsqueda
    const searchResults = React.useMemo(() => {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return [];
        }

        const searchTermLower = searchTerm.toLowerCase();
        return vendedores.filter(v => {
            return (
                v.nombre.toLowerCase().includes(searchTermLower) ||
                (v.telefono && v.telefono.toLowerCase().includes(searchTermLower)) ||
                (v.email && v.email.toLowerCase().includes(searchTermLower))
            );
        });
    }, [searchTerm, vendedores]);

    // 🔍 Manejar cambio en el campo de búsqueda
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setShowSearchDropdown(value.trim().length > 0);
    };

    // 🔍 Manejar selección de vendedor desde el dropdown
    const handleSelectVendedor = (vendedor: Vendedor) => {
        setShowSearchDropdown(false);
        setSearchTerm('');
        handleVendedorClick(vendedor);
    };      }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);ar estadísticas de todos los vendedores en batch
    useEffect(() => {
        if (vendedores.length > 0) {
            loadVendedoresStats();
        }
    }, [vendedores]);

    const loadVendedoresStats = async () => {
        setIsLoadingStats(true);
        try {
            const vendedorIds = vendedores.map(v => v.id);
            const stats = await fetchVendedoresStatsBatch(vendedorIds);
            setVendedoresStats(stats);
            console.log('✅ Estadísticas batch cargadas para', vendedorIds.length, 'vendedores');
        } catch (error) {
            console.error('Error al cargar estadísticas en batch:', error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleOpenModal = (vendedor: Vendedor | null = null) => {
        setEditingVendedor(vendedor);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVendedor(null);
    };

    const handleVendedorClick = (vendedor: Vendedor) => {
        setSelectedVendedor(vendedor);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedVendedor(null);
    };

    const handlePedidoClick = (pedidoId: string) => {
        if (onNavigateToPedido) {
            onNavigateToPedido(pedidoId);
        } else {
            console.log('Navegar al pedido:', pedidoId);
        }
    };

    const handleCrearPedido = (vendedor: Vendedor) => {
        if (onCrearPedido) {
            onCrearPedido({
                id: vendedor.id,
                nombre: vendedor.nombre
            });
            setIsDetailModalOpen(false);
        } else {
            alert(`Funcionalidad en desarrollo: Crear pedido para ${vendedor.nombre}`);
        }
    };

    const handleSave = async (data: VendedorCreateRequest | VendedorUpdateRequest, id?: string) => {
        if (id) {
            await updateVendedor(id, data as VendedorUpdateRequest);
        } else {
            await addVendedor(data as VendedorCreateRequest);
        }
    };

    const handleDelete = async (vendedor: Vendedor) => {
        if (confirm(`¿Estás seguro de que deseas eliminar al vendedor "${vendedor.nombre}"?`)) {
            try {
                await deleteVendedor(vendedor.id);
            } catch (error) {
                console.error('Error al eliminar vendedor:', error);
                alert('Error al eliminar el vendedor');
            }
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center p-10">
                    <div classNamflex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Listado de Vendedores
                    </h1>
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Icons.Plus className="-ml-1 mr-2 h-5 w-5" />
                        Añadir Vendedor
                    </button>
                </div>
                
                {/* 🔍 Campo de búsqueda */}
                <div ref={searchContainerRef} className="relative max-w-md">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="🔍 Buscar vendedores..."
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
                <VendedorSearchDropdown
                    searchTerm={searchTerm}
                    onSearchChange={(value) => {
                        setSearchTerm(value);
                        setShowSearchDropdown(value.trim().length > 0);
                    }}
                    results={searchResults}
                    onSelectVendedor={handleSelectVendedor}
                    onClose={() => setShowSearchDropdown(false)}
                />
            )}
        }

        if (vendedores.length === 0) {
            return (
                <div className="text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <Icons.NoData className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay vendedores</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Empieza por añadir un nuevo vendedor.</p>
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Icons.Plus className="-ml-1 mr-2 h-5 w-5" />
                            Añadir Vendedor
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vendedores.map(vendedor => (
                    <VendedorCard
                        key={vendedor.id}
                        vendedor={vendedor}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                        onClick={handleVendedorClick}
                        stats={vendedoresStats[vendedor.id]}
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
                    Listado de Vendedores
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Icons.Plus className="-ml-1 mr-2 h-5 w-5" />
                    Añadir Vendedor
                </button>
            </div>

            {renderContent()}

            {isModalOpen && (
                <VendedorModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    vendedor={editingVendedor}
                />
            )}

            {isDetailModalOpen && selectedVendedor && (
                <VendedorDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetailModal}
                    vendedor={selectedVendedor}
                    onPedidoClick={handlePedidoClick}
                    onCrearPedido={handleCrearPedido}
                />
            )}
        </div>
    );
};

export default VendedoresList;
