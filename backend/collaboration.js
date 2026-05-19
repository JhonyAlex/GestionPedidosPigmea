function setupNotesCollaboration(io) {
    io.on('connection', (socket) => {
        socket.on('notes:join', (noteId) => {
            if (!socket.userId) {
                socket.emit('notes:error', { message: 'No autenticado' });
                return;
            }
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
    });

    console.log('✅ Notes collaboration handlers setup');
}

module.exports = { setupNotesCollaboration };
