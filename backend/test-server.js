const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3333;

app.use(cors({
    origin: [
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3001"
    ],
    credentials: true
}));

app.use(express.json());

// Ruta de prueba simple
app.post('/api/auth/login', (req, res) => {
    console.log('Recibida petición de login:', req.body);
    
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'password123') {
        res.json({
            success: true,
            user: {
                id: '1',
                username: 'admin',
                role: 'Administrador',
                displayName: 'Administrador'
            },
            message: 'Login exitoso'
        });
    } else {
        res.status(401).json({
            error: 'Credenciales incorrectas'
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de prueba ejecutándose en puerto ${PORT}`);
});
