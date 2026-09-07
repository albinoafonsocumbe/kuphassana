const express = require('express');
const router  = express.Router();
const AvaliacaoController = require('../controllers/avaliacao.controller');
const { verificarToken } = require('../middleware/auth.middleware');

// GET públicas
router.get('/prestador/:id', AvaliacaoController.listarPorPrestador);
router.get('/servico/:id',   AvaliacaoController.listarPorServico);

// POST requer autenticação
router.post('/', verificarToken, AvaliacaoController.criar);

module.exports = router;
