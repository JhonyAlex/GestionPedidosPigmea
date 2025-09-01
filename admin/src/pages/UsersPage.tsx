import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { User, CreateUserRequest, UpdateUserRequest, UserRole, Permission } from '../types/admin';
import UserTable from '../components/UserTable';
import CreateUserModal from '../components/CreateUserModal';
import EditUserModal from '../components/EditUserModal';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
    loadPermissions();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
      setError(null);
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      // Crear permisos de ejemplo ya que el servicio no los tiene aún
      setPermissions([
        { id: '1', name: 'Ver Dashboard', description: 'Acceso al dashboard', module: 'view' },
        { id: '2', name: 'Gestionar Pedidos', description: 'Crear y editar pedidos', module: 'orders' },
        { id: '3', name: 'Gestionar Usuarios', description: 'Administrar usuarios', module: 'users' },
        { id: '4', name: 'Configuración Sistema', description: 'Acceso a configuración', module: 'system' }
      ]);
    } catch (err) {
      console.error('Error cargando permisos:', err);
      setPermissions([]);
    }
  };

  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      await userService.createUser(userData);
      await loadUsers();
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
      alert('Error al crear usuario');
    }
  };

  const handleUpdateUser = async (userId: string, userData: UpdateUserRequest) => {
    try {
      await userService.updateUser(userId, userData);
      await loadUsers();
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar usuario');
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    try {
      if (user.isActive) {
        await userService.deactivateUser(userId);
      } else {
        await userService.activateUser(userId);
      }
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert('Error al cambiar estado del usuario');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold text-admin-900">Gestión de Usuarios</h1>
          <p className="text-admin-600">Administra usuarios, roles y permisos del sistema</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          ➕ Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={loadUsers}
            className="ml-4 text-red-600 hover:text-red-800 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-admin-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre, usuario o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-admin-700 mb-1">
              Rol
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos los roles</option>
              <option value={UserRole.ADMIN}>Administrador</option>
              <option value={UserRole.SUPERVISOR}>Supervisor</option>
              <option value={UserRole.OPERATOR}>Operador</option>
              <option value={UserRole.VIEWER}>Visor</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-admin-700 mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="w-full px-3 py-2 text-admin-600 bg-admin-100 rounded-lg hover:bg-admin-200 transition-colors"
            >
              🔄 Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6 text-center">
          <div className="text-2xl font-bold text-primary-600">{users.length}</div>
          <div className="text-sm text-admin-600">Total de usuarios</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.isActive).length}
          </div>
          <div className="text-sm text-admin-600">Usuarios activos</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === UserRole.ADMIN).length}
          </div>
          <div className="text-sm text-admin-600">Administradores</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.lastLogin && 
              new Date(u.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length}
          </div>
          <div className="text-sm text-admin-600">Activos hoy</div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow-sm border border-admin-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-admin-200">
          <h3 className="text-lg font-semibold text-admin-900">
            Usuarios ({filteredUsers.length})
          </h3>
        </div>
        
        <UserTable
          users={filteredUsers}
          onEditUser={setEditingUser}
          onDeleteUser={handleDeleteUser}
          onToggleStatus={handleToggleUserStatus}
        />
      </div>

      {/* Modales */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          permissions={permissions}
        />
      )}

      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={(userData: UpdateUserRequest) => handleUpdateUser(editingUser.id, userData)}
          permissions={permissions}
        />
      )}
    </div>
  );
};

export default UsersPage;
