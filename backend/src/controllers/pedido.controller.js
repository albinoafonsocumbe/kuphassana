const PedidoModel  = require('../models/pedido.model');
const ServicoModel = require('../models/servico.model');

const PedidoController = {

    // POST /api/pedidos
    async criar(req, res) {
        try {
            const { servico_id, mensagem } = req.body;
            const cliente_id = req.utilizador.id;

            if (!servico_id) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'O campo servico_id é obrigatório.'
                });
            }

            // Verificar se o serviço existe
            const servico = await ServicoModel.buscarPorId(servico_id);
            if (!servico) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: 'Serviço não encontrado.'
                });
            }

            // Evitar pedido duplicado pendente
            const duplicado = await PedidoModel.pedidoDuplicado(cliente_id, servico_id);
            if (duplicado) {
                return res.status(409).json({
                    sucesso: false,
                    mensagem: 'Já tem um pedido pendente para este serviço.'
                });
            }

            const pedido = await PedidoModel.criar({
                cliente_id,
                servico_id,
                prestador_id: servico.prestador_id,
                mensagem: mensagem || ''
            });

            res.status(201).json({
                sucesso: true,
                mensagem: 'Pedido enviado com sucesso! O prestador irá contactá-lo em breve.',
                dados: pedido
            });
        } catch (erro) {
            console.error('Erro ao criar pedido:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // GET /api/pedidos/meus
    async meusPedidos(req, res) {
        try {
            const pedidos = await PedidoModel.listarPorCliente(req.utilizador.id);
            res.json({ sucesso: true, total: pedidos.length, dados: pedidos });
        } catch (erro) {
            console.error('Erro ao listar pedidos:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // GET /api/pedidos/prestador  (para o prestador ver os seus pedidos recebidos)
    async pedidosDoPrestador(req, res) {
        try {
            const pedidos = await PedidoModel.listarPorPrestador(req.utilizador.id);
            res.json({ sucesso: true, total: pedidos.length, dados: pedidos });
        } catch (erro) {
            console.error('Erro ao listar pedidos do prestador:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // PUT /api/pedidos/:id/estado  (prestador actualiza o estado)
    async atualizarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            const estadosValidos = ['pendente', 'confirmado', 'cancelado', 'concluido'];

            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: `Estado inválido. Use: ${estadosValidos.join(', ')}`
                });
            }

            const pedido = await PedidoModel.buscarPorId(id);
            if (!pedido) {
                return res.status(404).json({ sucesso: false, mensagem: 'Pedido não encontrado.' });
            }

            // Apenas o prestador do pedido ou admin pode alterar
            const { papel, id: userId } = req.utilizador;
            if (papel !== 'admin' && pedido.prestador_id !== userId) {
                return res.status(403).json({ sucesso: false, mensagem: 'Sem permissão.' });
            }

            const atualizado = await PedidoModel.atualizarEstado(id, estado);
            res.json({ sucesso: true, mensagem: 'Estado actualizado.', dados: atualizado });
        } catch (erro) {
            console.error('Erro ao actualizar estado:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // DELETE /api/pedidos/:id  (cliente cancela o seu pedido)
    async cancelar(req, res) {
        try {
            const { id } = req.params;
            const pedido = await PedidoModel.buscarPorId(id);

            if (!pedido) {
                return res.status(404).json({ sucesso: false, mensagem: 'Pedido não encontrado.' });
            }

            // Só o próprio cliente pode cancelar
            if (pedido.cliente_id !== req.utilizador.id && req.utilizador.papel !== 'admin') {
                return res.status(403).json({ sucesso: false, mensagem: 'Sem permissão.' });
            }

            if (pedido.estado === 'concluido') {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Não é possível cancelar um pedido já concluído.'
                });
            }

            await PedidoModel.atualizarEstado(id, 'cancelado');
            res.json({ sucesso: true, mensagem: 'Pedido cancelado.' });
        } catch (erro) {
            console.error('Erro ao cancelar pedido:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // PUT /api/pedidos/:id/notas (prestador guarda notas internas privadas)
    async salvarNotas(req, res) {
        try {
            const { id } = req.params;
            const { notas } = req.body;

            const pedido = await PedidoModel.buscarPorId(id);
            if (!pedido) {
                return res.status(404).json({ sucesso: false, mensagem: 'Pedido não encontrado.' });
            }

            const { papel, id: userId } = req.utilizador;
            if (papel !== 'admin' && pedido.prestador_id !== userId) {
                return res.status(403).json({ sucesso: false, mensagem: 'Sem permissão para adicionar notas neste pedido.' });
            }

            const atualizado = await PedidoModel.salvarNotas(id, notas || '');
            res.json({
                sucesso: true,
                mensagem: 'Notas guardadas com sucesso!',
                dados: atualizado
            });
        } catch (erro) {
            console.error('Erro ao guardar notas:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // POST /api/pedidos/:id/orcamento (prestador guarda proposta formal / orçamento)
    async salvarOrcamento(req, res) {
        try {
            const { id } = req.params;
            const { valor_orcamento, detalhes_orcamento } = req.body;

            if (valor_orcamento === undefined || valor_orcamento === null) {
                return res.status(400).json({ sucesso: false, mensagem: 'O valor do orçamento é obrigatório.' });
            }

            const pedido = await PedidoModel.buscarPorId(id);
            if (!pedido) {
                return res.status(404).json({ sucesso: false, mensagem: 'Pedido não encontrado.' });
            }

            const { papel, id: userId } = req.utilizador;
            if (papel !== 'admin' && pedido.prestador_id !== userId) {
                return res.status(403).json({ sucesso: false, mensagem: 'Sem permissão para emitir orçamento para este pedido.' });
            }

            const atualizado = await PedidoModel.salvarOrcamento(
                id,
                parseFloat(valor_orcamento),
                detalhes_orcamento || {}
            );

            res.json({
                sucesso: true,
                mensagem: 'Orçamento guardado e emitido com sucesso!',
                dados: atualizado
            });
        } catch (erro) {
            console.error('Erro ao guardar orçamento:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    }
};

module.exports = PedidoController;
