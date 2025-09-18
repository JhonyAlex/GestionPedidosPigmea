import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { useCliente } from '../../contexts/ClienteContext';
import { Cliente } from '../../types/cliente';
import ClienteStats from './ClienteStats';
import ClienteHistorial from './ClienteHistorial';

// Local Breadcrumbs component as suggested by user
const Breadcrumbs: React.FC<{ items: Array<{ label: string, onClick?: () => void }> }> = ({ items }) => (
    <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
            {items.map((item, index) => (
                <li key={index} className="flex items-center">
                    {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                    {item.onClick ? (
                        <button onClick={item.onClick} className="text-blue-600 hover:text-blue-800">
                            {item.label}
                        </button>
                    ) : (
                        <span className="text-gray-900 dark:text-gray-300">{item.label}</span>
                    )}
                </li>
            ))}
        </ol>
    </nav>
);

interface ClienteDetailProps {
  clienteId: string;
  onBack: () => void;
  onCrearPedido: (cliente: {id: string, nombre: string}) => void;
}

const ClienteDetail: React.FC<ClienteDetailProps> = ({ clienteId, onBack, onCrearPedido }) => {
  const { obtenerClientePorId, hasPermission } = useCliente();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'historial' | 'comentarios'>('info');

  useEffect(() => {
    const fetchCliente = async () => {
      setLoading(true);
      const fetchedCliente = await obtenerClientePorId(clienteId);
      if (fetchedCliente) {
        setCliente(fetchedCliente);
      } else {
        console.error("Cliente no encontrado");
        onBack(); // Go back if client not found
      }
      setLoading(false);
    };
    fetchCliente();
  }, [clienteId, obtenerClientePorId, onBack]);

  const handleCrearPedido = () => {
    if (!cliente) return;
    onCrearPedido({ id: cliente.id, nombre: cliente.nombre });
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando detalles del cliente...</div>;
  }

  if (!cliente) {
    return <div className="p-8 text-center text-red-500">Cliente no encontrado. Por favor, vuelva a la lista.</div>;
  }

  const tabs = [
    { id: 'info', label: 'Información y Estadísticas' },
    { id: 'historial', label: 'Historial de Pedidos' },
    { id: 'comentarios', label: 'Comentarios' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <Breadcrumbs items={[
          { label: 'Clientes', onClick: onBack },
          { label: cliente.nombre }
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{cliente.nombre}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{cliente.email || 'Sin email'}</p>
        </div>
        {hasPermission('pedidos.create') && (
            <button
                onClick={handleCrearPedido}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
                <PlusCircle size={18} className="mr-2" />
                Crear Nuevo Pedido
            </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'info' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Estadísticas Clave</h2>
            <ClienteStats clienteId={cliente.id} />
            <h2 className="text-xl font-semibold mt-8 mb-4">Información de Contacto</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <p><strong>Contacto Principal:</strong> {cliente.contactoPrincipal || 'N/A'}</p>
                <p><strong>Teléfono:</strong> {cliente.telefono || 'N/A'}</p>
                <p><strong>Dirección:</strong> {cliente.direccion || 'N/A'}</p>
                <p><strong>Comentarios:</strong> {cliente.comentarios || 'N/A'}</p>
            </div>
          </div>
        )}
        {activeTab === 'historial' && <ClienteHistorial clienteId={cliente.id} />}
        {activeTab === 'comentarios' && (
          <div className="text-center text-gray-500 py-12">
            <p>La sección de comentarios para clientes estará disponible próximamente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClienteDetail;
