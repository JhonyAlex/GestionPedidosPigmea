const jwt = require('jsonwebtoken');
const PostgreSQLClient = require('../../postgres-client');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-admin-key-change-in-production';
const dbClient = new PostgreSQLClient();

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Token de acceso requerido',
                code: 'NO_TOKEN'
            });
        }

        const token = authHeader.substring(7);
        
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({ 
                error: 'Token inválido o expirado',
                code: 'INVALID_TOKEN'
            });
        }

        let user;
        
        // Si no hay BD disponible, usar autenticación hardcodeada
        if (!dbClient.isInitialized || !dbClient.pool) {
            console.log('🔧 Usando verificación de token en modo desarrollo');
            
            // Usuarios hardcodeados para desarrollo
            const devUsers = {
                'admin': {
                    id: 'admin-1',
                    username: 'admin',
                    email: 'admin@pigmea.com',
                    role: 'ADMIN',
                    firstName: 'Administrador',
                    lastName: 'Sistema',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    permissions: [
                        { id: '1', name: 'users.view', description: 'Ver usuarios', module: 'users' },
                        { id: '2', name: 'users.create', description: 'Crear usuarios', module: 'users' },
                        { id: '3', name: 'users.edit', description: 'Editar usuarios', module: 'users' },
                        { id: '4', name: 'users.delete', description: 'Eliminar usuarios', module: 'users' },
                        { id: '5', name: 'system.admin', description: 'Administrador del sistema', module: 'system' }
                    ]
                },
                'supervisor': {
                    id: 'admin-2',
                    username: 'supervisor',
                    email: 'supervisor@pigmea.com',
                    role: 'SUPERVISOR',
                    firstName: 'Supervisor',
                    lastName: 'General',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    permissions: [
                        { id: '1', name: 'users.view', description: 'Ver usuarios', module: 'users' },
                        { id: '3', name: 'users.edit', description: 'Editar usuarios', module: 'users' }
                    ]
                }
            };
            
            user = devUsers[decoded.username];
        } else {
            // Verificar que el usuario existe y está activo en BD
            user = await dbClient.getAdminUserById(decoded.userId);
        }
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        // Verificar si está activo (compatibilidad con BD y modo desarrollo)
        const isActive = user.is_active !== undefined ? user.is_active : user.isActive;
        if (!isActive) {
            return res.status(401).json({ 
                error: 'Usuario desactivado',
                code: 'USER_INACTIVE'
            });
        }

        // Adjuntar información del usuario a la request (formato consistente)
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            firstName: user.firstName || user.first_name,
            lastName: user.lastName || user.last_name,
            isActive: isActive,
            createdAt: user.createdAt || user.created_at,
            updatedAt: user.updatedAt || user.updated_at,
            permissions: user.permissions || []
        };

        // Actualizar última actividad solo si hay BD disponible
        if (dbClient.isInitialized && dbClient.pool) {
            try {
                await dbClient.updateUserLastActivity(user.id, req.ip, req.headers['user-agent']);
            } catch (error) {
                console.log('⚠️ No se pudo actualizar última actividad:', error.message);
            }
        }

        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            code: 'INTERNAL_ERROR'
        });
    }
};

const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado',
                code: 'NOT_AUTHENTICATED'
            });
        }

        // Los administadores tienen todos los permisos
        if (req.user.role === 'ADMIN') {
            return next();
        }

        // Verificar permiso específico
        if (!req.user.permissions.includes(permission)) {
            return res.status(403).json({ 
                error: 'Permisos insuficientes',
                code: 'INSUFFICIENT_PERMISSIONS',
                required: permission
            });
        }

        next();
    };
};

const requireRole = (roles) => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Usuario no autenticado',
                code: 'NOT_AUTHENTICATED'
            });
        }

        if (!roleArray.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Rol insuficiente',
                code: 'INSUFFICIENT_ROLE',
                required: roles,
                current: req.user.role
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    requirePermission,
    requireRole,
    JWT_SECRET
};
