const path = require('path');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const SQLiteClient = require('./sqlite-client');

// Check if we're in a Cloud environment
const isCloudEnvironment = process.env.GOOGLE_CLOUD_PROJECT || process.env.K_SERVICE;

console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    K_SERVICE: process.env.K_SERVICE,
    isCloudEnvironment
});

let db, pedidosCollection;
let firestoreEnabled = false;
let sqliteClient = null;
let sqliteEnabled = false;

// Try to initialize Firestore only in cloud environment
if (isCloudEnvironment) {
    try {
        const { Firestore } = require('@google-cloud/firestore');
        console.log('Attempting to initialize Firestore...');
        
        db = new Firestore({
            projectId: process.env.GOOGLE_CLOUD_PROJECT || 'planning-pigmea-70067446729'
        });
        pedidosCollection = db.collection('pedidos');
        firestoreEnabled = true;
        console.log('Firestore initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Firestore:', error.message);
        console.error('Firestore will be disabled, falling back to SQLite');
        firestoreEnabled = false;
    }
}

// Initialize SQLite if not using Firestore
if (!firestoreEnabled) {
    console.log('Initializing SQLite database...');
    sqliteClient = new SQLiteClient();
}

// --- DATA (Fallback for non-cloud environments) ---
const { initialPedidos } = require('./data');
let inMemoryPedidos = [...initialPedidos];

// --- EXPRESS APP SETUP ---
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        firestoreEnabled,
        sqliteEnabled: !!sqliteClient,
        inMemoryFallback: !firestoreEnabled && !sqliteClient,
        websocketConnections: io.engine.clientsCount,
        connectedUsers: connectedUsers.size
    });
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
                console.log(`🧹 Limpiando usuario fantasma: ${userId}`);
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
    console.log('🔄 Reseteando lista de usuarios conectados...');
    connectedUsers.clear();
    io.emit('users-list', { connectedUsers: [] });
}

io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);
    
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
        
        console.log(`👤 Usuario autenticado: ${userId} (${userRole})`);
        
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
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
        
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

// Función para emitir eventos a usuarios específicos por rol
function broadcastToRole(userRole, event, data) {
    Array.from(connectedUsers.entries())
        .filter(([_, userData]) => userData.userRole === userRole)
        .forEach(([userId, userData]) => {
            io.to(userData.socketId).emit(event, {
                ...data,
                timestamp: new Date().toISOString(),
                serverTime: Date.now()
            });
        });
}

// --- API ROUTES ---

// GET /api/pedidos - Get all pedidos
app.get('/api/pedidos', async (req, res) => {
    try {
        console.log('GET /api/pedidos requested');
        console.log('Storage status:', { firestoreEnabled, sqliteEnabled });
        
        if (firestoreEnabled && pedidosCollection) {
            console.log('Using Firestore...');
            const snapshot = await pedidosCollection.get();
            console.log(`Found ${snapshot.size} documents in Firestore`);
            const pedidos = snapshot.docs.map(doc => doc.data()).sort((a, b) => b.secuenciaPedido - a.secuenciaPedido);
            return res.status(200).json(pedidos);
        } else if (sqliteEnabled && sqliteClient) {
            console.log('Using SQLite...');
            const pedidos = await sqliteClient.getAll();
            console.log(`Found ${pedidos.length} pedidos in SQLite`);
            return res.status(200).json(pedidos.sort((a, b) => b.secuenciaPedido - a.secuenciaPedido));
        } else {
            console.log('Using in-memory storage...');
            console.log(`Returning ${inMemoryPedidos.length} pedidos from memory`);
            return res.status(200).json([...inMemoryPedidos].sort((a, b) => b.secuenciaPedido - a.secuenciaPedido));
        }
    } catch (error) {
        console.error("Error in GET /api/pedidos:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ 
            message: "Error interno del servidor al obtener los pedidos.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            firestoreEnabled,
            sqliteEnabled,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/pedidos/:id - Get a single pedido by ID
app.get('/api/pedidos/:id', async (req, res) => {
    try {
        const pedidoId = req.params.id;
        console.log(`GET /api/pedidos/${pedidoId} requested`);
        
        if (firestoreEnabled && pedidosCollection) {
            const docRef = pedidosCollection.doc(pedidoId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                res.status(200).json(docSnap.data());
            } else {
                res.status(404).json({ message: 'Pedido no encontrado' });
            }
        } else if (sqliteEnabled && sqliteClient) {
            const pedido = await sqliteClient.findById(pedidoId);
            if (pedido) {
                res.status(200).json(pedido);
            } else {
                res.status(404).json({ message: 'Pedido no encontrado' });
            }
        } else {
            const pedido = inMemoryPedidos.find(p => p.id === pedidoId);
            if (pedido) {
                res.status(200).json(pedido);
            } else {
                res.status(404).json({ message: 'Pedido no encontrado' });
            }
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
        console.log(`POST /api/pedidos requested for pedido ${newPedido?.id}`);
        
        if (!newPedido || !newPedido.id) {
            return res.status(400).json({ message: 'Datos del pedido inválidos.' });
        }
        
        if (firestoreEnabled && pedidosCollection) {
            await pedidosCollection.doc(newPedido.id).set(newPedido);
        } else if (sqliteEnabled && sqliteClient) {
            await sqliteClient.create(newPedido);
        } else {
            inMemoryPedidos.unshift(newPedido);
        }
        
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
        console.log(`PUT /api/pedidos/${pedidoId} requested`);
        
        if (!updatedPedido || updatedPedido.id !== pedidoId) {
            return res.status(400).json({ message: 'El ID del pedido no coincide.' });
        }
        
        // Obtener el pedido anterior para comparar cambios
        let previousPedido = null;
        if (firestoreEnabled && pedidosCollection) {
            const docRef = pedidosCollection.doc(pedidoId);
            const docSnap = await docRef.get();
            previousPedido = docSnap.exists ? docSnap.data() : null;
            await docRef.set(updatedPedido);
        } else if (sqliteEnabled && sqliteClient) {
            previousPedido = await sqliteClient.findById(pedidoId);
            await sqliteClient.update(updatedPedido);
        } else {
            const index = inMemoryPedidos.findIndex(p => p.id === pedidoId);
            if (index !== -1) {
                previousPedido = { ...inMemoryPedidos[index] };
                inMemoryPedidos[index] = updatedPedido;
            } else {
                return res.status(404).json({ message: 'Pedido no encontrado para actualizar.' });
            }
        }
        
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
        console.log(`DELETE /api/pedidos/${pedidoId} requested`);
        
        // Obtener el pedido antes de eliminarlo
        let deletedPedido = null;
        
        if (firestoreEnabled && pedidosCollection) {
            const docRef = pedidosCollection.doc(pedidoId);
            const docSnap = await docRef.get();
            
            if (!docSnap.exists) {
                return res.status(404).json({ message: 'Pedido no encontrado para eliminar.' });
            }
            
            deletedPedido = docSnap.data();
            await docRef.delete();
        } else if (sqliteEnabled && sqliteClient) {
            deletedPedido = await sqliteClient.findById(pedidoId);
            if (!deletedPedido) {
                return res.status(404).json({ message: 'Pedido no encontrado para eliminar.' });
            }
            await sqliteClient.delete(pedidoId);
        } else {
            const index = inMemoryPedidos.findIndex(p => p.id === pedidoId);
            if (index === -1) {
                return res.status(404).json({ message: 'Pedido no encontrado para eliminar.' });
            }
            deletedPedido = { ...inMemoryPedidos[index] };
            inMemoryPedidos.splice(index, 1);
        }
        
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
        console.log(`POST /api/pedidos/bulk requested with ${items?.length} items`);
        
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Se esperaba un array de pedidos.' });
        }
        
        if (firestoreEnabled && pedidosCollection) {
            const batch = db.batch();
            items.forEach(item => {
                const docRef = pedidosCollection.doc(item.id);
                batch.set(docRef, item);
            });
            await batch.commit();
        } else if (sqliteEnabled && sqliteClient) {
            await sqliteClient.bulkInsert(items);
        } else {
            inMemoryPedidos = [...items];
        }
        
        res.status(201).json({ message: `${items.length} pedidos importados correctamente.` });
    } catch (error) {
        console.error("Error on bulk insert:", error);
        res.status(500).json({ message: "Error interno del servidor durante la importación masiva." });
    }
});

// DELETE /api/pedidos/all - Clear the entire collection
app.delete('/api/pedidos/all', async (req, res) => {
    try {
        console.log('DELETE /api/pedidos/all requested');
        
        if (firestoreEnabled && pedidosCollection) {
            const snapshot = await pedidosCollection.get();
            if (snapshot.empty) {
                return res.status(200).json({ message: 'La colección ya estaba vacía.' });
            }
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } else if (sqliteEnabled && sqliteClient) {
            await sqliteClient.clear();
        } else {
            inMemoryPedidos = [];
        }
        
        res.status(200).json({ message: 'Todos los pedidos han sido eliminados.' });
    } catch (error) {
        console.error("Error clearing collection:", error);
        res.status(500).json({ message: "Error interno del servidor al limpiar la colección." });
    }
});

// --- SERVER START ---
const PORT = process.env.PORT || 8080;

// Catch-all handler for frontend routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize and start server
async function startServer() {
    try {
        // Initialize SQLite if needed
        if (sqliteClient && !sqliteEnabled) {
            await sqliteClient.init();
            sqliteEnabled = true;
            console.log('SQLite database initialized successfully');
        }
    } catch (error) {
        console.error('Failed to initialize SQLite:', error.message);
        console.error('SQLite will be disabled, using in-memory storage');
        sqliteEnabled = false;
    }

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
        console.log(`📡 WebSocket habilitado con ${io.engine.clientsCount} conexiones`);
        console.log(`🗄️ Firestore habilitado: ${firestoreEnabled}`);
        console.log(`💾 SQLite habilitado: ${sqliteEnabled}`);
        console.log(`🎯 Modo: ${firestoreEnabled ? 'Cloud/Firestore' : sqliteEnabled ? 'Local/SQLite' : 'Local/Memory'}`);
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
    if (sqliteClient) {
        await sqliteClient.close();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    if (sqliteClient) {
        await sqliteClient.close();
    }
    process.exit(0);
});