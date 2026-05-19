const { authenticateUser, requireAuth } = require('./middleware/auth');

function setupNotesRoutes(app, pool, io) {
    const { authenticateUser, requireAuth } = require('./middleware/auth');

    app.get('/api/notes', authenticateUser, requireAuth, async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT id, title, created_by, created_at, updated_by, updated_at FROM limpio.shared_notes WHERE is_active = true ORDER BY updated_at DESC'
            );
            res.json(result.rows.map(rowToNote));
        } catch (err) {
            console.error('Error listing notes:', err);
            res.status(500).json({ error: 'Error listing notes' });
        }
    });

    app.post('/api/notes', authenticateUser, requireAuth, async (req, res) => {
        try {
            const userId = req.headers['x-user-id'];
            const { title } = req.body;
            const result = await pool.query(
                'INSERT INTO limpio.shared_notes (title, created_by, updated_by) VALUES ($1, $2, $2) RETURNING id, title, created_by, created_at, updated_by, updated_at',
                [title || 'Nueva nota', userId]
            );
            const note = rowToNote(result.rows[0]);
            io.emit('notes:created', note);
            res.json(note);
        } catch (err) {
            console.error('Error creating note:', err);
            res.status(500).json({ error: 'Error creating note' });
        }
    });

    app.put('/api/notes/:id', authenticateUser, requireAuth, async (req, res) => {
        try {
            const userId = req.headers['x-user-id'];
            const { id } = req.params;
            const { title } = req.body;
            const result = await pool.query(
                'UPDATE limpio.shared_notes SET title = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, title, created_by, created_at, updated_by, updated_at',
                [title, userId, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Nota no encontrada' });
            }
            const note = rowToNote(result.rows[0]);
            io.emit('notes:updated', note);
            res.json(note);
        } catch (err) {
            console.error('Error updating note:', err);
            res.status(500).json({ error: 'Error updating note' });
        }
    });

    app.delete('/api/notes/:id', authenticateUser, requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query(
                'UPDATE limpio.shared_notes SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [id]
            );
            io.emit('notes:deleted', { id });
            res.json({ success: true });
        } catch (err) {
            console.error('Error deleting note:', err);
            res.status(500).json({ error: 'Error deleting note' });
        }
    });

    app.get('/api/notes/:id/state', authenticateUser, requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('SELECT state FROM limpio.shared_notes WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Nota no encontrada' });
            }
            const state = result.rows[0].state;
            res.json({ state: state ? state.toString('base64') : null });
        } catch (err) {
            console.error('Error loading note state:', err);
            res.status(500).json({ error: 'Error loading note state' });
        }
    });

    app.put('/api/notes/:id/state', authenticateUser, requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { state } = req.body;
            const stateBuffer = state ? Buffer.from(state, 'base64') : null;
            await pool.query(
                'UPDATE limpio.shared_notes SET state = $1, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = $2',
                [stateBuffer, id]
            );
            res.json({ success: true });
        } catch (err) {
            console.error('Error saving note state:', err);
            res.status(500).json({ error: 'Error saving note state' });
        }
    });

    function rowToNote(row) {
        return {
            id: row.id,
            title: row.title,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedBy: row.updated_by,
            updatedAt: row.updated_at
        };
    }
}

function addNoteSocketHandlers(socket, io) {
    socket.on('notes:join', (noteId) => {
        if (!socket.userId) return;
        socket.join(`note:${noteId}`);
    });

    socket.on('notes:leave', (noteId) => {
        socket.leave(`note:${noteId}`);
    });

    socket.on('notes:yjs-update', ({ noteId, update }) => {
        if (!socket.userId) return;
        socket.to(`note:${noteId}`).emit('notes:yjs-update', { noteId, update });
    });

    socket.on('notes:presence', ({ noteId, name, color }) => {
        if (!socket.userId) return;
        socket.to(`note:${noteId}`).emit('notes:presence', {
            noteId,
            userId: socket.userId,
            name,
            color
        });
    });
}

module.exports = { setupNotesRoutes, addNoteSocketHandlers };
