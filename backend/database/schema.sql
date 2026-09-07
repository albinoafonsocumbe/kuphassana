-- =====================================================
-- Plataforma Funerária - Schema da Base de Dados
-- =====================================================

-- Criar a base de dados (executar separadamente se necessário)
-- CREATE DATABASE plataforma_funeraria;

-- Tabela: prestadores
CREATE TABLE IF NOT EXISTS prestadores (
    id            SERIAL PRIMARY KEY,
    nome          VARCHAR(150)        NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    senha_hash    VARCHAR(255)        NOT NULL,
    telefone      VARCHAR(20),
    morada        VARCHAR(255),
    cidade        VARCHAR(100),
    nif           VARCHAR(30),
    descricao     TEXT,
    horario       VARCHAR(100)        DEFAULT 'Piquete 24h / 7 dias por semana',
    areas_atuacao TEXT,
    logo_url      TEXT,
    website       VARCHAR(255),
    estado        VARCHAR(50)         DEFAULT 'ativo',  -- ativo | inativo | suspenso
    criado_em     TIMESTAMP           DEFAULT NOW(),
    atualizado_em TIMESTAMP           DEFAULT NOW()
);

-- Índice para pesquisa rápida por email
CREATE INDEX IF NOT EXISTS idx_prestadores_email ON prestadores(email);

-- Índice para filtrar por cidade
CREATE INDEX IF NOT EXISTS idx_prestadores_cidade ON prestadores(cidade);

-- -------------------------------------------------------

-- Tabela: administradores
CREATE TABLE IF NOT EXISTS administradores (
    id            SERIAL PRIMARY KEY,
    nome          VARCHAR(150)        NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    senha_hash    VARCHAR(255)        NOT NULL,
    criado_em     TIMESTAMP           DEFAULT NOW()
);

-- Inserir administrador padrão (senha: admin123)
-- Gera o hash com bcrypt rounds=10
-- ATENÇÃO: altera a senha depois do primeiro login!
INSERT INTO administradores (nome, email, senha_hash)
VALUES (
    'Administrador',
    'admin@plataforma.pt',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' -- senha: password
)
ON CONFLICT (email) DO NOTHING;

-- -------------------------------------------------------

-- Tabela: servicos
CREATE TABLE IF NOT EXISTS servicos (
    id             SERIAL PRIMARY KEY,
    prestador_id   INTEGER             NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
    nome           VARCHAR(150)        NOT NULL,
    descricao      TEXT,
    categoria      VARCHAR(100)        NOT NULL,
    preco          NUMERIC(10, 2)      NOT NULL,
    duracao_horas  INTEGER,
    imagem_url     TEXT,
    itens_incluidos JSONB              DEFAULT '[]'::jsonb,
    tipo_servico   VARCHAR(50)         DEFAULT 'pacote',  -- pacote | personalizado | base
    estado         VARCHAR(50)         DEFAULT 'ativo',  -- ativo | inativo
    criado_em      TIMESTAMP           DEFAULT NOW(),
    atualizado_em  TIMESTAMP           DEFAULT NOW()
);

-- Índices para pesquisa e filtros
CREATE INDEX IF NOT EXISTS idx_servicos_prestador  ON servicos(prestador_id);
CREATE INDEX IF NOT EXISTS idx_servicos_categoria  ON servicos(categoria);
CREATE INDEX IF NOT EXISTS idx_servicos_estado     ON servicos(estado);

-- Pesquisa por texto (nome e descrição)
CREATE INDEX IF NOT EXISTS idx_servicos_nome_descricao
    ON servicos USING gin(to_tsvector('portuguese', nome || ' ' || COALESCE(descricao, '')));

-- -------------------------------------------------------

-- Tabela: clientes
CREATE TABLE IF NOT EXISTS clientes (
    id            SERIAL PRIMARY KEY,
    nome          VARCHAR(150)        NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    senha_hash    VARCHAR(255)        NOT NULL,
    telefone      VARCHAR(20),
    cidade        VARCHAR(100),
    estado        VARCHAR(50)         DEFAULT 'ativo',
    criado_em     TIMESTAMP           DEFAULT NOW(),
    atualizado_em TIMESTAMP           DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- -------------------------------------------------------

-- Tabela: pedidos (cliente solicita contacto de um serviço)
CREATE TABLE IF NOT EXISTS pedidos (
    id                 SERIAL PRIMARY KEY,
    cliente_id         INTEGER        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    servico_id         INTEGER        NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    prestador_id       INTEGER        NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
    mensagem           TEXT,
    notas_prestador    TEXT,
    valor_orcamento    NUMERIC(10, 2),
    detalhes_orcamento JSONB,
    estado             VARCHAR(50)    DEFAULT 'pendente', -- pendente | confirmado | cancelado | concluido
    criado_em          TIMESTAMP      DEFAULT NOW(),
    atualizado_em      TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente   ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_prestador ON pedidos(prestador_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado    ON pedidos(estado);

-- -------------------------------------------------------

-- Tabela: avaliacoes (reviews & ratings das famílias)
CREATE TABLE IF NOT EXISTS avaliacoes (
    id            SERIAL PRIMARY KEY,
    cliente_id    INTEGER        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    servico_id    INTEGER        REFERENCES servicos(id) ON DELETE CASCADE,
    prestador_id  INTEGER        NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
    pedido_id     INTEGER        REFERENCES pedidos(id) ON DELETE SET NULL,
    classificacao INTEGER        NOT NULL CHECK (classificacao >= 1 AND classificacao <= 5),
    comentario    TEXT,
    criado_em     TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_prestador ON avaliacoes(prestador_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_servico   ON avaliacoes(servico_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_cliente   ON avaliacoes(cliente_id);
