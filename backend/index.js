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
const PostgreSQLClient = require('./postgres-client');

// Importar rutas administrativas
const adminAuthRoutes = require('./admin/routes/auth');
const adminUserRoutes = require('./admin/routes/users');

// Inicializar el cliente de PostgreSQL
const dbClient = new PostgreSQLClient();

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
                "http://localhost:5174",
                "http://localhost:3001" // Admin panel
            ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
    },
    // Configuración específica para producción con proxy
    transports: process.env.NODE_ENV === 'production' 
        ? ['polling', 'websocket'] 
        : ['websocket', 'polling'],
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

// Rate limiting para rutas administrativas
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

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

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://planning.pigmea.click', 'https://www.planning.pigmea.click']
        : [
            "http://localhost:3000", 
            "http://localhost:5173",
            "http://localhost:5174", 
            "http://localhost:3001"
        ],
    credentials: true
}));

app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
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
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
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

// Función para reset completo de usuarios conectados
function resetConnectedUsers() {
    connectedUsers.clear();
    io.emit('users-list', { connectedUsers: [] });
}

io.on('connection', (socket) => {
    // Manejar autenticación del usuario
    socket.on('authenticate', (userData) => {
        const { userId, userRole } = userData;
        connectedUsers.set(userId, {
            socketId: socket.id,
            userRole: userRole || 'Operador',
            joinedAt: new Date().toISOString()
        });
        
        socket.userId = userId;
        socket.userRole = userRole;
        
        // Notificar a otros usuarios sobre la nueva conexión
        socket.broadcast.emit('user-connected', {
            userId,
            userRole,
            connectedUsers: Array.from(connectedUsers.entries()).map(([id, data]) => ({
                userId: id,
                userRole: data.userRole,
                joinedAt: data.joinedAt
            }))
        });
        
        // Enviar lista de usuarios conectados al usuario que se acaba de conectar
        socket.emit('users-list', {
            connectedUsers: Array.from(connectedUsers.entries()).map(([id, data]) => ({
                userId: id,
                userRole: data.userRole,
                joinedAt: data.joinedAt
            }))
        });
    });
    
    // Manejar desconexión
    socket.on('disconnect', () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
            
            // Notificar a otros usuarios sobre la desconexión
            socket.broadcast.emit('user-disconnected', {
                userId: socket.userId,
                connectedUsers: Array.from(connectedUsers.entries()).map(([id, data]) => ({
                    userId: id,
                    userRole: data.userRole,
                    joinedAt: data.joinedAt
                }))
            });
        }
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

// --- API ROUTES ---

// === RUTAS DE AUTENTICACIÓN ===

// POST /api/auth/login - Autenticar usuario
app.post('/api/auth/login', async (req, res) => {
    console.log('🔐 Petición de login recibida:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            console.log('❌ Faltan credenciales');
            return res.status(400).json({ 
                error: 'Usuario y contraseña son requeridos' 
            });
        }

        // Si tenemos base de datos inicializada, usarla
        if (dbClient.isInitialized) {
            console.log('🗄️ Usando autenticación con base de datos');
            
            // Primero buscar en admin_users
            let user = await dbClient.getAdminUserByUsername(username);
            let isAdminUser = true;
            
            if (!user) {
                // Si no se encuentra en admin_users, buscar en users regulares
                user = await dbClient.findUserByUsername(username);
                isAdminUser = false;
            }
            
            if (!user) {
                console.log(`❌ Usuario no encontrado en BD: ${username}`);
                return res.status(401).json({ 
                    error: 'Usuario no encontrado' 
                });
            }

            console.log('🔍 Usuario encontrado:', { 
                username: user.username, 
                isAdmin: isAdminUser,
                role: user.role || 'user'
            });

            // Verificación de contraseña según el tipo de usuario
            let isValidPassword = false;
            
            if (isAdminUser && user.password_hash) {
                // Usuarios admin: usar bcrypt
                console.log('🔐 Verificando contraseña con bcrypt para admin');
                const bcrypt = require('bcryptjs');
                isValidPassword = await bcrypt.compare(password, user.password_hash);
            } else if (!isAdminUser && user.password) {
                // Usuarios regulares: comparación directa
                console.log('🔐 Verificando contraseña directa para usuario regular');
                isValidPassword = (user.password === password);
            }

            console.log('🔍 Resultado verificación:', isValidPassword);

            if (!isValidPassword) {
                console.log(`❌ Contraseña incorrecta para: ${username}`);
                return res.status(401).json({ 
                    error: 'Contraseña incorrecta' 
                });
            }

            // Actualizar último login solo para usuarios admin
            if (isAdminUser) {
                await dbClient.updateUserLastLogin(user.id);
            }

            // Devolver datos del usuario (sin contraseña)
            const userData = {
                id: user.id.toString(), // Convertir a string para frontend
                username: user.username,
                role: user.role,
                displayName: user.display_name || user.username
            };

            console.log(`✅ Login BD exitoso: ${username} (${user.role})`);
            
            res.status(200).json({
                success: true,
                user: userData,
                message: 'Login exitoso'
            });
            return;
        }

        // Fallback: usuarios hardcodeados para desarrollo sin BD
        console.log('⚠️ Usando autenticación de desarrollo (sin BD)');
        const devUsers = {
            'admin': { password: 'admin123', role: 'Administrador', displayName: 'Administrador' },
            'supervisor': { password: 'super123', role: 'Supervisor', displayName: 'Supervisor' },
            'operador': { password: 'oper123', role: 'Operador', displayName: 'Operador' }
        };

        const user = devUsers[username.toLowerCase()];
        
        if (!user || user.password !== password) {
            console.log(`❌ Credenciales incorrectas: ${username}/${password}`);
            return res.status(401).json({ 
                error: 'Credenciales incorrectas' 
            });
        }

        console.log(`✅ Login dev exitoso: ${username}`);
        
        res.status(200).json({
            success: true,
            user: {
                id: Math.random().toString(36).substr(2, 9),
                username: username,
                role: user.role,
                displayName: user.displayName
            },
            message: 'Login exitoso'
        });

    } catch (error) {
        console.error('💥 Error en login:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor' 
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

        // En modo desarrollo sin base de datos, simular registro
        if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL && !process.env.DB_HOST) {
            // En desarrollo, solo permitir registros únicos para esta sesión
            console.log(`✅ Usuario registrado (dev mode): ${username} (${role})`);

            const userData = {
                id: Math.random().toString(36).substr(2, 9),
                username: username.trim(),
                role: role,
                displayName: displayName?.trim() || username.trim()
            };

            res.status(201).json({
                success: true,
                user: userData,
                message: 'Usuario creado exitosamente (modo desarrollo)'
            });
            return;
        }

        // Modo producción - usar base de datos
        // Verificar si el usuario ya existe en ambas tablas
        const existingAdmin = await dbClient.getAdminUserByUsername(username);
        const existingUser = await dbClient.findUserByUsername(username);
        
        if (existingAdmin || existingUser) {
            return res.status(409).json({ 
                error: 'El nombre de usuario ya existe' 
            });
        }

        // Crear nuevo usuario
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newUser = {
            id: userId,
            username: username.trim(),
            password: password, // Sin hash para simplicidad
            role: role,
            displayName: displayName?.trim() || username.trim()
        };

        await dbClient.createUser(newUser);

        // Devolver datos del usuario (sin contraseña)
        const userData = {
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            displayName: newUser.displayName
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
        const users = await dbClient.getAllUsers();
        
        res.status(200).json({
            success: true,
            users: users
        });

    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor' 
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

// GET /api/pedidos - Get all pedidos
app.get('/api/pedidos', async (req, res) => {
    try {
        if (!dbClient.isInitialized) {
            console.log('⚠️ BD no disponible - devolviendo datos mock');
            return res.status(200).json([]);
        }
        
        const pedidos = await dbClient.getAll();
        res.status(200).json(pedidos.sort((a, b) => b.secuenciaPedido - a.secuenciaPedido));
        
    } catch (error) {
        console.error("Error in GET /api/pedidos:", error);
        res.status(500).json({ 
            message: "Error interno del servidor al obtener los pedidos.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        });
    }
});

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
app.post('/api/pedidos', async (req, res) => {
    try {
        const newPedido = req.body;
        
        if (!newPedido || !newPedido.id) {
            return res.status(400).json({ message: 'Datos del pedido inválidos.' });
        }
        
        await dbClient.create(newPedido);
        
        // 🔥 EVENTO WEBSOCKET: Nuevo pedido creado
        broadcastToClients('pedido-created', {
            pedido: newPedido,
            message: `Nuevo pedido creado: ${newPedido.numeroPedidoCliente}`
        });
        
        res.status(201).json(newPedido);
        
    } catch (error) {
        console.error("Error creating pedido:", error);
        res.status(500).json({ message: "Error interno del servidor al crear el pedido." });
    }
});

// PUT /api/pedidos/:id - Update an existing pedido
app.put('/api/pedidos/:id', async (req, res) => {
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
        
        // 🔥 EVENTO WEBSOCKET: Pedido actualizado
        const changes = [];
        if (previousPedido) {
            // Detectar cambios importantes
            if (previousPedido.etapaActual !== updatedPedido.etapaActual) {
                changes.push(`Etapa: ${previousPedido.etapaActual} → ${updatedPedido.etapaActual}`);
            }
            if (previousPedido.prioridad !== updatedPedido.prioridad) {
                changes.push(`Prioridad: ${previousPedido.prioridad} → ${updatedPedido.prioridad}`);
            }
            if (previousPedido.cliente !== updatedPedido.cliente) {
                changes.push(`Cliente: ${previousPedido.cliente} → ${updatedPedido.cliente}`);
            }
        }
        
        broadcastToClients('pedido-updated', {
            pedido: updatedPedido,
            previousPedido,
            changes,
            message: `Pedido actualizado: ${updatedPedido.numeroPedidoCliente}${changes.length > 0 ? ` (${changes.join(', ')})` : ''}`
        });
        
        res.status(200).json(updatedPedido);
        
    } catch (error) {
        console.error(`Error updating pedido ${req.params.id}:`, error);
        res.status(500).json({ message: "Error interno del servidor al actualizar el pedido." });
    }
});

// DELETE /api/pedidos/:id - Delete a single pedido
app.delete('/api/pedidos/:id', async (req, res) => {
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
        
        res.status(200).json({ message: 'Todos los pedidos han sido eliminados.' });
        
    } catch (error) {
        console.error("Error clearing collection:", error);
        res.status(500).json({ message: "Error interno del servidor al limpiar la colección." });
    }
});

// =================================================================
// RUTAS ADMINISTRATIVAS
// =================================================================

// Aplicar rate limiting a todas las rutas admin
app.use('/api/admin', adminLimiter);

// Aplicar rate limiting especial al login
app.use('/api/admin/auth/login', loginLimiter);

// Rutas de autenticación administrativa
app.use('/api/admin/auth', adminAuthRoutes);

// Rutas de gestión de usuarios
app.use('/api/admin/users', adminUserRoutes);

// Ruta para obtener datos del dashboard administrativo
app.get('/api/admin/dashboard', async (req, res) => {
    try {
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
            error: 'Error interno del servidor'
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

// =================================================================
// FIN RUTAS ADMINISTRATIVAS
// =================================================================

// --- SERVIR PANEL DE ADMINISTRACIÓN ---

// Servir archivos estáticos del panel de administración
app.use('/admin', express.static(path.join(__dirname, '../admin/dist')));

// Ruta específica para el panel de administración
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/dist', 'index.html'));
});

// --- SERVER START ---
const PORT = process.env.PORT || 3001;

// Catch-all handler for frontend routing (aplicación principal)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize and start server
async function startServer() {
    try {
        // Intentar inicializar PostgreSQL
        if (process.env.DATABASE_URL || process.env.DB_HOST) {
            console.log('🔄 Intentando conectar a PostgreSQL...');
            await dbClient.init();
            console.log('🐘 PostgreSQL conectado exitosamente');
        } else {
            console.log('⚠️ No se encontró configuración de base de datos');
        }
        
    } catch (error) {
        console.error('❌ Error al conectar a PostgreSQL:', error.message);
        
        if (process.env.NODE_ENV === 'production') {
            console.error('🚨 El servidor no puede continuar sin base de datos en producción');
            process.exit(1);
        } else {
            console.log('🔄 Continuando sin base de datos en modo desarrollo');
            console.log('💡 Se usarán usuarios hardcodeados para autenticación');
        }
    }

    // Iniciar el servidor HTTP
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
        if (dbClient.isInitialized) {
            console.log('📊 Estado: Conectado a PostgreSQL - Funcionalidad completa');
        } else {
            console.log('⚠️ Estado: Modo desarrollo - Base de datos no disponible');
        }
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
