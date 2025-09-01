import React, { useEffect, useState } from 'react';
import { systemService } from '../services/systemService';
import { AdminDashboardData } from '../types/admin';
import StatsCard from '../components/StatsCard';
import SystemHealthCard from '../components/SystemHealthCard';
import RecentActivityCard from '../components/RecentActivityCard';
import ActiveUsersCard from '../components/ActiveUsersCard';

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Actualizar datos cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await systemService.getDashboardData();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos del dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            loadDashboardData();
          }}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-admin-500">
        No hay datos disponibles
      </div>
    );
  }

  const { stats, systemHealth, recentAuditLogs, activeUsers } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-admin-900">Dashboard</h1>
        <p className="text-admin-600">Panel de control administrativo</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Usuarios"
          value={stats.totalUsers}
          change={`${stats.activeUsers} activos`}
          changeType="neutral"
          icon="users"
        />
        <StatsCard
          title="Pedidos Hoy"
          value={stats.pedidosHoy}
          change={`${stats.totalPedidos} total`}
          changeType="neutral"
          icon="orders"
        />
        <StatsCard
          title="Completados"
          value={stats.pedidosCompletados}
          change={`${Math.round(stats.promedioTiempoCompletado)} min promedio`}
          changeType="positive"
          icon="completed"
        />
        <StatsCard
          title="Conectados"
          value={stats.usuariosConectados}
          change={`${stats.sesionesActivas} sesiones`}
          changeType="neutral"
          icon="connected"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <SystemHealthCard health={systemHealth} />
        
        {/* Active Users */}
        <ActiveUsersCard users={activeUsers} />
      </div>

      {/* Recent Activity */}
      <RecentActivityCard logs={recentAuditLogs} />
    </div>
  );
};

export default Dashboard;
