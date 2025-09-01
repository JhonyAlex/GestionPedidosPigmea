import React from 'react';
import { User, UserRole } from '../types/admin';

interface UserTableProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleStatus: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onEditUser,
  onDeleteUser,
  onToggleStatus
}) => {
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.SUPERVISOR:
        return 'bg-purple-100 text-purple-800';
      case UserRole.OPERATOR:
        return 'bg-blue-100 text-blue-800';
      case UserRole.VIEWER:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-admin-100 text-admin-800';
    }
  };

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.SUPERVISOR:
        return 'Supervisor';
      case UserRole.OPERATOR:
        return 'Operador';
      case UserRole.VIEWER:
        return 'Visor';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-admin-200">
        <thead className="bg-admin-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
              Usuario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
              Último Login
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-admin-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-admin-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-admin-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-admin-500">
                      @{user.username}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-admin-900">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                  {getRoleText(user.role)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <button
                    onClick={() => onToggleStatus(user.id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      user.isActive ? 'bg-green-600' : 'bg-admin-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        user.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`ml-2 text-sm ${user.isActive ? 'text-green-600' : 'text-admin-500'}`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-500">
                {user.lastLogin ? formatDate(user.lastLogin) : 'Nunca'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => onEditUser(user)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Editar usuario"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDeleteUser(user.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Eliminar usuario"
                  disabled={user.role === UserRole.ADMIN} // No permitir eliminar admins
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-admin-500">
          <span className="text-4xl mb-2 block">👤</span>
          No hay usuarios registrados
        </div>
      )}
    </div>
  );
};

export default UserTable;
