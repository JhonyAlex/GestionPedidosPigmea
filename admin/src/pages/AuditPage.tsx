import React, { useState, useEffect } from 'react';
import { systemService } from '../services/systemService';
import { AuditLog } from '../types/admin';

const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    module: '',
    startDate: '',
    endDate: '',
    userId: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const result = await systemService.getAuditLogs(currentPage, 50, filters);
      setLogs(result.logs);
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      setError('Error al cargar logs de auditoría');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      module: '',
      startDate: '',
      endDate: '',
      userId: ''
    });
    setCurrentPage(1);
  };

  const exportLogs = async () => {
    try {
      const blob = await systemService.exportAuditLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar logs:', error);
      alert('Error al exportar logs de auditoría');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('LOGIN')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-admin-900">Auditoría del Sistema</h1>
          <p className="text-admin-600">Registro completo de actividades administrativas</p>
        </div>
        <button
          onClick={exportLogs}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          📊 Exportar CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={loadAuditLogs}
            className="ml-4 text-red-600 hover:text-red-800 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-admin-700 mb-2">
              Acción
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="Filtrar por acción..."
              className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-700 mb-2">
              Módulo
            </label>
            <select
              value={filters.module}
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los módulos</option>
              <option value="AUTH">Autenticación</option>
              <option value="USERS">Usuarios</option>
              <option value="SYSTEM">Sistema</option>
              <option value="DATABASE">Base de Datos</option>
              <option value="MAINTENANCE">Mantenimiento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-admin-600 text-white px-4 py-2 rounded-lg hover:bg-admin-700 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-admin-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-admin-200">
            <thead className="bg-admin-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-admin-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-admin-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-900">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-admin-900">
                    {log.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-500">
                    {log.module}
                  </td>
                  <td className="px-6 py-4 text-sm text-admin-900 max-w-xs truncate">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-500">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-admin-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-admin-700">
                Página {currentPage} de {totalPages}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-admin-300 rounded text-sm disabled:opacity-50 hover:bg-admin-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-admin-300 rounded text-sm disabled:opacity-50 hover:bg-admin-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {logs.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-admin-500">No se encontraron logs de auditoría con los filtros aplicados</p>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
