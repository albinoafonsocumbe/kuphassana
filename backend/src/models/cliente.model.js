const pool = require('../config/database');

const ClienteModel = {

    async criar(dados) {
        const { nome, email, senha_hash, telefone, cidade } = dados;
        const res = await pool.query(
            `INSERT INTO clientes (nome, email, senha_hash, telefone, cidade)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING id, nome, email, telefone, cidade, criado_em`,
            [nome, email, senha_hash, telefone, cidade]
        );
        return res.rows[0];
    },

    async buscarPorEmail(email) {
        const res = await pool.query(
            `SELECT id, nome, email, senha_hash, telefone, cidade, estado
             FROM clientes WHERE email = $1`,
            [email]
        );
        return res.rows[0];
    },

    async buscarPorId(id) {
        const res = await pool.query(
            `SELECT id, nome, email, telefone, cidade, estado, criado_em
             FROM clientes WHERE id = $1`,
            [id]
        );
        return res.rows[0];
    },

    async atualizar(id, dados) {
        const { nome, telefone, cidade } = dados;
        const res = await pool.query(
            `UPDATE clientes
             SET nome=$1, telefone=$2, cidade=$3, atualizado_em=NOW()
             WHERE id=$4
             RETURNING id, nome, email, telefone, cidade, atualizado_em`,
            [nome, telefone, cidade, id]
        );
        return res.rows[0];
    },

    async emailExiste(email) {
        const res = await pool.query(
            `SELECT id FROM clientes WHERE email=$1`, [email]
        );
        return res.rows.length > 0;
    }
};

module.exports = ClienteModel;
