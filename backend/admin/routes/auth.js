const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { auditLogin, auditLogout } = require('../middleware/audit');

const router = express.Router();

// Rutas públicas (sin autenticación)
router.post('/login', auditLogin, authController.login);
router.post('/reset-password', authController.requestPasswordReset);

// Rutas protegidas (requieren autenticación)
router.get('/verify', authMiddleware, authController.verify);
router.post('/logout', authMiddleware, auditLogout, authController.logout);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
