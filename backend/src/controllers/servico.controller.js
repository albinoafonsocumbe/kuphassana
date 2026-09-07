const ServicoModel = require('../models/servico.model');

const ServicoController = {

    // GET /api/servicos
    // Suporta: ?cidade=Lisboa&categoria=funeral&preco_min=100&preco_max=500&pesquisa=texto&pagina=1&limite=10
    async listar(req, res) {
        try {
            const { cidade, categoria, preco_min, preco_max, pesquisa, pagina, limite } = req.query;

            const resultado = await ServicoModel.listar({
                cidade, categoria, preco_min, preco_max, pesquisa,
                pagina: pagina || 1,
                limite: limite || 10
            });

            res.json({ sucesso: true, ...resultado });
        } catch (erro) {
            console.error('Erro ao listar serviços:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // GET /api/servicos/categorias
    async listarCategorias(req, res) {
        try {
            const categorias = await ServicoModel.listarCategorias();
            res.json({ sucesso: true, dados: categorias });
        } catch (erro) {
            console.error('Erro ao listar categorias:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // GET /api/servicos/:id
    async buscarPorId(req, res) {
        try {
            const servico = await ServicoModel.buscarPorId(req.params.id);
            if (!servico) {
                return res.status(404).json({ sucesso: false, mensagem: 'Serviço não encontrado.' });
            }
            res.json({ sucesso: true, dados: servico });
        } catch (erro) {
            console.error('Erro ao buscar serviço:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // GET /api/servicos/prestador/:prestador_id
    async listarPorPrestador(req, res) {
        try {
            const servicos = await ServicoModel.listarPorPrestador(req.params.prestador_id);
            res.json({ sucesso: true, total: servicos.length, dados: servicos });
        } catch (erro) {
            console.error('Erro ao listar serviços do prestador:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // POST /api/servicos
    async criar(req, res) {
        try {
            const { nome, descricao, categoria, preco, duracao_horas, imagem_url, itens_incluidos, tipo_servico } = req.body;

            if (!nome || !categoria || !preco) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Os campos nome, categoria e preco são obrigatórios.'
                });
            }

            // O prestador_id vem do token JWT
            const prestador_id = req.utilizador.id;

            const novoServico = await ServicoModel.criar({
                prestador_id,
                nome,
                descricao,
                categoria,
                preco: parseFloat(preco),
                duracao_horas: duracao_horas ? parseInt(duracao_horas) : null,
                imagem_url: imagem_url || null,
                itens_incluidos: itens_incluidos || [],
                tipo_servico: tipo_servico || 'pacote'
            });

            res.status(201).json({
                sucesso: true,
                mensagem: 'Serviço criado com sucesso.',
                dados: novoServico
            });
        } catch (erro) {
            console.error('Erro ao criar serviço:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // PUT /api/servicos/:id
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { nome, descricao, categoria, preco, duracao_horas, imagem_url, itens_incluidos, tipo_servico, estado } = req.body;

            if (!nome || !categoria || !preco) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Os campos nome, categoria e preco são obrigatórios.'
                });
            }

            // Verificar se o serviço existe
            const servicoExiste = await ServicoModel.buscarPorId(id);
            if (!servicoExiste) {
                return res.status(404).json({ sucesso: false, mensagem: 'Serviço não encontrado.' });
            }

            // Apenas o próprio prestador ou um admin pode editar
            const { papel, id: userId } = req.utilizador;
            if (papel !== 'admin' && Number(servicoExiste.prestador_id) !== Number(userId)) {
                return res.status(403).json({ sucesso: false, mensagem: 'Sem permissão para editar este serviço.' });
            }
            const servicoAtualizado = await ServicoModel.atualizar(id, {
                nome,
                descricao,
                categoria,
                preco: parseFloat(preco),
                duracao_horas: duracao_horas !== undefined ? (duracao_horas ? parseInt(duracao_horas) : null) : servicoExiste.duracao_horas,
                imagem_url: imagem_url !== undefined ? imagem_url : servicoExiste.imagem_url,
                itens_incluidos: itens_incluidos !== undefined ? itens_incluidos : servicoExiste.itens_incluidos,
                tipo_servico: tipo_servico !== undefined ? tipo_servico : servicoExiste.tipo_servico,
                estado: estado || servicoExiste.estado
            });

            res.json({
                sucesso: true,
                mensagem: 'Serviço atualizado com sucesso.',
                dados: servicoAtualizado
            });
        } catch (erro) {
            console.error('Erro ao atualizar serviço:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    // DELETE /api/servicos/:id
    async eliminar(req, res) {
        try {
            const { id } = req.params;

            const servicoExiste = await ServicoModel.buscarPorId(id);
            if (!servicoExiste) {
                return res.status(404).json({ sucesso: false, mensagem: 'Serviço não encontrado.' });
            }

            // Apenas o próprio prestador ou um admin pode eliminar
            const { papel, id: userId } = req.utilizador;
            if (papel !== 'admin' && servicoExiste.prestador_id !== userId) {
                return res.status(403).json({ sucesso: false, mensagem: 'Sem permissão para eliminar este serviço.' });
            }

            await ServicoModel.eliminar(id);
            res.json({ sucesso: true, mensagem: 'Serviço eliminado com sucesso.' });
        } catch (erro) {
            console.error('Erro ao eliminar serviço:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    }
};

module.exports = ServicoController;
