const PostgreSQLClient = require('../../postgres-client');
const dbClient = new PostgreSQLClient();

const auditMiddleware = (action, module) => {
    return async (req, res, next) => {
        // Guardar método original de res.send
        const originalSend = res.send.bind(res);
        
        // Interceptar la respuesta
        res.send = function(data) {
            // Solo auditar respuestas exitosas (200-299)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Ejecutar auditoría de forma asíncrona sin bloquear la respuesta
                setImmediate(async () => {
                    try {
                        let details = `${action} en ${module}`;
                        let affectedResource = null;

                        // Agregar detalles específicos basados en el método HTTP
                        switch (req.method) {
                            case 'POST':
                                if (req.body && req.body.username) {
                                    details += ` - Usuario: ${req.body.username}`;
                                }
                                break;
                            case 'PUT':
                            case 'PATCH':
                                if (req.params.id) {
                                    details += ` - ID: ${req.params.id}`;
                                    affectedResource = req.params.id;
                                }
                                break;
                            case 'DELETE':
                                if (req.params.id) {
                                    details += ` - Eliminado ID: ${req.params.id}`;
                                    affectedResource = req.params.id;
                                }
                                break;
                        }

                        // Agregar información de la query si existe
                        if (req.query && Object.keys(req.query).length > 0) {
                            const queryString = new URLSearchParams(req.query).toString();
                            details += ` - Filtros: ${queryString}`;
                        }

                        await dbClient.createAuditLog({
                            userId: req.user?.id || 'sistema',
                            username: req.user?.username || 'Sistema',
                            action: action,
                            module: module,
                            details: details,
                            ipAddress: req.ip || req.connection.remoteAddress,
                            userAgent: req.headers['user-agent'],
                            affectedResource: affectedResource
                        });
                    } catch (error) {
                        console.error('Error al crear log de auditoría:', error);
                    }
                });
            }
            
            // Llamar al método original
            return originalSend(data);
        };

        next();
    };
};

// Middleware específico para diferentes tipos de acciones
const auditLogin = auditMiddleware('LOGIN', 'AUTH');
const auditLogout = auditMiddleware('LOGOUT', 'AUTH');
const auditCreateUser = auditMiddleware('CREATE_USER', 'USERS');
const auditUpdateUser = auditMiddleware('UPDATE_USER', 'USERS');
const auditDeleteUser = auditMiddleware('DELETE_USER', 'USERS');
const auditViewUsers = auditMiddleware('VIEW_USERS', 'USERS');
const auditSystemConfig = auditMiddleware('UPDATE_CONFIG', 'SYSTEM');
const auditDatabaseBackup = auditMiddleware('CREATE_BACKUP', 'DATABASE');
const auditSystemRestart = auditMiddleware('RESTART_SYSTEM', 'SYSTEM');

module.exports = {
    auditMiddleware,
    auditLogin,
    auditLogout,
    auditCreateUser,
    auditUpdateUser,
    auditDeleteUser,
    auditViewUsers,
    auditSystemConfig,
    auditDatabaseBackup,
    auditSystemRestart
};
