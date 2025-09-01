import React from 'react';
import { AuditLog } from '../types/admin';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RecentActivityCardProps {
  logs: AuditLog[];
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ logs }) => {
  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) {
      return 'text-green-600 bg-green-100';
    }
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return 'text-red-600 bg-red-100';
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return 'text-blue-600 bg-blue-100';
    }
    return 'text-admin-600 bg-admin-100';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) {
      return '➕';
    }
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return '🗑️';
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return '✏️';
    }
    if (action.includes('LOGIN')) {
      return '🔐';
    }
    return '📝';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-admin-900">Actividad Reciente</h3>
        <span className="text-sm text-admin-500">{logs.length} eventos</span>
      </div>
      
      {logs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-admin-500">No hay actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="text-lg">{getActionIcon(log.action)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-admin-900">{log.username}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </div>
                <p className="text-sm text-admin-600 mt-1">{log.details}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-admin-400">
                    {formatDistanceToNow(new Date(log.timestamp), { 
                      addSuffix: true,
                      locale: es 
                    })}
                  </span>
                  <span className="text-xs text-admin-400">•</span>
                  <span className="text-xs text-admin-400">{log.module}</span>
                  {log.ipAddress && (
                    <>
                      <span className="text-xs text-admin-400">•</span>
                      <span className="text-xs text-admin-400">{log.ipAddress}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {logs.length > 10 && (
        <div className="mt-4 pt-4 border-t border-admin-200">
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todos los eventos →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivityCard;
