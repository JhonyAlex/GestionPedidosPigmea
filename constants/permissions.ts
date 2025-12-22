import { PermissionConfig, Permission, UserRole, RolePermissions } from '../types';

// ============================================================
// SISTEMA DE PERMISOS SIMPLIFICADO POR VISTAS
// ============================================================
// Cada permiso representa el acceso a una vista/sección completa
// Ventajas: Más simple, más mantenible, menos confusión en soporte
// ============================================================

export const PERMISSION_CONFIG: PermissionConfig = {
    categories: {
        vistas: {
            name: 'Vistas del Sistema',
            description: 'Control de acceso a vistas y secciones principales',
            permissions: [
                {
                    id: 'vista.pedidos',
                    name: 'Vista Pedidos',
                    description: 'Acceso completo a la sección de Pedidos',
                    category: 'vistas'
                },
                {
                    id: 'vista.clientes',
                    name: 'Vista Clientes',
                    description: 'Acceso completo a la sección de Clientes',
                    category: 'vistas'
                },
                {
                    id: 'vista.vendedores',
                    name: 'Vista Vendedores',
                    description: 'Acceso completo a la sección de Vendedores',
                    category: 'vistas'
                },
                {
                    id: 'vista.operador',
                    name: 'Vista Operador Producción',
                    description: 'Acceso a vista especializada de operación de producción',
                    category: 'vistas'
                },
                {
                    id: 'vista.preparacion',
                    name: 'Vista Preparación',
                    description: 'Acceso a sección de preparación de pedidos',
                    category: 'vistas'
                },
                {
                    id: 'vista.listo_produccion',
                    name: 'Vista Listo Producción',
                    description: 'Acceso a sección de pedidos listos para producción',
                    category: 'vistas'
                },
                {
                    id: 'vista.reportes',
                    name: 'Vista Reportes',
                    description: 'Acceso a sección de reportes y análisis',
                    category: 'vistas'
                },
                {
                    id: 'vista.auditoria',
                    name: 'Vista Auditoría',
                    description: 'Acceso a logs y auditoría del sistema',
                    category: 'vistas'
                }
            ]
        },
        administracion: {
            name: 'Administración',
            description: 'Permisos de administración del sistema',
            permissions: [
                {
                    id: 'admin.usuarios',
                    name: 'Administrar Usuarios',
                    description: 'Acceso completo a gestión de usuarios y permisos',
                    category: 'administracion'
                },
                {
                    id: 'admin.configuracion',
                    name: 'Administrar Configuración',
                    description: 'Acceso a configuraciones del sistema',
                    category: 'administracion'
                },
                {
                    id: 'admin.auditoria',
                    name: 'Ver Auditoría',
                    description: 'Acceso a logs y auditoría del sistema',
                    category: 'administracion'
                }
            ]
        }
                    description: 'Permite modificar configuraciones del sistema',
                    category: 'configuracion'
                },
                {
                    id: 'configuracion.etapas',
                    name: 'Gestionar Etapas',
                    description: 'Permite configurar etapas del workflow',
                    category: 'configuracion'
                },
                {
                    id: 'configuracion.import',
                    name: 'Importar Datos',
                    description: 'Permite importar datos al sistema',
                    category: 'configuracion'
                }
            ]
        },
        auditoria: {
            name: 'Auditoría',
            description: 'Permisos para revisar logs y actividad del sistema',
            permissions: [
                {
                    id: 'auditoria.view',
                    name: 'Ver Auditoría',
                    description: 'Permite ver logs de actividad del sistema',
                    category: 'auditoria'
                },
                {
                    id: 'auditoria.export',
                    name: 'Exportar Auditoría',
                    description: 'Permite exportar logs de auditoría',
                    category: 'auditoria'
                },
                {
                    id: 'auditoria.search',
                    name: 'Búsqueda Avanzada',
                    description: 'Permite realizar búsquedas avanzadas en logs',
                    category: 'auditoria'
                }
            ]
        },
        sistema: {
            name: 'Sistema',
            description: 'Permisos de administración del sistema',
            permissions: [
                {
                    id: 'sistema.health',
                    name: 'Ver Estado del Sistema',
                    description: 'Permite ver el estado de salud del sistema',
                    category: 'sistema'
                },
                {
                    id: 'sistema.backup',
                    name: 'Gestionar Respaldos',
                    description: 'Permite crear y restaurar respaldos',
                    category: 'sistema'
                },
                {
                    id: 'sistema.maintenance',
                    name: 'Modo Mantenimiento',
                    description: 'Permite activar/desactivar modo mantenimiento',
                    category: 'sistema'
                },
                {
                    id: 'sistema.debug',
                    name: 'Acceso Debug',
                    description: 'Permite acceder a información de depuración',
                    category: 'sistema'
                }
            ]
        }
    }
};

// Permisos por defecto para cada rol
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
    {
        role: 'Administrador',
        permissions: Object.values(PERMISSION_CONFIG.categories)
            .flatMap(category => category.permissions)
            .map(permission => ({ ...permission, enabled: true }))
    },
// Permisos por defecto para cada rol - SISTEMA SIMPLIFICADO
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
    {
        role: 'Administrador',
        permissions: Object.values(PERMISSION_CONFIG.categories)
            .flatMap(category => category.permissions)
            .map(permission => ({ ...permission, enabled: true }))
    },
    {
        role: 'Supervisor',
        permissions: [
            // Vistas principales
            { id: 'vista.pedidos', name: 'Vista Pedidos', description: 'Acceso completo a la sección de Pedidos', category: 'vistas', enabled: true },
            { id: 'vista.clientes', name: 'Vista Clientes', description: 'Acceso completo a la sección de Clientes', category: 'vistas', enabled: true },
            { id: 'vista.vendedores', name: 'Vista Vendedores', description: 'Acceso completo a la sección de Vendedores', category: 'vistas', enabled: true },
            { id: 'vista.preparacion', name: 'Vista Preparación', description: 'Acceso a sección de preparación de pedidos', category: 'vistas', enabled: true },
            { id: 'vista.listo_produccion', name: 'Vista Listo Producción', description: 'Acceso a sección de pedidos listos para producción', category: 'vistas', enabled: true },
            { id: 'vista.reportes', name: 'Vista Reportes', description: 'Acceso a sección de reportes y análisis', category: 'vistas', enabled: true },
            
            // Auditoría
            { id: 'admin.auditoria', name: 'Ver Auditoría', description: 'Acceso a logs y auditoría del sistema', category: 'administracion', enabled: true }
        ]
    },
    {
        role: 'Operador',
        permissions: [
            // Solo vista de pedidos y operador
            { id: 'vista.pedidos', name: 'Vista Pedidos', description: 'Acceso completo a la sección de Pedidos', category: 'vistas', enabled: true },
            { id: 'vista.operador', name: 'Vista Operador Producción', description: 'Acceso a vista especializada de operación de producción', category: 'vistas', enabled: true },
            { id: 'vista.preparacion', name: 'Vista Preparación', description: 'Acceso a sección de preparación de pedidos', category: 'vistas', enabled: true },
            { id: 'vista.listo_produccion', name: 'Vista Listo Producción', description: 'Acceso a sección de pedidos listos para producción', category: 'vistas', enabled: true }
        ]
    },
    {
        role: 'Visualizador',
        permissions: [
            // Solo lectura en vistas principales
            { id: 'vista.pedidos', name: 'Vista Pedidos', description: 'Acceso completo a la sección de Pedidos', category: 'vistas', enabled: true },
            { id: 'vista.clientes', name: 'Vista Clientes', description: 'Acceso completo a la sección de Clientes', category: 'vistas', enabled: true },
            { id: 'vista.reportes', name: 'Vista Reportes', description: 'Acceso a sección de reportes y análisis', category: 'vistas', enabled: true }
        ]
    }
];

// Función para obtener permisos por rol
export const getPermissionsByRole = (role: UserRole): Permission[] => {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS.find(rp => rp.role === role);
    return rolePermissions ? rolePermissions.permissions : [];
};

// Función para verificar si un usuario tiene un permiso específico
export const hasPermission = (userPermissions: Permission[], permissionId: string): boolean => {
    return userPermissions.some(permission => permission.id === permissionId && permission.enabled);
};

// Función para obtener todas las categorías de permisos
export const getAllPermissionCategories = () => {
    return Object.keys(PERMISSION_CONFIG.categories) as (keyof typeof PERMISSION_CONFIG.categories)[];
};

// Función para obtener permisos por categoría
export const getPermissionsByCategory = (category: keyof typeof PERMISSION_CONFIG.categories) => {
    return PERMISSION_CONFIG.categories[category].permissions;
};

// Función para obtener todos los permisos disponibles (equivalente a ALL_PERMISSIONS)
export const getAllPermissions = (): Permission[] => {
    return Object.values(PERMISSION_CONFIG.categories)
        .flatMap(category => category.permissions)
        .map(permission => ({ ...permission, enabled: true }));
};
