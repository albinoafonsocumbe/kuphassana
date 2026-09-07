const AvaliacaoModel = require('../models/avaliacao.model');
const PedidoModel = require('../models/pedido.model');

const AvaliacaoController = {

    // POST /api/avaliacoes
    async criar(req, res) {
        try {
            const { servico_id, prestador_id, pedido_id, classificacao, comentario } = req.body;
            const cliente_id = req.utilizador.id;

            if (!classificacao || classificacao < 1 || classificacao > 5) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'A classificação deve ser um número entre 1 e 5 estrelas.'
                });
            }

            if (!prestador_id) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'O campo prestador_id é obrigatório.'
                });
            }

            // Se for vinculada a um pedido, verificar se já foi avaliado
            if (pedido_id) {
                const jaAvaliado = await AvaliacaoModel.buscarPorPedido(pedido_id);
                if (jaAvaliado) {
                    return res.status(409).json({
                        sucesso: false,
                        mensagem: 'Este pedido já foi avaliado.'
                    });
                }
            }

            const avaliacao = await AvaliacaoModel.criar({
                cliente_id,
                servico_id,
                prestador_id,
                pedido_id,
                classificacao: parseInt(classificacao),
                comentario: comentario || ''
            });

            res.status(201).json({
                sucesso: true,
                mensagem: 'Avaliação registada com sucesso! Muito obrigado pelo seu testemunho.',
                dados: avaliacao
            });
        } catch (erro) {
            console.error('Erro ao criar avaliação:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // GET /api/avaliacoes/prestador/:id
    async listarPorPrestador(req, res) {
        try {
            const { id } = req.params;
            const [avaliacoes, stats] = await Promise.all([
                AvaliacaoModel.listarPorPrestador(id),
                AvaliacaoModel.obterEstatisticasPrestador(id)
            ]);

            res.json({
                sucesso: true,
                estatisticas: stats,
                total: avaliacoes.length,
                dados: avaliacoes
            });
        } catch (erro) {
            console.error('Erro ao listar avaliações do prestador:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // GET /api/avaliacoes/servico/:id
    async listarPorServico(req, res) {
        try {
            const { id } = req.params;
            const [avaliacoes, stats] = await Promise.all([
                AvaliacaoModel.listarPorServico(id),
                AvaliacaoModel.obterEstatisticasServico(id)
            ]);

            res.json({
                sucesso: true,
                estatisticas: stats,
                total: avaliacoes.length,
                dados: avaliacoes
            });
        } catch (erro) {
            console.error('Erro ao listar avaliações do serviço:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    }
};

module.exports = AvaliacaoController;
