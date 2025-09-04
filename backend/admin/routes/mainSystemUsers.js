const express = require('express');
const router = express.Router();
const mainSystemUsersController = require('../controllers/mainSystemUsersController');
const { authMiddleware } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// === RUTAS PARA USUARIOS DEL SISTEMA PRINCIPAL ===

// GET /api/admin/main-users - Obtener todos los usuarios del sistema principal
router.get('/', mainSystemUsersController.getAllMainUsers);

// GET /api/admin/main-users/stats - Obtener estadísticas de usuarios del sistema principal
router.get('/stats', mainSystemUsersController.getMainUsersStats);

// GET /api/admin/main-users/:id - Obtener usuario del sistema principal por ID
router.get('/:id', mainSystemUsersController.getMainUserById);

// POST /api/admin/main-users - Crear nuevo usuario del sistema principal
router.post('/', mainSystemUsersController.createMainUser);

// PUT /api/admin/main-users/:id - Actualizar usuario del sistema principal
router.put('/:id', mainSystemUsersController.updateMainUser);

// DELETE /api/admin/main-users/:id - Eliminar usuario del sistema principal
router.delete('/:id', mainSystemUsersController.deleteMainUser);

// POST /api/admin/main-users/:id/reset-password - Resetear contraseña de usuario del sistema principal
router.post('/:id/reset-password', mainSystemUsersController.resetMainUserPassword);

module.exports = router;
