/**
 * Middleware de autenticación para Express
 * Extrae información del usuario autenticado desde el token o sesión
 */

const jwt = require('jsonwebtoken');
const PostgreSQLClient = require('../postgres-client');

// Instancia del cliente de base de datos
let dbClient = null;

// Inicializar el cliente de base de datos de forma lazy
const getDbClient = () => {
    if (!dbClient) {
        dbClient = new PostgreSQLClient();
    }
    return dbClient;
};

/**
 * Middleware para autenticar al usuario
 * Extrae información del usuario desde el header Authorization o desde cookies
 */
const authenticateUser = async (req, res, next) => {
    try {
        // Por ahora, como no hay sistema de JWT implementado,
        // vamos a simular la autenticación extrayendo el usuario desde headers
        
        // En una implementación real, aquí verificarías un JWT token:
        // const token = req.headers.authorization?.replace('Bearer ', '');
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Simulación temporal: extraer usuario desde headers personalizados
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];
        const userPermissions = req.headers['x-user-permissions'];
        
        console.log('🔑 authenticateUser middleware');
        console.log('   - Ruta:', req.method, req.path);
        console.log('   - Headers recibidos:', {
            userId: userId || 'NO PRESENTE',
            userRole: userRole || 'NO PRESENTE',
            hasPermissions: !!userPermissions
        });
        
        if (userId) {
            // Verificar que el usuario existe en la base de datos
            try {
                const db = getDbClient();
                if (db.isInitialized) {
                    console.log('   - Buscando usuario en BD...');
                    const user = await db.getAdminUserById(userId);
                    if (user) {
                        console.log('   - ✅ Usuario encontrado en BD:', user.username);
                        req.user = {
                            id: user.id,
                            username: user.username,
                            role: user.role,
                            email: user.email
                        };
                    } else {
                        console.log('   - ⚠️ Usuario no encontrado en BD');
                    }
                } else {
                    console.log('   - ⚠️ BD no inicializada');
                }
            } catch (error) {
                console.error('   - ❌ Error validando usuario:', error.message);
            }
            
            // Si no se pudo validar desde la BD, usar headers (modo desarrollo)
            if (!req.user && userId) {
                console.log('   - ⚠️ Usando autenticación de headers (modo desarrollo)');
                req.user = {
                    id: userId,
                    role: userRole || 'OPERATOR'
                };
                
                // En modo desarrollo, incluir permisos del frontend si están disponibles
                if (userPermissions) {
                    try {
                        req.user.permissions = JSON.parse(userPermissions);
                        console.log('   - ✅ Permisos incluidos desde header:', req.user.permissions?.length || 0);
                    } catch (error) {
                        console.warn('   - ⚠️ Error parsing user permissions from header:', error.message);
                    }
                }
            }
            
            if (req.user) {
                console.log('   - ✅ Usuario autenticado:', req.user.id, `(${req.user.role})`);
            }
        } else {
            console.log('   - ⚠️ No hay userId en headers - ruta pública o error de autenticación');
        }
        
        next();
    } catch (error) {
        console.error('💥 Error en middleware de autenticación:', error);
        console.error('   Stack:', error.stack);
        next(); // Continuar sin autenticación (algunas rutas no la requieren)
    }
};

/**
 * Middleware que requiere autenticación
 * Debe usarse en rutas que requieren que el usuario esté autenticado
 */
const requireAuth = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            error: 'No autenticado',
            message: 'Debe iniciar sesión para acceder a este recurso'
        });
    }
    next();
};

/**
 * Middleware para extraer información del usuario desde la sesión de login
 * Útil para rutas que reciben datos del usuario directamente
 */
const extractUserFromRequest = (req, res, next) => {
    // Si ya tenemos usuario, continuar
    if (req.user) {
        return next();
    }
    
    // Intentar extraer desde el body de la request (para endpoints de login)
    if (req.body && req.body.userId) {
        req.user = {
            id: req.body.userId,
            role: req.body.userRole || 'OPERATOR'
        };
    }
    
    next();
};

module.exports = {
    authenticateUser,
    requireAuth,
    extractUserFromRequest
};
