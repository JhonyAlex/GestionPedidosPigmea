import React, { useState, useEffect } from 'react';
import { User, Permission, PermissionCategory } from '../types';
import { PERMISSION_CONFIG, getPermissionsByRole } from '../constants/permissions';

interface UserPermissionsModalProps {
    user: User;
    onClose: () => void;
    onSave: (userId: string, permissions: Permission[]) => void;
}

const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({ user, onClose, onSave }) => {
    const [userPermissions, setUserPermissions] = useState<{ [permissionId: string]: boolean }>({});
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Inicializar permisos del usuario
    useEffect(() => {
        const initialPermissions: { [permissionId: string]: boolean } = {};

        // Obtener permisos por defecto del rol
        const rolePermissions = getPermissionsByRole(user.role);

        // Si el usuario tiene permisos personalizados, usarlos
        const currentPermissions = user.permissions || rolePermissions;

        // Inicializar todos los permisos disponibles
        Object.values(PERMISSION_CONFIG.categories).forEach(category => {
            category.permissions.forEach(permission => {
                const hasPermission = currentPermissions.some(
                    p => p.id === permission.id && p.enabled
                );
                initialPermissions[permission.id] = hasPermission;
            });
        });

        setUserPermissions(initialPermissions);
    }, [user]);

    // Cambiar permiso
    const togglePermission = (permissionId: string) => {
        setUserPermissions(prev => ({
            ...prev,
            [permissionId]: !prev[permissionId]
        }));
        setHasChanges(true);
    };

    // Resetear a permisos por defecto del rol
    const resetToRoleDefaults = () => {
        if (confirm(`¿Resetear los permisos a los valores por defecto del rol ${user.role}?`)) {
            const rolePermissions = getPermissionsByRole(user.role);
            const resetPermissions: { [permissionId: string]: boolean } = {};

            Object.values(PERMISSION_CONFIG.categories).forEach(category => {
                category.permissions.forEach(permission => {
                    const hasPermission = rolePermissions.some(
                        p => p.id === permission.id && p.enabled
                    );
                    resetPermissions[permission.id] = hasPermission;
                });
            });

            setUserPermissions(resetPermissions);
            setHasChanges(true);
        }
    };

    // Guardar cambios
    const handleSave = async () => {
        setLoading(true);

        try {
            // Convertir el objeto de permisos a array de Permission
            const permissionsArray: Permission[] = [];

            Object.values(PERMISSION_CONFIG.categories).forEach(category => {
                category.permissions.forEach(permission => {
                    permissionsArray.push({
                        ...permission,
                        enabled: userPermissions[permission.id] || false
                    });
                });
            });

            await onSave(user.id, permissionsArray);
        } catch (error) {
            console.error('Error saving user permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category: PermissionCategory) => {
        const colors = {
            pedidos: 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20',
            usuarios: 'border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20',
            reportes: 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20',
            configuracion: 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20',
            auditoria: 'border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20',
            sistema: 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
        };
        return colors[category] || 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20';
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Administrador':
                return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
            case 'Supervisor':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';

            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };

    const countEnabledPermissions = () => {
        return Object.values(userPermissions).filter(Boolean).length;
    };

    const totalPermissions = Object.values(PERMISSION_CONFIG.categories)
        .reduce((total, category) => total + category.permissions.length, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Permisos de Usuario
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Usuario:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{user.displayName}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                {user.role}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {countEnabledPermissions()}/{totalPermissions} permisos habilitados
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Botón resetear */}
                <div className="mb-6">
                    <button
                        onClick={resetToRoleDefaults}
                        className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                    >
                        🔄 Resetear a permisos del rol {user.role}
                    </button>
                </div>

                {/* Grid de permisos por categoría */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    {Object.entries(PERMISSION_CONFIG.categories).map(([categoryKey, category]) => (
                        <div
                            key={categoryKey}
                            className={`border rounded-lg p-4 ${getCategoryColor(categoryKey as PermissionCategory)}`}
                        >
                            <div className="mb-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {category.name}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {category.description}
                                </p>
                            </div>

                            <div className="space-y-2">
                                {category.permissions.map((permission) => (
                                    <div
                                        key={permission.id}
                                        className="flex items-start space-x-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded"
                                    >
                                        <input
                                            type="checkbox"
                                            id={`user-${user.id}-${permission.id}`}
                                            checked={userPermissions[permission.id] || false}
                                            onChange={() => togglePermission(permission.id)}
                                            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label
                                            htmlFor={`user-${user.id}-${permission.id}`}
                                            className="flex-1 cursor-pointer"
                                        >
                                            <div className="text-xs font-medium text-gray-900 dark:text-white">
                                                {permission.name}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {permission.description}
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Botones de acción */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {hasChanges && '* Tienes cambios sin guardar'}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || loading}
                            className={`px-6 py-2 rounded-lg transition-colors ${hasChanges && !loading
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                }`}
                        >
                            {loading ? 'Guardando...' : 'Guardar Permisos'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserPermissionsModal;
