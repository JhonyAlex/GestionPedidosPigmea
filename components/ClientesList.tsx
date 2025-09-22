import React, { useState } from 'react';
import { useClientesManager, Cliente, ClienteCreateRequest, ClienteUpdateRequest } from '../hooks/useClientesManager';
import ClienteCard from './ClienteCard';
import ClienteModal from './ClienteModal';
import { Icons } from './Icons';

const ClientesList: React.FC = () => {
    const {
        clientes,
        isLoading,
        error,
        addCliente,
        updateCliente,
        deleteCliente,
    } = useClientesManager();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

    const handleOpenModal = (cliente: Cliente | null = null) => {
        setEditingCliente(cliente);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCliente(null);
    };

    const handleSave = async (data: ClienteCreateRequest | ClienteUpdateRequest, id?: string) => {
        if (id) {
            await updateCliente(id, data as ClienteUpdateRequest);
        } else {
            await addCliente(data as ClienteCreateRequest);
        }
    };

    const handleDelete = async (cliente: Cliente) => {
        if (window.confirm(`¿Estás seguro de que quieres archivar el cliente "${cliente.nombre}"?`)) {
            try {
                await deleteCliente(cliente.id);
            } catch (error) {
                alert((error as Error).message);
            }
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center p-10">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center p-10 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
                    <h3 className="font-bold text-lg">Error al cargar los clientes</h3>
                    <p>{error.message}</p>
                </div>
            );
        }

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
                <ClienteModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    cliente={editingCliente}
                />
            )}
        </div>
    );
};

export default ClientesList;
