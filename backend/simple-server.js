// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3333;

// CORS
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'Modo desarrollo',
        port: PORT
    });
});

// Ruta de login simplificada
app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Login recibido:', req.body);
    
    const { username, password } = req.body;
    
    const users = {
        'admin': { password: 'admin123', role: 'Administrador', displayName: 'Administrador' }
    };
    
    const user = users[username];
    
    if (user && user.password === password) {
        res.json({
            success: true,
            user: {
                id: '1',
                username,
                role: user.role,
                displayName: user.displayName
            },
            message: 'Login exitoso'
        });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor simple ejecutándose en puerto ${PORT}`);
});
