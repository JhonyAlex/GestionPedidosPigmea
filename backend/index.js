// Cargar variables de entorno
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { v5: uuidv5 } = require('uuid');
const PostgreSQLClient = require('./postgres-client');
const ProduccionOperations = require('./produccion-operations');
const { requirePermission, requireAnyPermission, setDbClient: setPermissionsDbClient } = require('./middleware/permissions');
const { authenticateUser, requireAuth, extractUserFromRequest, setDbClient: setAuthDbClient } = require('./middleware/auth');
const { setDbClient: setDbHealthClient, ensureDatabaseHealth } = require('./middleware/db-health');

// Mapeo de roles entre frontend y base de datos
const ROLE_MAPPING = {
    // Frontend -> Base de datos
    'Administrador': 'ADMIN',
    'Supervisor': 'SUPERVISOR', 
    'Operador': 'OPERATOR',
    'Visualizador': 'VIEWER',
    // Base de datos -> Frontend
    'ADMIN': 'Administrador',
    'SUPERVISOR': 'Supervisor',
    'OPERATOR': 'Operador', 
    'VIEWER': 'Visualizador'
};

// Función para mapear roles
const mapRole = (role, toDatabase = true) => {
    if (toDatabase) {
        return ROLE_MAPPING[role] || 'OPERATOR';
    } else {
        return ROLE_MAPPING[role] || 'Operador';
    }
};

// Inicializar el cliente de PostgreSQL
const dbClient = new PostgreSQLClient();

// Inicializar el módulo de operaciones de producción
const produccionOps = new ProduccionOperations(dbClient);

// --- EXPRESS APP SETUP ---
const app = express();

// Configurar proxy trust para Dokploy
if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://planning.pigmea.click', 'https://www.planning.pigmea.click']
            : [
                "http://localhost:3000", 
                "http://localhost:5173",
                "http://localhost:5174"
            ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
    },
    // Configuración específica para producción con proxy
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Seguridad y middleware
app.use(helmet({
    contentSecurityPolicy: false, // Deshabilitar para desarrollo
    crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting más estricto para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos de login por ventana
    message: {
        error: 'Demasiados intentos de login, intenta de nuevo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting general para rutas admin
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: {
        error: 'Demasiadas solicitudes a las rutas administrativas, intenta de nuevo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://planning.pigmea.click', 'https://www.planning.pigmea.click']
        : [
            "http://localhost:3000", 
            "http://localhost:5173",
            "http://localhost:5174"
        ],
    credentials: true
}));

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// � NUEVO: Middleware de autocuración de base de datos
app.use(ensureDatabaseHealth);

// �🔍 MIDDLEWARE DE LOGGING: Registrar todas las peticiones
let requestCounter = 0;
app.use((req, res, next) => {
    const requestId = ++requestCounter;
    const timestamp = new Date().toISOString();
    const userId = req.headers['x-user-id'] || 'anonymous';
    
    // Solo loguear peticiones a /api (ignorar archivos estáticos)
    if (req.path.startsWith('/api')) {
        console.log(`📨 [${requestId}] ${req.method} ${req.path} - User: ${userId} - ${timestamp}`);
    }
    
    next();
});

// Middleware de autenticación global (extrae usuario si está disponible)
app.use(authenticateUser);

// 🔴 MIDDLEWARE CRÍTICO: Verificar BD en producción (en tiempo real)
app.use(async (req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Rutas excluidas del check (para permitir health checks y diagnósticos)
    const excludedPaths = ['/health', '/api/health'];
    const isExcluded = excludedPaths.some(path => req.path === path);
    
    if (isProduction && !isExcluded) {
        // 🔴 VERIFICACIÓN EN TIEMPO REAL: Comprobar si la BD está saludable
        const isHealthy = await dbClient.isConnectionHealthy();
        
        if (!isHealthy) {
            console.error('🚨 PRODUCCIÓN: Bloqueando request porque BD no está disponible');
            console.error('   - Ruta:', req.method, req.path);
            console.error('   - Timestamp:', new Date().toISOString());
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'El sistema no puede procesar solicitudes porque la base de datos no está disponible. Contacte al administrador.',
                timestamp: new Date().toISOString(),
                retryAfter: 30 // Sugerir reintentar en 30 segundos
            });
        }
    }
    
    next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Verificar salud de la conexión en tiempo real
        const isHealthy = await dbClient.checkHealth();
        
        if (!isHealthy) {
            return res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                database: 'PostgreSQL - DISCONNECTED',
                error: 'Database connection lost'
            });
        }
        
        const stats = await dbClient.getStats();
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'PostgreSQL',
            websocketConnections: io.engine.clientsCount,
            connectedUsers: connectedUsers.size,
            ...stats
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Simple connectivity check for frontend
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// AI Analysis Endpoint - Proxy to OpenRouter
// ============================================================================
app.post('/api/analysis/generate', requireAuth, async (req, res) => {
    try {
        const { weeklyData, machineKeys, dateFilter, selectedStages, detailedPedidos } = req.body;

        if (!weeklyData || !Array.isArray(weeklyData)) {
            return res.status(400).json({ error: 'weeklyData es requerido y debe ser un array' });
        }

        // Obtener instrucciones personalizadas
        let customInstructions = '';
        try {
            const instructionsQuery = `
                SELECT instructions
                FROM analysis_instructions
                ORDER BY id DESC
                LIMIT 1
            `;
            const instructionsResult = await dbClient.pool.query(instructionsQuery);
            if (instructionsResult.rows.length > 0) {
                customInstructions = instructionsResult.rows[0].instructions || '';
            }
        } catch (error) {
            console.warn('No se pudieron obtener instrucciones personalizadas:', error);
        }

        // Preparar resumen de datos para el prompt
        const summary = weeklyData.map(week => ({
            semana: week.label,
            fechas: week.dateRange,
            wm1: week.machines['Windmöller 1'] || 0,
            wm3: week.machines['Windmöller 3'] || 0,
            giave: week.machines['GIAVE'] || 0,
            dnt: week.machines['DNT'] || 0,
            variables: week.machines['VARIABLES'] || 0,
            totalCarga: week.totalLoad,
            libres: week.freeCapacity,
            capacidad: week.totalCapacity
        }));

        const prompt = `Eres un gerente de producción experto analizando datos de planificación de una empresa de impresión flexográfica (PIGMEA).

DATOS ACTUALES:
${JSON.stringify(summary, null, 2)}

CONTEXTO:
- Capacidad base: 180 horas/semana
- Máquinas principales: Windmöller 1 (WM1), Windmöller 3 (WM3)
- Máquinas secundarias: GIAVE
- DNT: Pedidos urgentes de cliente especial
- VARIABLES: Pedidos sin máquina asignada o con datos incompletos (clichés nuevos pendientes)
- LIBRES: Horas disponibles (180 - WM1 - WM3 - DNT)

INSTRUCCIONES:
Genera un análisis gerencial ESTRUCTURADO (máximo 250 palabras) que incluya:

Balance de Carga:
• Identificar máquinas con sobrecarga (>85% capacidad) o baja utilización (<50%)
• Mencionar diferencias significativas entre WM1 y WM3
• Destacar oportunidades de redistribución

Pedidos Variables:
• Cantidad de horas en categoría VARIABLES
• Impacto en la planificación si no se asignan pronto
→ Acción específica requerida

Oportunidades:
• Horas LIBRES disponibles y cómo aprovecharlas
• Sugerencias para adelantar producción o mantenimiento

Recomendaciones:
1. Primera acción prioritaria (específica y medible)
2. Segunda acción importante
3. Tercera acción si aplica

FORMATO:
- Usa bullets (•) para listas
- Usa números (1., 2., 3.) para recomendaciones
- Usa flechas (→) para acciones urgentes
- Usa ⚠️ para advertencias críticas
- Usa ✅ para oportunidades positivas
- NO uses headers markdown (###), solo texto con "Título:" al inicio de secciones
- Sé directo, profesional y accionable

${customInstructions ? `\n⚡ INSTRUCCIONES PERSONALIZADAS (PRIORIDAD MÁXIMA):\n${customInstructions}\n\nAsegúrate de responder ESPECÍFICAMENTE a estas instrucciones personalizadas además del análisis estándar.` : ''}`;

        // Llamar a OpenRouter con el API key seguro
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        
        if (!OPENROUTER_API_KEY) {
            console.error('OPENROUTER_API_KEY no está configurada en las variables de entorno');
            return res.status(500).json({ error: 'Servicio de análisis no configurado' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://planning.pigmea.click',
                'X-Title': 'PIGMEA - Gestión de Pedidos'
            },
            body: JSON.stringify({
                model: 'google/gemini-pro-1.5', // Gemini 1.5 Pro - Más potente y preciso
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 600 // Más tokens para análisis detallado
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API Error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `Error del servicio de IA: ${response.status}` 
            });
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Respuesta inválida de OpenRouter:', data);
            return res.status(500).json({ error: 'Respuesta inválida del servicio de IA' });
        }

        const analysis = data.choices[0].message.content.trim();

        res.json({ 
            analysis,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Error en /api/analysis/generate:', error);
        res.status(500).json({ 
            error: 'Error al generar análisis',
            details: error.message 
        });
    }
});

// ============================================================================
// Custom Analysis Instructions Endpoints
// ============================================================================

// Obtener instrucciones personalizadas
app.get('/api/analysis/instructions', async (req, res) => {
    try {
        const query = `
            SELECT instructions, updated_at, updated_by
            FROM analysis_instructions
            ORDER BY id DESC
            LIMIT 1
        `;
        
        const result = await dbClient.pool.query(query);
        
        if (result.rows.length === 0) {
            return res.json({ 
                instructions: '',
                updatedAt: null,
                updatedBy: null
            });
        }
        
        res.json({
            instructions: result.rows[0].instructions || '',
            updatedAt: result.rows[0].updated_at,
            updatedBy: result.rows[0].updated_by
        });
        
    } catch (error) {
        console.error('Error al obtener instrucciones personalizadas:', error);
        res.status(500).json({ error: 'Error al obtener instrucciones' });
    }
});

// Guardar instrucciones personalizadas
app.post('/api/analysis/instructions', requireAuth, async (req, res) => {
    try {
        const { instructions } = req.body;
        const userId = req.headers['x-user-id'];
        
        if (instructions === undefined) {
            return res.status(400).json({ error: 'instructions es requerido' });
        }
        
        // Insertar nueva versión de instrucciones
        const query = `
            INSERT INTO analysis_instructions (instructions, updated_by)
            VALUES ($1, $2)
            RETURNING id, instructions, updated_at, updated_by
        `;
        
        const result = await dbClient.pool.query(query, [instructions, userId]);
        
        // Emitir evento Socket.IO para sincronizar con otros usuarios
        io.emit('analysis-instructions-updated', {
            instructions: instructions,
            updatedAt: result.rows[0].updated_at,
            updatedBy: userId
        });
        
        res.json({
            success: true,
            instructions: result.rows[0].instructions,
            updatedAt: result.rows[0].updated_at
        });
        
    } catch (error) {
        console.error('Error al guardar instrucciones personalizadas:', error);
        res.status(500).json({ error: 'Error al guardar instrucciones' });
    }
});

// TEMPORAL: Debug endpoint para consultar usuarios
app.get('/api/debug/users', async (req, res) => {
    try {
        if (!dbClient.isInitialized) {
            return res.json({
                message: 'Base de datos no inicializada, usando usuarios hardcodeados',
                users: [
                    { username: 'admin', role: 'Administrador', source: 'hardcoded' },
                    { username: 'user', role: 'Usuario', source: 'hardcoded' }
                ]
            });
        }

        // Consultar usuarios regulares
        const client = await dbClient.pool.connect();
        try {
            // Primero verificar qué columnas existen en la tabla users
            const columnsResult = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND table_schema = 'public'
            `);
            
            const availableColumns = columnsResult.rows.map(row => row.column_name);
            const hasUpdatedAt = availableColumns.includes('updated_at');
            
            // Construir la consulta con las columnas que existen
            const selectColumns = hasUpdatedAt 
                ? 'id, username, role, created_at, updated_at'
                : 'id, username, role, created_at';
                
            const result = await client.query(`
                SELECT ${selectColumns}
                FROM users 
                ORDER BY created_at DESC
            `);
            
            // También consultar usuarios admin si existen
            let adminUsers = [];
            try {
                const adminResult = await client.query(`
                    SELECT ${selectColumns}
                    FROM admin_users 
                    ORDER BY created_at DESC
                `);
                adminUsers = adminResult.rows.map(user => ({...user, user_type: 'admin'}));
            } catch (adminError) {
                console.log('Tabla admin_users no disponible:', adminError.message);
            }

            const regularUsers = result.rows.map(user => ({...user, user_type: 'regular'}));
            const allUsers = [...adminUsers, ...regularUsers];

            res.json({
                timestamp: new Date().toISOString(),
                database_connected: true,
                total_users: allUsers.length,
                admin_users: adminUsers.length,
                regular_users: regularUsers.length,
                users: allUsers
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error consultando usuarios:', error);
        res.status(500).json({
            error: 'Error consultando usuarios',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Reset users endpoint
app.post('/api/reset-users', (req, res) => {
    resetConnectedUsers();
    res.status(200).json({
        message: 'Usuarios conectados reseteados',
        timestamp: new Date().toISOString()
    });
});

// --- WEBSOCKET SETUP ---
let connectedUsers = new Map(); // userId -> { socketId, userRole, joinedAt }

// === SISTEMA DE BLOQUEO DE PEDIDOS ===
let pedidoLocks = new Map(); // pedidoId -> { userId, username, socketId, lockedAt, lastActivity }
let clienteLocks = new Map(); // clienteId -> { userId, username, socketId, lockedAt, lastActivity }
let vendedorLocks = new Map(); // vendedorId -> { userId, username, socketId, lockedAt, lastActivity }
const LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inactividad

// Función para limpiar bloqueos expirados
function cleanupExpiredLocks() {
    const now = Date.now();
    let hasChangesPedidos = false;
    let hasChangesClientes = false;
    let hasChangesVendedores = false;
    
    // Limpiar pedidos
    Array.from(pedidoLocks.entries()).forEach(([pedidoId, lockData]) => {
        const timeSinceActivity = now - lockData.lastActivity;
        
        if (timeSinceActivity > LOCK_TIMEOUT) {
            console.log(`🔓 Auto-desbloqueando pedido ${pedidoId} por inactividad (${Math.round(timeSinceActivity / 60000)} min)`);
            pedidoLocks.delete(pedidoId);
            hasChangesPedidos = true;
            
            io.emit('pedido-unlocked', {
                pedidoId,
                reason: 'timeout',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Limpiar clientes
    Array.from(clienteLocks.entries()).forEach(([clienteId, lockData]) => {
        const timeSinceActivity = now - lockData.lastActivity;
        
        if (timeSinceActivity > LOCK_TIMEOUT) {
            console.log(`🔓 Auto-desbloqueando cliente ${clienteId} por inactividad (${Math.round(timeSinceActivity / 60000)} min)`);
            clienteLocks.delete(clienteId);
            hasChangesClientes = true;
            
            io.emit('cliente-unlocked', {
                clienteId,
                reason: 'timeout',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Limpiar vendedores
    Array.from(vendedorLocks.entries()).forEach(([vendedorId, lockData]) => {
        const timeSinceActivity = now - lockData.lastActivity;
        
        if (timeSinceActivity > LOCK_TIMEOUT) {
            console.log(`🔓 Auto-desbloqueando vendedor ${vendedorId} por inactividad (${Math.round(timeSinceActivity / 60000)} min)`);
            vendedorLocks.delete(vendedorId);
            hasChangesVendedores = true;
            
            io.emit('vendedor-unlocked', {
                vendedorId,
                reason: 'timeout',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    if (hasChangesPedidos) {
        io.emit('locks-updated', {
            locks: Array.from(pedidoLocks.entries()).map(([id, data]) => ({
                pedidoId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    }
    
    if (hasChangesClientes) {
        io.emit('cliente-locks-updated', {
            locks: Array.from(clienteLocks.entries()).map(([id, data]) => ({
                clienteId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    }
    
    if (hasChangesVendedores) {
        io.emit('vendedor-locks-updated', {
            locks: Array.from(vendedorLocks.entries()).map(([id, data]) => ({
                vendedorId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    }
}

// Limpiar bloqueos expirados cada minuto
setInterval(cleanupExpiredLocks, 60000);

// Función para desbloquear todos los recursos de un usuario
function unlockAllPedidosForUser(userId, socketId) {
    const unlockedPedidos = [];
    const unlockedClientes = [];
    const unlockedVendedores = [];
    
    // Desbloquear pedidos
    Array.from(pedidoLocks.entries()).forEach(([pedidoId, lockData]) => {
        if (lockData.userId === userId || lockData.socketId === socketId) {
            pedidoLocks.delete(pedidoId);
            unlockedPedidos.push(pedidoId);
            
            io.emit('pedido-unlocked', {
                pedidoId,
                reason: 'user-disconnect',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Desbloquear clientes
    Array.from(clienteLocks.entries()).forEach(([clienteId, lockData]) => {
        if (lockData.userId === userId || lockData.socketId === socketId) {
            clienteLocks.delete(clienteId);
            unlockedClientes.push(clienteId);
            
            io.emit('cliente-unlocked', {
                clienteId,
                reason: 'user-disconnect',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Desbloquear vendedores
    Array.from(vendedorLocks.entries()).forEach(([vendedorId, lockData]) => {
        if (lockData.userId === userId || lockData.socketId === socketId) {
            vendedorLocks.delete(vendedorId);
            unlockedVendedores.push(vendedorId);
            
            io.emit('vendedor-unlocked', {
                vendedorId,
                reason: 'user-disconnect',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    if (unlockedPedidos.length > 0) {
        console.log(`🔓 Desbloqueados ${unlockedPedidos.length} pedidos del usuario ${userId}`);
        
        io.emit('locks-updated', {
            locks: Array.from(pedidoLocks.entries()).map(([id, data]) => ({
                pedidoId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    }
    
    if (unlockedClientes.length > 0) {
        console.log(`🔓 Desbloqueados ${unlockedClientes.length} clientes del usuario ${userId}`);
        
        io.emit('cliente-locks-updated', {
            locks: Array.from(clienteLocks.entries()).map(([id, data]) => ({
                clienteId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    }
    
    if (unlockedVendedores.length > 0) {
        console.log(`🔓 Desbloqueados ${unlockedVendedores.length} vendedores del usuario ${userId}`);
        
        io.emit('vendedor-locks-updated', {
            locks: Array.from(vendedorLocks.entries()).map(([id, data]) => ({
                vendedorId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    }
}

// Función para limpiar usuarios fantasma periodicamente
function cleanupGhostUsers() {
    const now = Date.now();
    const CLEANUP_INTERVAL = 30000; // 30 segundos
    
    Array.from(connectedUsers.entries()).forEach(([userId, userData]) => {
        const joinedAt = new Date(userData.joinedAt).getTime();
        const timeDiff = now - joinedAt;
        
        // Si el usuario lleva más de 30 segundos y no tiene socket válido
        if (timeDiff > CLEANUP_INTERVAL) {
            const socket = io.sockets.sockets.get(userData.socketId);
            if (!socket || !socket.connected) {
                connectedUsers.delete(userId);
            }
        }
    });
    
    // Emitir lista actualizada
    io.emit('users-list', {
        connectedUsers: Array.from(connectedUsers.entries()).map(([id, data]) => ({
            userId: id,
            userRole: data.userRole,
            joinedAt: data.joinedAt
        }))
    });
}

// Limpiar usuarios fantasma cada 10 segundos
setInterval(cleanupGhostUsers, 10000);

// Versión/buildTime del servidor (estable durante el proceso)
const packageJson = require('../package.json');
const serverVersion = packageJson.version || '1.0.0';
const serverBuildTime = process.env.BUILD_TIME || new Date().toISOString();

// Función para reset completo de usuarios conectados
function resetConnectedUsers() {
    connectedUsers.clear();
    io.emit('users-list', { connectedUsers: [] });
}

io.on('connection', (socket) => {
    // Enviar versión del servidor al conectar
    socket.emit('server-version', {
        version: serverVersion,
        buildTime: serverBuildTime
    });
    
    // Manejar solicitud de versión del cliente
    socket.on('request-version', () => {
        socket.emit('server-version', {
            version: serverVersion,
            buildTime: serverBuildTime
        });
    });
    
    // Manejar autenticación del usuario
    socket.on('authenticate', (userData) => {
        const { userId, userRole, displayName } = userData;
        connectedUsers.set(userId, {
            socketId: socket.id,
            userRole: userRole || 'Operador',
            displayName: displayName || userId, // ✅ Guardar displayName
            joinedAt: new Date().toISOString()
        });
        
        socket.userId = userId;
        socket.userRole = userRole;
        socket.displayName = displayName;
        
        // Notificar a otros usuarios sobre la nueva conexión
        socket.broadcast.emit('user-connected', {
            userId,
            userRole,
            displayName,
            connectedUsers: Array.from(connectedUsers.entries()).map(([id, data]) => ({
                userId: id,
                userRole: data.userRole,
                displayName: data.displayName,
                joinedAt: data.joinedAt
            }))
        });
        
        // Enviar lista de usuarios conectados al usuario que se acaba de conectar
        socket.emit('users-list', {
            connectedUsers: Array.from(connectedUsers.entries()).map(([id, data]) => ({
                userId: id,
                userRole: data.userRole,
                displayName: data.displayName,
                joinedAt: data.joinedAt
            }))
        });
    });
    
    // Manejar desconexión
    socket.on('disconnect', () => {
        if (socket.userId) {
            // Desbloquear todos los pedidos del usuario
            unlockAllPedidosForUser(socket.userId, socket.id);
            
            connectedUsers.delete(socket.userId);
            
            // Notificar a otros usuarios sobre la desconexión
            socket.broadcast.emit('user-disconnected', {
                userId: socket.userId,
                connectedUsers: Array.from(connectedUsers.entries()).map(([id, data]) => ({
                    userId: id,
                    userRole: data.userRole,
                    displayName: data.displayName,
                    joinedAt: data.joinedAt
                }))
            });
        }
    });
    
    // === SISTEMA DE BLOQUEO DE PEDIDOS ===
    
    // Intentar bloquear un pedido
    socket.on('lock-pedido', (data) => {
        const { pedidoId, userId, username } = data;
        
        // Verificar si el pedido ya está bloqueado
        const existingLock = pedidoLocks.get(pedidoId);
        
        if (existingLock) {
            // Si está bloqueado por otro usuario, rechazar
            if (existingLock.userId !== userId) {
                socket.emit('lock-denied', {
                    pedidoId,
                    lockedBy: existingLock.username,
                    lockedAt: existingLock.lockedAt
                });
                return;
            }
            
            // Si está bloqueado por el mismo usuario, actualizar actividad
            existingLock.lastActivity = Date.now();
            existingLock.socketId = socket.id; // Actualizar socketId por si cambió
            socket.emit('lock-acquired', { pedidoId, userId, username });
            return;
        }
        
        // Crear nuevo bloqueo
        const now = Date.now();
        pedidoLocks.set(pedidoId, {
            userId,
            username,
            socketId: socket.id,
            lockedAt: now,
            lastActivity: now
        });
        
        console.log(`🔒 Pedido ${pedidoId} bloqueado por ${username} (${userId})`);
        
        // Confirmar bloqueo al usuario que lo solicitó
        socket.emit('lock-acquired', { pedidoId, userId, username });
        
        // Notificar a todos los demás usuarios que el pedido está bloqueado
        socket.broadcast.emit('pedido-locked', {
            pedidoId,
            userId,
            username,
            lockedAt: now
        });
        
        // Emitir lista actualizada de bloqueos
        io.emit('locks-updated', {
            locks: Array.from(pedidoLocks.entries()).map(([id, data]) => ({
                pedidoId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    });
    
    // Desbloquear un pedido
    socket.on('unlock-pedido', (data) => {
        const { pedidoId, userId } = data;
        
        const existingLock = pedidoLocks.get(pedidoId);
        
        // Solo permitir desbloqueo si es el mismo usuario
        if (existingLock && existingLock.userId === userId) {
            pedidoLocks.delete(pedidoId);
            
            console.log(`🔓 Pedido ${pedidoId} desbloqueado por ${existingLock.username}`);
            
            // Notificar a todos que el pedido se desbloqueó
            io.emit('pedido-unlocked', {
                pedidoId,
                reason: 'user-unlock',
                timestamp: new Date().toISOString()
            });
            
            // Emitir lista actualizada de bloqueos
            io.emit('locks-updated', {
                locks: Array.from(pedidoLocks.entries()).map(([id, data]) => ({
                    pedidoId: id,
                    userId: data.userId,
                    username: data.username,
                    lockedAt: data.lockedAt
                }))
            });
        }
    });
    
    // Actualizar actividad en un pedido bloqueado (keep-alive)
    socket.on('pedido-activity', (data) => {
        const { pedidoId, userId } = data;
        
        const existingLock = pedidoLocks.get(pedidoId);
        
        // Solo actualizar si el pedido está bloqueado por este usuario
        if (existingLock && existingLock.userId === userId) {
            existingLock.lastActivity = Date.now();
            existingLock.socketId = socket.id;
        }
    });
    
    // Solicitar lista actual de bloqueos
    socket.on('get-locks', () => {
        socket.emit('locks-updated', {
            locks: Array.from(pedidoLocks.entries()).map(([id, data]) => ({
                pedidoId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    });
    
    // === SISTEMA DE BLOQUEO DE CLIENTES ===
    
    socket.on('lock-cliente', (data) => {
        const { clienteId, userId, username } = data;
        const existingLock = clienteLocks.get(clienteId);
        
        if (existingLock) {
            if (existingLock.userId !== userId) {
                socket.emit('cliente-lock-denied', {
                    clienteId,
                    lockedBy: existingLock.username,
                    lockedAt: existingLock.lockedAt
                });
                return;
            }
            existingLock.lastActivity = Date.now();
            existingLock.socketId = socket.id;
            socket.emit('cliente-lock-acquired', { clienteId, userId, username });
            return;
        }
        
        const now = Date.now();
        clienteLocks.set(clienteId, {
            userId,
            username,
            socketId: socket.id,
            lockedAt: now,
            lastActivity: now
        });
        
        console.log(`🔒 Cliente ${clienteId} bloqueado por ${username} (${userId})`);
        socket.emit('cliente-lock-acquired', { clienteId, userId, username });
        socket.broadcast.emit('cliente-locked', { clienteId, userId, username, lockedAt: now });
        
        io.emit('cliente-locks-updated', {
            locks: Array.from(clienteLocks.entries()).map(([id, data]) => ({
                clienteId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    });
    
    socket.on('unlock-cliente', (data) => {
        const { clienteId, userId } = data;
        const existingLock = clienteLocks.get(clienteId);
        
        if (existingLock && existingLock.userId === userId) {
            clienteLocks.delete(clienteId);
            console.log(`🔓 Cliente ${clienteId} desbloqueado por ${existingLock.username}`);
            
            io.emit('cliente-unlocked', {
                clienteId,
                reason: 'user-unlock',
                timestamp: new Date().toISOString()
            });
            
            io.emit('cliente-locks-updated', {
                locks: Array.from(clienteLocks.entries()).map(([id, data]) => ({
                    clienteId: id,
                    userId: data.userId,
                    username: data.username,
                    lockedAt: data.lockedAt
                }))
            });
        }
    });
    
    socket.on('cliente-activity', (data) => {
        const { clienteId, userId } = data;
        const existingLock = clienteLocks.get(clienteId);
        
        if (existingLock && existingLock.userId === userId) {
            existingLock.lastActivity = Date.now();
            existingLock.socketId = socket.id;
        }
    });
    
    socket.on('get-cliente-locks', () => {
        socket.emit('cliente-locks-updated', {
            locks: Array.from(clienteLocks.entries()).map(([id, data]) => ({
                clienteId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    });
    
    // === SISTEMA DE BLOQUEO DE VENDEDORES ===
    
    socket.on('lock-vendedor', (data) => {
        const { vendedorId, userId, username } = data;
        const existingLock = vendedorLocks.get(vendedorId);
        
        if (existingLock) {
            if (existingLock.userId !== userId) {
                socket.emit('vendedor-lock-denied', {
                    vendedorId,
                    lockedBy: existingLock.username,
                    lockedAt: existingLock.lockedAt
                });
                return;
            }
            existingLock.lastActivity = Date.now();
            existingLock.socketId = socket.id;
            socket.emit('vendedor-lock-acquired', { vendedorId, userId, username });
            return;
        }
        
        const now = Date.now();
        vendedorLocks.set(vendedorId, {
            userId,
            username,
            socketId: socket.id,
            lockedAt: now,
            lastActivity: now
        });
        
        console.log(`🔒 Vendedor ${vendedorId} bloqueado por ${username} (${userId})`);
        socket.emit('vendedor-lock-acquired', { vendedorId, userId, username });
        socket.broadcast.emit('vendedor-locked', { vendedorId, userId, username, lockedAt: now });
        
        io.emit('vendedor-locks-updated', {
            locks: Array.from(vendedorLocks.entries()).map(([id, data]) => ({
                vendedorId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    });
    
    socket.on('unlock-vendedor', (data) => {
        const { vendedorId, userId } = data;
        const existingLock = vendedorLocks.get(vendedorId);
        
        if (existingLock && existingLock.userId === userId) {
            vendedorLocks.delete(vendedorId);
            console.log(`🔓 Vendedor ${vendedorId} desbloqueado por ${existingLock.username}`);
            
            io.emit('vendedor-unlocked', {
                vendedorId,
                reason: 'user-unlock',
                timestamp: new Date().toISOString()
            });
            
            io.emit('vendedor-locks-updated', {
                locks: Array.from(vendedorLocks.entries()).map(([id, data]) => ({
                    vendedorId: id,
                    userId: data.userId,
                    username: data.username,
                    lockedAt: data.lockedAt
                }))
            });
        }
    });
    
    socket.on('vendedor-activity', (data) => {
        const { vendedorId, userId } = data;
        const existingLock = vendedorLocks.get(vendedorId);
        
        if (existingLock && existingLock.userId === userId) {
            existingLock.lastActivity = Date.now();
            existingLock.socketId = socket.id;
        }
    });
    
    socket.on('get-vendedor-locks', () => {
        socket.emit('vendedor-locks-updated', {
            locks: Array.from(vendedorLocks.entries()).map(([id, data]) => ({
                vendedorId: id,
                userId: data.userId,
                username: data.username,
                lockedAt: data.lockedAt
            }))
        });
    });
    
    // Manejar eventos de presencia (usuario está escribiendo, viendo, etc.)
    socket.on('user-activity', (activityData) => {
        socket.broadcast.emit('user-activity-received', {
            userId: socket.userId,
            userRole: socket.userRole,
            ...activityData
        });
    });
});

// Función para emitir eventos a todos los clientes conectados
function broadcastToClients(event, data) {
    io.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
        serverTime: Date.now()
    });
}

// === FUNCIONES AUXILIARES PARA NOTIFICACIONES ===

/**
 * Detectar cambios significativos entre dos pedidos
 * @param {Object} previousPedido - Pedido anterior
 * @param {Object} updatedPedido - Pedido actualizado
 * @returns {Array} - Array de strings describiendo los cambios
 */
function detectChanges(previousPedido, updatedPedido) {
    const changes = [];
    
    if (!previousPedido) return changes;
    
    // Cambios en etapa
    if (previousPedido.etapaActual !== updatedPedido.etapaActual) {
        changes.push(`Etapa: ${previousPedido.etapaActual} → ${updatedPedido.etapaActual}`);
    }
    
    // Cambios en prioridad
    if (previousPedido.prioridad !== updatedPedido.prioridad) {
        changes.push(`Prioridad: ${previousPedido.prioridad} → ${updatedPedido.prioridad}`);
    }
    
    // Cambios en cliente
    if (previousPedido.cliente !== updatedPedido.cliente) {
        changes.push(`Cliente: ${previousPedido.cliente} → ${updatedPedido.cliente}`);
    }
    
    // Cambios en fechas
    if (previousPedido.nuevaFechaEntrega !== updatedPedido.nuevaFechaEntrega) {
        changes.push(`Nueva Fecha Entrega: ${previousPedido.nuevaFechaEntrega || 'Sin fecha'} → ${updatedPedido.nuevaFechaEntrega || 'Sin fecha'}`);
    }
    
    if (previousPedido.fechaProduccion !== updatedPedido.fechaProduccion) {
        changes.push(`Fecha Producción: ${previousPedido.fechaProduccion || 'Sin fecha'} → ${updatedPedido.fechaProduccion || 'Sin fecha'}`);
    }
    
    // Cambios en estado de preparación
    if (previousPedido.materialDisponible !== updatedPedido.materialDisponible) {
        changes.push(`Material Disponible: ${previousPedido.materialDisponible ? 'Sí' : 'No'} → ${updatedPedido.materialDisponible ? 'Sí' : 'No'}`);
    }
    
    if (previousPedido.clicheDisponible !== updatedPedido.clicheDisponible) {
        changes.push(`Cliché Disponible: ${previousPedido.clicheDisponible ? 'Sí' : 'No'} → ${updatedPedido.clicheDisponible ? 'Sí' : 'No'}`);
    }
    
    if (previousPedido.subEtapaActual !== updatedPedido.subEtapaActual) {
        changes.push(`Sub-Etapa: ${previousPedido.subEtapaActual || 'Ninguna'} → ${updatedPedido.subEtapaActual || 'Ninguna'}`);
    }
    
    // Cambios en post-impresión
    if (previousPedido.antivaho !== updatedPedido.antivaho) {
        changes.push(`Antivaho: ${previousPedido.antivaho ? 'Sí' : 'No'} → ${updatedPedido.antivaho ? 'Sí' : 'No'}`);
    }
    
    if (previousPedido.antivahoRealizado !== updatedPedido.antivahoRealizado) {
        changes.push(`Antivaho Realizado: ${previousPedido.antivahoRealizado ? 'Sí' : 'No'} → ${updatedPedido.antivahoRealizado ? 'Sí' : 'No'}`);
    }
    
    // Cambios en números de compra (detectar si cambió el array)
    const prevNumerosCompra = (previousPedido.numerosCompra || []).filter(n => n && n.trim()).join(', ');
    const newNumerosCompra = (updatedPedido.numerosCompra || []).filter(n => n && n.trim()).join(', ');
    if (prevNumerosCompra !== newNumerosCompra) {
        changes.push(`Números de Compra: ${prevNumerosCompra || 'Ninguno'} → ${newNumerosCompra || 'Ninguno'}`);
    }
    
    // Cambios en velocidad posible
    if (previousPedido.velocidadPosible !== updatedPedido.velocidadPosible) {
        changes.push(`Velocidad Posible: ${previousPedido.velocidadPosible || 'Sin definir'} → ${updatedPedido.velocidadPosible || 'Sin definir'} m/min`);
    }
    
    // Cambios en horas confirmadas
    if (previousPedido.horasConfirmadas !== updatedPedido.horasConfirmadas) {
        changes.push(`Horas Confirmadas: ${previousPedido.horasConfirmadas ? 'Sí' : 'No'} → ${updatedPedido.horasConfirmadas ? 'Sí' : 'No'}`);
    }
    
    return changes;
}

/**
 * Crear y persistir una notificación en la base de datos
 * @param {string} type - Tipo de notificación: success, info, warning, error
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje descriptivo
 * @param {Object} options - Opciones adicionales
 * @param {string} [options.pedidoId] - ID del pedido relacionado
 * @param {Object} [options.metadata] - Metadata adicional
 * @param {string} [options.userId] - ID del usuario destinatario (null = global)
 * @returns {Promise<Object>} - Notificación creada
 */
async function createAndBroadcastNotification(type, title, message, options = {}) {
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const notification = {
        id: notificationId,
        type,
        title,
        message,
        timestamp,
        pedidoId: options.pedidoId || null,
        metadata: options.metadata || null,
        userId: options.userId || null
    };
    
    // Intentar guardar en base de datos
    if (dbClient.isInitialized) {
        try {
            await dbClient.createNotification(notification);
            console.log(`✅ Notificación guardada en BD: ${notificationId}`);
        } catch (error) {
            console.error(`❌ Error al guardar notificación en BD:`, error);
            // Continuar aunque falle la BD (la notificación se enviará por WebSocket)
        }
    }
    
    // Emitir notificación por WebSocket a todos los clientes
    broadcastToClients('notification', notification);
    
    return notification;
}

// --- API ROUTES ---

// === RUTAS DE AUTENTICACIÓN ===

// POST /api/auth/login - Autenticar usuario
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Usuario y contraseña son requeridos',
                errorCode: 'MISSING_CREDENTIALS'
            });
        }

        // Si tenemos base de datos inicializada, usarla
        if (dbClient.isInitialized) {
            
            // Primero buscar en admin_users
            let user = await dbClient.getAdminUserByUsername(username);
            let isAdminUser = true;
            
            if (!user) {
                // Si no se encuentra en admin_users, buscar en users regulares
                user = await dbClient.findUserByUsername(username);
                isAdminUser = false;
            }
            
            if (!user) {
                return res.status(401).json({ 
                    error: 'Usuario no encontrado',
                    errorCode: 'USER_NOT_FOUND'
                });
            }

            // Verificación de contraseña según el tipo de usuario
            let isValidPassword = false;
            
            if (isAdminUser && user.password_hash) {
                // Usuarios admin: usar bcrypt
                isValidPassword = await bcrypt.compare(password, user.password_hash);
            } else if (!isAdminUser && user.password) {
                // Usuarios regulares: comparación directa
                isValidPassword = (user.password === password);
            }

            if (!isValidPassword) {
                return res.status(401).json({ 
                    error: 'Contraseña incorrecta',
                    errorCode: 'INVALID_PASSWORD'
                });
            }

            // Actualizar último login según el tipo de usuario
            if (isAdminUser) {
                // Para usuarios admin, usar la función que actualiza admin_users
                await dbClient.updateUserLastLogin(user.id, req.ip, req.get('User-Agent'));
            } else {
                // Para usuarios regulares, actualizar la tabla users por username
                const client = await dbClient.pool.connect();
                try {
                    await client.query(
                        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                        [user.id]
                    );
                } finally {
                    client.release();
                }
            }

            // Devolver datos del usuario (sin contraseña)
            const userData = {
                id: user.id.toString(), // Convertir a string para frontend
                username: user.username,
                role: isAdminUser ? mapRole(user.role, false) : user.role, // Mapear solo usuarios admin
                displayName: user.display_name || user.username
            };

            // ✅ Emitir evento WebSocket para notificar actualización de último login
            io.emit('user-login-updated', {
                userId: user.id,
                username: user.username,
                lastLogin: new Date().toISOString()
            });

            console.log(`✅ Login BD exitoso: ${username} (${user.role})`);
            
            res.status(200).json({
                success: true,
                user: userData,
                message: 'Login exitoso'
            });
            return;
        }

        // 🔴 Si llegamos aquí, la BD no está disponible - SIEMPRE rechazar
        console.error('🚨 BD no disponible - rechazando login');
        return res.status(503).json({ 
            error: 'Service Unavailable',
            errorCode: 'DATABASE_UNAVAILABLE',
            message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
        });

    } catch (error) {
        console.error('💥 Error en login:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            errorCode: 'INTERNAL_SERVER_ERROR',
            details: error.message
        });
    }
});

// POST /api/auth/register - Registrar nuevo usuario
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, role = 'Operador', displayName } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Usuario y contraseña son requeridos' 
            });
        }

        if (username.length < 3) {
            return res.status(400).json({ 
                error: 'El usuario debe tener al menos 3 caracteres' 
            });
        }

        if (password.length < 3) {
            return res.status(400).json({ 
                error: 'La contraseña debe tener al menos 3 caracteres' 
            });
        }

        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando registro');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        // Usar base de datos
        // Verificar si el usuario ya existe
        const existingAdmin = await dbClient.getAdminUserByUsername(username);
        
        if (existingAdmin) {
            return res.status(409).json({ 
                error: 'El nombre de usuario ya existe' 
            });
        }

        // Hashear la contraseña
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Crear nuevo usuario admin
        const names = (displayName || username).split(' ');
        const firstName = names[0] || username;
        const lastName = names.slice(1).join(' ') || '';
        
        const newUser = {
            username: username.trim(),
            email: `${username.trim()}@pigmea.local`, // Email temporal si no se proporciona
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            passwordHash: passwordHash,
            role: mapRole(role, true), // Convertir a formato de BD
            isActive: true
        };

        const createdUser = await dbClient.createAdminUser(newUser);

        // Devolver datos del usuario (sin contraseña)
        const userData = {
            id: createdUser.id,
            username: createdUser.username,
            role: mapRole(createdUser.role, false), // Convertir de vuelta a formato frontend
            displayName: `${createdUser.first_name} ${createdUser.last_name}`.trim(),
            email: createdUser.email,
            isActive: createdUser.is_active
        };

        console.log(`✅ Usuario registrado: ${username} (${role})`);

        res.status(201).json({
            success: true,
            user: userData,
            message: 'Usuario creado exitosamente'
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            error: error.message || 'Error interno del servidor' 
        });
    }
});

// GET /api/auth/users - Obtener lista de usuarios (solo para administradores)
app.get('/api/auth/users', async (req, res) => {
    try {
        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando consulta de usuarios');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        const users = await dbClient.getAllAdminUsers();
        
        // Transformar los nombres de campos de snake_case a camelCase
        const transformedUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            role: mapRole(user.role, false), // Convertir rol a formato frontend
            displayName: (user.first_name + ' ' + user.last_name).trim() || user.username,
            email: user.email,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            isActive: user.is_active
        }));
        
        res.status(200).json({
            success: true,
            users: transformedUsers
        });

    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor' 
        });
    }
});

// GET /api/users/active - Obtener usuarios activos para menciones (requiere autenticación)
app.get('/api/users/active', requireAuth, async (req, res) => {
    try {
        // Verificar que la BD está disponible
        if (!dbClient.isInitialized || !dbClient.pool) {
            console.error('🚨 BD no disponible - rechazando consulta de usuarios activos');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        // Obtener solo usuarios activos de admin_users
        const result = await dbClient.pool.query(`
            SELECT 
                id,
                username
            FROM admin_users 
            WHERE is_active = true
            ORDER BY username ASC
        `);

        // Formato simplificado para el autocomplete de menciones
        const activeUsers = result.rows.map(user => ({
            id: user.id,
            username: user.username
        }));

        res.status(200).json({
            success: true,
            users: activeUsers
        });

    } catch (error) {
        console.error('Error obteniendo usuarios activos:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor' 
        });
    }
});

// PUT /api/auth/users/:id - Actualizar usuario
app.put('/api/auth/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, role, displayName, password } = req.body;

        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando actualización de usuario');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        // Verificar si el usuario existe
        const existingUser = await dbClient.getAdminUserById(id);
        if (!existingUser) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Verificar si el nuevo username ya existe (si se está cambiando)
        if (username && username !== existingUser.username) {
            const usernameExists = await dbClient.getAdminUserByUsername(username);
            if (usernameExists) {
                return res.status(409).json({
                    error: 'El nombre de usuario ya existe'
                });
            }
        }

        // Preparar datos de actualización para admin_users
        const updateData = {};
        if (username) updateData.username = username.trim();
        if (role) updateData.role = mapRole(role, true); // Convertir a formato BD
        if (displayName) updateData.displayName = displayName.trim();
        
        // Si se proporciona una nueva contraseña, hashearla
        if (password && password.trim()) {
            const saltRounds = 12;
            updateData.passwordHash = await bcrypt.hash(password.trim(), saltRounds);
        }

        // Usar updateAdminUser en lugar de updateUser
        const updatedUser = await dbClient.updateAdminUser(id, updateData);

        res.json({
            success: true,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                role: mapRole(updatedUser.role, false), // Convertir de vuelta a formato frontend
                displayName: updatedUser.first_name + ' ' + updatedUser.last_name,
                createdAt: updatedUser.created_at
            },
            message: 'Usuario actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({
            error: error.message || 'Error interno del servidor'
        });
    }
});

// DELETE /api/auth/users/:id - Eliminar usuario
app.delete('/api/auth/users/:id', requirePermission('usuarios.admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando eliminación de usuario');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        // Verificar si el usuario existe
        const existingUser = await dbClient.getAdminUserById(id);
        if (!existingUser) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        await dbClient.deleteAdminUser(id);

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({
            error: error.message || 'Error interno del servidor'
        });
    }
});

// GET /api/auth/permissions - Obtener configuración de permisos
app.get('/api/auth/permissions', async (req, res) => {
    try {
        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando consulta de permisos');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }
        
        // Obtener categorías de permisos de constants/permissions.ts
        // pero con los datos actualizados de la BD
        const allPermissions = await dbClient.getAllSystemPermissions();
        
        res.json({
            success: true,
            permissions: allPermissions
        });
    } catch (error) {
        console.error('Error obteniendo permisos:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// PUT /api/auth/users/:id/password - Cambiar contraseña de usuario
app.put('/api/auth/users/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 3) {
            return res.status(400).json({
                error: 'La nueva contraseña debe tener al menos 3 caracteres'
            });
        }

        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando cambio de contraseña');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        // Verificar si el usuario existe
        const existingUser = await dbClient.getAdminUserById(id);
        if (!existingUser) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual si se proporciona (opcional para administradores)
        if (currentPassword) {
            const isValidCurrentPassword = await bcrypt.compare(currentPassword, existingUser.password_hash);
            if (!isValidCurrentPassword) {
                return res.status(400).json({
                    error: 'La contraseña actual es incorrecta'
                });
            }
        }

        // Hashear la nueva contraseña
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar la contraseña
        await dbClient.updateUserPassword(id, passwordHash);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            error: error.message || 'Error interno del servidor'
        });
    }
});

// PUT /api/auth/admin/users/:id/password - Cambiar contraseña de usuario (administradores)
app.put('/api/auth/admin/users/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 3) {
            return res.status(400).json({
                error: 'La nueva contraseña debe tener al menos 3 caracteres'
            });
        }

        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando cambio de contraseña administrativo');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        // Verificar si el usuario existe
        const existingUser = await dbClient.getAdminUserById(id);
        if (!existingUser) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Hashear la nueva contraseña
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar la contraseña sin verificar la actual
        await dbClient.updateUserPassword(id, passwordHash);

        console.log(`✅ Contraseña actualizada administrativamente para usuario: ${existingUser.username}`);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            error: error.message || 'Error interno del servidor'
        });
    }
});

// PUT /api/auth/users/:id/permissions - Actualizar permisos de usuario
app.put('/api/auth/users/:id/permissions', requirePermission('permisos.admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;
        
        // Validar que el usuario exista
        const userExists = await dbClient.getAdminUserById(id);
        if (!userExists) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }
        
        // Obtener información del usuario que realiza la acción
        const grantedBy = req.user ? req.user.id : null;
        
        if (!grantedBy) {
            return res.status(401).json({
                error: 'No autenticado',
                message: 'Debe iniciar sesión para modificar permisos'
            });
        }

        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando actualización de permisos');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        // Formatear permisos para guardar en BD
        const formattedPermissions = permissions.map(perm => ({
            permissionId: perm.id,
            enabled: perm.enabled === true
        }));

        // Guardar permisos en la base de datos
        await dbClient.saveUserPermissions(id, grantedBy, formattedPermissions);
        
        // Registrar en log de auditoría
        await dbClient.logAuditEvent({
            userId: grantedBy,
            action: 'UPDATE_USER_PERMISSIONS',
            module: 'SECURITY',
            details: `Actualización de permisos para usuario ${id}`,
            metadata: { userId: id, permissions: formattedPermissions }
        });

        res.json({
            success: true,
            message: 'Permisos de usuario actualizados exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando permisos de usuario:', error);
        res.status(500).json({
            error: error.message || 'Error interno del servidor'
        });
    }
});

// GET /api/auth/users/:id/permissions - Obtener permisos de un usuario específico
app.get('/api/auth/users/:id/permissions', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el usuario exista
        const userExists = await dbClient.getAdminUserById(id);
        if (!userExists) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }
        
        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando consulta de permisos de usuario');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }
        
        // Obtener permisos del usuario desde la base de datos
        const permissions = await dbClient.getUserPermissions(id);
        
        // Formatear para la respuesta
        const formattedPermissions = permissions.map(perm => ({
            id: perm.permission_id,
            enabled: perm.enabled
        }));
        
        res.json({
            success: true,
            permissions: formattedPermissions
        });
        
    } catch (error) {
        console.error('Error obteniendo permisos de usuario:', error);
        res.status(500).json({
            error: error.message || 'Error interno del servidor'
        });
    }
});

// POST /api/auth/users/:id/permissions/sync - Sincronizar permisos entre frontend y backend
app.post('/api/auth/users/:id/permissions/sync', async (req, res) => {
    try {
        const { id } = req.params;
        const { localPermissions } = req.body;
        
        console.log(`🔄 Sincronizando permisos para usuario ID: ${id}`);
        console.log(`📋 Permisos locales recibidos:`, localPermissions?.length || 0, 'permisos');
        
        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando sincronización de permisos');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }
        
        // Verificar que el usuario existe antes de obtener permisos
        let userExists = await dbClient.getAdminUserById(id);
        
        // Si no se encuentra con el ID directo, intentar buscar en la tabla legacy users
        if (!userExists) {
            console.log(`🔍 Usuario no encontrado en admin_users, buscando en tabla legacy...`);
            userExists = await dbClient.findLegacyUserById(id);
        }
        
        if (!userExists) {
            console.log(`❌ Usuario con ID ${id} no encontrado en ninguna tabla`);
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }
        
        console.log(`✅ Usuario encontrado: ${userExists.username}${userExists.isLegacy ? ' (legacy)' : ''}`);
        
        // Obtener permisos del usuario desde la base de datos
        // Para usuarios legacy, puede que no tengan permisos en la nueva tabla
        let dbPermissions = [];
        try {
            dbPermissions = await dbClient.getUserPermissions(id);
        } catch (permError) {
            console.log(`⚠️ Error obteniendo permisos (puede ser normal para usuarios legacy):`, permError.message);
            dbPermissions = []; // Usuario sin permisos configurados
        }
        console.log(`📋 Permisos en BD:`, dbPermissions?.length || 0, 'permisos');
        
        // Formatear permisos de la base de datos
        const formattedDbPermissions = dbPermissions.map(perm => ({
            id: perm.permission_id,
            enabled: perm.enabled
        }));
        
        // Si es un usuario sin permisos (tanto legacy como admin_users), darle permisos por defecto según su rol
        if (formattedDbPermissions.length === 0) {
            console.log(`🔧 Usuario sin permisos configurados, asignando permisos por defecto según rol: ${userExists.role}`);
            
            // Mapear rol de BD a rol del sistema de permisos
            let permissionRole = userExists.role;
            if (userExists.role === 'Administrador') permissionRole = 'ADMIN';
            else if (userExists.role === 'Supervisor') permissionRole = 'SUPERVISOR';
            else if (userExists.role === 'Operador') permissionRole = 'OPERATOR';
            else if (userExists.role === 'Visualizador') permissionRole = 'VIEWER';
            
            console.log(`🔧 Rol mapeado: ${userExists.role} → ${permissionRole}`);
            
            // Obtener permisos predeterminados según el rol
            const defaultPermissions = dbClient.getDefaultPermissionsForRole(permissionRole);
            
            // Convertir formato para respuesta
            const defaultPermissionsFormatted = defaultPermissions.map(perm => ({
                id: perm.permissionId,
                enabled: perm.enabled
            }));
            
            console.log(`📋 Permisos por defecto asignados:`, defaultPermissionsFormatted.length, 'permisos');
            
            // Intentar guardar permisos en BD para la próxima vez (solo si es UUID válido)
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
            if (isValidUUID) {
                try {
                    await dbClient.saveUserPermissions(id, id, defaultPermissions);
                    console.log(`✅ Permisos guardados en BD para usuario UUID: ${id}`);
                } catch (saveError) {
                    console.log(`⚠️ No se pudieron guardar permisos en BD:`, saveError.message);
                }
            } else {
                console.log(`⚠️ No se guardan permisos en BD para usuario con ID no-UUID: ${id}`);
            }
            
            // Responder con permisos por defecto
            return res.json({
                success: true,
                permissions: defaultPermissionsFormatted,
                synced: false,
                message: `Se han asignado permisos por defecto para usuario con rol ${permissionRole}`
            });
        }
        
        // Verificar si hay diferencias
        const localSorted = JSON.stringify((localPermissions || []).sort((a, b) => a.id?.localeCompare(b.id || '') || 0));
        const dbSorted = JSON.stringify(formattedDbPermissions.sort((a, b) => a.id?.localeCompare(b.id || '') || 0));
        const needsSync = localSorted !== dbSorted;
        
        console.log(`🔍 ¿Necesita sincronización?`, needsSync);
        
        if (needsSync) {
            // Si hay diferencias, la base de datos tiene prioridad
            res.json({
                success: true,
                permissions: formattedDbPermissions,
                synced: false,
                message: 'Se han sincronizado los permisos desde el servidor'
            });
        } else {
            // Si no hay diferencias, todo está sincronizado
            res.json({
                success: true,
                permissions: formattedDbPermissions,
                synced: true
            });
        }
        
    } catch (error) {
        console.error('❌ Error sincronizando permisos:', error);
        console.error('📋 Stack trace:', error.stack);
        res.status(500).json({
            error: error.message || 'Error interno del servidor'
        });
    }
});

// GET /api/permissions - Obtener lista de permisos disponibles
app.get('/api/permissions', async (req, res) => {
    try {
        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando consulta de permisos');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }
        
        // Obtener permisos desde la base de datos
        const permissions = await dbClient.getAllPermissions();
        
        return res.json({
            success: true,
            permissions
        });

        res.json({
            success: true,
            permissions
        });
    } catch (error) {
        console.error('Error obteniendo permisos:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// POST /api/admin/trigger-update - Disparar evento de actualización a todos los clientes
app.post('/api/admin/trigger-update', requirePermission('usuarios.admin'), async (req, res) => {
    try {
        console.log('🚀 Disparando evento de actualización a todos los clientes...');
        
        const packageJson = require('../package.json');
        const serverVersion = packageJson.version || '1.0.0';
        const buildTime = process.env.BUILD_TIME || new Date().toISOString();
        
        // Emitir evento a todos los clientes conectados
        io.emit('app-updated', {
            version: serverVersion,
            buildTime: buildTime
        });
        
        console.log(`✅ Evento app-updated emitido a ${io.engine.clientsCount} clientes`);
        
        res.json({
            success: true,
            message: 'Evento de actualización enviado',
            clientsNotified: io.engine.clientsCount,
            version: serverVersion,
            buildTime: buildTime
        });
    } catch (error) {
        console.error('❌ Error al disparar actualización:', error);
        res.status(500).json({
            success: false,
            error: 'Error al disparar actualización'
        });
    }
});

// === RUTAS DE AUDITORÍA ===

// GET /api/audit - Get audit log
app.get('/api/audit', async (req, res) => {
    try {
        if (!dbClient.pool) {
            return res.status(200).json([]); // Retornar array vacío si no hay BD
        }
        const limit = parseInt(req.query.limit) || 100;
        const auditLog = await dbClient.getAuditLog(limit);
        res.status(200).json(auditLog);
    } catch (error) {
        console.error('Error obteniendo log de auditoría:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor' 
        });
    }
});

// POST /api/audit - Add audit entry
app.post('/api/audit', async (req, res) => {
    try {
        if (!dbClient.pool) {
            return res.status(200).json({ message: 'Auditoría omitida - sin BD' }); // Respuesta silenciosa
        }
        const { userRole, action, pedidoId, details } = req.body;
        
        if (!userRole || !action) {
            return res.status(400).json({ 
                error: 'userRole y action son requeridos' 
            });
        }

        const auditEntry = await dbClient.logAuditAction(userRole, action, pedidoId, details);
        res.status(201).json(auditEntry);
    } catch (error) {
        console.error('Error creando entrada de auditoría:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor' 
        });
    }
});

// === RUTAS DE PEDIDOS ===

// GET /api/pedidos - Get all pedidos (con soporte de paginación)
app.get('/api/pedidos', async (req, res) => {
    try {
        // 🔒 Headers anti-caché para prevenir problemas de sincronización
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        // Verificar que la BD está disponible
        if (!dbClient.isInitialized) {
            console.error('🚨 BD no disponible - rechazando consulta de pedidos');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        // Detectar si el cliente solicita paginación
        const usePagination = req.query.page || req.query.limit || req.query.fechaEntregaDesde || req.query.sinFiltroFecha;
        
        if (usePagination) {
            // === MODO PAGINADO (nuevo) ===
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const incluirArchivados = req.query.incluirArchivados === 'true';
            const incluirCompletados = req.query.incluirCompletados !== 'false'; // true por defecto
            const sinFiltroFecha = req.query.sinFiltroFecha === 'true';

            // Calcular fecha de hace 2 meses (para filtro por defecto)
            const dosMesesAtras = new Date();
            dosMesesAtras.setMonth(dosMesesAtras.getMonth() - 2);
            const fechaEntregaDesde = req.query.fechaEntregaDesde || (sinFiltroFecha ? null : dosMesesAtras.toISOString().split('T')[0]);

            const result = await dbClient.getAllPaginated({
                page,
                limit,
                fechaEntregaDesde,
                fechaEntregaHasta: req.query.fechaEntregaHasta || null,
                incluirArchivados,
                incluirCompletados,
                etapas: req.query.etapas ? req.query.etapas.split(',') : null,
                sinFiltroFecha
            });

            const timestamp = new Date().toISOString();
            console.log(`📊 [${timestamp}] GET /api/pedidos (PAGINADO) - Página ${page}: ${result.pedidos.length}/${result.pagination.total} pedidos`);
            
            res.status(200).json(result);
        } else {
            // === MODO LEGACY (sin paginación) - para compatibilidad ===
            const pedidos = await dbClient.getAll();
            
            const timestamp = new Date().toISOString();
            console.log(`📊 [${timestamp}] GET /api/pedidos (LEGACY) - Total: ${pedidos.length} pedidos`);
            
            res.status(200).json(pedidos.sort((a, b) => b.secuenciaPedido - a.secuenciaPedido));
        }
        
    } catch (error) {
        console.error("Error in GET /api/pedidos:", error);
        res.status(500).json({ 
            message: "Error interno del servidor al obtener los pedidos.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/pedidos/exists - Verificar si ya existe un numero de pedido
app.get('/api/pedidos/exists', async (req, res) => {
    try {
        const numero = typeof req.query.numero === 'string' ? req.query.numero : '';
        const excludeId = typeof req.query.excludeId === 'string' ? req.query.excludeId : '';

        if (!numero.trim()) {
            return res.status(400).json({ message: 'El parametro "numero" es requerido.' });
        }

        if (!dbClient.isInitialized) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'El sistema no esta disponible. Por favor, contacte al administrador.'
            });
        }

        const exists = await dbClient.existsNumeroPedidoCliente(numero, excludeId || null);
        res.status(200).json({ exists });
    } catch (error) {
        console.error('Error in GET /api/pedidos/exists:', error);
        res.status(500).json({
            message: 'Error interno del servidor al validar el numero de pedido.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        });
    }
});

// === ENDPOINTS DE OPERACIONES MASIVAS (DEBEN IR ANTES DE RUTAS CON :id) ===

// DELETE /api/pedidos/bulk-delete - Eliminar múltiples pedidos
app.delete('/api/pedidos/bulk-delete', requirePermission('pedidos.delete'), async (req, res) => {
    try {
        const { ids } = req.body;
        
        console.log('🗑️ [BULK DELETE] Endpoint alcanzado');
        console.log('🗑️ IDs recibidos:', ids);
        
        // Validación
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ 
                error: 'Se requiere un array de IDs no vacío.' 
            });
        }

        if (!dbClient.isInitialized) {
            return res.status(503).json({ 
                error: 'Base de datos no disponible' 
            });
        }

        console.log(`🗑️ Eliminando ${ids.length} pedidos en operación masiva...`);

        // Obtener información de los pedidos antes de eliminarlos (para websocket)
        const pedidosToDelete = [];
        for (const id of ids) {
            const pedido = await dbClient.findById(id);
            if (pedido) {
                pedidosToDelete.push(pedido);
            }
        }

        // Eliminar cada pedido
        let deletedCount = 0;
        for (const id of ids) {
            try {
                const deleted = await dbClient.delete(id);
                if (deleted) {
                    deletedCount++;
                }
            } catch (error) {
                console.error(`Error eliminando pedido ${id}:`, error);
                // Continuar con los demás pedidos
            }
        }

        // 🔥 EVENTO WEBSOCKET: Pedidos eliminados masivamente
        broadcastToClients('pedidos-bulk-deleted', {
            pedidoIds: ids,
            count: deletedCount,
            pedidos: pedidosToDelete.map(p => ({
                id: p.id,
                numeroPedidoCliente: p.numeroPedidoCliente
            }))
        });

        console.log(`✅ ${deletedCount} de ${ids.length} pedidos eliminados exitosamente`);

        res.status(200).json({ 
            success: true,
            deletedCount,
            message: `${deletedCount} pedidos eliminados exitosamente.` 
        });
        
    } catch (error) {
        console.error('Error en bulk-delete:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al eliminar pedidos.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PATCH /api/pedidos/bulk-update-date - Actualizar nueva fecha de entrega para múltiples pedidos
app.patch('/api/pedidos/bulk-update-date', requirePermission('pedidos.edit'), async (req, res) => {
    try {
        const { ids, nuevaFechaEntrega } = req.body;
        
        console.log('📅 [BULK UPDATE DATE] Endpoint alcanzado');
        console.log('📅 IDs recibidos:', ids);
        console.log('📅 Nueva fecha:', nuevaFechaEntrega);
        
        // Validación
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ 
                error: 'Se requiere un array de IDs no vacío.' 
            });
        }

        if (!nuevaFechaEntrega) {
            return res.status(400).json({ 
                error: 'Se requiere una fecha válida.' 
            });
        }

        if (!dbClient.isInitialized) {
            return res.status(503).json({ 
                error: 'Base de datos no disponible' 
            });
        }

        console.log(`📅 Actualizando nueva fecha de entrega para ${ids.length} pedidos: ${ids.join(', ')}`);
        console.log(`📅 Nueva fecha: ${nuevaFechaEntrega}`);

        // Actualizar cada pedido
        let updatedCount = 0;
        const updatedPedidos = [];
        const errors = [];

        for (const id of ids) {
            try {
                console.log(`  🔄 Procesando pedido ${id}...`);
                
                const pedido = await dbClient.findById(id);
                if (!pedido) {
                    console.warn(`  ⚠️ Pedido ${id} no encontrado, saltando...`);
                    errors.push({ id, error: 'Pedido no encontrado' });
                    continue;
                }

                console.log(`  📦 Pedido encontrado: ${pedido.numeroPedidoCliente}`);
                console.log(`  📅 Fecha anterior: ${pedido.nuevaFechaEntrega || 'N/A'}`);

                // Actualizar el pedido con la nueva fecha
                const updatedPedido = {
                    ...pedido,
                    nuevaFechaEntrega: nuevaFechaEntrega
                };

                const result = await dbClient.update(updatedPedido);
                
                if (result) {
                    updatedCount++;
                    console.log(`  ✅ Pedido ${id} actualizado exitosamente`);
                    updatedPedidos.push({
                        id: result.id,
                        numeroPedidoCliente: result.numeroPedidoCliente,
                        nuevaFechaEntrega: result.nuevaFechaEntrega
                    });
                } else {
                    console.error(`  ❌ Error: update devolvió null para ${id}`);
                    errors.push({ id, error: 'update devolvió null' });
                }
            } catch (error) {
                console.error(`  ❌ Error actualizando pedido ${id}:`, error.message);
                console.error(error.stack);
                errors.push({ id, error: error.message });
            }
        }

        // 🔥 EVENTO WEBSOCKET: Pedidos actualizados masivamente
        broadcastToClients('pedidos-bulk-updated', {
            pedidoIds: ids,
            count: updatedCount,
            field: 'nueva_fecha_entrega',
            value: nuevaFechaEntrega,
            pedidos: updatedPedidos
        });

        console.log(`✅ ${updatedCount} de ${ids.length} pedidos actualizados exitosamente`);
        if (errors.length > 0) {
            console.log(`⚠️ ${errors.length} errores:`, errors);
        }

        res.status(200).json({ 
            success: true,
            updatedCount,
            totalRequested: ids.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `${updatedCount} pedidos actualizados exitosamente.` 
        });
        
    } catch (error) {
        console.error('❌ Error en bulk-update-date:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al actualizar pedidos.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PATCH /api/pedidos/bulk-update-machine - Actualizar máquina de impresión para múltiples pedidos
app.patch('/api/pedidos/bulk-update-machine', requirePermission('pedidos.edit'), async (req, res) => {
    try {
        const { ids, maquinaImpresion } = req.body;
        
        console.log('🖨️ [BULK UPDATE MACHINE] Endpoint alcanzado');
        console.log('🖨️ IDs recibidos:', ids);
        console.log('🖨️ Nueva máquina:', maquinaImpresion);
        
        // Validación
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ 
                error: 'Se requiere un array de IDs no vacío.' 
            });
        }

        if (!maquinaImpresion) {
            return res.status(400).json({ 
                error: 'Se requiere una máquina válida.' 
            });
        }

        if (!dbClient.isInitialized) {
            return res.status(503).json({ 
                error: 'Base de datos no disponible' 
            });
        }

        console.log(`🖨️ Actualizando máquina de impresión para ${ids.length} pedidos: ${ids.join(', ')}`);
        console.log(`🖨️ Nueva máquina: ${maquinaImpresion}`);

        // Actualizar cada pedido
        let updatedCount = 0;
        const updatedPedidos = [];
        const errors = [];

        for (const id of ids) {
            try {
                console.log(`  🔄 Procesando pedido ${id}...`);
                
                const pedido = await dbClient.findById(id);
                if (!pedido) {
                    console.warn(`  ⚠️ Pedido ${id} no encontrado, saltando...`);
                    errors.push({ id, error: 'Pedido no encontrado' });
                    continue;
                }

                console.log(`  📦 Pedido encontrado: ${pedido.numeroPedidoCliente}`);
                console.log(`  🖨️ Máquina anterior: ${pedido.maquinaImpresion || 'N/A'}`);

                // Actualizar el pedido con la nueva máquina
                const updatedPedido = {
                    ...pedido,
                    maquinaImpresion: maquinaImpresion
                };

                const result = await dbClient.update(updatedPedido);
                
                if (result) {
                    updatedCount++;
                    console.log(`  ✅ Pedido ${id} actualizado exitosamente`);
                    updatedPedidos.push({
                        id: result.id,
                        numeroPedidoCliente: result.numeroPedidoCliente,
                        maquinaImpresion: result.maquinaImpresion
                    });
                } else {
                    console.error(`  ❌ Error: update devolvió null para ${id}`);
                    errors.push({ id, error: 'update devolvió null' });
                }
            } catch (error) {
                console.error(`  ❌ Error actualizando pedido ${id}:`, error.message);
                console.error(error.stack);
                errors.push({ id, error: error.message });
            }
        }

        // 🔥 EVENTO WEBSOCKET: Pedidos actualizados masivamente
        broadcastToClients('pedidos-bulk-updated', {
            pedidoIds: ids,
            count: updatedCount,
            field: 'maquina_impresion',
            value: maquinaImpresion,
            pedidos: updatedPedidos
        });

        console.log(`✅ ${updatedCount} de ${ids.length} pedidos actualizados exitosamente`);
        if (errors.length > 0) {
            console.log(`⚠️ ${errors.length} errores:`, errors);
        }

        res.status(200).json({ 
            success: true,
            updatedCount,
            totalRequested: ids.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `${updatedCount} pedidos actualizados exitosamente.` 
        });
        
    } catch (error) {
        console.error('❌ Error en bulk-update-machine:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al actualizar pedidos.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PATCH /api/pedidos/bulk-archive - Archivar/Desarchivar múltiples pedidos
app.patch('/api/pedidos/bulk-archive', requirePermission('pedidos.edit'), async (req, res) => {
    try {
        const { ids, archived = true } = req.body;
        
        console.log('📦 [BULK ARCHIVE] Endpoint alcanzado');
        console.log('📦 IDs recibidos:', ids);
        console.log('📦 Archivar:', archived);
        
        // Validación
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ 
                error: 'Se requiere un array de IDs no vacío.' 
            });
        }

        if (!dbClient.isInitialized) {
            return res.status(503).json({ 
                error: 'Base de datos no disponible' 
            });
        }

        console.log(`📦 ${archived ? 'Archivando' : 'Desarchivando'} ${ids.length} pedidos...`);

        // Actualizar cada pedido
        let updatedCount = 0;
        const updatedPedidos = [];
        const errors = [];

        for (const id of ids) {
            try {
                console.log(`  🔄 Procesando pedido ${id}...`);
                
                const pedido = await dbClient.findById(id);
                if (!pedido) {
                    console.warn(`  ⚠️ Pedido ${id} no encontrado, saltando...`);
                    errors.push({ id, error: 'Pedido no encontrado' });
                    continue;
                }

                console.log(`  📦 Pedido encontrado: ${pedido.numeroPedidoCliente}`);
                console.log(`  📦 Estado anterior: ${pedido.etapaActual}`);

                // Actualizar el pedido con el nuevo estado y etapa
                const updatedPedido = {
                    ...pedido,
                    etapaActual: archived ? 'ARCHIVADO' : 'COMPLETADO',
                    archivado: archived,
                    historial: [
                        ...(pedido.historial || []),
                        {
                            timestamp: new Date().toISOString(),
                            usuario: req.headers['x-user-id'] || 'Sistema',
                            accion: archived ? 'Archivado masivo' : 'Desarchivado masivo',
                            detalles: `Pedido ${archived ? 'archivado' : 'desarchivado'} mediante operación masiva`
                        }
                    ]
                };

                const result = await dbClient.update(updatedPedido);
                
                if (result) {
                    updatedCount++;
                    console.log(`  ✅ Pedido ${id} ${archived ? 'archivado' : 'desarchivado'} exitosamente - Nueva etapa: ${result.etapaActual}`);
                    updatedPedidos.push({
                        id: result.id,
                        numeroPedidoCliente: result.numeroPedidoCliente,
                        archivado: result.archivado
                    });
                } else {
                    console.error(`  ❌ Error: update devolvió null para ${id}`);
                    errors.push({ id, error: 'update devolvió null' });
                }
            } catch (error) {
                console.error(`  ❌ Error actualizando pedido ${id}:`, error.message);
                errors.push({ id, error: error.message });
            }
        }

        // 🔥 EVENTO WEBSOCKET: Pedidos archivados masivamente
        broadcastToClients('pedidos-bulk-archived', {
            pedidoIds: ids,
            count: updatedCount,
            archived,
            pedidos: updatedPedidos
        });

        console.log(`✅ ${updatedCount} de ${ids.length} pedidos ${archived ? 'archivados' : 'desarchivados'} exitosamente`);
        if (errors.length > 0) {
            console.log(`⚠️ ${errors.length} errores:`, errors);
        }

        res.status(200).json({ 
            success: true,
            updatedCount,
            totalRequested: ids.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `${updatedCount} pedidos ${archived ? 'archivados' : 'desarchivados'} exitosamente.` 
        });
        
    } catch (error) {
        console.error('❌ Error en bulk-archive:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al archivar pedidos.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/pedidos/bulk - Bulk insert pedidos
app.post('/api/pedidos/bulk', async (req, res) => {
    try {
        const items = req.body;
        
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Se esperaba un array de pedidos.' });
        }
        
        await dbClient.bulkInsert(items);
        
        res.status(201).json({ message: `${items.length} pedidos importados correctamente.` });
        
    } catch (error) {
        console.error("Error on bulk insert:", error);
        res.status(500).json({ message: "Error interno del servidor durante la importación masiva." });
    }
});

// DELETE /api/pedidos/all - Clear the entire collection
app.delete('/api/pedidos/all', async (req, res) => {
    try {
        await dbClient.clear();
        
        // 🔥 EVENTO WEBSOCKET: Todos los pedidos eliminados
        broadcastToClients('pedidos-cleared', {
            message: 'Todos los pedidos han sido eliminados'
        });
        
        res.status(204).send();
        
    } catch (error) {
        console.error("Error clearing all pedidos:", error);
        res.status(500).json({ message: "Error interno del servidor al eliminar todos los pedidos." });
    }
});

// GET /api/pedidos/search/:term - Search pedidos by various fields including numero_compra
app.get('/api/pedidos/search/:term', async (req, res) => {
    try {
        const searchTerm = req.params.term;
        
        if (!searchTerm || searchTerm.trim().length === 0) {
            return res.status(400).json({ message: 'Término de búsqueda requerido.' });
        }
        
        if (!dbClient.isInitialized) {
            console.log('⚠️ BD no disponible - devolviendo datos vacíos');
            return res.status(200).json([]);
        }
        
        const results = await dbClient.searchPedidos(searchTerm.trim());
        res.status(200).json(results);
        
    } catch (error) {
        console.error(`Error searching pedidos with term "${req.params.term}":`, error);
        res.status(500).json({ 
            message: "Error interno del servidor al buscar pedidos.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// === RUTAS CON PARÁMETROS DINÁMICOS (DEBEN IR DESPUÉS DE RUTAS ESPECÍFICAS) ===

// GET /api/pedidos/:id - Get a single pedido by ID
app.get('/api/pedidos/:id', async (req, res) => {
    try {
        const pedidoId = req.params.id;
        
        const pedido = await dbClient.findById(pedidoId);
        if (pedido) {
            res.status(200).json(pedido);
        } else {
            res.status(404).json({ message: 'Pedido no encontrado' });
        }
        
    } catch (error) {
        console.error(`Error fetching pedido ${req.params.id}:`, error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

// POST /api/pedidos - Create a new pedido
// POST /api/pedidos - Crear un nuevo pedido
app.post('/api/pedidos', requirePermission('pedidos.create'), async (req, res) => {
    try {
        const newPedido = req.body;
        
        // 🐛 DEBUG: Log para verificar clienteId
        console.log('📦 Creando nuevo pedido:');
        console.log('  - Cliente:', newPedido.cliente);
        console.log('  - ClienteId:', newPedido.clienteId);
        console.log('  - ID Pedido:', newPedido.id);
        
        // ✅ VALIDACIÓN: Campo Cliente obligatorio
        if (!newPedido || !newPedido.id) {
            return res.status(400).json({ message: 'Datos del pedido inválidos.' });
        }
        
        if (!newPedido.cliente || !newPedido.cliente.trim()) {
            return res.status(400).json({ message: 'El campo Cliente es obligatorio.' });
        }
        
        await dbClient.create(newPedido);
        
        // 🔥 EVENTO WEBSOCKET: Nuevo pedido creado
        broadcastToClients('pedido-created', {
            pedido: newPedido,
            message: `Nuevo pedido creado: ${newPedido.numeroPedidoCliente}`
        });
        
        // 📢 NOTIFICACIÓN PERSISTENTE
        await createAndBroadcastNotification(
            'success',
            'Nuevo pedido',
            `Pedido ${newPedido.numeroPedidoCliente} creado para ${newPedido.cliente}`,
            {
                pedidoId: newPedido.id,
                metadata: {
                    cliente: newPedido.cliente,
                    prioridad: newPedido.prioridad,
                    etapaActual: newPedido.etapaActual,
                    categoria: 'pedido'
                }
            }
        );
        
        res.status(201).json(newPedido);
        
    } catch (error) {
        console.error("Error creating pedido:", error);
        res.status(500).json({ message: "Error interno del servidor al crear el pedido." });
    }
});

// PATCH /api/pedidos/:id/horas-confirmadas - Actualizar solo horas_confirmadas
app.patch('/api/pedidos/:id/horas-confirmadas', requirePermission('pedidos.edit'), async (req, res) => {
    try {
        const { horasConfirmadas } = req.body;
        const pedidoId = req.params.id;
        
        const pedido = await dbClient.findById(pedidoId);
        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Actualizar solo horas_confirmadas
        const updatedPedido = {
            ...pedido,
            horasConfirmadas
        };

        await dbClient.update(updatedPedido);

        // Broadcast event
        broadcastToClients('pedido-updated', {
            pedido: updatedPedido,
            previousPedido: pedido,
            changes: ['Horas Confirmadas'],
            message: `Horas Confirmadas actualizado para pedido: ${updatedPedido.numeroPedidoCliente}`
        });

        res.status(200).json({ success: true, horasConfirmadas });

    } catch (error) {
        console.error(`Error updating horasConfirmadas for pedido ${req.params.id}:`, error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

// PUT /api/pedidos/:id - Update an existing pedido
// PUT /api/pedidos/:id - Actualizar un pedido existente
app.put('/api/pedidos/:id', requirePermission('pedidos.edit'), async (req, res) => {
    try {
        const updatedPedido = req.body;
        const pedidoId = req.params.id;
        
        if (!updatedPedido || updatedPedido.id !== pedidoId) {
            return res.status(400).json({ message: 'El ID del pedido no coincide.' });
        }
        
        // Obtener el pedido anterior para comparar cambios
        const previousPedido = await dbClient.findById(pedidoId);
        
        if (!previousPedido) {
            return res.status(404).json({ message: 'Pedido no encontrado para actualizar.' });
        }
        
        await dbClient.update(updatedPedido);
        
        // 🔥 EVENTO WEBSOCKET: Pedido actualizado (usar función mejorada detectChanges)
        const changes = detectChanges(previousPedido, updatedPedido);
        
        broadcastToClients('pedido-updated', {
            pedido: updatedPedido,
            previousPedido,
            changes,
            message: `Pedido actualizado: ${updatedPedido.numeroPedidoCliente}${changes.length > 0 ? ` (${changes.join(', ')})` : ''}`
        });
        
        // 📢 NOTIFICACIÓN PERSISTENTE (solo si hay cambios significativos)
        if (changes.length > 0) {
            await createAndBroadcastNotification(
                'info',
                'Pedido actualizado',
                `${updatedPedido.numeroPedidoCliente}: ${changes.slice(0, 2).join(', ')}${changes.length > 2 ? ` +${changes.length - 2} más` : ''}`,
                {
                    pedidoId: updatedPedido.id,
                    metadata: {
                        cliente: updatedPedido.cliente,
                        prioridad: updatedPedido.prioridad,
                        etapaActual: updatedPedido.etapaActual,
                        etapaAnterior: previousPedido?.etapaActual,
                        cambios: changes,
                        categoria: 'pedido'
                    }
                }
            );
        }
        
        res.status(200).json(updatedPedido);
        
    } catch (error) {
        console.error(`Error updating pedido ${req.params.id}:`, error);
        res.status(500).json({ message: "Error interno del servidor al actualizar el pedido." });
    }
});

// DELETE /api/pedidos/:id - Delete a single pedido
// DELETE /api/pedidos/:id - Eliminar un pedido
app.delete('/api/pedidos/:id', requirePermission('pedidos.delete'), async (req, res) => {
    try {
        const pedidoId = req.params.id;
        
        // Obtener el pedido antes de eliminarlo
        const deletedPedido = await dbClient.findById(pedidoId);
        
        if (!deletedPedido) {
            return res.status(404).json({ message: 'Pedido no encontrado para eliminar.' });
        }
        
        await dbClient.delete(pedidoId);
        
        // 🔥 EVENTO WEBSOCKET: Pedido eliminado
        broadcastToClients('pedido-deleted', {
            pedidoId,
            deletedPedido,
            message: `Pedido eliminado: ${deletedPedido?.numeroPedidoCliente || pedidoId}`
        });
        
        // 📢 NOTIFICACIÓN PERSISTENTE
        await createAndBroadcastNotification(
            'warning',
            'Pedido eliminado',
            `Pedido ${deletedPedido?.numeroPedidoCliente || pedidoId} de ${deletedPedido?.cliente || 'cliente desconocido'} ha sido eliminado`,
            {
                pedidoId: pedidoId,
                metadata: {
                    cliente: deletedPedido?.cliente,
                    prioridad: deletedPedido?.prioridad,
                    etapaActual: deletedPedido?.etapaActual,
                    categoria: 'pedido'
                }
            }
        );
        
        res.status(204).send();
        
    } catch (error) {
        console.error(`Error deleting pedido ${req.params.id}:`, error);
        res.status(500).json({ message: "Error interno del servidor al eliminar el pedido." });
    }
});

// POST /api/pedidos/bulk - Bulk insert pedidos
app.post('/api/pedidos/bulk', async (req, res) => {
    try {
        const items = req.body;
        
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Se esperaba un array de pedidos.' });
        }
        
        await dbClient.bulkInsert(items);
        
        res.status(201).json({ message: `${items.length} pedidos importados correctamente.` });
        
    } catch (error) {
        console.error("Error on bulk insert:", error);
        res.status(500).json({ message: "Error interno del servidor durante la importación masiva." });
    }
});

// DELETE /api/pedidos/all - Clear the entire collection
app.delete('/api/pedidos/all', async (req, res) => {
    try {
        await dbClient.clear();
        
        // 🔥 EVENTO WEBSOCKET: Todos los pedidos eliminados
        broadcastToClients('pedidos-cleared', {
            message: 'Todos los pedidos han sido eliminados'
        });
        
        res.status(204).send();
        
    } catch (error) {
        console.error("Error clearing all pedidos:", error);
        res.status(500).json({ message: "Error interno del servidor al eliminar todos los pedidos." });
    }
});

// GET /api/pedidos/search/:term - Search pedidos by various fields including numero_compra
app.get('/api/pedidos/search/:term', async (req, res) => {
    try {
        const searchTerm = req.params.term;
        
        if (!searchTerm || searchTerm.trim().length === 0) {
            return res.status(400).json({ message: 'Término de búsqueda requerido.' });
        }
        
        if (!dbClient.isInitialized) {
            console.log('⚠️ BD no disponible - devolviendo datos vacíos');
            return res.status(200).json([]);
        }
        
        const results = await dbClient.searchPedidos(searchTerm.trim());
        res.status(200).json(results);
        
    } catch (error) {
        console.error(`Error searching pedidos with term "${req.params.term}":`, error);
        res.status(500).json({ 
            message: "Error interno del servidor al buscar pedidos.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// === ENDPOINT DE MIGRACIONES ===

// POST /api/admin/migrate - Aplicar migraciones pendientes
app.post('/api/admin/migrate', requirePermission('usuarios.admin'), async (req, res) => {
    try {
        console.log('🔧 Iniciando aplicación de migraciones...');
        
        if (!dbClient.isInitialized) {
            return res.status(500).json({ message: 'Base de datos no inicializada' });
        }

        const client = await dbClient.pool.connect();
        let results = [];
        
        try {
            // Migración 1: nueva_fecha_entrega
            try {
                await client.query(`
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'pedidos' AND column_name = 'nueva_fecha_entrega'
                        ) THEN
                            ALTER TABLE pedidos ADD COLUMN nueva_fecha_entrega TIMESTAMP;
                            CREATE INDEX IF NOT EXISTS idx_pedidos_nueva_fecha_entrega ON pedidos(nueva_fecha_entrega);
                            RAISE NOTICE 'Columna nueva_fecha_entrega agregada';
                        ELSE
                            RAISE NOTICE 'Columna nueva_fecha_entrega ya existe';
                        END IF;
                    END $$;
                `);
                results.push({ migration: 'nueva_fecha_entrega', status: 'success' });
            } catch (error) {
                console.error('Error en migración nueva_fecha_entrega:', error);
                results.push({ migration: 'nueva_fecha_entrega', status: 'error', error: error.message });
            }

            // Migración 2: numero_compra
            try {
                await client.query(`
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'pedidos' AND column_name = 'numero_compra'
                        ) THEN
                            ALTER TABLE pedidos ADD COLUMN numero_compra VARCHAR(50);
                            CREATE INDEX IF NOT EXISTS idx_pedidos_numero_compra ON pedidos(numero_compra);
                            RAISE NOTICE 'Columna numero_compra agregada';
                        ELSE
                            RAISE NOTICE 'Columna numero_compra ya existe';
                        END IF;
                    END $$;
                `);
                
                // Crear índice GIN para búsquedas de texto - DESHABILITADO temporalmente
                // El índice GIN con pg_trgm no funciona bien con JSONB arrays
                // Se usará el índice regular en su lugar
                
                results.push({ migration: 'numero_compra', status: 'success' });
            } catch (error) {
                console.error('Error en migración numero_compra:', error);
                results.push({ migration: 'numero_compra', status: 'error', error: error.message });
            }

            // Migración 3: vendedor
            try {
                await client.query(`
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'pedidos' AND column_name = 'vendedor'
                        ) THEN
                            ALTER TABLE pedidos ADD COLUMN vendedor VARCHAR(255);
                            CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor ON pedidos(vendedor);
                            RAISE NOTICE 'Columna vendedor agregada';
                        ELSE
                            RAISE NOTICE 'Columna vendedor ya existe';
                        END IF;
                    END $$;
                `);
                results.push({ migration: 'vendedor', status: 'success' });
            } catch (error) {
                console.error('Error en migración vendedor:', error);
                results.push({ migration: 'vendedor', status: 'error', error: error.message });
            }

            // Migración 4: anonimo
            try {
                await client.query(`
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'pedidos' AND column_name = 'anonimo'
                        ) THEN
                            ALTER TABLE pedidos ADD COLUMN anonimo BOOLEAN DEFAULT false;
                            CREATE INDEX IF NOT EXISTS idx_pedidos_anonimo ON pedidos(anonimo);
                            COMMENT ON COLUMN pedidos.anonimo IS 'Indica si el pedido es anónimo';
                            RAISE NOTICE 'Columna anonimo agregada';
                        ELSE
                            RAISE NOTICE 'Columna anonimo ya existe';
                        END IF;
                    END $$;
                `);
                results.push({ migration: 'anonimo', status: 'success' });
            } catch (error) {
                console.error('Error en migración anonimo:', error);
                results.push({ migration: 'anonimo', status: 'error', error: error.message });
            }

            // ===== MIGRACIÓN 13: Campos de fecha Cliché (compra_cliche, recepcion_cliche) =====
            try {
                await client.query(`
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'pedidos' AND column_name = 'compra_cliche'
                        ) THEN
                            ALTER TABLE pedidos ADD COLUMN compra_cliche DATE;
                            CREATE INDEX IF NOT EXISTS idx_pedidos_compra_cliche ON pedidos(compra_cliche);
                            COMMENT ON COLUMN pedidos.compra_cliche IS 'Fecha de Compra Cliché';
                            RAISE NOTICE 'Columna compra_cliche agregada';
                        ELSE
                            RAISE NOTICE 'Columna compra_cliche ya existe';
                        END IF;

                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'pedidos' AND column_name = 'recepcion_cliche'
                        ) THEN
                            ALTER TABLE pedidos ADD COLUMN recepcion_cliche DATE;
                            CREATE INDEX IF NOT EXISTS idx_pedidos_recepcion_cliche ON pedidos(recepcion_cliche);
                            COMMENT ON COLUMN pedidos.recepcion_cliche IS 'Fecha de Recepción del Cliché';
                            RAISE NOTICE 'Columna recepcion_cliche agregada';
                        ELSE
                            RAISE NOTICE 'Columna recepcion_cliche ya existe';
                        END IF;
                    END $$;
                `);
                results.push({ migration: 'cliche_dates', status: 'success' });
            } catch (error) {
                console.error('Error en migración cliche_dates:', error);
                results.push({ migration: 'cliche_dates', status: 'error', error: error.message });
            }

            // ===== MIGRACIÓN 032: Sistema de Menciones en Comentarios =====
            try {
                await client.query(`
                    DO $$ 
                    BEGIN
                        -- Agregar columna mentioned_users si no existe
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'pedido_comments' AND column_name = 'mentioned_users'
                        ) THEN
                            ALTER TABLE pedido_comments 
                            ADD COLUMN mentioned_users JSONB DEFAULT '[]'::jsonb;
                            
                            COMMENT ON COLUMN pedido_comments.mentioned_users IS 
                            'Array JSONB de usuarios mencionados. Formato: [{"id": "uuid", "username": "nombre"}]';
                            
                            RAISE NOTICE 'Columna mentioned_users agregada a pedido_comments';
                        ELSE
                            RAISE NOTICE 'Columna mentioned_users ya existe en pedido_comments';
                        END IF;
                    END $$;
                `);

                // Crear índice GIN para búsqueda eficiente de menciones
                await client.query(`
                    CREATE INDEX IF NOT EXISTS idx_pedido_comments_mentioned_users_gin 
                    ON pedido_comments USING gin(mentioned_users);
                `);

                // Crear índice compuesto para búsquedas de comentarios con menciones
                await client.query(`
                    CREATE INDEX IF NOT EXISTS idx_pedido_comments_mentions 
                    ON pedido_comments(pedido_id) 
                    WHERE mentioned_users IS NOT NULL AND jsonb_array_length(mentioned_users) > 0;
                `);

                // Crear función auxiliar para buscar comentarios donde se menciona a un usuario
                await client.query(`
                    CREATE OR REPLACE FUNCTION get_comments_mentioning_user(user_id_param UUID)
                    RETURNS TABLE(
                        comment_id UUID,
                        pedido_id VARCHAR(50),
                        message TEXT,
                        username VARCHAR(50),
                        created_at TIMESTAMP WITH TIME ZONE
                    ) AS $func$
                    BEGIN
                        RETURN QUERY
                        SELECT 
                            pc.id,
                            pc.pedido_id,
                            pc.message,
                            pc.username,
                            pc.created_at
                        FROM pedido_comments pc
                        WHERE pc.mentioned_users @> jsonb_build_array(
                            jsonb_build_object('id', user_id_param::text)
                        )
                        ORDER BY pc.created_at DESC;
                    END;
                    $func$ LANGUAGE plpgsql STABLE;
                `);

                await client.query(`
                    COMMENT ON FUNCTION get_comments_mentioning_user(UUID) IS 
                    'Retorna todos los comentarios donde se menciona al usuario especificado';
                `);

                results.push({ migration: 'mentioned_users', status: 'success' });
            } catch (error) {
                console.error('Error en migración mentioned_users:', error);
                results.push({ migration: 'mentioned_users', status: 'error', error: error.message });
            }

            // ===== MIGRACIÓN 033: Checkbox Horas Confirmadas =====
            try {
                await client.query(`
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'pedidos' AND column_name = 'horas_confirmadas'
                        ) THEN
                            ALTER TABLE pedidos ADD COLUMN horas_confirmadas BOOLEAN DEFAULT false;
                            COMMENT ON COLUMN pedidos.horas_confirmadas IS 'Indica si las horas de cliché han sido confirmadas';
                            RAISE NOTICE 'Columna horas_confirmadas agregada';
                        ELSE
                            RAISE NOTICE 'Columna horas_confirmadas ya existe';
                        END IF;
                    END $$;
                `);
                results.push({ migration: 'horas_confirmadas', status: 'success' });
            } catch (error) {
                console.error('Error en migración horas_confirmadas:', error);
                results.push({ migration: 'horas_confirmadas', status: 'error', error: error.message });
            }

            // Verificar estado final
            const checkResult = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'pedidos' 
                AND column_name IN ('nueva_fecha_entrega', 'numero_compra', 'vendedor', 'anonimo', 'compra_cliche', 'recepcion_cliche', 'horas_confirmadas')
                ORDER BY column_name;
            `);
            
            const existingColumns = checkResult.rows.map(row => row.column_name);
            
            console.log('✅ Migraciones completadas. Columnas presentes:', existingColumns);
            
            res.status(200).json({
                message: 'Migraciones aplicadas',
                results,
                existingColumns,
                success: true
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error aplicando migraciones:', error);
        res.status(500).json({ 
            message: 'Error aplicando migraciones',
            error: error.message
        });
    }
});

// === RUTAS DE NOTIFICACIONES ===

// GET /api/notifications - Obtener notificaciones del usuario (últimas 50)
app.get('/api/notifications', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(400).json({ message: 'ID de usuario requerido (x-user-id header)' });
        }
        
        if (!dbClient.isInitialized) {
            console.log('⚠️ BD no disponible - devolviendo array vacío');
            return res.status(200).json([]);
        }
        
        const notifications = await dbClient.getNotifications(userId, 50);
        res.status(200).json(notifications);
        
    } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        res.status(500).json({ 
            message: 'Error al obtener notificaciones',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/notifications/:id/read - Marcar una notificación como leída
app.post('/api/notifications/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(400).json({ message: 'ID de usuario requerido (x-user-id header)' });
        }
        
        if (!dbClient.isInitialized) {
            return res.status(503).json({ message: 'Base de datos no disponible' });
        }
        
        const updatedNotification = await dbClient.markNotificationAsRead(notificationId, userId);
        
        // Emitir evento WebSocket para sincronizar con otros clientes del mismo usuario
        io.emit('notification-read', { notificationId, userId });
        
        res.status(200).json(updatedNotification);
        
    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
        res.status(500).json({ 
            message: 'Error al marcar notificación como leída',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/notifications/read-all - Marcar todas las notificaciones como leídas
app.post('/api/notifications/read-all', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(400).json({ message: 'ID de usuario requerido (x-user-id header)' });
        }
        
        if (!dbClient.isInitialized) {
            return res.status(503).json({ message: 'Base de datos no disponible' });
        }
        
        const updatedCount = await dbClient.markAllNotificationsAsRead(userId);
        
        // Emitir evento WebSocket para sincronizar con otros clientes del mismo usuario
        io.emit('notifications-read-all', { userId });
        
        res.status(200).json({ 
            message: `${updatedCount} notificaciones marcadas como leídas`,
            count: updatedCount 
        });
        
    } catch (error) {
        console.error('Error marcando todas las notificaciones como leídas:', error);
        res.status(500).json({ 
            message: 'Error al marcar todas las notificaciones como leídas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// DELETE /api/notifications/:id - Eliminar una notificación
app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(400).json({ message: 'ID de usuario requerido (x-user-id header)' });
        }
        
        if (!dbClient.isInitialized) {
            return res.status(503).json({ message: 'Base de datos no disponible' });
        }
        
        await dbClient.deleteNotification(notificationId, userId);
        
        // Emitir evento WebSocket para sincronizar con otros clientes del mismo usuario
        io.emit('notification-deleted', { notificationId, userId });
        
        res.status(204).send();
        
    } catch (error) {
        console.error('Error eliminando notificación:', error);
        res.status(500).json({ 
            message: 'Error al eliminar notificación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// === ENDPOINTS DE OPERACIONES DE PRODUCCIÓN ===
// ============================================

// POST /api/produccion/iniciar - Iniciar una nueva operación de producción
app.post('/api/produccion/iniciar', requireAuth, async (req, res) => {
    try {
        const { pedidoId, maquina, metrosObjetivo, observaciones } = req.body;
        const operadorId = req.headers['x-user-id'];
        const operadorNombre = req.user?.displayName || req.user?.username || 'Operador';
        
        if (!pedidoId || !maquina) {
            return res.status(400).json({ 
                success: false,
                message: 'Datos incompletos: pedidoId y maquina son requeridos' 
            });
        }
        
        if (!operadorId) {
            return res.status(401).json({ 
                success: false,
                message: 'Usuario no autenticado' 
            });
        }
        
        const operacion = await produccionOps.iniciarOperacion({
            pedidoId,
            operadorId,
            operadorNombre,
            maquina,
            metrosObjetivo,
            observaciones
        });
        
        // Emitir evento WebSocket
        io.emit('operacion-iniciada', operacion);
        
        res.status(201).json({
            success: true,
            operacion,
            message: `Operación iniciada en ${maquina}`
        });
        
    } catch (error) {
        console.error('Error iniciando operación:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al iniciar operación'
        });
    }
});

// POST /api/produccion/pausar/:operacionId - Pausar una operación
app.post('/api/produccion/pausar/:operacionId', requireAuth, async (req, res) => {
    try {
        const { operacionId } = req.params;
        const { motivo } = req.body;
        
        const operacion = await produccionOps.pausarOperacion(operacionId, motivo);
        
        // Emitir evento WebSocket
        io.emit('operacion-pausada', operacion);
        
        res.status(200).json({
            success: true,
            operacion,
            message: 'Operación pausada'
        });
        
    } catch (error) {
        console.error('Error pausando operación:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al pausar operación'
        });
    }
});

// POST /api/produccion/reanudar/:operacionId - Reanudar una operación pausada
app.post('/api/produccion/reanudar/:operacionId', requireAuth, async (req, res) => {
    try {
        const { operacionId } = req.params;
        
        const operacion = await produccionOps.reanudarOperacion(operacionId);
        
        // Emitir evento WebSocket
        io.emit('operacion-reanudada', operacion);
        
        res.status(200).json({
            success: true,
            operacion,
            message: 'Operación reanudada'
        });
        
    } catch (error) {
        console.error('Error reanudando operación:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al reanudar operación'
        });
    }
});

// POST /api/produccion/completar - Completar una operación
app.post('/api/produccion/completar', requireAuth, async (req, res) => {
    try {
        const { operacionId, metrosProducidos, observaciones, calidad } = req.body;
        
        if (!operacionId || metrosProducidos === undefined) {
            return res.status(400).json({ 
                success: false,
                message: 'Datos incompletos: operacionId y metrosProducidos son requeridos' 
            });
        }
        
        const operacion = await produccionOps.completarOperacion({
            operacionId,
            metrosProducidos: parseFloat(metrosProducidos),
            observaciones,
            calidad
        });
        
        // Emitir evento WebSocket
        io.emit('operacion-completada', operacion);
        
        // También emitir actualización del pedido
        const pedidoActualizado = await dbClient.findById(operacion.pedidoId);
        if (pedidoActualizado) {
            io.emit('pedido-updated', {
                pedido: pedidoActualizado,
                message: `Pedido actualizado: ${metrosProducidos}m producidos`
            });
        }
        
        res.status(200).json({
            success: true,
            operacion,
            message: `Operación completada: ${metrosProducidos}m producidos`
        });
        
    } catch (error) {
        console.error('Error completando operación:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al completar operación'
        });
    }
});

// POST /api/produccion/cancelar/:operacionId - Cancelar una operación
app.post('/api/produccion/cancelar/:operacionId', requireAuth, async (req, res) => {
    try {
        const { operacionId } = req.params;
        const { motivo } = req.body;
        
        const operacion = await produccionOps.cancelarOperacion(operacionId, motivo);
        
        // Emitir evento WebSocket
        io.emit('operacion-cancelada', operacion);
        
        res.status(200).json({
            success: true,
            operacion,
            message: 'Operación cancelada'
        });
        
    } catch (error) {
        console.error('Error cancelando operación:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al cancelar operación'
        });
    }
});

// GET /api/produccion/operaciones-activas - Obtener todas las operaciones activas
app.get('/api/produccion/operaciones-activas', requireAuth, async (req, res) => {
    try {
        const { operadorId, maquina, etapa } = req.query;
        
        const operaciones = await produccionOps.obtenerOperacionesActivas({
            operadorId,
            maquina,
            etapa
        });
        
        res.status(200).json({
            success: true,
            operaciones,
            count: operaciones.length
        });
        
    } catch (error) {
        console.error('Error obteniendo operaciones activas:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al obtener operaciones activas'
        });
    }
});

// GET /api/produccion/operacion/:operacionId - Obtener una operación por ID
app.get('/api/produccion/operacion/:operacionId', requireAuth, async (req, res) => {
    try {
        const { operacionId } = req.params;
        
        const operacion = await produccionOps.obtenerOperacionPorId(operacionId);
        
        if (!operacion) {
            return res.status(404).json({
                success: false,
                message: 'Operación no encontrada'
            });
        }
        
        res.status(200).json({
            success: true,
            operacion
        });
        
    } catch (error) {
        console.error('Error obteniendo operación:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al obtener operación'
        });
    }
});

// GET /api/produccion/historial/:pedidoId - Obtener historial de operaciones de un pedido
app.get('/api/produccion/historial/:pedidoId', requireAuth, async (req, res) => {
    try {
        const { pedidoId } = req.params;
        
        const historial = await produccionOps.obtenerHistorialPedido(pedidoId);
        
        res.status(200).json({
            success: true,
            historial,
            count: historial.length
        });
        
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al obtener historial'
        });
    }
});

// GET /api/produccion/pedidos-disponibles - Obtener pedidos disponibles para operación
app.get('/api/produccion/pedidos-disponibles', requireAuth, async (req, res) => {
    try {
        const { etapa } = req.query;
        
        const pedidos = await produccionOps.obtenerPedidosDisponibles({ etapa });
        
        res.status(200).json({
            success: true,
            pedidos,
            count: pedidos.length
        });
        
    } catch (error) {
        console.error('Error obteniendo pedidos disponibles:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al obtener pedidos disponibles'
        });
    }
});

// GET /api/produccion/estadisticas/:operadorId - Obtener estadísticas del operador (hoy)
app.get('/api/produccion/estadisticas/:operadorId', requireAuth, async (req, res) => {
    try {
        const { operadorId } = req.params;
        
        const estadisticas = await produccionOps.obtenerEstadisticasOperadorHoy(operadorId);
        
        res.status(200).json({
            success: true,
            estadisticas: estadisticas || {
                operadorId,
                totalOperaciones: 0,
                operacionesCompletadas: 0,
                operacionesEnProgreso: 0,
                operacionesPausadas: 0,
                metrosProducidosHoy: 0,
                tiempoTrabajadoSegundos: 0,
                tiempoPromedioOperacion: 0
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al obtener estadísticas'
        });
    }
});

// POST /api/produccion/observacion - Agregar observación a una operación
app.post('/api/produccion/observacion', requireAuth, async (req, res) => {
    try {
        const { operacionId, pedidoId, observacion, tipo } = req.body;
        const creadoPor = req.headers['x-user-id'];
        const creadoNombre = req.user?.displayName || req.user?.username || 'Usuario';
        
        if (!operacionId || !pedidoId || !observacion) {
            return res.status(400).json({ 
                success: false,
                message: 'Datos incompletos' 
            });
        }
        
        const observacionCreada = await produccionOps.agregarObservacion({
            operacionId,
            pedidoId,
            observacion,
            tipo,
            creadoPor,
            creadoNombre
        });
        
        // Emitir evento WebSocket
        io.emit('observacion-agregada', observacionCreada);
        
        res.status(201).json({
            success: true,
            observacion: observacionCreada,
            message: 'Observación agregada'
        });
        
    } catch (error) {
        console.error('Error agregando observación:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al agregar observación'
        });
    }
});

// GET /api/produccion/observaciones/:operacionId - Obtener observaciones de una operación
app.get('/api/produccion/observaciones/:operacionId', requireAuth, async (req, res) => {
    try {
        const { operacionId } = req.params;
        
        const observaciones = await produccionOps.obtenerObservacionesOperacion(operacionId);
        
        res.status(200).json({
            success: true,
            observaciones,
            count: observaciones.length
        });
        
    } catch (error) {
        console.error('Error obteniendo observaciones:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al obtener observaciones'
        });
    }
});

// GET /api/produccion/metraje/:pedidoId - Obtener historial de metraje de un pedido
app.get('/api/produccion/metraje/:pedidoId', requireAuth, async (req, res) => {
    try {
        const { pedidoId } = req.params;
        
        const metraje = await produccionOps.obtenerHistorialMetraje(pedidoId);
        
        res.status(200).json({
            success: true,
            metraje,
            count: metraje.length
        });
        
    } catch (error) {
        console.error('Error obteniendo metraje:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al obtener metraje'
        });
    }
});

// === RUTAS DE HISTORIAL DE ACTIVIDAD ===

// POST /api/action-history - Crear nueva entrada en el historial
app.post('/api/action-history', async (req, res) => {
    try {
        const action = req.body;
        
        if (!action.id || !action.contextId || !action.contextType || !action.type) {
            return res.status(400).json({ message: 'Faltan campos requeridos' });
        }

        const query = `
            INSERT INTO action_history (
                id, context_id, context_type, action_type, payload, 
                timestamp, user_id, user_name, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO NOTHING
            RETURNING *;
        `;

        const values = [
            action.id,
            action.contextId,
            action.contextType,
            action.type,
            JSON.stringify(action.payload || {}),
            action.timestamp,
            action.userId,
            action.userName,
            action.description
        ];

        const result = await dbClient.pool.query(query, values);
        
        if (result.rowCount === 0) {
            return res.status(409).json({ message: 'Acción ya existe' });
        }

        console.log(`✅ Historial guardado: ${action.contextType} ${action.contextId} - ${action.type}`);
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('Error al guardar historial:', error);
        res.status(500).json({ message: 'Error al guardar historial de actividad' });
    }
});

// GET /api/action-history/:contextId - Obtener historial de un contexto específico
app.get('/api/action-history/:contextId', async (req, res) => {
    try {
        const { contextId } = req.params;
        const { contextType, limit } = req.query;

        let query = `
            SELECT 
                id, context_id as "contextId", context_type as "contextType",
                action_type as "type", payload, timestamp,
                user_id as "userId", user_name as "userName", description
            FROM action_history
            WHERE context_id = $1
        `;
        
        const values = [contextId];
        let paramIndex = 2;

        if (contextType) {
            query += ` AND context_type = $${paramIndex}`;
            values.push(contextType);
            paramIndex++;
        }

        query += ` ORDER BY timestamp DESC`;

        if (limit) {
            query += ` LIMIT $${paramIndex}`;
            values.push(parseInt(limit, 10));
        }

        const result = await dbClient.pool.query(query, values);
        
        res.status(200).json(result.rows);
        
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ message: 'Error al obtener historial de actividad' });
    }
});

// GET /api/action-history/user/:userId - Obtener historial de un usuario
app.get('/api/action-history/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit } = req.query;

        const query = `
            SELECT 
                id, context_id as "contextId", context_type as "contextType",
                action_type as "type", payload, timestamp,
                user_id as "userId", user_name as "userName", description
            FROM action_history
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT $2;
        `;

        const result = await dbClient.pool.query(query, [userId, parseInt(limit, 10) || 50]);
        
        res.status(200).json(result.rows);
        
    } catch (error) {
        console.error('Error al obtener historial del usuario:', error);
        res.status(500).json({ message: 'Error al obtener historial del usuario' });
    }
});

// === RUTAS DE CLIENTES ===


// GET /api/clientes - Get all clientes with pagination, sorting, and filtering
app.get('/api/clientes', requirePermission('clientes.view'), async (req, res) => {
    try {
        const { page, limit, sortBy, sortOrder, searchTerm, estado } = req.query;
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20,
            sortBy: sortBy || 'nombre',
            sortOrder: sortOrder || 'ASC',
            searchTerm: searchTerm || '',
            estado: estado || null
        };
        const result = await dbClient.getAllClientes(options);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in GET /api/clientes:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener los clientes." });
    }
});

// GET /api/clientes/simple - Get a simple list of all active clients (for selectors)
app.get('/api/clientes/simple', requireAnyPermission(['clientes.view', 'pedidos.create', 'pedidos.edit']), async (req, res) => {
    try {
        const clientes = await dbClient.getAllClientesSimple();
        res.status(200).json(clientes);
    } catch (error) {
        console.error("Error in GET /api/clientes/simple:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener la lista de clientes." });
    }
});

// GET /api/clientes/stats - Get client statistics
app.get('/api/clientes/stats', requirePermission('clientes.view'), async (req, res) => {
    try {
        const stats = await dbClient.getClienteStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error("Error in GET /api/clientes/stats:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener estadísticas de clientes." });
    }
});

// 🚀 NUEVO: GET /api/clientes/stats/batch - Get statistics for multiple clients in one query
app.get('/api/clientes/stats/batch', requirePermission('clientes.view'), async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) {
            return res.status(400).json({ message: "Se requiere el parámetro 'ids'" });
        }
        
        const clienteIds = ids.split(',').filter(id => id.trim());
        if (clienteIds.length === 0) {
            return res.status(400).json({ message: "No se proporcionaron IDs válidos" });
        }

        const batchStats = await dbClient.getClientesEstadisticasBatch(clienteIds);
        res.status(200).json(batchStats);
    } catch (error) {
        console.error("Error in GET /api/clientes/stats/batch:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener estadísticas en lote." });
    }
});

// GET /api/clientes/:id - Get a single cliente by ID
app.get('/api/clientes/:id', requirePermission('clientes.view'), async (req, res) => {
    try {
        const cliente = await dbClient.getClienteById(req.params.id);
        if (cliente) {
            res.status(200).json(cliente);
        } else {
            res.status(404).json({ message: 'Cliente no encontrado.' });
        }
    } catch (error) {
        console.error(`Error in GET /api/clientes/${req.params.id}:`, error);
        res.status(500).json({ message: "Error interno del servidor al obtener el cliente." });
    }
});

// GET /api/clientes/:id/historial - Get order history for a client
app.get('/api/clientes/:id/historial', requirePermission('clientes.view'), async (req, res) => {
    try {
        const { page, limit } = req.query;
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 10,
        };
        const historial = await dbClient.getClienteHistorialPedidos(req.params.id, options);
        res.status(200).json(historial);
    } catch (error) {
        console.error(`Error in GET /api/clientes/${req.params.id}/historial:`, error);
        res.status(500).json({ message: "Error interno del servidor al obtener el historial." });
    }
});

// GET /api/clientes/:id/pedidos - Get all orders for a client with optional filtering
app.get('/api/clientes/:id/pedidos', async (req, res) => {
    try {
        const { estado } = req.query; // activo, completado, archivado, produccion
        const pedidos = await dbClient.getClientePedidos(req.params.id, estado);
        res.status(200).json(pedidos);
    } catch (error) {
        console.error(`Error in GET /api/clientes/${req.params.id}/pedidos:`, error);
        res.status(500).json({ message: "Error interno del servidor al obtener los pedidos del cliente." });
    }
});

// GET /api/clientes/:id/estadisticas - Get statistics for a client
app.get('/api/clientes/:id/estadisticas', async (req, res) => {
    try {
        const estadisticas = await dbClient.getClienteEstadisticas(req.params.id);
        res.status(200).json(estadisticas);
    } catch (error) {
        console.error(`Error in GET /api/clientes/${req.params.id}/estadisticas:`, error);
        res.status(500).json({ message: "Error interno del servidor al obtener las estadísticas del cliente." });
    }
});

// POST /api/clientes - Create a new cliente
app.post('/api/clientes', requirePermission('clientes.create'), async (req, res) => {
    try {
        console.log('🔍 POST /api/clientes - Datos recibidos:', JSON.stringify(req.body, null, 2));
        console.log('🔍 Database initialized:', dbClient.isInitialized);
        
        // Agregar información del usuario para auditoría
        const clienteData = {
            ...req.body,
            _changedBy: req.user?.username || req.user?.displayName || 'Sistema',
            _userRole: req.user?.role || 'SYSTEM'
        };
        
        const newCliente = await dbClient.createCliente(clienteData);
        console.log('✅ Cliente creado exitosamente:', newCliente.id);
        
        broadcastToClients('cliente-created', { cliente: newCliente });
        res.status(201).json(newCliente);
    } catch (error) {
        console.error("❌ Error in POST /api/clientes:");
        console.error("   Error message:", error.message);
        console.error("   Error code:", error.code);
        console.error("   Error detail:", error.detail);
        console.error("   Stack trace:", error.stack);
        res.status(500).json({
            message: "Error interno del servidor al crear el cliente.",
            debug: process.env.NODE_ENV === 'development' ? {
                error: error.message,
                code: error.code,
                detail: error.detail
            } : undefined
        });
    }
});

// PUT /api/clientes/:id - Update an existing cliente
app.put('/api/clientes/:id', requirePermission('clientes.edit'), async (req, res) => {
    try {
        // Agregar información del usuario para auditoría
        const clienteData = {
            ...req.body,
            _changedBy: req.user?.username || req.user?.displayName || 'Sistema',
            _userRole: req.user?.role || 'SYSTEM'
        };
        
        const updatedCliente = await dbClient.updateCliente(req.params.id, clienteData);
        broadcastToClients('cliente-updated', { cliente: updatedCliente });
        res.status(200).json(updatedCliente);
    } catch (error) {
        console.error(`Error in PUT /api/clientes/${req.params.id}:`, error);
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Error interno del servidor al actualizar el cliente." });
    }
});

// DELETE /api/clientes/:id - Soft-delete a cliente (archiva)
app.delete('/api/clientes/:id', requirePermission('clientes.delete'), async (req, res) => {
    try {
        const deletedCliente = await dbClient.deleteCliente(req.params.id);
        broadcastToClients('cliente-deleted', { clienteId: req.params.id, cliente: deletedCliente });
        res.status(200).json({ message: 'Cliente archivado exitosamente.', cliente: deletedCliente });
    } catch (error) {
        console.error(`Error in DELETE /api/clientes/${req.params.id}:`, error);
        res.status(500).json({ message: "Error interno del servidor al archivar el cliente." });
    }
});

// DELETE /api/clientes/:id/permanent - Eliminación permanente de cliente
app.delete('/api/clientes/:id/permanent', requirePermission('clientes.delete'), async (req, res) => {
    try {
        const { deletePedidos } = req.query; // Query param para indicar si eliminar pedidos también
        const shouldDeletePedidos = deletePedidos === 'true';
        
        const result = await dbClient.deleteClientePermanently(req.params.id, shouldDeletePedidos);
        
        // Broadcast para eliminar cliente
        broadcastToClients('cliente-deleted-permanent', { 
            clienteId: req.params.id, 
            cliente: result.cliente,
            pedidosEliminados: result.pedidosEliminados 
        });
        
        // Si se eliminaron pedidos, hacer broadcast para cada uno
        if (result.pedidosEliminadosIds && result.pedidosEliminadosIds.length > 0) {
            result.pedidosEliminadosIds.forEach(pedidoId => {
                broadcastToClients('pedido-deleted', { 
                    pedidoId: pedidoId,
                    deletedByClienteDeletion: true,
                    clienteId: req.params.id
                });
            });
            console.log(`📢 Broadcast enviado para ${result.pedidosEliminadosIds.length} pedidos eliminados`);
        }
        
        res.status(200).json({ 
            message: shouldDeletePedidos 
                ? 'Cliente y sus pedidos eliminados permanentemente.' 
                : 'Cliente eliminado permanentemente.',
            cliente: result.cliente,
            pedidosEliminados: result.pedidosEliminadosIds?.length || 0
        });
    } catch (error) {
        console.error(`Error in DELETE permanent /api/clientes/${req.params.id}:`, error);
        
        // Manejar errores específicos
        if (error.message.includes('pedidos activos')) {
            res.status(409).json({ message: error.message });
        } else if (error.message.includes('no encontrado')) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Error interno del servidor al eliminar el cliente permanentemente." });
        }
    }
});

// GET /api/clientes/:id/history - Obtener historial de cambios de un cliente
app.get('/api/clientes/:id/history', requireAuth, async (req, res) => {
    try {
        if (!dbClient.isInitialized) {
            return res.status(503).json({ message: 'Base de datos no disponible', history: [] });
        }
        
        const history = await dbClient.getClienteHistory(req.params.id);
        res.status(200).json({ history });
    } catch (error) {
        console.error(`Error in GET /api/clientes/${req.params.id}/history:`, error);
        res.status(500).json({ message: "Error al obtener historial del cliente." });
    }
});

// =================================================================
// RUTAS DE VENDEDORES
// =================================================================

// GET /api/vendedores - Obtener todos los vendedores activos
app.get('/api/vendedores', requireAnyPermission(['vendedores.view', 'pedidos.create', 'pedidos.edit']), async (req, res) => {
    try {
        if (!dbClient.isInitialized) {
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'Base de datos no disponible' 
            });
        }
        const vendedores = await dbClient.getAllVendedores();
        res.status(200).json(vendedores);
    } catch (error) {
        console.error('Error in GET /api/vendedores:', error);
        res.status(500).json({ message: "Error interno del servidor al obtener vendedores." });
    }
});

// GET /api/vendedores/:id - Obtener un vendedor por ID
app.get('/api/vendedores/:id', requirePermission('vendedores.view'), async (req, res) => {
    try {
        if (!dbClient.isInitialized) {
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'Base de datos no disponible' 
            });
        }
        const vendedor = await dbClient.getVendedorById(req.params.id);
        if (!vendedor) {
            return res.status(404).json({ message: 'Vendedor no encontrado.' });
        }
        res.status(200).json(vendedor);
    } catch (error) {
        console.error(`Error in GET /api/vendedores/${req.params.id}:`, error);
        res.status(500).json({ message: "Error interno del servidor al obtener el vendedor." });
    }
});

// POST /api/vendedores - Crear un nuevo vendedor
app.post('/api/vendedores', requirePermission('vendedores.create'), async (req, res) => {
    try {
        const { nombre, email, telefono, activo } = req.body;
        
        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({ message: 'El nombre del vendedor es requerido.' });
        }

        if (!dbClient.isInitialized) {
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'Base de datos no disponible' 
            });
        }

        const nuevoVendedor = await dbClient.createVendedor({
            nombre: nombre.trim(),
            email: email || null,
            telefono: telefono || null,
            activo: activo !== undefined ? activo : true,
            _changedBy: req.user?.username || req.user?.displayName || 'Sistema',
            _userRole: req.user?.role || 'SYSTEM'
        });

        // 🔥 EVENTO WEBSOCKET: Nuevo vendedor creado
        broadcastToClients('vendedor-created', {
            vendedor: nuevoVendedor,
            message: `Nuevo vendedor creado: ${nuevoVendedor.nombre}`
        });

        res.status(201).json(nuevoVendedor);
    } catch (error) {
        console.error('Error in POST /api/vendedores:', error);
        
        if (error.message && error.message.includes('duplicate key')) {
            return res.status(409).json({ message: 'Ya existe un vendedor con ese nombre.' });
        }
        
        res.status(500).json({ message: "Error interno del servidor al crear el vendedor." });
    }
});

// PUT /api/vendedores/:id - Actualizar un vendedor
app.put('/api/vendedores/:id', requirePermission('vendedores.edit'), async (req, res) => {
    try {
        const { nombre, email, telefono, activo } = req.body;
        const vendedorId = req.params.id;

        if (!dbClient.isInitialized) {
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'Base de datos no disponible' 
            });
        }

        const vendedorActualizado = await dbClient.updateVendedor(vendedorId, {
            nombre: nombre?.trim(),
            email,
            telefono,
            activo,
            _changedBy: req.user?.username || req.user?.displayName || 'Sistema',
            _userRole: req.user?.role || 'SYSTEM'
        });

        if (!vendedorActualizado) {
            return res.status(404).json({ message: 'Vendedor no encontrado.' });
        }

        // 🔥 EVENTO WEBSOCKET: Vendedor actualizado
        broadcastToClients('vendedor-updated', {
            vendedor: vendedorActualizado,
            message: `Vendedor actualizado: ${vendedorActualizado.nombre}`
        });

        res.status(200).json(vendedorActualizado);
    } catch (error) {
        console.error(`Error in PUT /api/vendedores/${req.params.id}:`, error);
        
        if (error.message && error.message.includes('duplicate key')) {
            return res.status(409).json({ message: 'Ya existe un vendedor con ese nombre.' });
        }
        
        res.status(500).json({ message: "Error interno del servidor al actualizar el vendedor." });
    }
});

// DELETE /api/vendedores/:id - Eliminar/desactivar un vendedor
app.delete('/api/vendedores/:id', requirePermission('vendedores.delete'), async (req, res) => {
    try {
        const vendedorId = req.params.id;

        if (!dbClient.isInitialized) {
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'Base de datos no disponible' 
            });
        }

        // Obtener el vendedor antes de eliminarlo
        const vendedor = await dbClient.getVendedorById(vendedorId);
        
        if (!vendedor) {
            return res.status(404).json({ message: 'Vendedor no encontrado.' });
        }

        await dbClient.deleteVendedor(vendedorId);

        // 🔥 EVENTO WEBSOCKET: Vendedor eliminado
        broadcastToClients('vendedor-deleted', {
            vendedorId,
            vendedor,
            message: `Vendedor eliminado: ${vendedor.nombre}`
        });

        res.status(204).send();
    } catch (error) {
        console.error(`Error in DELETE /api/vendedores/${req.params.id}:`, error);
        res.status(500).json({ message: "Error interno del servidor al eliminar el vendedor." });
    }
});

// GET /api/vendedores/:id/pedidos - Obtener pedidos de un vendedor con filtros opcionales
app.get('/api/vendedores/:id/pedidos', async (req, res) => {
    try {
        const { estado } = req.query; // activo, completado, archivado, produccion
        const pedidos = await dbClient.getVendedorPedidos(req.params.id, estado);
        res.status(200).json(pedidos);
    } catch (error) {
        console.error(`Error in GET /api/vendedores/${req.params.id}/pedidos:`, error);
        res.status(500).json({ message: "Error interno del servidor al obtener los pedidos del vendedor." });
    }
});

// GET /api/vendedores/:id/estadisticas - Obtener estadísticas de un vendedor
app.get('/api/vendedores/:id/estadisticas', async (req, res) => {
    try {
        const estadisticas = await dbClient.getVendedorEstadisticas(req.params.id);
        res.status(200).json(estadisticas);
    } catch (error) {
        console.error(`Error in GET /api/vendedores/${req.params.id}/estadisticas:`, error);
        res.status(500).json({ message: "Error interno del servidor al obtener las estadísticas del vendedor." });
    }
});

// 🚀 NUEVO: GET /api/vendedores/stats/batch - Get statistics for multiple vendedores in one query
app.get('/api/vendedores/stats/batch', requirePermission('vendedores.view'), async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) {
            return res.status(400).json({ message: "Se requiere el parámetro 'ids'" });
        }
        
        const vendedorIds = ids.split(',').filter(id => id.trim());
        if (vendedorIds.length === 0) {
            return res.status(400).json({ message: "No se proporcionaron IDs válidos" });
        }

        const batchStats = await dbClient.getVendedoresEstadisticasBatch(vendedorIds);
        res.status(200).json(batchStats);
    } catch (error) {
        console.error("Error in GET /api/vendedores/stats/batch:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener estadísticas en lote." });
    }
});

// GET /api/vendedores/:id/history - Obtener historial de cambios de un vendedor
app.get('/api/vendedores/:id/history', requireAuth, async (req, res) => {
    try {
        if (!dbClient.isInitialized) {
            return res.status(503).json({ message: 'Base de datos no disponible', history: [] });
        }
        
        const history = await dbClient.getVendedorHistory(req.params.id);
        res.status(200).json({ history });
    } catch (error) {
        console.error(`Error in GET /api/vendedores/${req.params.id}/history:`, error);
        res.status(500).json({ message: "Error al obtener historial del vendedor." });
    }
});


// =================================================================
// RUTAS DE MATERIALES
// =================================================================

// GET /api/materiales - Obtener todos los materiales
app.get('/api/materiales', async (req, res) => {
    try {
        const materiales = await dbClient.getAllMateriales();
        console.log(`✅ Materiales obtenidos: ${materiales.length}`);
        res.status(200).json(materiales);
    } catch (error) {
        console.error('Error in GET /api/materiales:', error);
        res.status(500).json({ 
            message: "Error al obtener materiales",
            error: error.message 
        });
    }
});

// GET /api/materiales/:id - Obtener un material específico
app.get('/api/materiales/:id', async (req, res) => {
    try {
        const material = await dbClient.getMaterialById(parseInt(req.params.id));
        res.status(200).json(material);
    } catch (error) {
        console.error(`Error in GET /api/materiales/${req.params.id}:`, error);
        const statusCode = error.message.includes('no encontrado') ? 404 : 500;
        res.status(statusCode).json({ 
            message: error.message 
        });
    }
});

// POST /api/materiales - Crear un nuevo material
app.post('/api/materiales', requirePermission('pedidos.create'), async (req, res) => {
    try {
        const { numero, descripcion, pendienteRecibir, pendienteGestion } = req.body;
        
        // Validación
        if (!numero || numero.trim() === '') {
            return res.status(400).json({ 
                message: 'El número de material es requerido' 
            });
        }
        
        const materialData = {
            numero: numero.trim(),
            descripcion: descripcion?.trim(),
            pendienteRecibir: pendienteRecibir !== undefined ? Boolean(pendienteRecibir) : true,
            pendienteGestion: pendienteGestion !== undefined ? Boolean(pendienteGestion) : true
        };
        
        const newMaterial = await dbClient.createMaterial(materialData);
        
        // 🔥 EVENTO WEBSOCKET: Material creado
        io.emit('material-created', newMaterial);
        
        res.status(201).json(newMaterial);
    } catch (error) {
        console.error('Error in POST /api/materiales:', error);
        const statusCode = error.message.includes('ya existe') ? 409 : 500;
        res.status(statusCode).json({ 
            message: error.message 
        });
    }
});

// PUT /api/materiales/:id - Actualizar un material
app.put('/api/materiales/:id', requirePermission('pedidos.edit'), async (req, res) => {
    try {
        const { id } = req.params;
        const { numero, descripcion, pendienteRecibir, pendienteGestion } = req.body;
        
        const updates = {
            numero: numero?.trim(),
            descripcion: descripcion?.trim(),
            pendienteRecibir,
            pendienteGestion
        };
        
        // 🔄 LÓGICA DE TRANSICIÓN: Si se marca como recibido, forzar gestionado
        if (updates.pendienteRecibir === false) {
            updates.pendienteGestion = false;
        }
        
        const updatedMaterial = await dbClient.updateMaterial(parseInt(id), updates);
        
        // 🔥 EVENTO WEBSOCKET: Material actualizado
        io.emit('material-updated', updatedMaterial);
        
        res.status(200).json(updatedMaterial);
    } catch (error) {
        console.error(`Error in PUT /api/materiales/${req.params.id}:`, error);
        const statusCode = error.message.includes('no encontrado') ? 404 
                         : error.message.includes('ya existe') ? 409 
                         : 500;
        res.status(statusCode).json({ 
            message: error.message 
        });
    }
});

// DELETE /api/materiales/:id - Eliminar un material
app.delete('/api/materiales/:id', requirePermission('pedidos.delete'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const deleteResult = await dbClient.deleteMaterial(parseInt(id));
        
        // 🔥 EVENTO WEBSOCKET: Material eliminado (con pedidoId para sincronizar caché)
        io.emit('material-deleted', { 
            materialId: parseInt(id),
            pedidoId: deleteResult?.pedidoId || null 
        });
        
        res.status(204).send();
    } catch (error) {
        console.error(`Error in DELETE /api/materiales/${req.params.id}:`, error);
        const statusCode = error.message.includes('no encontrado') ? 404 : 500;
        res.status(statusCode).json({ 
            message: error.message 
        });
    }
});

// GET /api/pedidos/:id/materiales - Obtener materiales de un pedido
app.get('/api/pedidos/:id/materiales', async (req, res) => {
    try {
        const materiales = await dbClient.getMaterialesByPedidoId(req.params.id);
        console.log(`📦 GET /api/pedidos/${req.params.id}/materiales → ${materiales.length} materiales encontrados`);
        res.status(200).json(materiales);
    } catch (error) {
        console.error(`Error in GET /api/pedidos/${req.params.id}/materiales:`, error);
        res.status(500).json({ 
            message: "Error al obtener materiales del pedido",
            error: error.message 
        });
    }
});

// POST /api/pedidos/:pedidoId/materiales/:materialId - Asignar material a pedido
app.post('/api/pedidos/:pedidoId/materiales/:materialId', requirePermission('pedidos.edit'), async (req, res) => {
    try {
        const { pedidoId, materialId } = req.params;
        
        await dbClient.assignMaterialToPedido(pedidoId, parseInt(materialId));
        
        // 🔥 EVENTO WEBSOCKET: Material asignado
        io.emit('material-assigned', { 
            pedidoId, 
            materialId: parseInt(materialId) 
        });
        
        res.status(204).send();
    } catch (error) {
        console.error(`Error in POST /api/pedidos/${req.params.pedidoId}/materiales/${req.params.materialId}:`, error);
        res.status(500).json({ 
            message: "Error al asignar material al pedido",
            error: error.message 
        });
    }
});

// DELETE /api/pedidos/:pedidoId/materiales/:materialId - Desasignar material de pedido
app.delete('/api/pedidos/:pedidoId/materiales/:materialId', requirePermission('pedidos.edit'), async (req, res) => {
    try {
        const { pedidoId, materialId } = req.params;
        
        await dbClient.unassignMaterialFromPedido(pedidoId, parseInt(materialId));
        
        // 🔥 EVENTO WEBSOCKET: Material desasignado
        io.emit('material-unassigned', { 
            pedidoId, 
            materialId: parseInt(materialId) 
        });
        
        res.status(204).send();
    } catch (error) {
        console.error(`Error in DELETE /api/pedidos/${req.params.pedidoId}/materiales/${req.params.materialId}:`, error);
        res.status(500).json({ 
            message: "Error al desasignar material del pedido",
            error: error.message 
        });
    }
});


// =================================================================
// RUTAS DE TEMPLATES DE OBSERVACIONES
// =================================================================

// GET /api/observaciones/templates - Obtener todos los templates activos
app.get('/api/observaciones/templates', async (req, res) => {
    try {
        const templates = await dbClient.getAllObservacionesTemplates();
        res.status(200).json(templates);
    } catch (error) {
        console.error('Error in GET /api/observaciones/templates:', error);
        res.status(500).json({ 
            message: "Error al obtener templates de observaciones",
            error: error.message 
        });
    }
});

// GET /api/observaciones/templates/search - Buscar templates por texto
app.get('/api/observaciones/templates/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length === 0) {
            return res.status(200).json([]);
        }
        
        const templates = await dbClient.searchObservacionesTemplates(q.trim());
        res.status(200).json(templates);
    } catch (error) {
        console.error('Error in GET /api/observaciones/templates/search:', error);
        res.status(500).json({ 
            message: "Error al buscar templates",
            error: error.message 
        });
    }
});

// POST /api/observaciones/templates - Crear o incrementar uso de un template
app.post('/api/observaciones/templates', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ 
                message: 'El texto del template es requerido' 
            });
        }
        
        if (text.trim().length > 100) {
            return res.status(400).json({ 
                message: 'El texto no puede exceder 100 caracteres' 
            });
        }
        
        const template = await dbClient.upsertObservacionTemplate(text.trim());
        
        // 🔥 EVENTO WEBSOCKET: Template creado/actualizado
        io.emit('observacion-template-updated', template);
        
        res.status(201).json(template);
    } catch (error) {
        console.error('Error in POST /api/observaciones/templates:', error);
        res.status(500).json({ 
            message: error.message 
        });
    }
});

// DELETE /api/observaciones/templates/:id - Eliminar un template
app.delete('/api/observaciones/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedTemplate = await dbClient.deleteObservacionTemplate(parseInt(id));
        
        // 🔥 EVENTO WEBSOCKET: Template eliminado
        io.emit('observacion-template-deleted', { id: parseInt(id) });
        
        res.status(200).json(deletedTemplate);
    } catch (error) {
        console.error(`Error in DELETE /api/observaciones/templates/${req.params.id}:`, error);
        const statusCode = error.message.includes('no encontrado') ? 404 : 500;
        res.status(statusCode).json({ 
            message: error.message 
        });
    }
});


// =================================================================
// RUTAS ADMINISTRATIVAS
// =================================================================

// Aplicar rate limiting a todas las rutas admin
app.use('/api/admin', adminLimiter);

// Aplicar rate limiting especial al login
app.use('/api/admin/auth/login', loginLimiter);

// Rutas de autenticación administrativa (comentadas temporalmente)
// app.use('/api/admin/auth', adminAuthRoutes);

// Rutas de gestión de usuarios (comentadas temporalmente)
// app.use('/api/admin/users', adminUserRoutes);

// Rutas de gestión de usuarios del sistema principal (comentadas temporalmente)
// app.use('/api/admin/main-users', adminMainSystemUsersRoutes);

// Ruta para obtener datos del dashboard administrativo
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        // Verificar que la BD está disponible
        if (!dbClient.isInitialized || !dbClient.pool) {
            console.error('🚨 BD no disponible - rechazando consulta de dashboard');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        // Verificar si las tablas admin existen antes de usarlas
        try {
            // Intentar hacer una consulta simple para verificar si las tablas existen
            await dbClient.pool.query("SELECT 1 FROM admin_users LIMIT 1");
        } catch (error) {
            console.error('🚨 Tablas de admin no disponibles');
            return res.status(503).json({ 
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.' 
            });
        }

        const dashboardData = await dbClient.getAdminDashboardData();
        const systemHealth = await dbClient.getSystemHealth();
        const recentAuditLogs = await dbClient.getRecentAuditLogs(10);
        const activeUsers = await dbClient.getUserActivity();

        res.json({
            stats: dashboardData.stats,
            systemHealth: systemHealth,
            recentAuditLogs: recentAuditLogs,
            activeUsers: activeUsers.slice(0, 10)
        });
    } catch (error) {
        console.error('Error al obtener datos del dashboard:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Ruta para obtener logs de auditoría
app.get('/api/admin/audit-logs', async (req, res) => {
    try {
        const { page = 1, limit = 50, userId, action, module, startDate, endDate } = req.query;
        
        const filters = {};
        if (userId) filters.userId = userId;
        if (action) filters.action = action;
        if (module) filters.module = module;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const result = await dbClient.getAuditLogs(
            parseInt(page), 
            parseInt(limit), 
            filters
        );

        res.json(result);
    } catch (error) {
        console.error('Error al obtener logs de auditoría:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Ruta para obtener estado del sistema
app.get('/api/admin/health', async (req, res) => {
    try {
        const health = await dbClient.getSystemHealth();
        
        // Agregar información de WebSocket
        health.websocket.connections = io.engine.clientsCount;
        
        res.json(health);
    } catch (error) {
        console.error('Error al obtener estado del sistema:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Ruta para obtener estadísticas del sistema
app.get('/api/admin/stats', async (req, res) => {
    try {
        const dashboardData = await dbClient.getAdminDashboardData();
        res.json(dashboardData.stats);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Rutas de integridad de datos
app.get('/api/admin/data-integrity/run-checks', requirePermission('usuarios.admin'), async (req, res) => {
    try {
        const results = await dbClient.runDataIntegrityChecks();
        res.status(200).json(results);
    } catch (error) {
        console.error('Error ejecutando chequeos de integridad:', error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

app.post('/api/admin/data-integrity/fix-missing-client-ids', requirePermission('usuarios.admin'), async (req, res) => {
    try {
        const result = await dbClient.fixMissingClientIds();
        res.status(200).json({ message: `${result.updatedCount} pedidos han sido actualizados.`, ...result });
    } catch (error) {
        console.error('Error arreglando IDs de cliente faltantes:', error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

// --- COMENTARIOS ROUTES ---

// Obtener comentarios de un pedido
app.get('/api/comments/:pedidoId', requireAuth, async (req, res) => {
    try {
        const { pedidoId } = req.params;
        
        // Verificar que la BD está disponible
        if (!dbClient.isInitialized || !dbClient.pool) {
            console.error('🚨 BD no disponible - rechazando consulta de comentarios');
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.'
            });
        }
        
        // Verificar si la columna mentioned_users existe
        const columnCheckResult = await dbClient.pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'pedido_comments' 
                AND column_name = 'mentioned_users'
            ) as column_exists;
        `);
        
        const hasMentionedUsersColumn = columnCheckResult.rows[0]?.column_exists || false;

        let result;
        if (hasMentionedUsersColumn) {
            result = await dbClient.pool.query(`
                SELECT 
                    id,
                    pedido_id as "pedidoId",
                    user_id as "userId", 
                    user_role as "userRole",
                    username,
                    message,
                    mentioned_users as "mentionedUsers",
                    is_system_message as "isSystemMessage",
                    is_edited as "isEdited",
                    edited_at as "editedAt",
                    created_at as "timestamp"
                FROM pedido_comments 
                WHERE pedido_id = $1 
                ORDER BY created_at ASC
            `, [pedidoId]);
        } else {
            // Sin columna mentioned_users (retrocompatibilidad)
            result = await dbClient.pool.query(`
                SELECT 
                    id,
                    pedido_id as "pedidoId",
                    user_id as "userId", 
                    user_role as "userRole",
                    username,
                    message,
                    is_system_message as "isSystemMessage",
                    is_edited as "isEdited",
                    edited_at as "editedAt",
                    created_at as "timestamp"
                FROM pedido_comments 
                WHERE pedido_id = $1 
                ORDER BY created_at ASC
            `, [pedidoId]);
        }

        res.json({
            success: true,
            comments: result.rows
        });
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener comentarios'
        });
    }
});

// Crear un nuevo comentario
app.post('/api/comments', requireAuth, async (req, res) => {
    try {
        const { pedidoId, message, userId, userRole, username, mentionedUsers = [] } = req.body;
        const userFromToken = req.user;

        // Validaciones
        if (!pedidoId || !message?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El pedidoId y mensaje son requeridos'
            });
        }

        // Validar límite de menciones (máximo 5)
        if (mentionedUsers.length > 5) {
            return res.status(400).json({
                success: false,
                error: 'Máximo 5 menciones permitidas por comentario'
            });
        }

        // Verificar que la BD está disponible
        if (!dbClient.isInitialized || !dbClient.pool) {
            console.error('🚨 BD no disponible - rechazando creación de comentario');
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.'
            });
        }

        // Usar datos del token para seguridad
        const finalUserId = userFromToken.id || userId;
        const finalUserRole = userFromToken.role || userRole;
        const finalUsername = userFromToken.username || username;

        // Validar que finalUserId es un UUID válido, si no, generar uno temporal
        let validUserId = finalUserId;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(finalUserId)) {
            // Si no es un UUID válido (ej: "4" en modo desarrollo), usar un UUID temporal basado en el ID
            // Esto asegura consistencia para el mismo usuario sin generar conflictos
            const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID namespace estándar
            validUserId = uuidv5(String(finalUserId), namespace);
            console.log(`🔄 Convirtiendo user_id "${finalUserId}" a UUID: ${validUserId}`);
        }

        // Verificar si la columna mentioned_users existe
        const columnCheckResult = await dbClient.pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'pedido_comments' 
                AND column_name = 'mentioned_users'
            ) as column_exists;
        `);
        
        const hasMentionedUsersColumn = columnCheckResult.rows[0]?.column_exists || false;

        // Convertir mentionedUsers a JSONB
        const mentionedUsersJson = JSON.stringify(mentionedUsers);

        let result;
        if (hasMentionedUsersColumn) {
            // Versión con soporte para menciones
            result = await dbClient.pool.query(`
                INSERT INTO pedido_comments (
                    pedido_id, user_id, user_role, username, message, mentioned_users, is_system_message
                ) VALUES ($1, $2, $3, $4, $5, $6, false)
                RETURNING 
                    id,
                    pedido_id as "pedidoId",
                    user_id as "userId",
                    user_role as "userRole", 
                    username,
                    message,
                    mentioned_users as "mentionedUsers",
                    is_system_message as "isSystemMessage",
                    created_at as "timestamp"
            `, [pedidoId, validUserId, finalUserRole, finalUsername, message.trim(), mentionedUsersJson]);
        } else {
            // Versión sin menciones (retrocompatibilidad)
            result = await dbClient.pool.query(`
                INSERT INTO pedido_comments (
                    pedido_id, user_id, user_role, username, message, is_system_message
                ) VALUES ($1, $2, $3, $4, $5, false)
                RETURNING 
                    id,
                    pedido_id as "pedidoId",
                    user_id as "userId",
                    user_role as "userRole", 
                    username,
                    message,
                    is_system_message as "isSystemMessage",
                    created_at as "timestamp"
            `, [pedidoId, validUserId, finalUserRole, finalUsername, message.trim()]);
        }

        const newComment = result.rows[0];

        // Crear notificaciones para usuarios mencionados (solo si la columna existe y hay menciones)
        if (hasMentionedUsersColumn && mentionedUsers && mentionedUsers.length > 0) {
            for (const mentionedUser of mentionedUsers) {
                try {
                    // No crear notificación si el usuario se menciona a sí mismo
                    // (aunque permitimos auto-menciones, no hace falta notificar)
                    if (mentionedUser.id === validUserId) {
                        continue;
                    }

                    const notificationId = `mention-${newComment.id}-${mentionedUser.id}-${Date.now()}`;
                    
                    await dbClient.pool.query(`
                        INSERT INTO notifications (
                            id, type, title, message, timestamp, read, 
                            pedido_id, user_id, metadata
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    `, [
                        notificationId,
                        'mention',
                        `${finalUsername} te mencionó`,
                        `"${message.trim().substring(0, 100)}${message.trim().length > 100 ? '...' : ''}"`,
                        new Date(),
                        false,
                        pedidoId,
                        mentionedUser.id,
                        JSON.stringify({
                            commentId: newComment.id,
                            mentionedBy: {
                                id: validUserId,
                                username: finalUsername
                            },
                            comment: message.trim()
                        })
                    ]);

                    // Emitir evento WebSocket de nueva notificación SOLO al usuario mencionado
                    const notificationPayload = {
                        id: notificationId,
                        type: 'mention',
                        title: `${finalUsername} te mencionó`,
                        message: `"${message.trim().substring(0, 100)}${message.trim().length > 100 ? '...' : ''}"`,
                        timestamp: new Date(),
                        read: false,
                        pedidoId: pedidoId,
                        userId: mentionedUser.id,
                        metadata: {
                            commentId: newComment.id,
                            mentionedBy: {
                                id: validUserId,
                                username: finalUsername
                            },
                            comment: message.trim()
                        }
                    };

                    // Emitir solo a las sesiones del usuario mencionado
                    const targetSockets = Array.from(io.sockets.sockets.values())
                        .filter(socket => socket.userId === mentionedUser.id);
                    
                    targetSockets.forEach(socket => {
                        socket.emit('notification:new', notificationPayload);
                    });

                    console.log(`📧 Notificación de mención enviada a ${mentionedUser.username} (${targetSockets.length} sesiones activas)`);
                } catch (notifError) {
                    console.error(`Error creando notificación de mención para ${mentionedUser.username}:`, notifError);
                    // Continuar aunque falle la notificación
                }
            }
        }

        // Emitir evento WebSocket del comentario
        io.emit('comment:added', newComment);

        // Log de auditoría
        await dbClient.pool.query(`
            INSERT INTO audit_logs (user_id, username, action, module, details, ip_address, user_agent, affected_resource)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            validUserId,
            finalUsername,
            'COMMENT_CREATED',
            'COMMENTS',
            `Comentario agregado al pedido ${pedidoId}${mentionedUsers.length > 0 ? ` mencionando a ${mentionedUsers.length} usuario(s)` : ''}`,
            req.ip,
            req.get('User-Agent'),
            newComment.id
        ]);

        res.status(201).json({
            success: true,
            comment: newComment
        });
    } catch (error) {
        console.error('Error al crear comentario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear comentario'
        });
    }
});

// Eliminar un comentario
app.delete('/api/comments/:commentId', requireAuth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userFromToken = req.user;

        // Verificar que la BD está disponible
        if (!dbClient.isInitialized || !dbClient.pool) {
            console.error('🚨 BD no disponible - rechazando eliminación de comentario');
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'El sistema no está disponible. Por favor, contacte al administrador.'
            });
        }

        // Verificar que el comentario existe y obtener info
        const commentResult = await dbClient.pool.query(`
            SELECT user_id, pedido_id, username 
            FROM pedido_comments 
            WHERE id = $1
        `, [commentId]);

        if (commentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Comentario no encontrado'
            });
        }

        const comment = commentResult.rows[0];
        const canDelete = comment.user_id === userFromToken.id || 
                         userFromToken.role === 'ADMIN' || 
                         userFromToken.role === 'Administrador';

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para eliminar este comentario'
            });
        }

        // Eliminar comentario
        await dbClient.pool.query('DELETE FROM pedido_comments WHERE id = $1', [commentId]);

        // Emitir evento WebSocket
        io.emit('comment:deleted', {
            commentId,
            pedidoId: comment.pedido_id
        });

        // Log de auditoría
        await dbClient.pool.query(`
            INSERT INTO audit_logs (user_id, username, action, module, details, ip_address, user_agent, affected_resource)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            userFromToken.id,
            userFromToken.username,
            'COMMENT_DELETED',
            'COMMENTS',
            `Comentario eliminado del pedido ${comment.pedido_id}`,
            req.ip,
            req.get('User-Agent'),
            commentId
        ]);

        res.json({
            success: true,
            message: 'Comentario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar comentario'
        });
    }
});

// --- SERVER START ---
const PORT = process.env.PORT || 3001;

// Catch-all handler for frontend routing (aplicación principal) - DEBE IR AL FINAL
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Initialize and start server
async function startServer() {
    try {
        // Intentar inicializar PostgreSQL
        if (process.env.DATABASE_URL || process.env.DB_HOST || process.env.POSTGRES_HOST) {
            console.log('🔄 Intentando conectar a PostgreSQL...');
            await dbClient.init();
            console.log('🐘 PostgreSQL conectado exitosamente');
            
            // 🔴 CRÍTICO: Configurar el dbClient en los middlewares
            setAuthDbClient(dbClient);
            setPermissionsDbClient(dbClient);
            setDbHealthClient(dbClient);
            console.log('✅ dbClient compartido con middlewares');

            // 🔄 Ejecutar migraciones automáticamente en startup
            try {
                console.log('🔄 Verificando y aplicando migraciones pendientes...');
                
                // Verificar si la columna mentioned_users existe
                const checkColumnQuery = `
                    SELECT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'pedido_comments' 
                        AND column_name = 'mentioned_users'
                    ) as column_exists;
                `;
                const checkResult = await dbClient.pool.query(checkColumnQuery);
                const columnExists = checkResult.rows[0]?.column_exists;

                if (!columnExists) {
                    console.log('📝 Aplicando migración 032: Sistema de menciones...');
                    
                    // Aplicar migración 032
                    await dbClient.pool.query(`
                        -- Agregar columna mentioned_users si no existe
                        DO $$ 
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM information_schema.columns 
                                WHERE table_name = 'pedido_comments' 
                                AND column_name = 'mentioned_users'
                            ) THEN
                                ALTER TABLE pedido_comments 
                                ADD COLUMN mentioned_users JSONB DEFAULT '[]'::jsonb;
                                
                                COMMENT ON COLUMN pedido_comments.mentioned_users IS 
                                'Array de user_ids mencionados con @ en el comentario (máximo 5)';
                            END IF;
                        END $$;

                        -- Crear índice GIN para búsquedas eficientes
                        CREATE INDEX IF NOT EXISTS idx_pedido_comments_mentioned_users 
                        ON pedido_comments USING GIN (mentioned_users);

                        -- Función para obtener comentarios donde un usuario fue mencionado
                        CREATE OR REPLACE FUNCTION get_comments_mentioning_user(target_user_id UUID)
                        RETURNS TABLE (
                            id UUID,
                            pedido_id UUID,
                            user_id UUID,
                            comentario TEXT,
                            mentioned_users JSONB,
                            created_at TIMESTAMP WITH TIME ZONE
                        ) AS $$
                        BEGIN
                            RETURN QUERY
                            SELECT 
                                pc.id,
                                pc.pedido_id,
                                pc.user_id,
                                pc.comentario,
                                pc.mentioned_users,
                                pc.created_at
                            FROM pedido_comments pc
                            WHERE mentioned_users @> to_jsonb(ARRAY[target_user_id::text])
                            ORDER BY pc.created_at DESC;
                        END;
                        $$ LANGUAGE plpgsql;
                    `);
                    
                    console.log('✅ Migración 032 aplicada exitosamente');
                } else {
                    console.log('✅ Migración 032 ya aplicada previamente');
                }

                // ===== MIGRACIÓN 033: Checkbox Horas Confirmadas =====
                const checkHorasQuery = `
                    SELECT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'pedidos' 
                        AND column_name = 'horas_confirmadas'
                    ) as column_exists;
                `;
                const checkHorasResult = await dbClient.pool.query(checkHorasQuery);
                const horasColumnExists = checkHorasResult.rows[0]?.column_exists;

                if (!horasColumnExists) {
                    console.log('📝 Aplicando migración 033: Checkbox Horas Confirmadas...');
                    await dbClient.pool.query(`
                        ALTER TABLE pedidos ADD COLUMN horas_confirmadas BOOLEAN DEFAULT false;
                        COMMENT ON COLUMN pedidos.horas_confirmadas IS 'Indica si las horas de cliché han sido confirmadas';
                    `);
                    console.log('✅ Migración 033 aplicada exitosamente');
                } else {
                    console.log('✅ Migración 033 ya aplicada previamente');
                }
            } catch (migrationError) {
                console.error('⚠️ Error al aplicar migraciones automáticas:', migrationError.message);
                // No detener el servidor, continuar con retrocompatibilidad
            }

        } else {
            console.log('⚠️ No se encontró configuración de base de datos');
        }
        
    } catch (error) {
        console.error('❌ Error al conectar a PostgreSQL:', error.message);
        console.error('🚨 El servidor no puede continuar sin base de datos');
        process.exit(1);
    }

    // Iniciar el servidor HTTP
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
        console.log('✅ PostgreSQL conectado - Sistema operativo');
    });
}

// Start the server
startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await dbClient.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await dbClient.close();
    process.exit(0);
});
// Force deploy Thu Sep  4 15:22:25 UTC 2025

