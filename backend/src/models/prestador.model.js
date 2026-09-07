const pool = require('../config/database');

const PrestadorModel = {

    // Listar todos os prestadores
    async listarTodos() {
        const query = `
            SELECT id, nome, email, telefone, morada, cidade, nif, descricao, horario, areas_atuacao, logo_url, website, estado, criado_em
            FROM prestadores
            ORDER BY nome ASC
        `;
        const resultado = await pool.query(query);
        return resultado.rows;
    },

    // Buscar prestador por ID
    async buscarPorId(id) {
        const query = `
            SELECT id, nome, email, telefone, morada, cidade, nif, descricao, horario, areas_atuacao, logo_url, website, estado, criado_em
            FROM prestadores
            WHERE id = $1
        `;
        const resultado = await pool.query(query, [id]);
        return resultado.rows[0];
    },

    // Criar novo prestador
    async criar(dados) {
        const { nome, email, telefone, morada, cidade, estado, senha_hash, nif, descricao, horario, areas_atuacao, logo_url, website } = dados;
        const query = `
            INSERT INTO prestadores (nome, email, telefone, morada, cidade, estado, senha_hash, nif, descricao, horario, areas_atuacao, logo_url, website)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, nome, email, telefone, morada, cidade, nif, descricao, horario, areas_atuacao, logo_url, website, estado, criado_em
        `;
        const valores = [nome, email, telefone, morada, cidade, estado || 'ativo', senha_hash, nif || null, descricao || null, horario || 'Piquete 24h / 7 dias por semana', areas_atuacao || null, logo_url || null, website || null];
        const resultado = await pool.query(query, valores);
        return resultado.rows[0];
    },

    // Atualizar prestador
    async atualizar(id, dados) {
        const { nome, telefone, morada, cidade, estado, nif, descricao, horario, areas_atuacao, logo_url, website } = dados;
        const query = `
            UPDATE prestadores
            SET nome = $1, telefone = $2, morada = $3, cidade = $4,
                estado = COALESCE($5, estado),
                nif = $6, descricao = $7, horario = $8,
                areas_atuacao = $9, logo_url = $10, website = $11,
                atualizado_em = NOW()
            WHERE id = $12
            RETURNING id, nome, email, telefone, morada, cidade, nif, descricao, horario, areas_atuacao, logo_url, website, estado, atualizado_em
        `;
        const valores = [nome, telefone, morada, cidade, estado, nif, descricao, horario, areas_atuacao, logo_url, website, id];
        const resultado = await pool.query(query, valores);
        return resultado.rows[0];
    },

    // Eliminar prestador
    async eliminar(id) {
        const query = `DELETE FROM prestadores WHERE id = $1 RETURNING id`;
        const resultado = await pool.query(query, [id]);
        return resultado.rows[0];
    },

    // Verificar se email já existe
    async emailExiste(email) {
        const query = `SELECT id FROM prestadores WHERE email = $1`;
        const resultado = await pool.query(query, [email]);
        return resultado.rows.length > 0;
    }
};

module.exports = PrestadorModel;
