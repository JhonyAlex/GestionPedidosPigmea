import React from 'react';

const ClientesList: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Listado de Clientes
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
                Esta es la vista de la lista de clientes. Aquí se mostrará la tabla con todos los clientes.
            </p>
        </div>
    );
};

export default ClientesList;
