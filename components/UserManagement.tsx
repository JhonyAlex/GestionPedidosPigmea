import React, { useState, useEffect } from 'react';
import { User, UserRole, Permission } from '../types';
import { DEFAULT_ROLE_PERMISSIONS, getPermissionsByRole, getAllPermissionCategories, PERMISSION_CONFIG } from '../constants/permissions';
import PermissionsManager from './PermissionsManager';
import UserPermissionsModal from './UserPermissionsModal';

interface UserFormData {
    username: string;
    role: UserRole;
    displayName: string;
    password?: string;
    permissions?: Permission[];
}

interface UserManagementProps {
    onClose: () => void;
}

type TabType = 'users' | 'permissions';

const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [showPermissionsManager, setShowPermissionsManager] = useState(false);
    const [showUserPermissions, setShowUserPermissions] = useState<User | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState<User | null>(null);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [formData, setFormData] = useState<UserFormData>({
        username: '',
        role: 'Operador',
        displayName: '',
        password: '',
        permissions: []
    });

    // Cargar usuarios
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/auth/users');
            const data = await response.json();
            
            if (data.success) {
                setUsers(data.users || []);
            } else {
                setError('Error al cargar usuarios');
            }
        } catch (err) {
            setError('Error de conexión');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Manejar envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            let response;
            
            if (editingUser) {
                // Actualizar usuario
                response = await fetch(`/api/auth/users/${editingUser.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.username,
                        role: formData.role,
                        displayName: formData.displayName,
                        ...(formData.password && { password: formData.password })
                    }),
                });
            } else {
                // Crear nuevo usuario
                response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password || 'temporal123',
                        role: formData.role,
                        displayName: formData.displayName,
                    }),
                });
            }

            const result = await response.json();
            
            if (result.success) {
                await fetchUsers();
                resetForm();
                setError(null);
            } else {
                setError(result.error || 'Error al guardar usuario');
            }
        } catch (err) {
            setError('Error de conexión');
            console.error('Error saving user:', err);
        }
    };

    // Eliminar usuario
    const handleDelete = async (userId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            return;
        }

        try {
            const response = await fetch(`/api/auth/users/${userId}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            
            if (result.success) {
                await fetchUsers();
                setError(null);
            } else {
                setError(result.error || 'Error al eliminar usuario');
            }
        } catch (err) {
            setError('Error de conexión');
            console.error('Error deleting user:', err);
        }
    };

    // Iniciar edición
    const startEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            role: user.role,
            displayName: user.displayName,
            password: '',
            permissions: user.permissions || getPermissionsByRole(user.role)
        });
        setShowAddForm(true);
    };

    // Resetear formulario
    const resetForm = () => {
        setEditingUser(null);
        setShowAddForm(false);
        setFormData({
            username: '',
            role: 'Operador',
            displayName: '',
            password: '',
            permissions: []
        });
    };

    // Abrir modal de permisos de usuario específico
    const openUserPermissions = (user: User) => {
        setShowUserPermissions(user);
    };

    // Actualizar permisos de usuario
    const updateUserPermissions = async (userId: string, permissions: Permission[]) => {
        try {
            // Aquí iría la llamada a la API para actualizar permisos del usuario
            console.log('Actualizando permisos del usuario:', userId, permissions);
            
            // Actualizar estado local
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.id === userId 
                        ? { ...user, permissions }
                        : user
                )
            );
            
            setShowUserPermissions(null);
        } catch (err) {
            setError('Error al actualizar permisos del usuario');
            console.error('Error updating user permissions:', err);
        }
    };

    // Cambiar contraseña de usuario
    const changeUserPassword = async () => {
        if (!showPasswordModal) return;

        try {
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                setError('Las contraseñas no coinciden');
                return;
            }

            if (passwordData.newPassword.length < 3) {
                setError('La contraseña debe tener al menos 3 caracteres');
                return;
            }

            // Usar ruta administrativa si no se proporciona contraseña actual
            const isAdminChange = !passwordData.currentPassword;
            const endpoint = isAdminChange 
                ? `/api/auth/admin/users/${showPasswordModal.id}/password`
                : `/api/auth/users/${showPasswordModal.id}/password`;

            const requestBody = isAdminChange
                ? { newPassword: passwordData.newPassword }
                : {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                };

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (data.success) {
                setShowPasswordModal(null);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                alert('Contraseña actualizada exitosamente');
            } else {
                setError(data.error || 'Error al cambiar la contraseña');
            }
        } catch (err) {
            setError('Error de conexión al cambiar la contraseña');
            console.error('Error changing password:', err);
        }
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case 'Administrador':
                return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
            case 'Supervisor':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
            case 'Operador':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Nunca';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Gestión de Usuarios y Permisos
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* Pestañas */}
                <div className="mb-6">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'users'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                Usuarios
                            </button>
                            <button
                                onClick={() => setActiveTab('permissions')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'permissions'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                Configuración de Permisos
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Contenido según pestaña activa */}
                {activeTab === 'users' ? (
                    <>
                        {/* Botón agregar usuario */}
                        <div className="mb-6">
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                + Agregar Usuario
                            </button>
                        </div>

                        {/* Formulario agregar/editar */}
                        {showAddForm && (
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                                </h3>
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Usuario
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Nombre Completo
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Rol
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                        >
                                            <option value="Operador">Operador</option>
                                            <option value="Supervisor">Supervisor</option>
                                            <option value="Administrador">Administrador</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                            required={!editingUser}
                                            placeholder={editingUser ? 'Dejar vacío para mantener actual' : ''}
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex gap-2">
                                        <button
                                            type="submit"
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            {editingUser ? 'Actualizar' : 'Crear'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Lista de usuarios */}
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No hay usuarios registrados
                                </div>
                            ) : (
                                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Usuario
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Nombre
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Rol
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Creado
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Último Login
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {user.username}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-gray-900 dark:text-white">
                                                        {user.displayName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(user.createdAt || '')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(user.lastLogin || '')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => startEdit(user)}
                                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => openUserPermissions(user)}
                                                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                                        >
                                                            Permisos
                                                        </button>
                                                        <button
                                                            onClick={() => setShowPasswordModal(user)}
                                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                        >
                                                            Contraseña
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    /* Pestaña de configuración de permisos */
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Configuración de Permisos por Rol
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Define qué permisos tiene cada rol por defecto. Los usuarios heredan estos permisos según su rol.
                            </p>
                            <button
                                onClick={() => setShowPermissionsManager(true)}
                                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                🔐 Gestionar Permisos por Rol
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal de gestión de permisos por rol */}
                {showPermissionsManager && (
                    <PermissionsManager onClose={() => setShowPermissionsManager(false)} />
                )}

                {/* Modal de permisos de usuario específico */}
                {showUserPermissions && (
                    <UserPermissionsModal
                        user={showUserPermissions}
                        onClose={() => setShowUserPermissions(null)}
                        onSave={updateUserPermissions}
                    />
                )}

                {/* Modal de cambio de contraseña */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-lg mx-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Cambiar Contraseña - {showPasswordModal.username}
                            </h3>
                            
                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Contraseña Actual (opcional)
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({
                                            ...passwordData,
                                            currentPassword: e.target.value
                                        })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Ingresa tu contraseña actual (opcional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({
                                            ...passwordData,
                                            newPassword: e.target.value
                                        })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Ingresa la nueva contraseña"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Confirmar Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({
                                            ...passwordData,
                                            confirmPassword: e.target.value
                                        })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Confirma la nueva contraseña"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(null);
                                        setPasswordData({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: ''
                                        });
                                        setError(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={changeUserPassword}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                                    disabled={!passwordData.newPassword || !passwordData.confirmPassword}
                                >
                                    Cambiar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
