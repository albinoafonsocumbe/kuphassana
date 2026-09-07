const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth.middleware');
const ClienteModel = require('../models/cliente.model');

// PUT /api/clientes/:id  → cliente actualiza o próprio perfil
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { papel, id: userId } = req.utilizador;

        // Apenas o próprio cliente ou admin pode editar
        if (papel === 'prestador') {
            return res.status(403).json({ sucesso: false, mensagem: 'Sem permissão.' });
        }
        if (papel !== 'admin' && Number(id) !== Number(userId)) {
            return res.status(403).json({ sucesso: false, mensagem: 'Sem permissão.' });
        }

        const { nome, telefone, cidade } = req.body;
        if (!nome) {
            return res.status(400).json({ sucesso: false, mensagem: 'O nome é obrigatório.' });
        }

        const cliente = await ClienteModel.atualizar(id, { nome, telefone, cidade });
        res.json({ sucesso: true, mensagem: 'Perfil actualizado.', dados: cliente });
    } catch (e) {
        console.error(e);
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// GET /api/clientes/:id  → buscar cliente por id
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const cliente = await ClienteModel.buscarPorId(req.params.id);
        if (!cliente) return res.status(404).json({ sucesso: false, mensagem: 'Não encontrado.' });
        res.json({ sucesso: true, dados: cliente });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

module.exports = router;
