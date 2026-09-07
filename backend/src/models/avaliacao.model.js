const pool = require('../config/database');

const AvaliacaoModel = {

    // Criar uma nova avaliação
    async criar(dados) {
        const { cliente_id, servico_id, prestador_id, pedido_id, classificacao, comentario } = dados;
        const query = `
            INSERT INTO avaliacoes (cliente_id, servico_id, prestador_id, pedido_id, classificacao, comentario)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const valores = [cliente_id, servico_id || null, prestador_id, pedido_id || null, classificacao, comentario || null];
        const res = await pool.query(query, valores);
        return res.rows[0];
    },

    // Listar avaliações de um prestador
    async listarPorPrestador(prestador_id) {
        const query = `
            SELECT
                a.id, a.classificacao, a.comentario, a.criado_em,
                c.nome AS cliente_nome,
                s.nome AS servico_nome
            FROM avaliacoes a
            JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN servicos s ON a.servico_id = s.id
            WHERE a.prestador_id = $1
            ORDER BY a.criado_em DESC
        `;
        const res = await pool.query(query, [prestador_id]);
        return res.rows;
    },

    // Listar avaliações de um serviço específico
    async listarPorServico(servico_id) {
        const query = `
            SELECT
                a.id, a.classificacao, a.comentario, a.criado_em,
                c.nome AS cliente_nome
            FROM avaliacoes a
            JOIN clientes c ON a.cliente_id = c.id
            WHERE a.servico_id = $1
            ORDER BY a.criado_em DESC
        `;
        const res = await pool.query(query, [servico_id]);
        return res.rows;
    },

    // Obter estatísticas / média de um prestador
    async obterEstatisticasPrestador(prestador_id) {
        const query = `
            SELECT
                COUNT(*)::int AS total,
                COALESCE(ROUND(AVG(classificacao), 1), 0)::float AS media
            FROM avaliacoes
            WHERE prestador_id = $1
        `;
        const res = await pool.query(query, [prestador_id]);
        return res.rows[0];
    },

    // Obter estatísticas / média de um serviço
    async obterEstatisticasServico(servico_id) {
        const query = `
            SELECT
                COUNT(*)::int AS total,
                COALESCE(ROUND(AVG(classificacao), 1), 0)::float AS media
            FROM avaliacoes
            WHERE servico_id = $1
        `;
        const res = await pool.query(query, [servico_id]);
        return res.rows[0];
    },

    // Verificar se o cliente já avaliou este pedido
    async buscarPorPedido(pedido_id) {
        const query = `SELECT * FROM avaliacoes WHERE pedido_id = $1`;
        const res = await pool.query(query, [pedido_id]);
        return res.rows[0];
    }
};

module.exports = AvaliacaoModel;
