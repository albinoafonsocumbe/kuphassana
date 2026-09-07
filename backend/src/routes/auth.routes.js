const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth.middleware');

// POST /api/auth/registar  → criar conta de prestador
// POST /api/auth/login     → fazer login (prestador ou admin)
// GET  /api/auth/perfil    → ver perfil do utilizador autenticado

router.post('/registar',         AuthController.registar);
router.post('/registar-cliente', AuthController.registarCliente);
router.post('/login',            AuthController.login);
router.get('/perfil',            verificarToken, AuthController.perfil);

module.exports = router;
