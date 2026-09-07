const PrestadorModel = require('../models/prestador.model');
const bcrypt = require('bcrypt');

const PrestadorController = {

    // GET /prestadores
    async listar(req, res) {
        try {
            const prestadores = await PrestadorModel.listarTodos();
            res.json({
                sucesso: true,
                total: prestadores.length,
                dados: prestadores
            });
        } catch (erro) {
            console.error('Erro ao listar prestadores:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
        }
    },

    // GET /prestadores/:id
    async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const prestador = await PrestadorModel.buscarPorId(id);

            if (!prestador) {
                return res.status(404).json({ sucesso: false, mensagem: 'Prestador não encontrado' });
            }

            res.json({ sucesso: true, dados: prestador });
        } catch (erro) {
            console.error('Erro ao buscar prestador:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
        }
    },

    // POST /prestadores
    async criar(req, res) {
        try {
            const { nome, email, telefone, morada, cidade, estado, senha } = req.body;

            // Validação dos campos obrigatórios
            if (!nome || !email || !senha) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Os campos nome, email e senha são obrigatórios'
                });
            }

            // Verificar se o email já existe
            const emailJaExiste = await PrestadorModel.emailExiste(email);
            if (emailJaExiste) {
                return res.status(409).json({
                    sucesso: false,
                    mensagem: 'Já existe um prestador com este email'
                });
            }

            // Encriptar a senha
            const senha_hash = await bcrypt.hash(senha, 10);

            const novoPrestador = await PrestadorModel.criar({
                nome, email, telefone, morada, cidade, estado, senha_hash
            });

            res.status(201).json({
                sucesso: true,
                mensagem: 'Prestador criado com sucesso',
                dados: novoPrestador
            });
        } catch (erro) {
            console.error('Erro ao criar prestador:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
        }
    },

    // PUT /prestadores/:id
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { nome, telefone, morada, cidade, estado, nif, descricao, horario, areas_atuacao, logo_url, website } = req.body;

            if (!nome) {
                return res.status(400).json({ sucesso: false, mensagem: 'O campo nome é obrigatório' });
            }

            const prestadorExiste = await PrestadorModel.buscarPorId(id);
            if (!prestadorExiste) {
                return res.status(404).json({ sucesso: false, mensagem: 'Prestador não encontrado' });
            }

            // Apenas o próprio prestador pode editar os seus dados,
            // mas um admin pode editar qualquer campo incluindo o estado
            const { papel, id: userId } = req.utilizador;
            if (papel !== 'admin' && prestadorExiste.id !== userId) {
                return res.status(403).json({ sucesso: false, mensagem: 'Sem permissão para editar este prestador.' });
            }

            // Prestadores comuns não podem alterar o próprio estado
            const estadoFinal = papel === 'admin'
                ? (estado || prestadorExiste.estado)
                : prestadorExiste.estado;

            const prestadorAtualizado = await PrestadorModel.atualizar(id, {
                nome,
                telefone: telefone !== undefined ? telefone : prestadorExiste.telefone,
                morada:   morada !== undefined ? morada : prestadorExiste.morada,
                cidade:   cidade !== undefined ? cidade : prestadorExiste.cidade,
                estado:   estadoFinal,
                nif:      nif !== undefined ? nif : prestadorExiste.nif,
                descricao:descricao !== undefined ? descricao : prestadorExiste.descricao,
                horario:  horario !== undefined ? horario : prestadorExiste.horario,
                areas_atuacao: areas_atuacao !== undefined ? areas_atuacao : prestadorExiste.areas_atuacao,
                logo_url: logo_url !== undefined ? logo_url : prestadorExiste.logo_url,
                website:  website !== undefined ? website : prestadorExiste.website
            });

            res.json({
                sucesso: true,
                mensagem: 'Prestador atualizado com sucesso',
                dados: prestadorAtualizado
            });
        } catch (erro) {
            console.error('Erro ao atualizar prestador:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
        }
    },

    // DELETE /prestadores/:id
    async eliminar(req, res) {
        try {
            const { id } = req.params;

            const prestadorExiste = await PrestadorModel.buscarPorId(id);
            if (!prestadorExiste) {
                return res.status(404).json({ sucesso: false, mensagem: 'Prestador não encontrado' });
            }

            await PrestadorModel.eliminar(id);

            res.json({
                sucesso: true,
                mensagem: 'Prestador eliminado com sucesso'
            });
        } catch (erro) {
            console.error('Erro ao eliminar prestador:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor' });
        }
    }
};

module.exports = PrestadorController;
