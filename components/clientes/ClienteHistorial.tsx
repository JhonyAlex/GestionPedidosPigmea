import React, { useState, useEffect } from 'react';
import { ListFilter, Calendar } from 'lucide-react';
import { clienteService } from '../../services/clienteService';
import { ClienteHistorialResponse } from '../../types/cliente';
import { Prioridad } from '../../types';
import { PRIORIDAD_COLORS } from '../../constants';

interface ClienteHistorialProps {
  clienteId: string;
  onPedidoSelect: (pedidoId: string) => void;
}

const ClienteHistorial: React.FC<ClienteHistorialProps> = ({ clienteId, onPedidoSelect }) => {
  const [historial, setHistorial] = useState<ClienteHistorialResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!clienteId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await clienteService.obtenerHistorialPedidos(clienteId);
        setHistorial(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el historial de pedidos');
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, [clienteId]);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'completado': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'archivado': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePedidoClick = (pedidoId: string) => {
    onPedidoSelect(pedidoId);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">{error}</div>;
  }

  if (!historial || historial.pedidos.length === 0) {
    return <div className="text-gray-500 text-center py-8">No se encontraron pedidos para este cliente.</div>;
  }

  return (
    <div>
      {/* Filters -- Placeholder UI */}
      <div className="flex justify-end items-center gap-4 mb-4">
        <button className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
          <ListFilter size={16} />
          <span>Filtrar por Estado</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
          <Calendar size={16} />
          <span>Filtrar por Fecha</span>
        </button>
      </div>

      {/* Pedidos List */}
      <div className="space-y-3">
        {historial.pedidos.map(pedido => (
          <div
            key={pedido.id}
            onClick={() => handlePedidoClick(pedido.id)}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4"
            style={{ borderColor: PRIORIDAD_COLORS[pedido.prioridad as Prioridad] || '#ccc' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="md:col-span-2">
                <p className="font-bold text-gray-800 dark:text-gray-100">{pedido.numeroPedidoCliente}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Registro: {pedido.numeroRegistro}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fecha Entrega</p>
                <p className="font-semibold">{new Date(pedido.fechaEntrega).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-end items-center">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusColor(pedido.estado)}`}>
                  {pedido.estado}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClienteHistorial;
