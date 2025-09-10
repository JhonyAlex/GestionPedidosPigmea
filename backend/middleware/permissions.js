/**
 * Middleware de permisos para Express
 * Implementa verificación de permisos a niv            // Verificar si el usuario tiene al menos uno de los permisos
            const dbClient = getDbClient();
            for (const permId of permissionIds) {
                const hasPermission = await dbClient.hasPermission(req.user.id, permId);
                if (hasPermission) {
                    // Si tiene al menos un permiso, continuar
                    return next();
                }
            }
            
            // Si no tiene ningún permiso, denegar acceso y registrar
            await dbClient.logAuditEvent({
 */

const PostgreSQLClient = require('../postgres-client');

// Instancia del cliente de base de datos (se inicializa de forma lazy)
let dbClient = null;

// Función para obtener o crear la instancia del cliente de BD
const getDbClient = () => {
    if (!dbClient) {
        dbClient = new PostgreSQLClient();
    }
    return dbClient;
};

/**
 * Middleware que verifica si un usuario tiene un permiso específico
 * @param {string} permissionId - El ID del permiso requerido
 * @returns {Function} Middleware de Express
 */
const requirePermission = (permissionId) => {
    return async (req, res, next) => {
        try {
            // Verificar si el usuario está autenticado
            if (!req.user || !req.user.id) {
                return res.status(401).json({ 
                    error: 'No autenticado',
                    message: 'Debe iniciar sesión para acceder a este recurso'
                });
            }

            // Verificar el permiso del usuario
            const dbClient = getDbClient();
            const hasPermission = await dbClient.hasPermission(req.user.id, permissionId);
            
            if (!hasPermission) {
                // Registrar intento de acceso no autorizado
                await dbClient.logAuditEvent({
                    userId: req.user.id,
                    action: 'PERMISSION_DENIED',
                    module: 'SECURITY',
                    details: `Acceso denegado a recurso protegido: ${permissionId}`,
                    metadata: { 
                        path: req.path,
                        method: req.method,
                        requiredPermission: permissionId
                    }
                });
                
                return res.status(403).json({ 
                    error: 'Acceso denegado',
                    message: 'No tiene los permisos necesarios para esta acción',
                    requiredPermission: permissionId
                });
            }
            
            // Si tiene permiso, continuar
            next();
        } catch (error) {
            console.error('Error en middleware de permisos:', error);
            res.status(500).json({ 
                error: 'Error interno',
                message: 'Error al verificar permisos'
            });
        }
    };
};

/**
 * Middleware que verifica si un usuario tiene alguno de los permisos especificados
 * @param {string[]} permissionIds - Array de IDs de permisos requeridos (OR lógico)
 * @returns {Function} Middleware de Express
 */
const requireAnyPermission = (permissionIds) => {
    return async (req, res, next) => {
        try {
            // Verificar si el usuario está autenticado
            if (!req.user || !req.user.id) {
                return res.status(401).json({ 
                    error: 'No autenticado',
                    message: 'Debe iniciar sesión para acceder a este recurso'
                });
            }

            // Verificar si el usuario tiene al menos uno de los permisos
            const dbClient = getDbClient();
            for (const permId of permissionIds) {
                const hasPermission = await dbClient.hasPermission(req.user.id, permId);
                if (hasPermission) {
                    // Si tiene al menos un permiso, continuar
                    return next();
                }
            }
            
            // Si no tiene ninguno de los permisos, denegar acceso
            await dbClient.logAuditEvent({
                userId: req.user.id,
                action: 'PERMISSION_DENIED',
                module: 'SECURITY',
                details: `Acceso denegado a recurso protegido`,
                metadata: { 
                    path: req.path,
                    method: req.method,
                    requiredPermissions: permissionIds
                }
            });
            
            return res.status(403).json({ 
                error: 'Acceso denegado',
                message: 'No tiene los permisos necesarios para esta acción',
                requiredPermissions: permissionIds
            });
        } catch (error) {
            console.error('Error en middleware de permisos:', error);
            res.status(500).json({ 
                error: 'Error interno',
                message: 'Error al verificar permisos'
            });
        }
    };
};

/**
 * Middleware que verifica si un usuario tiene todos los permisos especificados
 * @param {string[]} permissionIds - Array de IDs de permisos requeridos (AND lógico)
 * @returns {Function} Middleware de Express
 */
const requireAllPermissions = (permissionIds) => {
    return async (req, res, next) => {
        try {
            // Verificar si el usuario está autenticado
            if (!req.user || !req.user.id) {
                return res.status(401).json({ 
                    error: 'No autenticado',
                    message: 'Debe iniciar sesión para acceder a este recurso'
                });
            }

            // Verificar si el usuario tiene todos los permisos
            const dbClient = getDbClient();
            for (const permId of permissionIds) {
                const hasPermission = await dbClient.hasPermission(req.user.id, permId);
                if (!hasPermission) {
                    // Si no tiene alguno de los permisos, denegar acceso
                    await dbClient.logAuditEvent({
                        userId: req.user.id,
                        action: 'PERMISSION_DENIED',
                        module: 'SECURITY',
                        details: `Acceso denegado a recurso protegido: falta ${permId}`,
                        metadata: { 
                            path: req.path,
                            method: req.method,
                            requiredPermissions: permissionIds,
                            missingPermission: permId
                        }
                    });
                    
                    return res.status(403).json({ 
                        error: 'Acceso denegado',
                        message: 'No tiene los permisos necesarios para esta acción',
                        requiredPermissions: permissionIds,
                        missingPermission: permId
                    });
                }
            }
            
            // Si tiene todos los permisos, continuar
            next();
        } catch (error) {
            console.error('Error en middleware de permisos:', error);
            res.status(500).json({ 
                error: 'Error interno',
                message: 'Error al verificar permisos'
            });
        }
    };
};

module.exports = {
    requirePermission,
    requireAnyPermission,
    requireAllPermissions
};
