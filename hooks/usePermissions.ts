import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../constants/permissions';
import { Permission } from '../types';

export const usePermissions = () => {
    const { user } = useAuth();

    // Obtener permisos del usuario como array de Permission
    const getUserPermissions = (): Permission[] => {
        if (!user || !user.permissions) {
            return [];
        }
        
        // Ya están como Permission[] en el user
        return user.permissions;
    };

    // Verificar si el usuario tiene un permiso específico
    const canAccess = (permissionId: string): boolean => {
        const userPermissions = getUserPermissions();
        return hasPermission(userPermissions, permissionId);
    };

    // Verificar si el usuario tiene alguno de los permisos especificados (OR)
    const canAccessAny = (permissionIds: string[]): boolean => {
        const userPermissions = getUserPermissions();
        return permissionIds.some(permissionId => hasPermission(userPermissions, permissionId));
    };

    // Verificar si el usuario tiene todos los permisos especificados (AND)
    const canAccessAll = (permissionIds: string[]): boolean => {
        const userPermissions = getUserPermissions();
        return permissionIds.every(permissionId => hasPermission(userPermissions, permissionId));
    };

    // Verificar permisos específicos por categoría
    const canViewPedidos = () => canAccess('pedidos.view');
    const canCreatePedidos = () => canAccess('pedidos.create');
    const canEditPedidos = () => canAccess('pedidos.edit');
    const canDeletePedidos = () => canAccess('pedidos.delete');
    const canMovePedidos = () => canAccess('pedidos.move');
    const canArchivePedidos = () => canAccess('pedidos.archive');

    const canViewClientes = () => canAccess('clientes.view');
    const canCreateClientes = () => canAccess('clientes.create');
    const canEditClientes = () => canAccess('clientes.edit');
    const canDeleteClientes = () => canAccess('clientes.delete');

    const canViewUsers = () => canAccess('usuarios.view');
    const canCreateUsers = () => canAccess('usuarios.create');
    const canEditUsers = () => canAccess('usuarios.edit');
    const canDeleteUsers = () => canAccess('usuarios.delete');
    const canManagePermissions = () => canAccess('usuarios.permissions');

    const canViewReports = () => canAccess('reportes.view');
    const canViewKPI = () => canAccess('reportes.kpi');
    const canExportReports = () => canAccess('reportes.export');

    const canViewConfig = () => canAccess('configuracion.view');
    const canEditConfig = () => canAccess('configuracion.edit');

    const canViewAudit = () => canAccess('auditoria.view');

    const canViewSystemHealth = () => canAccess('sistema.health');
    const canAccessMaintenance = () => canAccess('sistema.maintenance');

    // Verificar si es administrador (tiene todos los permisos de usuarios)
    const isAdmin = () => {
        return canAccessAll([
            'usuarios.view',
            'usuarios.create', 
            'usuarios.edit',
            'usuarios.delete',
            'usuarios.permissions'
        ]);
    };

    // Verificar si puede acceder a las funciones de administración
    const canAccessAdmin = () => {
        return canAccessAny([
            'usuarios.view',
            'usuarios.create',
            'usuarios.edit',
            'usuarios.permissions'
        ]);
    };

    return {
        user,
        canAccess,
        canAccessAny,
        canAccessAll,
        // Permisos específicos de pedidos
        canViewPedidos,
        canCreatePedidos,
        canEditPedidos,
        canDeletePedidos,
        canMovePedidos,
        canArchivePedidos,
        // Permisos de Clientes
        canViewClientes,
        canCreateClientes,
        canEditClientes,
        canDeleteClientes,
        // Permisos específicos de usuarios
        canViewUsers,
        canCreateUsers,
        canEditUsers,
        canDeleteUsers,
        canManagePermissions,
        // Permisos específicos de reportes
        canViewReports,
        canViewKPI,
        canExportReports,
        // Permisos específicos de configuración
        canViewConfig,
        canEditConfig,
        // Permisos específicos de auditoría
        canViewAudit,
        // Permisos específicos de sistema
        canViewSystemHealth,
        canAccessMaintenance,
        // Utilidades
        isAdmin,
        canAccessAdmin,
        getUserPermissions
    };
};
