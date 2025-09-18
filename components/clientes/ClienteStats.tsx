import React, { useState, useEffect } from 'react';
import { TrendingUp, ListOrdered, CheckCircle, Clock } from 'lucide-react';
import { clienteService } from '../../services/clienteService';
import { ClienteEstadisticas } from '../../types/cliente';

interface ClienteStatsProps {
  clienteId: string;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
  <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 ${color}`}>
    <div className="flex items-center">
      <div className="mr-4">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    </div>
  </div>
);

const ClienteStats: React.FC<ClienteStatsProps> = ({ clienteId }) => {
  const [stats, setStats] = useState<ClienteEstadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!clienteId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await clienteService.obtenerEstadisticasCliente(clienteId);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [clienteId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">{error}</div>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<ListOrdered size={32} className="text-blue-500" />}
        label="Total Pedidos"
        value={stats.totalPedidos}
        color="border-blue-500"
      />
      <StatCard
        icon={<Clock size={32} className="text-green-500" />}
        label="Pedidos Activos"
        value={stats.pedidosActivos}
        color="border-green-500"
      />
      <StatCard
        icon={<CheckCircle size={32} className="text-purple-500" />}
        label="Pedidos Completados"
        value={stats.pedidosCompletados}
        color="border-purple-500"
      />
      <StatCard
        icon={<TrendingUp size={32} className="text-yellow-500" />}
        label="Metros Totales"
        value={`${stats.metrosTotal}m`}
        color="border-yellow-500"
      />
    </div>
  );
};

export default ClienteStats;
