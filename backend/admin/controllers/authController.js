const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const PostgreSQLClient = require('../../postgres-client');
const { JWT_SECRET } = require('../middleware/auth');

const dbClient = new PostgreSQLClient();

const authController = {
    // Login de administrador
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    error: 'Usuario y contraseña son requeridos'
                });
            }

            // Buscar usuario administrador
            const user = await dbClient.getAdminUserByUsername(username);
            
            console.log('🔍 Debug login - Usuario encontrado:', user ? { id: user.id, username: user.username, role: user.role } : null);
            
            if (!user) {
                return res.status(401).json({
                    error: 'Usuario no encontrado'
                });
            }

            if (!user.is_active) {
                return res.status(401).json({
                    error: 'Usuario desactivado'
                });
            }

            // Verificar contraseña
            console.log('🔍 Debug login - Verificando contraseña para:', username);
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            console.log('🔍 Debug login - Contraseña válida:', isValidPassword);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Contraseña incorrecta'
                });
            }

            // Generar token JWT
            const token = jwt.sign(
                { 
                    userId: user.id,
                    username: user.username,
                    role: user.role 
                },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            // Actualizar último login
            await dbClient.updateUserLastLogin(user.id, req.ip, req.headers['user-agent']);

            // Preparar respuesta (sin incluir password_hash)
            const { password_hash, ...userResponse } = user;
            
            res.json({
                token,
                user: {
                    id: userResponse.id,
                    username: userResponse.username,
                    email: userResponse.email,
                    firstName: userResponse.first_name,
                    lastName: userResponse.last_name,
                    role: userResponse.role,
                    isActive: userResponse.is_active,
                    lastLogin: userResponse.last_login,
                    createdAt: userResponse.created_at,
                    updatedAt: userResponse.updated_at,
                    permissions: userResponse.permissions || []
                },
                expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Verificar token
    async verify(req, res) {
        try {
            // El middleware de auth ya verificó el token y agregó el usuario a req.user
            res.json(req.user);
        } catch (error) {
            console.error('Error en verificación:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Logout
    async logout(req, res) {
        try {
            // En un sistema más complejo, aquí podríamos invalidar el token
            // Por ahora, solo registramos la acción de logout
            res.json({
                message: 'Logout exitoso'
            });
        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Cambiar contraseña
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    error: 'Contraseña actual y nueva son requeridas'
                });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({
                    error: 'La nueva contraseña debe tener al menos 8 caracteres'
                });
            }

            // Obtener usuario actual
            const user = await dbClient.getAdminUserById(userId);
            
            if (!user) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }

            // Verificar contraseña actual
            const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
            
            if (!isValidPassword) {
                return res.status(400).json({
                    error: 'Contraseña actual incorrecta'
                });
            }

            // Hash de la nueva contraseña
            const saltRounds = 12;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            // Actualizar contraseña
            await dbClient.updateUserPassword(userId, newPasswordHash);

            res.json({
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Solicitar reset de contraseña (placeholder)
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    error: 'Email es requerido'
                });
            }

            // En un sistema real, aquí enviarías un email con un token de reset
            // Por ahora, solo registramos la solicitud
            console.log(`Solicitud de reset de contraseña para: ${email}`);

            res.json({
                message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña'
            });

        } catch (error) {
            console.error('Error en solicitud de reset:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    }
};

module.exports = authController;
