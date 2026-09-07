const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const ClienteModel = require('../models/cliente.model');
require('dotenv').config();

const AuthController = {

    /**
     * POST /api/auth/registar
     * Registo de novo prestador
     */
    async registar(req, res) {
        try {
            const { nome, email, telefone, morada, cidade, senha } = req.body;

            if (!nome || !email || !senha) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Nome, email e senha são obrigatórios.'
                });
            }

            // Verificar se email já existe
            const existe = await pool.query(
                'SELECT id FROM prestadores WHERE email = $1',
                [email]
            );
            if (existe.rows.length > 0) {
                return res.status(409).json({
                    sucesso: false,
                    mensagem: 'Este email já está registado.'
                });
            }

            // Encriptar senha
            const senha_hash = await bcrypt.hash(senha, 10);

            // Inserir prestador
            const resultado = await pool.query(
                `INSERT INTO prestadores (nome, email, senha_hash, telefone, morada, cidade)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, nome, email, cidade, criado_em`,
                [nome, email, senha_hash, telefone, morada, cidade]
            );

            const prestador = resultado.rows[0];

            // Gerar token JWT
            const token = jwt.sign(
                { id: prestador.id, email: prestador.email, papel: 'prestador' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.status(201).json({
                sucesso: true,
                mensagem: 'Registo realizado com sucesso!',
                token,
                utilizador: { ...prestador, papel: 'prestador' }
            });

        } catch (erro) {
            console.error('Erro no registo:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    /**
     * POST /api/auth/login
     * Login de prestador ou administrador
     */
    async login(req, res) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Email e senha são obrigatórios.'
                });
            }

            // Procurar utilizador (prestador ou admin)
            let utilizador = null;
            let papel = null;

            // 1. Verificar na tabela de prestadores
            const resPrestador = await pool.query(
                'SELECT id, nome, email, senha_hash, estado FROM prestadores WHERE email = $1',
                [email]
            );
            if (resPrestador.rows.length > 0) {
                utilizador = resPrestador.rows[0];
                papel = 'prestador';
            }

            // 2. Verificar na tabela de administradores
            if (!utilizador) {
                const resAdmin = await pool.query(
                    'SELECT id, nome, email, senha_hash FROM administradores WHERE email = $1',
                    [email]
                );
                if (resAdmin.rows.length > 0) {
                    utilizador = resAdmin.rows[0];
                    papel = 'admin';
                }
            }

            // 3. Verificar na tabela de clientes
            if (!utilizador) {
                const resCliente = await pool.query(
                    'SELECT id, nome, email, senha_hash, estado FROM clientes WHERE email = $1',
                    [email]
                );
                if (resCliente.rows.length > 0) {
                    utilizador = resCliente.rows[0];
                    papel = 'cliente';
                }
            }

            // Utilizador não encontrado
            if (!utilizador) {
                return res.status(401).json({
                    sucesso: false,
                    mensagem: 'Email ou senha incorretos.'
                });
            }

            // Verificar estado da conta (apenas para prestadores)
            if (papel === 'prestador' && utilizador.estado === 'suspenso') {
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Conta suspensa. Contacte o suporte.'
                });
            }

            // Verificar senha
            const senhaCorreta = await bcrypt.compare(senha, utilizador.senha_hash);
            if (!senhaCorreta) {
                return res.status(401).json({
                    sucesso: false,
                    mensagem: 'Email ou senha incorretos.'
                });
            }

            // Gerar token JWT
            const token = jwt.sign(
                { id: utilizador.id, email: utilizador.email, papel },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                sucesso: true,
                mensagem: 'Login realizado com sucesso!',
                token,
                utilizador: {
                    id: utilizador.id,
                    nome: utilizador.nome,
                    email: utilizador.email,
                    papel
                }
            });

        } catch (erro) {
            console.error('Erro no login:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    /**
     * GET /api/auth/perfil
     * Devolver dados do utilizador autenticado (rota protegida)
     */
    async perfil(req, res) {
        try {
            const { id, papel } = req.utilizador;

            let query;
            if (papel === 'admin') {
                query = 'SELECT id, nome, email FROM administradores WHERE id = $1';
            } else if (papel === 'cliente') {
                query = 'SELECT id, nome, email, telefone, cidade, estado, criado_em FROM clientes WHERE id = $1';
            } else {
                query = 'SELECT id, nome, email, telefone, morada, cidade, nif, descricao, horario, areas_atuacao, logo_url, website, estado, criado_em FROM prestadores WHERE id = $1';
            }

            const resultado = await pool.query(query, [id]);

            if (resultado.rows.length === 0) {
                return res.status(404).json({ sucesso: false, mensagem: 'Utilizador não encontrado.' });
            }

            res.json({
                sucesso: true,
                utilizador: { ...resultado.rows[0], papel }
            });

        } catch (erro) {
            console.error('Erro ao buscar perfil:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    },

    /**
     * POST /api/auth/registar-cliente
     * Registo de novo cliente
     */
    async registarCliente(req, res) {
        try {
            const { nome, email, telefone, cidade, senha } = req.body;

            if (!nome || !email || !senha) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Nome, email e senha são obrigatórios.'
                });
            }

            // Verificar duplicado entre clientes E prestadores (mesmo email)
            const existeCliente   = await ClienteModel.emailExiste(email);
            const existePrestador = await pool.query(
                'SELECT id FROM prestadores WHERE email=$1', [email]
            );

            if (existeCliente || existePrestador.rows.length > 0) {
                return res.status(409).json({
                    sucesso: false,
                    mensagem: 'Este email já está registado.'
                });
            }

            const senha_hash = await bcrypt.hash(senha, 10);

            const cliente = await ClienteModel.criar({
                nome, email, senha_hash, telefone, cidade
            });

            const token = jwt.sign(
                { id: cliente.id, email: cliente.email, papel: 'cliente' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.status(201).json({
                sucesso: true,
                mensagem: 'Conta criada com sucesso!',
                token,
                utilizador: { ...cliente, papel: 'cliente' }
            });

        } catch (erro) {
            console.error('Erro no registo de cliente:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    }
};

module.exports = AuthController;
