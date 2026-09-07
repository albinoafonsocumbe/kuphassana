const pool = require('../config/database');

const ServicoModel = {

    // Listar todos os serviços (com filtros opcionais)
    async listar({ cidade, categoria, preco_min, preco_max, pesquisa, pagina = 1, limite = 10 }) {
        const condicoes = ['s.estado = $1'];
        const valores = ['ativo'];
        let contador = 2;

        if (cidade) {
            condicoes.push(`p.cidade ILIKE $${contador++}`);
            valores.push(`%${cidade}%`);
        }
        if (categoria) {
            condicoes.push(`s.categoria = $${contador++}`);
            valores.push(categoria);
        }
        if (preco_min) {
            condicoes.push(`s.preco >= $${contador++}`);
            valores.push(Number(preco_min));
        }
        if (preco_max) {
            condicoes.push(`s.preco <= $${contador++}`);
            valores.push(Number(preco_max));
        }
        if (pesquisa) {
            condicoes.push(`(s.nome ILIKE $${contador} OR s.descricao ILIKE $${contador})`);
            valores.push(`%${pesquisa}%`);
            contador++;
        }

        const offset = (pagina - 1) * limite;
        const where = condicoes.join(' AND ');

        const query = `
            SELECT
                s.id, s.nome, s.descricao, s.categoria, s.preco,
                s.duracao_horas, s.imagem_url, s.itens_incluidos, s.tipo_servico, s.estado, s.criado_em,
                p.id   AS prestador_id,
                p.nome AS prestador_nome,
                p.cidade,
                p.telefone,
                p.horario AS prestador_horario,
                p.logo_url AS prestador_logo
            FROM servicos s
            JOIN prestadores p ON s.prestador_id = p.id
            WHERE ${where}
            ORDER BY s.criado_em DESC
            LIMIT $${contador} OFFSET $${contador + 1}
        `;
        valores.push(Number(limite), offset);

        // Query de contagem total (para paginação)
        const queryTotal = `
            SELECT COUNT(*) FROM servicos s
            JOIN prestadores p ON s.prestador_id = p.id
            WHERE ${where}
        `;
        const valoresTotal = valores.slice(0, -2); // sem limit e offset

        const [resultado, total] = await Promise.all([
            pool.query(query, valores),
            pool.query(queryTotal, valoresTotal)
        ]);

        return {
            dados: resultado.rows,
            total: parseInt(total.rows[0].count),
            pagina: Number(pagina),
            limite: Number(limite),
            paginas: Math.ceil(total.rows[0].count / limite)
        };
    },

    // Buscar serviço por ID
    async buscarPorId(id) {
        const query = `
            SELECT
                s.id, s.nome, s.descricao, s.categoria, s.preco,
                s.duracao_horas, s.imagem_url, s.itens_incluidos, s.tipo_servico, s.estado, s.criado_em,
                p.id    AS prestador_id,
                p.nome  AS prestador_nome,
                p.cidade, p.telefone,
                p.email AS prestador_email,
                p.nif   AS prestador_nif,
                p.horario AS prestador_horario,
                p.areas_atuacao AS prestador_areas,
                p.logo_url AS prestador_logo,
                p.website  AS prestador_website
            FROM servicos s
            JOIN prestadores p ON s.prestador_id = p.id
            WHERE s.id = $1
        `;
        const resultado = await pool.query(query, [id]);
        return resultado.rows[0];
    },

    // Listar serviços de um prestador específico
    async listarPorPrestador(prestador_id) {
        const query = `
            SELECT id, nome, descricao, categoria, preco, duracao_horas, imagem_url, itens_incluidos, tipo_servico, estado, criado_em
            FROM servicos
            WHERE prestador_id = $1
            ORDER BY criado_em DESC
        `;
        const resultado = await pool.query(query, [prestador_id]);
        return resultado.rows;
    },

    // Criar serviço
    async criar(dados) {
        const { prestador_id, nome, descricao, categoria, preco, duracao_horas, imagem_url, itens_incluidos, tipo_servico } = dados;
        const query = `
            INSERT INTO servicos (prestador_id, nome, descricao, categoria, preco, duracao_horas, imagem_url, itens_incluidos, tipo_servico)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, nome, descricao, categoria, preco, duracao_horas, imagem_url, itens_incluidos, tipo_servico, estado, criado_em
        `;
        const itensJson = Array.isArray(itens_incluidos) ? JSON.stringify(itens_incluidos) : (itens_incluidos || '[]');
        const resultado = await pool.query(query, [
            prestador_id, nome, descricao, categoria, preco, duracao_horas, imagem_url || null, itensJson, tipo_servico || 'pacote'
        ]);
        return resultado.rows[0];
    },

    // Atualizar serviço
    async atualizar(id, dados) {
        const { nome, descricao, categoria, preco, duracao_horas, imagem_url, itens_incluidos, tipo_servico, estado } = dados;
        const itensJson = Array.isArray(itens_incluidos) ? JSON.stringify(itens_incluidos) : (itens_incluidos !== undefined ? itens_incluidos : null);
        const query = `
            UPDATE servicos
            SET nome=$1, descricao=$2, categoria=$3, preco=$4,
                duracao_horas=$5,
                imagem_url = COALESCE($6, imagem_url),
                itens_incluidos = CASE WHEN $7::jsonb IS NOT NULL THEN $7::jsonb ELSE itens_incluidos END,
                tipo_servico = COALESCE($8, tipo_servico),
                estado = COALESCE($9, estado),
                atualizado_em=NOW()
            WHERE id = $10
            RETURNING id, nome, descricao, categoria, preco, duracao_horas, imagem_url, itens_incluidos, tipo_servico, estado, atualizado_em
        `;
        const resultado = await pool.query(query, [
            nome, descricao, categoria, preco, duracao_horas, imagem_url || null, itensJson, tipo_servico || null, estado || null, id
        ]);
        return resultado.rows[0];
    },

    // Eliminar serviço
    async eliminar(id) {
        const resultado = await pool.query(
            'DELETE FROM servicos WHERE id = $1 RETURNING id',
            [id]
        );
        return resultado.rows[0];
    },

    // Listar categorias disponíveis
    async listarCategorias() {
        const query = `
            SELECT DISTINCT categoria, COUNT(*) AS total
            FROM servicos
            WHERE estado = 'ativo'
            GROUP BY categoria
            ORDER BY total DESC
        `;
        const resultado = await pool.query(query);
        return resultado.rows;
    }
};

module.exports = ServicoModel;
