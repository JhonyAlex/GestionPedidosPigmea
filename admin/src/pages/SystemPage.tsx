import React, { useState, useEffect } from 'react';
import { systemService } from '../services/systemService';
import { SystemHealth } from '../types/admin';

const SystemPage: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    loadSystemData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      const [health, logs] = await Promise.all([
        systemService.getSystemHealth(),
        systemService.getSystemLogs(50)
      ]);
      
      setSystemHealth(health);
      setSystemLogs(logs);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos del sistema');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const metrics = await systemService.getPerformanceMetrics(startDate, endDate);
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Error cargando métricas:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await systemService.clearCache();
      alert('Cache limpiado exitosamente');
      loadSystemData();
    } catch (error) {
      console.error('Error limpiando cache:', error);
      alert('Error al limpiar cache');
    }
  };

  const handleRunMaintenance = async () => {
    if (!confirm('¿Estás seguro de ejecutar tareas de mantenimiento? Esto puede tomar varios minutos.')) {
      return;
    }

    try {
      const result = await systemService.runMaintenance();
      alert(`Mantenimiento completado: ${result.message}`);
      loadSystemData();
    } catch (error) {
      console.error('Error en mantenimiento:', error);
      alert('Error durante el mantenimiento');
    }
  };

  const handleRestartSystem = async () => {
    if (!confirm('¿ADVERTENCIA: Esto reiniciará el sistema y desconectará a todos los usuarios. ¿Continuar?')) {
      return;
    }

    try {
      await systemService.restartSystem();
      alert('Sistema reiniciándose...');
    } catch (error) {
      console.error('Error reiniciando sistema:', error);
      alert('Error al reiniciar sistema');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-admin-600 bg-admin-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Saludable';
      case 'warning':
        return 'Advertencia';
      case 'error':
        return 'Error';
      default:
        return 'Desconocido';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-900">Estado del Sistema</h1>
          <p className="text-admin-600">Monitoreo y gestión del sistema en tiempo real</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadPerformanceMetrics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📊 Métricas
          </button>
          <button
            onClick={loadSystemData}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={loadSystemData}
            className="ml-4 text-red-600 hover:text-red-800 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado del Sistema */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Base de Datos */}
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-admin-900">Base de Datos</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.database.status)}`}>
                {getStatusText(systemHealth.database.status)}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-admin-600">Conexiones:</span>
                <span className="font-medium">{systemHealth.database.connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-600">Tiempo de respuesta:</span>
                <span className="font-medium">{systemHealth.database.responseTime}ms</span>
              </div>
            </div>
          </div>

          {/* Servidor */}
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-admin-900">Servidor</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.server.status)}`}>
                {getStatusText(systemHealth.server.status)}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-admin-600">Uptime:</span>
                <span className="font-medium">{formatUptime(systemHealth.server.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-600">CPU:</span>
                <span className="font-medium">{systemHealth.server.cpuUsage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-600">Memoria:</span>
                <span className="font-medium">{systemHealth.server.memoryUsage}%</span>
              </div>
            </div>
          </div>

          {/* WebSocket */}
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-admin-900">WebSocket</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.websocket.status)}`}>
                {getStatusText(systemHealth.websocket.status)}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-admin-600">Conexiones activas:</span>
                <span className="font-medium">{systemHealth.websocket.connections}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones del Sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
        <h3 className="text-lg font-semibold text-admin-900 mb-4">Acciones de Mantenimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleClearCache}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>🗑️</span>
            <span>Limpiar Cache</span>
          </button>
          
          <button
            onClick={handleRunMaintenance}
            className="flex items-center justify-center space-x-2 bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <span>🔧</span>
            <span>Mantenimiento</span>
          </button>
          
          <button
            onClick={handleRestartSystem}
            className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <span>⚠️</span>
            <span>Reiniciar Sistema</span>
          </button>
        </div>
      </div>

      {/* Logs del Sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
        <h3 className="text-lg font-semibold text-admin-900 mb-4">Logs del Sistema (Últimas 50 líneas)</h3>
        <div className="bg-admin-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          {systemLogs.length > 0 ? (
            systemLogs.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {line}
              </div>
            ))
          ) : (
            <div className="text-admin-400">No hay logs disponibles</div>
          )}
        </div>
      </div>

      {/* Métricas de Rendimiento */}
      {performanceMetrics && (
        <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-4">Métricas de Rendimiento (24h)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {performanceMetrics.responseTime?.[0] || 0}ms
              </div>
              <div className="text-sm text-admin-600">Tiempo de Respuesta Promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceMetrics.throughput?.[0] || 0}
              </div>
              <div className="text-sm text-admin-600">Requests por Minuto</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {performanceMetrics.errorRate?.[0] || 0}%
              </div>
              <div className="text-sm text-admin-600">Tasa de Error</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemPage;
