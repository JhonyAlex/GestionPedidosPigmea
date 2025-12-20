/**
 * Middleware para verificar la salud de la base de datos
 * y autocurar problemas de tablas faltantes
 */

let dbClient = null;
let lastHealthCheck = null;
let healthCheckInterval = 30000; // Verificar cada 30 segundos
let isCheckingHealth = false;

/**
 * Configurar el cliente de base de datos
 * @param {PostgreSQLClient} client - Cliente de PostgreSQL
 */
function setDbClient(client) {
    dbClient = client;
}

/**
 * Middleware que verifica la salud de la BD antes de procesar la petición
 * Solo verifica cada 30 segundos para evitar overhead
 */
async function ensureDatabaseHealth(req, res, next) {
    // Solo verificar si tenemos un cliente de BD
    if (!dbClient || !dbClient.isInitialized) {
        return next();
    }
    
    const now = Date.now();
    
    // Solo verificar si han pasado más de 30 segundos desde la última verificación
    // o si nunca se ha verificado
    if (!lastHealthCheck || (now - lastHealthCheck) > healthCheckInterval) {
        // Evitar múltiples verificaciones simultáneas
        if (!isCheckingHealth) {
            isCheckingHealth = true;
            lastHealthCheck = now;
            
            try {
                // Verificar si las tablas existen y recrearlas si es necesario
                await dbClient.ensureTablesExist();
            } catch (error) {
                console.error('❌ Error en verificación de salud de BD:', error.message);
            } finally {
                isCheckingHealth = false;
            }
        }
    }
    
    next();
}

/**
 * Middleware para rutas que requieren base de datos
 * Falla rápidamente si la BD no está disponible
 */
function requireDatabase(req, res, next) {
    if (!dbClient || !dbClient.isInitialized) {
        return res.status(503).json({
            error: 'Database not available',
            message: 'El sistema de base de datos no está disponible en este momento'
        });
    }
    
    next();
}

module.exports = {
    setDbClient,
    ensureDatabaseHealth,
    requireDatabase
};
