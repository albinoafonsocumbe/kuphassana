const express = require('express');
const router = express.Router();
const ServicoController = require('../controllers/servico.controller');
const { verificarToken } = require('../middleware/auth.middleware');

// ── Rotas públicas ────────────────────────────────────────────
// GET /api/servicos                          → listar com filtros e paginação
// GET /api/servicos/categorias               → listar categorias disponíveis
// GET /api/servicos/:id                      → detalhe de um serviço
// GET /api/servicos/prestador/:prestador_id  → serviços de um prestador

router.get('/categorias',             ServicoController.listarCategorias);
router.get('/prestador/:prestador_id', ServicoController.listarPorPrestador);
router.get('/:id',                    ServicoController.buscarPorId);
router.get('/',                       ServicoController.listar);

// ── Rotas protegidas (requerem token JWT) ─────────────────────
// POST   /api/servicos       → criar serviço (apenas prestador)
// PUT    /api/servicos/:id   → atualizar (próprio prestador ou admin)
// DELETE /api/servicos/:id   → eliminar  (próprio prestador ou admin)

// Middleware: apenas prestadores e admins podem criar/editar/eliminar serviços
const apenasGestor = (req, res, next) => {
    if (req.utilizador?.papel === 'cliente') {
        return res.status(403).json({ sucesso: false, mensagem: 'Clientes não podem gerir serviços.' });
    }
    next();
};

router.post('/',      verificarToken, apenasGestor, ServicoController.criar);
router.put('/:id',    verificarToken, apenasGestor, ServicoController.atualizar);
router.delete('/:id', verificarToken, apenasGestor, ServicoController.eliminar);

module.exports = router;
