const express = require('express');
const router  = express.Router();
const PedidoController = require('../controllers/pedido.controller');
const { verificarToken } = require('../middleware/auth.middleware');

// Todas as rotas de pedidos requerem autenticação
router.use(verificarToken);

// POST   /api/pedidos             → cliente cria pedido
// GET    /api/pedidos/meus        → cliente vê os seus pedidos
// GET    /api/pedidos/prestador   → prestador vê pedidos recebidos
// PUT    /api/pedidos/:id/estado  → prestador actualiza estado
// PUT    /api/pedidos/:id/notas   → prestador guarda notas privadas
// POST   /api/pedidos/:id/orcamento → prestador guarda orçamento formal
// DELETE /api/pedidos/:id         → cliente cancela pedido

router.post('/',                  PedidoController.criar);
router.get('/meus',               PedidoController.meusPedidos);
router.get('/prestador',          PedidoController.pedidosDoPrestador);
router.put('/:id/estado',         PedidoController.atualizarEstado);
router.put('/:id/notas',          PedidoController.salvarNotas);
router.post('/:id/orcamento',     PedidoController.salvarOrcamento);
router.delete('/:id',             PedidoController.cancelar);

module.exports = router;
