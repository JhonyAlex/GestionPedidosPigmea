import { PermissionConfig, Permission, UserRole, RolePermissions } from '../types';

// Configuración de permisos del sistema
export const PERMISSION_CONFIG: PermissionConfig = {
    categories: {
        pedidos: {
            name: 'Gestión de Pedidos',
            description: 'Permisos relacionados con la creación, edición y gestión de pedidos',
            permissions: [
                {
                    id: 'pedidos.view',
                    name: 'Ver Pedidos',
                    description: 'Permite visualizar la lista de pedidos',
                    category: 'pedidos'
                },
                {
                    id: 'pedidos.create',
                    name: 'Crear Pedidos',
                    description: 'Permite crear nuevos pedidos',
                    category: 'pedidos'
                },
                {
                    id: 'pedidos.edit',
                    name: 'Editar Pedidos',
                    description: 'Permite modificar pedidos existentes',
                    category: 'pedidos'
                },
                {
                    id: 'pedidos.delete',
                    name: 'Eliminar Pedidos',
                    description: 'Permite eliminar pedidos',
                    category: 'pedidos'
                },
                {
                    id: 'pedidos.move',
                    name: 'Mover Etapas',
                    description: 'Permite cambiar pedidos entre etapas',
                    category: 'pedidos'
                },
                {
                    id: 'pedidos.duplicate',
                    name: 'Duplicar Pedidos',
                    description: 'Permite duplicar pedidos existentes',
                    category: 'pedidos'
                },
                {
                    id: 'pedidos.export',
                    name: 'Exportar Pedidos',
                    description: 'Permite exportar datos de pedidos',
                    category: 'pedidos'
                },
                {
                    id: 'pedidos.archive',
                    name: 'Archivar Pedidos',
                    description: 'Permite archivar y desarchivar pedidos',
                    category: 'pedidos'
                }
            ]
        },
        clientes: {
            name: 'Gestión de Clientes',
            description: 'Permisos para administrar los clientes de la empresa',
            permissions: [
                {
                    id: 'clientes.view',
                    name: 'Ver Clientes',
                    description: 'Permite visualizar la lista de clientes',
                    category: 'clientes'
                },
                {
                    id: 'clientes.create',
                    name: 'Crear Clientes',
                    description: 'Permite crear nuevos clientes',
                    category: 'clientes'
                },
                {
                    id: 'clientes.edit',
                    name: 'Editar Clientes',
                    description: 'Permite modificar la información de los clientes',
                    category: 'clientes'
                },
                {
                    id: 'clientes.delete',
                    name: 'Archivar Clientes',
                    description: 'Permite archivar (borrado lógico) de clientes',
                    category: 'clientes'
                }
            ]
        },
        usuarios: {
            name: 'Gestión de Usuarios',
            description: 'Permisos para administrar usuarios y sus accesos',
            permissions: [
                {
                    id: 'usuarios.view',
                    name: 'Ver Usuarios',
                    description: 'Permite ver la lista de usuarios del sistema',
                    category: 'usuarios'
                },
                {
                    id: 'usuarios.create',
                    name: 'Crear Usuarios',
                    description: 'Permite crear nuevos usuarios',
                    category: 'usuarios'
                },
                {
                    id: 'usuarios.edit',
                    name: 'Editar Usuarios',
                    description: 'Permite modificar información de usuarios',
                    category: 'usuarios'
                },
                {
                    id: 'usuarios.delete',
                    name: 'Eliminar Usuarios',
                    description: 'Permite eliminar usuarios del sistema',
                    category: 'usuarios'
                },
                {
                    id: 'usuarios.permissions',
                    name: 'Gestionar Permisos',
                    description: 'Permite modificar permisos de usuarios',
                    category: 'usuarios'
                },
                {
                    id: 'usuarios.roles',
                    name: 'Gestionar Roles',
                    description: 'Permite modificar roles de usuarios',
                    category: 'usuarios'
                }
            ]
        },
        reportes: {
            name: 'Reportes y Análisis',
            description: 'Permisos para generar y visualizar reportes',
            permissions: [
                {
                    id: 'reportes.view',
                    name: 'Ver Reportes',
                    description: 'Permite acceder a la sección de reportes',
                    category: 'reportes'
                },
                {
                    id: 'reportes.kpi',
                    name: 'Ver KPIs',
                    description: 'Permite visualizar indicadores clave de rendimiento',
                    category: 'reportes'
                },
                {
                    id: 'reportes.export',
                    name: 'Exportar Reportes',
                    description: 'Permite exportar reportes en diferentes formatos',
                    category: 'reportes'
                },
                {
                    id: 'reportes.advanced',
                    name: 'Reportes Avanzados',
                    description: 'Permite acceso a reportes y análisis avanzados',
                    category: 'reportes'
                }
            ]
        },
        configuracion: {
            name: 'Configuración',
            description: 'Permisos para modificar configuraciones del sistema',
            permissions: [
                {
                    id: 'configuracion.view',
                    name: 'Ver Configuración',
                    description: 'Permite ver configuraciones del sistema',
                    category: 'configuracion'
                },
                {
                    id: 'configuracion.edit',
                    name: 'Editar Configuración',
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
    {
        role: 'Supervisor',
        permissions: [
            // Pedidos - Todos los permisos
            { id: 'pedidos.view', name: 'Ver Pedidos', description: 'Permite visualizar la lista de pedidos', category: 'pedidos', enabled: true },
            { id: 'clientes.view', name: 'Ver Clientes', description: 'Permite visualizar la lista de clientes', category: 'clientes', enabled: true },
            { id: 'clientes.create', name: 'Crear Clientes', description: 'Permite crear nuevos clientes', category: 'clientes', enabled: true },
            { id: 'clientes.edit', name: 'Editar Clientes', description: 'Permite modificar la información de los clientes', category: 'clientes', enabled: true },
            { id: 'pedidos.create', name: 'Crear Pedidos', description: 'Permite crear nuevos pedidos', category: 'pedidos', enabled: true },
            { id: 'pedidos.edit', name: 'Editar Pedidos', description: 'Permite modificar pedidos existentes', category: 'pedidos', enabled: true },
            { id: 'pedidos.delete', name: 'Eliminar Pedidos', description: 'Permite eliminar pedidos', category: 'pedidos', enabled: true },
            { id: 'pedidos.move', name: 'Mover Etapas', description: 'Permite cambiar pedidos entre etapas', category: 'pedidos', enabled: true },
            { id: 'pedidos.duplicate', name: 'Duplicar Pedidos', description: 'Permite duplicar pedidos existentes', category: 'pedidos', enabled: true },
            { id: 'pedidos.export', name: 'Exportar Pedidos', description: 'Permite exportar datos de pedidos', category: 'pedidos', enabled: true },
            { id: 'pedidos.archive', name: 'Archivar Pedidos', description: 'Permite archivar y desarchivar pedidos', category: 'pedidos', enabled: true },
            
            // Usuarios - Solo lectura
            { id: 'usuarios.view', name: 'Ver Usuarios', description: 'Permite ver la lista de usuarios del sistema', category: 'usuarios', enabled: true },
            
            // Reportes - Todos excepto avanzados
            { id: 'reportes.view', name: 'Ver Reportes', description: 'Permite acceder a la sección de reportes', category: 'reportes', enabled: true },
            { id: 'reportes.kpi', name: 'Ver KPIs', description: 'Permite visualizar indicadores clave de rendimiento', category: 'reportes', enabled: true },
            { id: 'reportes.export', name: 'Exportar Reportes', description: 'Permite exportar reportes en diferentes formatos', category: 'reportes', enabled: true },
            
            // Auditoría - Solo lectura
            { id: 'auditoria.view', name: 'Ver Auditoría', description: 'Permite ver logs de actividad del sistema', category: 'auditoria', enabled: true },
            { id: 'auditoria.search', name: 'Búsqueda Avanzada', description: 'Permite realizar búsquedas avanzadas en logs', category: 'auditoria', enabled: true },
            
            // Sistema - Solo estado
            { id: 'sistema.health', name: 'Ver Estado del Sistema', description: 'Permite ver el estado de salud del sistema', category: 'sistema', enabled: true }
        ]
    },
    {
        role: 'Operador',
        permissions: [
            // Pedidos - Solo operaciones básicas
            { id: 'pedidos.view', name: 'Ver Pedidos', description: 'Permite visualizar la lista de pedidos', category: 'pedidos', enabled: true },
            { id: 'pedidos.edit', name: 'Editar Pedidos', description: 'Permite modificar pedidos existentes', category: 'pedidos', enabled: true },
            { id: 'pedidos.move', name: 'Mover Etapas', description: 'Permite cambiar pedidos entre etapas', category: 'pedidos', enabled: true },
            
            // Reportes - Solo vista básica
            { id: 'reportes.view', name: 'Ver Reportes', description: 'Permite acceder a la sección de reportes', category: 'reportes', enabled: true },
            { id: 'reportes.kpi', name: 'Ver KPIs', description: 'Permite visualizar indicadores clave de rendimiento', category: 'reportes', enabled: true }
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
