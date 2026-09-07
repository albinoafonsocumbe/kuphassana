const pool = require('../config/database');

const PedidoModel = {

    // Criar pedido de contacto
    async criar(dados) {
        const { cliente_id, servico_id, prestador_id, mensagem } = dados;
        const res = await pool.query(
            `INSERT INTO pedidos (cliente_id, servico_id, prestador_id, mensagem)
             VALUES ($1,$2,$3,$4)
             RETURNING *`,
            [cliente_id, servico_id, prestador_id, mensagem]
        );
        return res.rows[0];
    },

    // Pedidos de um cliente (com info do serviço e prestador)
    async listarPorCliente(cliente_id) {
        const res = await pool.query(
            `SELECT
                p.id, p.mensagem, p.estado, p.criado_em,
                s.id          AS servico_id,
                s.nome        AS servico_nome,
                s.preco       AS servico_preco,
                s.categoria   AS servico_categoria,
                s.duracao_horas AS servico_duracao,
                pr.id         AS prestador_id,
                pr.nome       AS prestador_nome,
                pr.telefone   AS prestador_telefone,
                pr.email      AS prestador_email,
                pr.cidade     AS prestador_cidade,
                pr.morada     AS prestador_morada
             FROM pedidos p
             JOIN servicos    s  ON p.servico_id   = s.id
             JOIN prestadores pr ON p.prestador_id = pr.id
             WHERE p.cliente_id = $1
             ORDER BY p.criado_em DESC`,
            [cliente_id]
        );
        return res.rows;
    },

    // Pedidos recebidos por um prestador
    async listarPorPrestador(prestador_id) {
        const res = await pool.query(
            `SELECT
                p.id, p.mensagem, p.notas_prestador, p.valor_orcamento, p.detalhes_orcamento, p.estado, p.criado_em, p.atualizado_em,
                s.id        AS servico_id,
                s.nome      AS servico_nome,
                s.preco     AS servico_preco,
                s.categoria AS servico_categoria,
                s.imagem_url AS servico_imagem,
                s.itens_incluidos AS servico_itens,
                c.id        AS cliente_id,
                c.nome      AS cliente_nome,
                c.telefone  AS cliente_telefone,
                c.email     AS cliente_email,
                c.cidade    AS cliente_cidade
             FROM pedidos p
             JOIN servicos s ON p.servico_id  = s.id
             JOIN clientes c ON p.cliente_id  = c.id
             WHERE p.prestador_id = $1
             ORDER BY p.criado_em DESC`,
            [prestador_id]
        );
        return res.rows;
    },

    async buscarPorId(id) {
        const res = await pool.query(
            `SELECT
                p.*,
                s.nome AS servico_nome,
                s.preco AS servico_preco,
                s.categoria AS servico_categoria,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone,
                c.email AS cliente_email
             FROM pedidos p
             JOIN servicos s ON p.servico_id = s.id
             JOIN clientes c ON p.cliente_id = c.id
             WHERE p.id = $1`,
            [id]
        );
        return res.rows[0];
    },

    async atualizarEstado(id, estado) {
        const res = await pool.query(
            `UPDATE pedidos SET estado=$1, atualizado_em=NOW()
             WHERE id=$2 RETURNING *`,
            [estado, id]
        );
        return res.rows[0];
    },

    // Salvar notas internas do prestador
    async salvarNotas(id, notas) {
        const res = await pool.query(
            `UPDATE pedidos
             SET notas_prestador = $1, atualizado_em = NOW()
             WHERE id = $2
             RETURNING id, notas_prestador, atualizado_em`,
            [notas, id]
        );
        return res.rows[0];
    },

    // Salvar orçamento gerado
    async salvarOrcamento(id, valor, detalhes) {
        const detalhesJson = typeof detalhes === 'object' ? JSON.stringify(detalhes) : detalhes;
        const res = await pool.query(
            `UPDATE pedidos
             SET valor_orcamento = $1, detalhes_orcamento = $2::jsonb, atualizado_em = NOW()
             WHERE id = $3
             RETURNING id, valor_orcamento, detalhes_orcamento, atualizado_em`,
            [valor, detalhesJson, id]
        );
        return res.rows[0];
    },

    // Verificar se já existe pedido igual pendente
    async pedidoDuplicado(cliente_id, servico_id) {
        const res = await pool.query(
            `SELECT id FROM pedidos
             WHERE cliente_id=$1 AND servico_id=$2 AND estado='pendente'`,
            [cliente_id, servico_id]
        );
        return res.rows.length > 0;
    }
};

module.exports = PedidoModel;
