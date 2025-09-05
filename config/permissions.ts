import { Permission, UserRole } from '../types';

// Definición de todos los permisos disponibles
export const ALL_PERMISSIONS: Permission[] = [
    // Gestión de Pedidos
    {
        id: 'pedidos.view',
        name: 'Ver Pedidos',
        description: 'Permite ver la lista de pedidos',
        category: 'pedidos',
        enabled: true
    },
    {
        id: 'pedidos.create',
        name: 'Crear Pedidos',
        description: 'Permite crear nuevos pedidos',
        category: 'pedidos',
        enabled: true
    },
    {
        id: 'pedidos.edit',
        name: 'Editar Pedidos',
        description: 'Permite modificar pedidos existentes',
        category: 'pedidos',
        enabled: true
    },
    {
        id: 'pedidos.delete',
        name: 'Eliminar Pedidos',
        description: 'Permite eliminar pedidos',
        category: 'pedidos',
        enabled: true
    },
    {
        id: 'pedidos.archive',
        name: 'Archivar Pedidos',
        description: 'Permite archivar y desarchivar pedidos',
        category: 'pedidos',
        enabled: true
    },
    {
        id: 'pedidos.priority',
        name: 'Cambiar Prioridad',
        description: 'Permite modificar la prioridad de los pedidos',
        category: 'pedidos',
        enabled: true
    },
    {
        id: 'pedidos.stage',
        name: 'Cambiar Etapa',
        description: 'Permite mover pedidos entre etapas',
        category: 'pedidos',
        enabled: true
    },

    // Producción
    {
        id: 'production.view',
        name: 'Ver Producción',
        description: 'Permite acceder a la vista de producción (Kanban)',
        category: 'sistema',
        enabled: true
    },
    {
        id: 'production.manage',
        name: 'Gestionar Producción',
        description: 'Permite gestionar el flujo de producción',
        category: 'sistema',
        enabled: true
    },
    {
        id: 'production.sequence',
        name: 'Reordenar Secuencia',
        description: 'Permite reordenar la secuencia de producción',
        category: 'sistema',
        enabled: true
    },

    // Reportes
    {
        id: 'reports.view',
        name: 'Ver Reportes',
        description: 'Permite acceder a los reportes del sistema',
        category: 'reportes',
        enabled: true
    },
    {
        id: 'reports.export',
        name: 'Exportar Reportes',
        description: 'Permite exportar reportes a PDF/Excel',
        category: 'reportes',
        enabled: true
    },
    {
        id: 'reports.analytics',
        name: 'Analytics Avanzados',
        description: 'Permite acceder a análisis avanzados',
        category: 'reportes',
        enabled: true
    },

    // Gestión de Usuarios
    {
        id: 'users.view',
        name: 'Ver Usuarios',
        description: 'Permite ver la lista de usuarios del sistema',
        category: 'usuarios',
        enabled: true
    },
    {
        id: 'users.create',
        name: 'Crear Usuarios',
        description: 'Permite crear nuevos usuarios',
        category: 'usuarios',
        enabled: true
    },
    {
        id: 'users.edit',
        name: 'Editar Usuarios',
        description: 'Permite modificar usuarios existentes',
        category: 'usuarios',
        enabled: true
    },
    {
        id: 'users.delete',
        name: 'Eliminar Usuarios',
        description: 'Permite eliminar usuarios del sistema',
        category: 'usuarios',
        enabled: true
    },
    {
        id: 'users.permissions',
        name: 'Gestionar Permisos',
        description: 'Permite modificar permisos de usuarios',
        category: 'usuarios',
        enabled: true
    },

    // Sistema
    {
        id: 'system.settings',
        name: 'Configuración Sistema',
        description: 'Permite acceder a la configuración del sistema',
        category: 'configuracion',
        enabled: true
    },
    {
        id: 'system.audit',
        name: 'Auditoría Sistema',
        description: 'Permite ver logs de auditoría del sistema',
        category: 'auditoria',
        enabled: true
    },
    {
        id: 'system.backup',
        name: 'Respaldos',
        description: 'Permite gestionar respaldos del sistema',
        category: 'sistema',
        enabled: true
    },
    {
        id: 'system.maintenance',
        name: 'Mantenimiento',
        description: 'Permite acceder a herramientas de mantenimiento',
        category: 'sistema',
        enabled: true
    },

    // Importación/Exportación
    {
        id: 'data.import',
        name: 'Importar Datos',
        description: 'Permite importar datos desde archivos externos',
        category: 'sistema',
        enabled: true
    },
    {
        id: 'data.export',
        name: 'Exportar Datos',
        description: 'Permite exportar datos del sistema',
        category: 'sistema',
        enabled: true
    }
];

// Permisos predeterminados por rol
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    'Administrador': [
        // Administrador tiene todos los permisos
        ...ALL_PERMISSIONS.map(p => p.id)
    ],
    'Supervisor': [
        // Permisos de gestión de pedidos y producción
        'pedidos.view',
        'pedidos.create',
        'pedidos.edit',
        'pedidos.archive',
        'pedidos.priority',
        'pedidos.stage',
        'production.view',
        'production.manage',
        'production.sequence',
        'reports.view',
        'reports.export',
        'users.view',
        'data.export'
    ],
    'Operador': [
        // Permisos básicos de operación
        'pedidos.view',
        'pedidos.edit',
        'pedidos.stage',
        'production.view',
        'production.manage'
    ]
};

// Función para obtener permisos por categoría
export const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {};
    
    ALL_PERMISSIONS.forEach(permission => {
        if (!categories[permission.category]) {
            categories[permission.category] = [];
        }
        categories[permission.category].push(permission);
    });
    
    return categories;
};

// Función para obtener permisos por rol
export const getPermissionsByRole = (role: UserRole): Permission[] => {
    const permissionIds = DEFAULT_ROLE_PERMISSIONS[role] || [];
    return ALL_PERMISSIONS.filter(permission => permissionIds.includes(permission.id));
};

// Función para verificar si un usuario tiene un permiso específico
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
    return userPermissions.includes(requiredPermission);
};

// Función para verificar múltiples permisos (OR)
export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
};

// Función para verificar múltiples permisos (AND)
export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
};
