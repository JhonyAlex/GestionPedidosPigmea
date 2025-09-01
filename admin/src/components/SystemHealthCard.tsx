import React from 'react';
import { SystemHealth } from '../types/admin';

interface SystemHealthCardProps {
  health: SystemHealth;
}

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ health }) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
      <h3 className="text-lg font-semibold text-admin-900 mb-4">Estado del Sistema</h3>
      
      <div className="space-y-4">
        {/* Database */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-admin-700">Base de Datos</p>
            <p className="text-sm text-admin-500">
              {health.database.connections} conexiones • {health.database.responseTime}ms
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(health.database.status)}`}>
            {getStatusText(health.database.status)}
          </span>
        </div>

        {/* Server */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-admin-700">Servidor</p>
            <p className="text-sm text-admin-500">
              CPU: {health.server.cpuUsage}% • RAM: {health.server.memoryUsage}%
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(health.server.status)}`}>
            {getStatusText(health.server.status)}
          </span>
        </div>

        {/* WebSocket */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-admin-700">WebSocket</p>
            <p className="text-sm text-admin-500">
              {health.websocket.connections} conexiones activas
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(health.websocket.status)}`}>
            {getStatusText(health.websocket.status)}
          </span>
        </div>
      </div>

      {/* Overall Health */}
      <div className="mt-6 pt-4 border-t border-admin-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-admin-900">Estado General</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            health.database.status === 'healthy' && 
            health.server.status === 'healthy' && 
            health.websocket.status === 'healthy'
              ? 'text-green-600 bg-green-100'
              : 'text-yellow-600 bg-yellow-100'
          }`}>
            {health.database.status === 'healthy' && 
             health.server.status === 'healthy' && 
             health.websocket.status === 'healthy'
              ? 'Óptimo'
              : 'Requiere Atención'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCard;
