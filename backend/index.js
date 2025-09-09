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
const PostgreSQLClient = require('./postgres-client');
const { requirePermission, requireAnyPermission } = require('./middleware/permissions');
const { authenticateUser, requireAuth, extractUserFromRequest } = require('./middleware/auth');

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

app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de autenticación global (extrae usuario si está disponible)
app.use(authenticateUser);

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

// Simple connectivity check for frontend
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
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
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Usuario y contraseña son requeridos' 
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
                    error: 'Usuario no encontrado' 
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
                    error: 'Contraseña incorrecta' 
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
        if (!dbClient.isInitialized) {
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
        if (!dbClient.isInitialized) {
            // Modo desarrollo sin base de datos - devolver usuarios de ejemplo
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            return res.status(200).json({
                success: true,
                users: [
                    {
                        id: 'dev-admin-1',
                        username: 'admin',
                        role: 'Administrador',
                        displayName: 'Usuario Administrador',
                        createdAt: '2025-01-01T00:00:00.000Z',
                        lastLogin: yesterday.toISOString()
                    },
                    {
                        id: 'dev-user-1',
                        username: 'operador1',
                        role: 'Operador',
                        displayName: 'Operador de Prueba',
                        createdAt: '2025-01-15T00:00:00.000Z',
                        lastLogin: lastWeek.toISOString()
                    }
                ]
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

// PUT /api/auth/users/:id - Actualizar usuario
app.put('/api/auth/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, role, displayName, password } = req.body;

        if (!dbClient.isInitialized) {
            // Modo desarrollo sin base de datos
            return res.status(200).json({
                success: true,
                user: {
                    id: id,
                    username: username || 'usuario_actualizado',
                    role: role || 'Operador',
                    displayName: displayName || 'Usuario Actualizado'
                },
                message: 'Usuario actualizado exitosamente (modo desarrollo)'
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

        if (!dbClient.isInitialized) {
            // Modo desarrollo sin base de datos
            return res.status(200).json({
                success: true,
                message: 'Usuario eliminado exitosamente (modo desarrollo)'
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
        // Configuración de permisos desde la base de datos
        if (dbClient.isInitialized) {
            // Obtener categorías de permisos de constants/permissions.ts
            // pero con los datos actualizados de la BD
            const allPermissions = await dbClient.getAllSystemPermissions();
            
            res.json({
                success: true,
                permissions: allPermissions
            });
            return;
        }
        
        // Fallback para modo desarrollo sin base de datos
        const permissions = {
            categories: {
                pedidos: {
                    name: 'Gestión de Pedidos',
                    permissions: [
                        { id: 'pedidos.view', name: 'Ver Pedidos' },
                        { id: 'pedidos.create', name: 'Crear Pedidos' },
                        { id: 'pedidos.edit', name: 'Editar Pedidos' },
                        { id: 'pedidos.delete', name: 'Eliminar Pedidos' },
                        { id: 'pedidos.move', name: 'Mover Etapas' }
                    ]
                },
                usuarios: {
                    name: 'Gestión de Usuarios',
                    permissions: [
                        { id: 'usuarios.view', name: 'Ver Usuarios' },
                        { id: 'usuarios.create', name: 'Crear Usuarios' },
                        { id: 'usuarios.edit', name: 'Editar Usuarios' },
                        { id: 'usuarios.delete', name: 'Eliminar Usuarios' }
                    ]
                }
            }
        };

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

        if (!dbClient.isInitialized) {
            // Modo desarrollo sin base de datos - simular cambio exitoso
            console.log(`🔄 Simulando cambio de contraseña para usuario ${id} (modo desarrollo)`);
            return res.status(200).json({
                success: true,
                message: 'Contraseña actualizada exitosamente (modo desarrollo)'
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

        if (!dbClient.isInitialized) {
            // Modo desarrollo sin base de datos - simular cambio exitoso
            console.log(`🔄 Simulando cambio de contraseña administrativo para usuario ${id} (modo desarrollo)`);
            return res.status(200).json({
                success: true,
                message: 'Contraseña actualizada exitosamente (modo desarrollo)'
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

        if (!dbClient.isInitialized) {
            // Modo desarrollo sin base de datos
            return res.status(200).json({
                success: true,
                message: 'Permisos de usuario actualizados exitosamente (modo desarrollo)'
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
        
        if (!dbClient.isInitialized) {
            // Modo desarrollo sin base de datos
            return res.json({
                success: true,
                permissions: []
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
        
        if (!dbClient.isInitialized) {
            // Modo desarrollo sin base de datos
            return res.json({
                success: true,
                permissions: localPermissions,
                synced: true
            });
        }
        
        // Obtener permisos del usuario desde la base de datos
        const dbPermissions = await dbClient.getUserPermissions(id);
        
        // Formatear permisos de la base de datos
        const formattedDbPermissions = dbPermissions.map(perm => ({
            id: perm.permission_id,
            enabled: perm.enabled
        }));
        
        // Verificar si hay diferencias
        const needsSync = JSON.stringify(formattedDbPermissions.sort((a, b) => a.id.localeCompare(b.id))) !== 
                         JSON.stringify(localPermissions.sort((a, b) => a.id.localeCompare(b.id)));
        
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
        console.error('Error sincronizando permisos:', error);
        res.status(500).json({
            error: error.message || 'Error interno del servidor'
        });
    }
});

// GET /api/permissions - Obtener lista de permisos disponibles
app.get('/api/permissions', async (req, res) => {
    try {
        if (dbClient.isInitialized) {
            // Obtener permisos desde la base de datos
            const permissions = await dbClient.getAllPermissions();
            
            return res.json({
                success: true,
                permissions
            });
        }
        
        // Fallback para desarrollo, devolver permisos estáticos
        const permissions = [
            { id: 'pedidos.view', name: 'Ver Pedidos', category: 'pedidos', enabled: true },
            { id: 'pedidos.create', name: 'Crear Pedidos', category: 'pedidos', enabled: true },
            { id: 'pedidos.edit', name: 'Editar Pedidos', category: 'pedidos', enabled: true },
            { id: 'pedidos.delete', name: 'Eliminar Pedidos', category: 'pedidos', enabled: true },
            { id: 'pedidos.stage', name: 'Cambiar Etapa', category: 'pedidos', enabled: true },
            { id: 'users.view', name: 'Ver Usuarios', category: 'usuarios', enabled: true },
            { id: 'users.create', name: 'Crear Usuarios', category: 'usuarios', enabled: true },
            { id: 'users.edit', name: 'Editar Usuarios', category: 'usuarios', enabled: true },
            { id: 'users.delete', name: 'Eliminar Usuarios', category: 'usuarios', enabled: true },
            { id: 'users.permissions', name: 'Gestionar Permisos', category: 'usuarios', enabled: true },
            { id: 'reports.view', name: 'Ver Reportes', category: 'reportes', enabled: true },
            { id: 'reports.export', name: 'Exportar Reportes', category: 'reportes', enabled: true },
            { id: 'system.settings', name: 'Configuración Sistema', category: 'sistema', enabled: true },
            { id: 'system.audit', name: 'Auditoría Sistema', category: 'auditoria', enabled: true }
        ];

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
// POST /api/pedidos - Crear un nuevo pedido
app.post('/api/pedidos', requirePermission('pedidos.create'), async (req, res) => {
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

// Rutas de autenticación administrativa (comentadas temporalmente)
// app.use('/api/admin/auth', adminAuthRoutes);

// Rutas de gestión de usuarios (comentadas temporalmente)
// app.use('/api/admin/users', adminUserRoutes);

// Rutas de gestión de usuarios del sistema principal (comentadas temporalmente)
// app.use('/api/admin/main-users', adminMainSystemUsersRoutes);

// Ruta para obtener datos del dashboard administrativo
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        // Verificar si las tablas admin existen antes de usarlas
        let useDatabase = false;
        if (dbClient.isInitialized && dbClient.pool) {
            try {
                // Intentar hacer una consulta simple para verificar si las tablas existen
                await dbClient.pool.query("SELECT 1 FROM admin_users LIMIT 1");
                useDatabase = true;
            } catch (error) {
                console.log('⚠️ Tablas de admin no disponibles, usando datos mock');
                useDatabase = false;
            }
        }

        if (!useDatabase) {
            console.log('🔧 Usando datos mock de dashboard para modo desarrollo');
            return res.json({
                stats: {
                    totalUsers: 5,
                    activeUsers: 2,
                    totalPedidos: 150,
                    pedidosHoy: 12,
                    pedidosCompletados: 140,
                    promedioTiempoCompletado: 45,
                    usuariosConectados: 2,
                    sesionesActivas: 3
                },
                systemHealth: {
                    status: 'healthy',
                    uptime: '2 hours',
                    memoryUsage: '256MB',
                    cpuUsage: '15%',
                    database: {
                        status: 'healthy',
                        connections: 5,
                        responseTime: 42
                    },
                    server: {
                        status: 'healthy',
                        cpuUsage: 15,
                        memoryUsage: 45
                    },
                    websocket: {
                        status: 'healthy',
                        connections: 2
                    }
                },
                recentAuditLogs: [
                    {
                        id: '1',
                        username: 'admin',
                        action: 'LOGIN',
                        module: 'auth',
                        timestamp: new Date().toISOString(),
                        details: 'Login exitoso'
                    }
                ],
                activeUsers: [
                    {
                        userId: 'admin-1',
                        username: 'admin',
                        lastActivity: new Date().toISOString(),
                        actionsToday: 5
                    }
                ]
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
        
        // Si hay cualquier error, devolver datos mock como fallback
        console.log('🔧 Error en dashboard, usando datos mock como fallback');
        res.json({
            stats: {
                totalUsers: 5,
                activeUsers: 2,
                totalPedidos: 150,
                pedidosHoy: 12,
                pedidosCompletados: 140,
                promedioTiempoCompletado: 45,
                usuariosConectados: 2,
                sesionesActivas: 3
            },
            systemHealth: {
                status: 'healthy',
                uptime: '2 hours',
                memoryUsage: '256MB',
                cpuUsage: '15%',
                database: {
                    status: 'healthy',
                    connections: 5,
                    responseTime: 42
                },
                server: {
                    status: 'healthy',
                    cpuUsage: 15,
                    memoryUsage: 45
                },
                websocket: {
                    status: 'healthy',
                    connections: 2
                }
            },
            recentAuditLogs: [
                {
                    id: '1',
                    username: 'admin',
                    action: 'LOGIN',
                    module: 'auth',
                    timestamp: new Date().toISOString(),
                    details: 'Login exitoso'
                }
            ],
            activeUsers: [
                {
                    userId: 'admin-1',
                    username: 'admin',
                    lastActivity: new Date().toISOString(),
                    actionsToday: 5
                }
            ]
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

// --- SERVER START ---
const PORT = process.env.PORT || 3001;

// Catch-all handler for frontend routing (aplicación principal) - DEBE IR AL FINAL
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
        console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
        if (dbClient.isInitialized) {
            console.log('✅ PostgreSQL conectado - Sistema operativo');
        } else {
            console.log('⚠️ Modo desarrollo - Base de datos no disponible');
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
// Force deploy Thu Sep  4 15:22:25 UTC 2025
