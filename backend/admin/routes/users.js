const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware, requirePermission, requireRole } = require('../middleware/auth');
const {
    auditViewUsers,
    auditCreateUser,
    auditUpdateUser,
    auditDeleteUser
} = require('../middleware/audit');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los usuarios
router.get('/', requirePermission('users.view'), auditViewUsers, userController.getAllUsers);

// Obtener usuario por ID
router.get('/:id', requirePermission('users.view'), userController.getUserById);

// Crear nuevo usuario
router.post('/', requirePermission('users.create'), auditCreateUser, userController.createUser);

// Actualizar usuario
router.put('/:id', requirePermission('users.edit'), auditUpdateUser, userController.updateUser);

// Eliminar usuario
router.delete('/:id', requirePermission('users.delete'), auditDeleteUser, userController.deleteUser);

// Activar usuario
router.patch('/:id/activate', requirePermission('users.edit'), auditUpdateUser, userController.activateUser);

// Desactivar usuario
router.patch('/:id/deactivate', requirePermission('users.edit'), auditUpdateUser, userController.deactivateUser);

// Reset de contraseña
router.post('/:id/reset-password', requirePermission('users.edit'), auditUpdateUser, userController.resetUserPassword);

// Obtener actividad de usuarios
router.get('/activity', requirePermission('users.view'), userController.getUserActivity);

// Eliminación en lote
router.delete('/bulk', requirePermission('users.delete'), auditDeleteUser, userController.bulkDeleteUsers);

// Exportar usuarios
router.get('/export', requirePermission('users.view'), userController.exportUsers);

module.exports = router;
