import React, { useState } from 'react';
import { useVendedoresManager } from '../hooks/useVendedoresManager';
import { Vendedor, VendedorCreateRequest, VendedorUpdateRequest } from '../types/vendedor';
import VendedorCard from './VendedorCard';
import VendedorModal from './VendedorModal';
import VendedorDetailModal from './VendedorDetailModal';
import { Icons } from './Icons';

interface VendedoresListProps {
    onCrearPedido?: (vendedor: { id: string; nombre: string }) => void;
}

const VendedoresList: React.FC<VendedoresListProps> = ({ onCrearPedido }) => {
    const {
        vendedores,
        loading,
        error,
        addVendedor,
        updateVendedor,
        deleteVendedor,
    } = useVendedoresManager();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
    const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
        console.log('Navegar al pedido:', pedidoId);
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
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center p-10 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
                    <h3 className="font-bold text-lg">Error al cargar los vendedores</h3>
                    <p>{error}</p>
                </div>
            );
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
