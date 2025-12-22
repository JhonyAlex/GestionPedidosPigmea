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

    // SISTEMA SIMPLIFICADO: Verificar acceso a vistas/secciones
    const canViewSection = (sectionId: string): boolean => {
        return canAccess(`vista.${sectionId}`);
    };

    // Acceso a vistas específicas
    const canViewPedidos = () => canAccess('vista.pedidos');
    const canViewClientes = () => canAccess('vista.clientes');
    const canViewVendedores = () => canAccess('vista.vendedores');
    const canViewOperador = () => canAccess('vista.operador');
    const canViewPreparacion = () => canAccess('vista.preparacion');
    const canViewListoProduccion = () => canAccess('vista.listo_produccion');
    const canViewReportes = () => canAccess('vista.reportes');
    const canViewAuditoria = () => canAccess('vista.auditoria');

    // Acceso a administración
    const canManageUsers = () => canAccess('admin.usuarios');
    const canManageConfig = () => canAccess('admin.configuracion');
    const canViewAudit = () => canAccess('admin.auditoria');

    // Acceso simplificado por rol
    const isAdmin = () => user?.role === 'Administrador';
    const isSupervisor = () => user?.role === 'Supervisor';
    const isOperador = () => user?.role === 'Operador';
    const isVisualizador = () => user?.role === 'Visualizador';

    // ============================================================
    // Compatibilidad (API antigua / acciones)
    // ============================================================
    // Nota: el sistema actual es por vistas. Para acciones (mover/archivar/crear),
    // aplicamos una regla segura: el rol Visualizador es solo lectura.
    const canCreatePedidos = () => canViewPedidos() && !isVisualizador();
    const canMovePedidos = () => canViewPedidos() && !isVisualizador();
    const canArchivePedidos = () => canViewPedidos() && !isVisualizador();

    // Alias históricos usados por algunos componentes
    const canViewReports = () => canViewReportes();
    const canViewConfig = () => canManageConfig();
    const canAccessAdmin = () => isAdmin() || canManageUsers() || canManageConfig() || canViewAudit();

    return {
        user,
        canAccess,
        canViewSection,
        // Vistas principales
        canViewPedidos,
        canViewClientes,
        canViewVendedores,
        canViewOperador,
        canViewPreparacion,
        canViewListoProduccion,
        canViewReportes,
        canViewAuditoria,
        // Administración
        canManageUsers,
        canManageConfig,
        canViewAudit,
        // Acciones (compatibilidad / solo lectura)
        canCreatePedidos,
        canMovePedidos,
        canArchivePedidos,
        // Alias históricos
        canViewReports,
        canViewConfig,
        canAccessAdmin,
        // Roles
        isAdmin,
        isSupervisor,
        isOperador,
        isVisualizador,
        // Utilidades
        getUserPermissions
    };
};
