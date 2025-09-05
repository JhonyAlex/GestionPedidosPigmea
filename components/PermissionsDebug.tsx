import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';

const PermissionsDebug: React.FC = () => {
    const { user } = useAuth();
    const {
        canViewPedidos,
        canCreatePedidos,
        canEditPedidos,
        canDeletePedidos,
        canMovePedidos,
        canArchivePedidos,
        canViewUsers,
        canCreateUsers,
        canEditUsers,
        canDeleteUsers,
        canManagePermissions,
        canViewReports,
        canViewKPI,
        canExportReports,
        canViewConfig,
        canEditConfig,
        canViewAudit,
        canViewSystemHealth,
        canAccessMaintenance,
        isAdmin,
        canAccessAdmin,
        getUserPermissions
    } = usePermissions();

    if (!user) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">No hay usuario autenticado.</p>
            </div>
        );
    }

    const userPermissions = getUserPermissions();

    const permissionSections = [
        {
            title: 'Gestión de Pedidos',
            permissions: [
                { name: 'Ver Pedidos', value: canViewPedidos() },
                { name: 'Crear Pedidos', value: canCreatePedidos() },
                { name: 'Editar Pedidos', value: canEditPedidos() },
                { name: 'Eliminar Pedidos', value: canDeletePedidos() },
                { name: 'Mover entre Etapas', value: canMovePedidos() },
                { name: 'Archivar Pedidos', value: canArchivePedidos() }
            ]
        },
        {
            title: 'Gestión de Usuarios',
            permissions: [
                { name: 'Ver Usuarios', value: canViewUsers() },
                { name: 'Crear Usuarios', value: canCreateUsers() },
                { name: 'Editar Usuarios', value: canEditUsers() },
                { name: 'Eliminar Usuarios', value: canDeleteUsers() },
                { name: 'Gestionar Permisos', value: canManagePermissions() }
            ]
        },
        {
            title: 'Reportes y Análisis',
            permissions: [
                { name: 'Ver Reportes', value: canViewReports() },
                { name: 'Ver KPIs', value: canViewKPI() },
                { name: 'Exportar Reportes', value: canExportReports() }
            ]
        },
        {
            title: 'Configuración y Sistema',
            permissions: [
                { name: 'Ver Configuración', value: canViewConfig() },
                { name: 'Editar Configuración', value: canEditConfig() },
                { name: 'Ver Auditoría', value: canViewAudit() },
                { name: 'Ver Estado del Sistema', value: canViewSystemHealth() },
                { name: 'Acceso a Mantenimiento', value: canAccessMaintenance() }
            ]
        }
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    🔍 Debug de Permisos del Sistema
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                            Información del Usuario
                        </h3>
                        <p><span className="font-medium">Usuario:</span> {user.displayName}</p>
                        <p><span className="font-medium">Rol:</span> {user.role}</p>
                        <p><span className="font-medium">ID:</span> {user.id}</p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                            Estado de Privilegios
                        </h3>
                        <p>
                            <span className="font-medium">Es Administrador:</span> 
                            <span className={`ml-2 px-2 py-1 rounded text-sm ${isAdmin() ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                {isAdmin() ? 'Sí' : 'No'}
                            </span>
                        </p>
                        <p>
                            <span className="font-medium">Acceso Admin:</span> 
                            <span className={`ml-2 px-2 py-1 rounded text-sm ${canAccessAdmin() ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                {canAccessAdmin() ? 'Sí' : 'No'}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {permissionSections.map((section, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                                {section.title}
                            </h3>
                            <div className="space-y-2">
                                {section.permissions.map((permission, permIndex) => (
                                    <div key={permIndex} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {permission.name}
                                        </span>
                                        <span 
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                permission.value 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' 
                                                    : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                                            }`}
                                        >
                                            {permission.value ? '✅ Permitido' : '❌ Denegado'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Permisos Detallados del Usuario
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        <p className="mb-2">Total de permisos: {userPermissions.length}</p>
                        <div className="max-h-40 overflow-y-auto">
                            {userPermissions.length > 0 ? (
                                <ul className="space-y-1">
                                    {userPermissions.map((permission, index) => (
                                        <li key={index} className="flex items-center">
                                            <span className="text-green-600 mr-2">•</span>
                                            {permission.id} - {permission.name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-red-600">No hay permisos asignados</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionsDebug;
