const express = require('express');
const router = express.Router();
const PrestadorController = require('../controllers/prestador.controller');
const { verificarToken, apenasAdmin } = require('../middleware/auth.middleware');

// Rotas públicas (sem autenticação)
// GET /api/prestadores          → listar todos (área pública)
// GET /api/prestadores/:id      → ver detalhe de um prestador

router.get('/',    PrestadorController.listar);
router.get('/:id', PrestadorController.buscarPorId);

// Rotas protegidas (requerem token JWT)
// PUT    /api/prestadores/:id   → atualizar (próprio prestador ou admin)
// DELETE /api/prestadores/:id   → eliminar (apenas admin)

router.put('/:id',    verificarToken, PrestadorController.atualizar);
router.delete('/:id', verificarToken, apenasAdmin, PrestadorController.eliminar);

// POST /api/prestadores → criação via painel admin (requer admin)
// Nota: registo público usa POST /api/auth/registar
router.post('/', verificarToken, apenasAdmin, PrestadorController.criar);

module.exports = router;
