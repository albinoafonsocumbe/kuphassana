/**
 * setup.js — Criar todas as tabelas da Agência Funerária
 * Executar: node database/setup.js
 */
const pool = require('../src/config/database');

async function setup() {
    console.log('🔧 A configurar base de dados...\n');
    try {

        // Tabela: empresa (dados da agência)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS empresa (
                id            SERIAL PRIMARY KEY,
                nome          VARCHAR(200)  NOT NULL DEFAULT 'Agência Funerária',
                slogan        VARCHAR(300),
                telefone      VARCHAR(30),
                whatsapp      VARCHAR(30),
                email         VARCHAR(150),
                morada        VARCHAR(300),
                cidade        VARCHAR(100),
                horario       VARCHAR(200),
                sobre         TEXT,
                logo_url      VARCHAR(500),
                criado_em     TIMESTAMP DEFAULT NOW(),
                atualizado_em TIMESTAMP DEFAULT NOW()
            );
            -- Inserir dados da empresa (apenas um registo)
            INSERT INTO empresa (nome, slogan, telefone, whatsapp, email, cidade, horario)
            VALUES (
                'Agência Funerária Silva',
                'Cuidamos de si e da sua família nos momentos mais difíceis',
                '+351 912 345 678',
                '351912345678',
                'contacto@funeraria-silva.pt',
                'Lisboa',
                'Disponível 24 horas, 7 dias por semana'
            )
            ON CONFLICT DO NOTHING;
        `);
        console.log('✅ Tabela empresa');

        // Tabela: administradores
        await pool.query(`
            CREATE TABLE IF NOT EXISTS administradores (
                id         SERIAL PRIMARY KEY,
                nome       VARCHAR(150) NOT NULL,
                email      VARCHAR(150) NOT NULL UNIQUE,
                senha_hash VARCHAR(255) NOT NULL,
                criado_em  TIMESTAMP DEFAULT NOW()
            );
            -- Admin padrão: senha = admin123
            INSERT INTO administradores (nome, email, senha_hash)
            VALUES (
                'Administrador',
                'admin@funeraria.pt',
                '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
            )
            ON CONFLICT (email) DO NOTHING;
        `);
        console.log('✅ Tabela administradores');

        // Tabela: categorias de serviços
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categorias (
                id        SERIAL PRIMARY KEY,
                nome      VARCHAR(100) NOT NULL UNIQUE,
                icone     VARCHAR(10)  DEFAULT '✦',
                ordem     INTEGER      DEFAULT 0
            );
            INSERT INTO categorias (nome, icone, ordem) VALUES
                ('Funeral Completo', '⚰️', 1),
                ('Cremação',         '🕯️', 2),
                ('Transporte',       '🚗', 3),
                ('Urna',             '🏺', 4),
                ('Flores',           '🌹', 5),
                ('Documentação',     '📋', 6),
                ('Outro',            '✦',  7)
            ON CONFLICT (nome) DO NOTHING;
        `);
        console.log('✅ Tabela categorias');

        // Tabela: serviços da empresa
        await pool.query(`
            CREATE TABLE IF NOT EXISTS servicos (
                id            SERIAL PRIMARY KEY,
                nome          VARCHAR(200)   NOT NULL,
                descricao     TEXT,
                categoria     VARCHAR(100)   NOT NULL,
                preco         NUMERIC(10,2),
                preco_visivel BOOLEAN        DEFAULT true,
                duracao_horas INTEGER,
                destaque      BOOLEAN        DEFAULT false,
                estado        VARCHAR(50)    DEFAULT 'ativo',
                ordem         INTEGER        DEFAULT 0,
                criado_em     TIMESTAMP      DEFAULT NOW(),
                atualizado_em TIMESTAMP      DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria);
            CREATE INDEX IF NOT EXISTS idx_servicos_estado    ON servicos(estado);
            CREATE INDEX IF NOT EXISTS idx_servicos_destaque  ON servicos(destaque);
        `);
        console.log('✅ Tabela servicos');

        // Tabela: contactos recebidos (quando alguém preenche formulário)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS contactos (
                id         SERIAL PRIMARY KEY,
                nome       VARCHAR(150) NOT NULL,
                telefone   VARCHAR(30),
                email      VARCHAR(150),
                servico_id INTEGER REFERENCES servicos(id) ON DELETE SET NULL,
                mensagem   TEXT,
                canal      VARCHAR(50) DEFAULT 'formulario',
                lido       BOOLEAN DEFAULT false,
                criado_em  TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_contactos_lido ON contactos(lido);
        `);
        console.log('✅ Tabela contactos');

        // Inserir serviços de exemplo
        await pool.query(`
            INSERT INTO servicos (nome, descricao, categoria, preco, destaque, ordem) VALUES
            ('Funeral Completo',
             'Serviço funerário completo com tratamento do corpo, urna, transporte, cerimónia religiosa e gestão de toda a documentação necessária.',
             'Funeral Completo', 2500.00, true, 1),
            ('Cremação com Cerimónia',
             'Serviço de cremação com cerimónia de despedida, urna cinerária e entrega das cinzas à família.',
             'Cremação', 1800.00, true, 2),
            ('Transporte Funerário',
             'Transporte do corpo em viatura própria, disponível 24 horas. Serviço em todo o país.',
             'Transporte', 350.00, false, 3),
            ('Urna Simples',
             'Urna de madeira em pinho, acabamento natural, adequada para inumação ou cremação.',
             'Urna', 280.00, false, 4),
            ('Urna Premium',
             'Urna em madeira de carvalho com acabamento lacado e detalhes em bronze.',
             'Urna', 650.00, false, 5),
            ('Arranjo Floral',
             'Coroa ou ramo de flores naturais, preparado no próprio dia.',
             'Flores', 120.00, false, 6),
            ('Gestão de Documentação',
             'Tratamento de toda a documentação legal — certidão de óbito, assento de óbito, e demais formalidades.',
             'Documentação', NULL, false, 7)
            ON CONFLICT DO NOTHING;
        `);
        console.log('✅ Serviços de exemplo inseridos');

        console.log('\n🎉 Base de dados configurada com sucesso!\n');
        console.log('📋 Credenciais de acesso ao painel admin:');
        console.log('   Email : admin@funeraria.pt');
        console.log('   Senha : password\n');

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

setup();
