const express = require('express');
const cors = require('cors');
const { Firestore } = require('@google-cloud/firestore');

// --- DATA (Copied from frontend for backend use) ---
// This would typically be shared in a common library in a monorepo
const { initialPedidos } = require('./data');

// --- FIRESTORE INITIALIZATION ---
// In a Google Cloud environment (like Cloud Run), the library automatically
// authenticates using the service account, so no config object is needed.
const db = new Firestore();
const pedidosCollection = db.collection('pedidos');

// --- EXPRESS APP SETUP ---
const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// --- API ROUTES ---

// GET /api/pedidos - Get all pedidos
app.get('/api/pedidos', async (req, res) => {
    try {
        const query = pedidosCollection.orderBy("secuenciaPedido", "desc");
        let snapshot = await query.get();

        // If the database is empty, seed it with initial data
        if (snapshot.empty) {
            console.log("No data found in Firestore, populating with seed data.");
            const batch = db.batch();
            initialPedidos.forEach(pedido => {
                const docRef = pedidosCollection.doc(pedido.id);
                batch.set(docRef, pedido);
            });
            await batch.commit();
            // Re-fetch the data after seeding
            snapshot = await query.get();
            console.log("Seeding complete.");
        }

        const pedidos = [];
        snapshot.forEach(doc => pedidos.push(doc.data()));
        res.status(200).json(pedidos);
    } catch (error) {
        console.error("Error fetching pedidos:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener los pedidos." });
    }
});

// GET /api/pedidos/:id - Get a single pedido by ID
app.get('/api/pedidos/:id', async (req, res) => {
    try {
        const docRef = pedidosCollection.doc(req.params.id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            res.status(200).json(docSnap.data());
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
        await pedidosCollection.doc(newPedido.id).set(newPedido);
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
        await pedidosCollection.doc(pedidoId).set(updatedPedido);
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
        const docRef = pedidosCollection.doc(pedidoId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ message: 'Pedido no encontrado para eliminar.' });
        }

        await docRef.delete();
        res.status(204).send(); // 204 No Content is standard for successful DELETE
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
        const batch = db.batch();
        items.forEach(item => {
            const docRef = pedidosCollection.doc(item.id);
            batch.set(docRef, item);
        });
        await batch.commit();
        res.status(201).json({ message: `${items.length} pedidos importados correctamente.` });
    } catch (error) {
        console.error("Error on bulk insert:", error);
        res.status(500).json({ message: "Error interno del servidor durante la importación masiva." });
    }
});


// DELETE /api/pedidos/all - Clear the entire collection
app.delete('/api/pedidos/all', async (req, res) => {
    try {
        const snapshot = await pedidosCollection.get();
        if (snapshot.empty) {
            return res.status(200).json({ message: 'La colección ya estaba vacía.' });
        }
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        res.status(200).json({ message: 'Todos los pedidos han sido eliminados.' });
    } catch (error) {
        console.error("Error clearing collection:", error);
        res.status(500).json({ message: "Error interno del servidor al limpiar la colección." });
    }
});


// --- SERVER START ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});