import React, { useState, useEffect } from 'react';
import { Permission, UserRole, PermissionCategory } from '../types';
import { PERMISSION_CONFIG, DEFAULT_ROLE_PERMISSIONS, getPermissionsByRole } from '../constants/permissions';

interface PermissionsManagerProps {
    onClose: () => void;
}

interface RolePermissionState {
    [key: string]: {
        role: UserRole;
        permissions: { [permissionId: string]: boolean };
    };
}

const PermissionsManager: React.FC<PermissionsManagerProps> = ({ onClose }) => {
    const [rolePermissions, setRolePermissions] = useState<RolePermissionState>({});
    const [selectedRole, setSelectedRole] = useState<UserRole>('Administrador');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Inicializar permisos por rol
    useEffect(() => {
        const initialState: RolePermissionState = {};
        
        DEFAULT_ROLE_PERMISSIONS.forEach(roleConfig => {
            const permissionsMap: { [permissionId: string]: boolean } = {};
            
            // Obtener todos los permisos disponibles
            Object.values(PERMISSION_CONFIG.categories).forEach(category => {
                category.permissions.forEach(permission => {
                    // Verificar si este rol tiene este permiso habilitado
                    const hasPermission = roleConfig.permissions.some(
                        p => p.id === permission.id && p.enabled
                    );
                    permissionsMap[permission.id] = hasPermission;
                });
            });
            
            initialState[roleConfig.role] = {
                role: roleConfig.role,
                permissions: permissionsMap
            };
        });
        
        setRolePermissions(initialState);
    }, []);

    // Cambiar permiso para un rol específico
    const togglePermission = (role: UserRole, permissionId: string) => {
        setRolePermissions(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                permissions: {
                    ...prev[role].permissions,
                    [permissionId]: !prev[role].permissions[permissionId]
                }
            }
        }));
        setHasChanges(true);
    };

    // Guardar cambios
    const handleSave = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Aquí iría la llamada a la API para guardar los permisos
            console.log('Guardando permisos:', rolePermissions);
            
            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setHasChanges(false);
            // Podrías mostrar un mensaje de éxito aquí
        } catch (err) {
            setError('Error al guardar los permisos');
            console.error('Error saving permissions:', err);
        } finally {
            setLoading(false);
        }
    };

    // Resetear a configuración por defecto
    const handleReset = () => {
        if (confirm('¿Estás seguro de que quieres resetear todos los permisos a su configuración por defecto?')) {
            const initialState: RolePermissionState = {};
            
            DEFAULT_ROLE_PERMISSIONS.forEach(roleConfig => {
                const permissionsMap: { [permissionId: string]: boolean } = {};
                
                Object.values(PERMISSION_CONFIG.categories).forEach(category => {
                    category.permissions.forEach(permission => {
                        const hasPermission = roleConfig.permissions.some(
                            p => p.id === permission.id && p.enabled
                        );
                        permissionsMap[permission.id] = hasPermission;
                    });
                });
                
                initialState[roleConfig.role] = {
                    role: roleConfig.role,
                    permissions: permissionsMap
                };
            });
            
            setRolePermissions(initialState);
            setHasChanges(true);
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

    const countEnabledPermissions = (role: UserRole) => {
        if (!rolePermissions[role]) return 0;
        return Object.values(rolePermissions[role].permissions).filter(Boolean).length;
    };

    const totalPermissions = Object.values(PERMISSION_CONFIG.categories)
        .reduce((total, category) => total + category.permissions.length, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Gestión de Permisos por Rol
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Configura qué puede hacer cada rol en el sistema
                        </p>
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

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* Selección de rol */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Seleccionar Rol para Editar:
                    </label>
                    <div className="flex gap-2">
                        {(['Administrador', 'Supervisor', 'Operador'] as UserRole[]).map((role) => (
                            <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    selectedRole === role
                                        ? getRoleColor(role) + ' ring-2 ring-offset-2 ring-blue-500'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                <div className="text-sm font-medium">{role}</div>
                                <div className="text-xs opacity-75">
                                    {countEnabledPermissions(role)}/{totalPermissions} permisos
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid de permisos por categoría */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {Object.entries(PERMISSION_CONFIG.categories).map(([categoryKey, category]) => (
                        <div
                            key={categoryKey}
                            className={`border rounded-lg p-4 ${getCategoryColor(categoryKey as PermissionCategory)}`}
                        >
                            <div className="mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {category.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {category.description}
                                </p>
                            </div>

                            <div className="space-y-2">
                                {category.permissions.map((permission) => (
                                    <div
                                        key={permission.id}
                                        className="flex items-start space-x-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded"
                                    >
                                        <input
                                            type="checkbox"
                                            id={`${selectedRole}-${permission.id}`}
                                            checked={rolePermissions[selectedRole]?.permissions[permission.id] || false}
                                            onChange={() => togglePermission(selectedRole, permission.id)}
                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label
                                            htmlFor={`${selectedRole}-${permission.id}`}
                                            className="flex-1 cursor-pointer"
                                        >
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
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
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                        >
                            Resetear a Defecto
                        </button>
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
                            className={`px-6 py-2 rounded-lg transition-colors ${
                                hasChanges && !loading
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>

                {hasChanges && (
                    <div className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                        * Tienes cambios sin guardar
                    </div>
                )}
            </div>
        </div>
    );
};

export default PermissionsManager;
