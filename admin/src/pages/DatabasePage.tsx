import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { DatabaseBackup, DatabaseStats } from '../types/admin';

const DatabasePage: React.FC = () => {
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState<any>(null);

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const loadDatabaseData = async () => {
    try {
      setLoading(true);
      const [backupsData, statsData] = await Promise.all([
        databaseService.getBackups(),
        databaseService.getStats()
      ]);
      
      setBackups(backupsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos de la base de datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const backup = await databaseService.createBackup({
        name: `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}`,
        description: 'Backup manual creado desde panel administrativo'
      });
      
      setBackups([backup, ...backups]);
      alert('Backup creado exitosamente');
    } catch (error) {
      console.error('Error creando backup:', error);
      alert('Error al crear backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('¿ADVERTENCIA: Esto restaurará la base de datos y sobrescribirá todos los datos actuales. ¿Continuar?')) {
      return;
    }

    try {
      await databaseService.restoreBackup(backupId);
      alert('Base de datos restaurada exitosamente. Se recomienda reiniciar la aplicación.');
    } catch (error) {
      console.error('Error restaurando backup:', error);
      alert('Error al restaurar backup');
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('¿Estás seguro de eliminar este backup? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await databaseService.deleteBackup(backupId);
      setBackups(backups.filter(b => b.id !== backupId));
      alert('Backup eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando backup:', error);
      alert('Error al eliminar backup');
    }
  };

  const handleOptimizeDatabase = async () => {
    if (!confirm('¿Ejecutar optimización de base de datos? Esto puede tomar varios minutos.')) {
      return;
    }

    try {
      const result = await databaseService.optimizeDatabase();
      setMaintenanceStatus(result);
      alert('Optimización completada exitosamente');
      loadDatabaseData();
    } catch (error) {
      console.error('Error optimizando base de datos:', error);
      alert('Error durante la optimización');
    }
  };

  const handleCleanupOldData = async () => {
    if (!confirm('¿Limpiar datos antiguos? Esto eliminará registros de más de 90 días.')) {
      return;
    }

    try {
      const result = await databaseService.cleanupOldData();
      alert(`Limpieza completada: ${result.deletedRecords} registros eliminados`);
      loadDatabaseData();
    } catch (error) {
      console.error('Error limpiando datos:', error);
      alert('Error durante la limpieza');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
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
          <h1 className="text-3xl font-bold text-admin-900">Gestión de Base de Datos</h1>
          <p className="text-admin-600">Backups, estadísticas y mantenimiento de la base de datos</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isCreatingBackup ? '⏳ Creando...' : '💾 Crear Backup'}
          </button>
          <button
            onClick={loadDatabaseData}
            className="bg-admin-600 text-white px-4 py-2 rounded-lg hover:bg-admin-700 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={loadDatabaseData}
            className="ml-4 text-red-600 hover:text-red-800 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estadísticas de la Base de Datos */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6 text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.totalTables}</div>
            <div className="text-sm text-admin-600">Tablas Totales</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalRecords.toLocaleString()}</div>
            <div className="text-sm text-admin-600">Registros Totales</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{formatFileSize(stats.databaseSize)}</div>
            <div className="text-sm text-admin-600">Tamaño de BD</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.activeConnections}</div>
            <div className="text-sm text-admin-600">Conexiones Activas</div>
          </div>
        </div>
      )}

      {/* Acciones de Mantenimiento */}
      <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
        <h3 className="text-lg font-semibold text-admin-900 mb-4">Mantenimiento de Base de Datos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleOptimizeDatabase}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>⚡</span>
            <span>Optimizar Base de Datos</span>
          </button>
          
          <button
            onClick={handleCleanupOldData}
            className="flex items-center justify-center space-x-2 bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <span>🧹</span>
            <span>Limpiar Datos Antiguos</span>
          </button>
        </div>
        
        {maintenanceStatus && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800">Última Optimización:</h4>
            <div className="text-sm text-green-700 mt-2">
              <p>Tablas optimizadas: {maintenanceStatus.tablesOptimized}</p>
              <p>Tiempo tomado: {maintenanceStatus.timeTaken}ms</p>
              <p>Espacio liberado: {formatFileSize(maintenanceStatus.spaceFreed)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Backups */}
      <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-admin-900">Backups Disponibles</h3>
          <span className="text-sm text-admin-600">{backups.length} backups encontrados</span>
        </div>
        
        {backups.length === 0 ? (
          <div className="text-center py-8 text-admin-500">
            No hay backups disponibles
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-admin-200">
              <thead className="bg-admin-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-admin-200">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-admin-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-admin-900">{backup.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-admin-600 max-w-xs truncate">
                        {backup.description || 'Sin descripción'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-admin-600">{formatFileSize(backup.size)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-admin-600">{formatDate(backup.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        backup.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : backup.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {backup.status === 'completed' ? 'Completado' : 
                         backup.status === 'in_progress' ? 'En Progreso' : 'Error'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {backup.status === 'completed' && (
                        <>
                          <button
                            onClick={() => handleRestoreBackup(backup.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Restaurar backup"
                          >
                            🔄
                          </button>
                          <a
                            href={`/api/admin/database/backups/${backup.id}/download`}
                            className="text-green-600 hover:text-green-900"
                            title="Descargar backup"
                          >
                            📥
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar backup"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información de Tablas */}
      {stats?.tables && (
        <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-4">Información de Tablas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.tables.map((table, index) => (
              <div key={index} className="p-4 border border-admin-200 rounded-lg">
                <h4 className="font-medium text-admin-900">{table.name}</h4>
                <div className="text-sm text-admin-600 mt-2">
                  <p>Registros: {table.rowCount?.toLocaleString() || 'N/A'}</p>
                  <p>Tamaño: {formatFileSize(table.size || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabasePage;
