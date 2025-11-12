/**
 * Middleware de autenticación para Express
 * Extrae información del usuario autenticado desde el token o sesión
 */

const jwt = require('jsonwebtoken');

// Cliente de base de datos compartido (se inyecta desde index.js)
let sharedDbClient = null;

/**
 * Configurar el cliente de base de datos compartido
 * Debe llamarse desde index.js después de inicializar el dbClient
 */
const setDbClient = (dbClient) => {
    sharedDbClient = dbClient;
};

/**
 * Obtener el cliente de base de datos
 */
const getDbClient = () => {
    return sharedDbClient;
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
            // 🔴 MODO PRODUCCIÓN: BD ES OBLIGATORIA
            const isProduction = process.env.NODE_ENV === 'production';
            const db = getDbClient();
            
            // En producción, si la BD no está inicializada, fallar inmediatamente
            if (isProduction && db && !db.isInitialized) {
                console.error('   - 🚨 ERROR CRÍTICO: BD no disponible en producción');
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'La base de datos no está disponible. El sistema no puede procesar solicitudes.'
                });
            }
            
            // Verificar que el usuario existe en la base de datos
            try {
                if (db && db.isInitialized) {
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
                        // Usuario no existe en BD - autenticación fallida
                        return res.status(401).json({
                            error: 'Unauthorized',
                            message: 'Usuario no válido'
                        });
                    }
                } else {
                    // Solo en desarrollo: permitir fallback a headers
                    console.log('   - ⚠️ BD no inicializada - MODO DESARROLLO');
                    console.log('   - ⚠️ Usando autenticación de headers (SOLO DESARROLLO)');
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
            } catch (error) {
                console.error('   - ❌ Error validando usuario:', error.message);
                return res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Error al validar usuario'
                });
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
    extractUserFromRequest,
    setDbClient // 🔴 NUEVO: Exportar función para configurar dbClient
};
