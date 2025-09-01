import React from 'react';
import { UserActivity } from '../types/admin';

interface ActiveUsersCardProps {
  users: UserActivity[];
}

const ActiveUsersCard: React.FC<ActiveUsersCardProps> = ({ users }) => {
  const formatLastActivity = (timestamp: string) => {
    const now = new Date();
    const lastActivity = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getActivityStatus = (timestamp: string) => {
    const now = new Date();
    const lastActivity = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 5) return 'online';
    if (diffInMinutes < 30) return 'away';
    return 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-admin-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-admin-900">Usuarios Activos</h3>
        <span className="text-sm text-admin-500">{users.length} usuarios</span>
      </div>
      
      {users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-admin-500">No hay usuarios activos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.slice(0, 8).map((user) => {
            const status = getActivityStatus(user.lastActivity);
            return (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user.username.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(status)}`}></div>
                  </div>
                  <div>
                    <p className="font-medium text-admin-900">{user.username}</p>
                    <p className="text-xs text-admin-500">
                      {user.actionsToday} acciones hoy
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-admin-600">
                    {formatLastActivity(user.lastActivity)}
                  </p>
                  <p className="text-xs text-admin-400 capitalize">{status}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {users.length > 8 && (
        <div className="mt-4 pt-4 border-t border-admin-200">
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todos los usuarios →
          </button>
        </div>
      )}
    </div>
  );
};

export default ActiveUsersCard;
