const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('./config/database');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Uploads ───────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads/servicos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const nome = `srv_${Date.now()}_${Math.random().toString(36).slice(2,8)}${ext}`;
        cb(null, nome);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        allowed.includes(ext) ? cb(null, true) : cb(new Error('Apenas imagens JPG, PNG ou WebP.'));
    }
});

// Servir imagens publicamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── CORS ─────────────────────────────────────────────────────
const origensPermitidas = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'https://kuphassana.vercel.app',
    'https://kuphassana.onrender.com',
];

// Adicionar FRONTEND_URL se configurado nas variáveis de ambiente
if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',').forEach(u => {
        const trimmed = u.trim();
        if (!origensPermitidas.includes(trimmed)) origensPermitidas.push(trimmed);
    });
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Postman, mobile, etc.
        if (
            origensPermitidas.some(o => origin === o) ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.onrender.com')
        ) {
            return callback(null, true);
        }
        callback(new Error(`CORS bloqueado para: ${origin}`));
    },
    methods:        ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials:    true
}));
app.use(express.json());

// ── MIDDLEWARE JWT ────────────────────────────────────────────
function verificarToken(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer '))
        return res.status(401).json({ sucesso: false, mensagem: 'Token não fornecido.' });
    try {
        req.utilizador = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ sucesso: false, mensagem: 'Token inválido ou expirado.' });
    }
}

function apenasAdmin(req, res, next) {
    if (req.utilizador?.papel !== 'admin')
        return res.status(403).json({ sucesso: false, mensagem: 'Acesso restrito ao administrador.' });
    next();
}

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha)
            return res.status(400).json({ sucesso: false, mensagem: 'Email e senha são obrigatórios.' });

        const r = await pool.query(
            'SELECT id, nome, email, senha_hash FROM administradores WHERE email=$1', [email]
        );
        if (!r.rows.length)
            return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas.' });

        const admin = r.rows[0];
        const ok = await bcrypt.compare(senha, admin.senha_hash);
        if (!ok)
            return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas.' });

        const token = jwt.sign(
            { id: admin.id, email: admin.email, papel: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            sucesso: true,
            token,
            utilizador: { id: admin.id, nome: admin.nome, email: admin.email, papel: 'admin' }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// GET /api/auth/perfil
app.get('/api/auth/perfil', verificarToken, async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT id, nome, email FROM administradores WHERE id=$1', [req.utilizador.id]
        );
        if (!r.rows.length)
            return res.status(404).json({ sucesso: false, mensagem: 'Não encontrado.' });
        res.json({ sucesso: true, utilizador: { ...r.rows[0], papel: 'admin' } });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// ══════════════════════════════════════════════════════════════
//  EMPRESA
// ══════════════════════════════════════════════════════════════

// GET /api/empresa
app.get('/api/empresa', async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM empresa ORDER BY id LIMIT 1');
        res.json({ sucesso: true, dados: r.rows[0] || null });
    } catch (e) {
        console.error('ERRO /api/empresa:', e.message, e.code);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno.',
            codigo: e.code,
            detalhe: e.message
        });
    }
});

// GET /api/debug — diagnóstico da BD
app.get('/api/debug', async (req, res) => {
    try {
        const tabelas = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        const conn = await pool.query('SELECT NOW() as agora, current_database() as bd');
        res.json({
            sucesso: true,
            hora: conn.rows[0].agora,
            bd: conn.rows[0].bd,
            tabelas: tabelas.rows.map(r => r.table_name)
        });
    } catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message, codigo: e.code });
    }
});

// PUT /api/empresa  (admin)
app.put('/api/empresa', verificarToken, apenasAdmin, async (req, res) => {
    try {
        const { nome, slogan, telefone, whatsapp, email, morada, cidade, horario, sobre } = req.body;
        const r = await pool.query(`
            UPDATE empresa SET
                nome=$1, slogan=$2, telefone=$3, whatsapp=$4, email=$5,
                morada=$6, cidade=$7, horario=$8, sobre=$9, atualizado_em=NOW()
            WHERE id=1
            RETURNING *`,
            [nome, slogan, telefone, whatsapp, email, morada, cidade, horario, sobre]
        );
        res.json({ sucesso: true, dados: r.rows[0] });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// ══════════════════════════════════════════════════════════════
//  SERVIÇOS
// ══════════════════════════════════════════════════════════════

// GET /api/servicos  (público — filtros: categoria, pesquisa, destaque)
app.get('/api/servicos', async (req, res) => {
    try {
        const { categoria, pesquisa, destaque } = req.query;
        const conds = ["estado = 'ativo'"];
        const vals  = [];
        let n = 1;

        if (categoria) { conds.push(`categoria = $${n++}`); vals.push(categoria); }
        if (destaque === 'true') { conds.push(`destaque = true`); }
        if (pesquisa)  {
            conds.push(`(nome ILIKE $${n} OR descricao ILIKE $${n})`);
            vals.push(`%${pesquisa}%`); n++;
        }

        const r = await pool.query(
            `SELECT * FROM servicos WHERE ${conds.join(' AND ')} ORDER BY destaque DESC, ordem ASC, nome ASC`,
            vals
        );        res.json({ sucesso: true, total: r.rows.length, dados: r.rows });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// GET /api/servicos/categorias
app.get('/api/servicos/categorias', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT s.categoria, COUNT(*) as total
            FROM servicos s
            WHERE s.estado = 'ativo'
            GROUP BY s.categoria ORDER BY total DESC`
        );
        res.json({ sucesso: true, dados: r.rows });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// GET /api/servicos/:id
app.get('/api/servicos/:id', async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM servicos WHERE id=$1', [req.params.id]);
        if (!r.rows.length)
            return res.status(404).json({ sucesso: false, mensagem: 'Serviço não encontrado.' });
        // Buscar dados da empresa para contacto
        const emp = await pool.query('SELECT * FROM empresa LIMIT 1');
        res.json({ sucesso: true, dados: { ...r.rows[0], empresa: emp.rows[0] || {} } });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// POST /api/servicos  (admin)
app.post('/api/servicos', verificarToken, apenasAdmin, async (req, res) => {
    try {
        const { nome, descricao, categoria, preco, preco_visivel, duracao_horas, destaque, ordem } = req.body;
        if (!nome || !categoria)
            return res.status(400).json({ sucesso: false, mensagem: 'Nome e categoria são obrigatórios.' });

        const r = await pool.query(`
            INSERT INTO servicos (nome, descricao, categoria, preco, preco_visivel, duracao_horas, destaque, ordem)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [nome, descricao, categoria, preco || null,
             preco_visivel !== false, duracao_horas || null,
             destaque || false, ordem || 0]
        );
        res.status(201).json({ sucesso: true, dados: r.rows[0] });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// PUT /api/servicos/:id  (admin)
app.put('/api/servicos/:id', verificarToken, apenasAdmin, async (req, res) => {
    try {
        const { nome, descricao, categoria, preco, preco_visivel, duracao_horas, destaque, estado, ordem } = req.body;
        const r = await pool.query(`
            UPDATE servicos SET
                nome=$1, descricao=$2, categoria=$3, preco=$4, preco_visivel=$5,
                duracao_horas=$6, destaque=$7, estado=$8, ordem=$9, atualizado_em=NOW()
            WHERE id=$10 RETURNING *`,
            [nome, descricao, categoria, preco || null, preco_visivel !== false,
             duracao_horas || null, destaque || false, estado || 'ativo', ordem || 0,
             req.params.id]
        );
        if (!r.rows.length)
            return res.status(404).json({ sucesso: false, mensagem: 'Serviço não encontrado.' });
        res.json({ sucesso: true, dados: r.rows[0] });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// DELETE /api/servicos/:id  (admin)
app.delete('/api/servicos/:id', verificarToken, apenasAdmin, async (req, res) => {
    try {
        const r = await pool.query('DELETE FROM servicos WHERE id=$1 RETURNING id', [req.params.id]);
        if (!r.rows.length)
            return res.status(404).json({ sucesso: false, mensagem: 'Não encontrado.' });
        res.json({ sucesso: true, mensagem: 'Serviço eliminado.' });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// ══════════════════════════════════════════════════════════════
//  CONTACTOS (formulário de contacto do website)
// ══════════════════════════════════════════════════════════════

// ── Notificação WhatsApp ────────────────────────────────────
// Envia mensagem WhatsApp via link (não requer API paga)
// Para notificação automática real, usar Twilio ou WhatsApp Business API
async function notificarAdminWhatsApp(contacto, empresa) {
    if (!empresa?.whatsapp) return;
    // Apenas log — em produção integrar com Twilio/Z-API/etc
    const msg = `🔔 NOVO CONTACTO - Kuphassana\n\nNome: ${contacto.nome}\n${contacto.telefone ? 'Tel: ' + contacto.telefone : ''}${contacto.email ? '\nEmail: ' + contacto.email : ''}${contacto.servico_nome ? '\nServiço: ' + contacto.servico_nome : ''}\n${contacto.mensagem ? '\nMensagem: ' + contacto.mensagem : ''}\n\nResponder: http://localhost:3000`;
    console.log(`📱 WhatsApp notification queued for +${empresa.whatsapp}`);
    console.log(`   ${msg.substring(0, 80)}...`);
    // TODO: Twilio integration
    // await twilioClient.messages.create({ from: 'whatsapp:+14155238886', to: `whatsapp:+${empresa.whatsapp}`, body: msg });
}

// POST /api/contactos  (público)
app.post('/api/contactos', async (req, res) => {
    try {
        const { nome, telefone, email, servico_id, mensagem } = req.body;
        if (!nome || (!telefone && !email))
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nome e pelo menos um contacto (telefone ou email) são obrigatórios.'
            });

        // Buscar nome do serviço se existe
        let servico_nome = null;
        if (servico_id) {
            const srv = await pool.query('SELECT nome FROM servicos WHERE id=$1', [servico_id]);
            if (srv.rows.length) servico_nome = srv.rows[0].nome;
        }

        await pool.query(`
            INSERT INTO contactos (nome, telefone, email, servico_id, mensagem)
            VALUES ($1,$2,$3,$4,$5)`,
            [nome, telefone, email, servico_id || null, mensagem]
        );

        // Notificar admin (async — não bloqueia a resposta)
        const emp = await pool.query('SELECT whatsapp FROM empresa LIMIT 1');
        notificarAdminWhatsApp(
            { nome, telefone, email, mensagem, servico_nome },
            emp.rows[0]
        ).catch(e => console.warn('Notificação WA falhou:', e.message));

        res.status(201).json({
            sucesso: true,
            mensagem: 'Mensagem enviada! Entraremos em contacto brevemente.'
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// GET /api/contactos  (admin)
app.get('/api/contactos', verificarToken, apenasAdmin, async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT c.*, s.nome as servico_nome
            FROM contactos c
            LEFT JOIN servicos s ON c.servico_id = s.id
            ORDER BY c.criado_em DESC`
        );
        res.json({ sucesso: true, total: r.rows.length, dados: r.rows });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// PUT /api/contactos/:id/lido  (admin)
app.put('/api/contactos/:id/lido', verificarToken, apenasAdmin, async (req, res) => {
    try {
        await pool.query('UPDATE contactos SET lido=true WHERE id=$1', [req.params.id]);
        res.json({ sucesso: true });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// DELETE /api/contactos/:id  (admin)
app.delete('/api/contactos/:id', verificarToken, apenasAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM contactos WHERE id=$1', [req.params.id]);
        res.json({ sucesso: true });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// ══════════════════════════════════════════════════════════════
//  DASHBOARD (admin)
// ══════════════════════════════════════════════════════════════
app.get('/api/dashboard', verificarToken, apenasAdmin, async (req, res) => {
    try {
        const [srv, cat, cont, naoLidos] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM servicos WHERE estado='ativo'"),
            pool.query("SELECT COUNT(DISTINCT categoria) FROM servicos WHERE estado='ativo'"),
            pool.query('SELECT COUNT(*) FROM contactos'),
            pool.query('SELECT COUNT(*) FROM contactos WHERE lido=false'),
        ]);
        res.json({
            sucesso: true,
            dados: {
                servicos_ativos: parseInt(srv.rows[0].count),
                categorias:      parseInt(cat.rows[0].count),
                total_contactos: parseInt(cont.rows[0].count),
                nao_lidos:       parseInt(naoLidos.rows[0].count),
            }
        });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
    }
});

// ── Upload de imagem para serviço ────────────────────────────
app.post('/api/servicos/:id/imagem', verificarToken, apenasAdmin, upload.single('imagem'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ sucesso: false, mensagem: 'Nenhuma imagem enviada.' });
        const url = `/uploads/servicos/${req.file.filename}`;

        // Guardar como imagem principal e adicionar ao array
        await pool.query(
            `UPDATE servicos SET imagem_url=$1,
             imagens = COALESCE(imagens, ARRAY[]::TEXT[]) || ARRAY[$1]::TEXT[]
             WHERE id=$2`,
            [url, req.params.id]
        );
        res.json({ sucesso: true, url });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: e.message });
    }
});

// ── Remover imagem de serviço ─────────────────────────────────
app.delete('/api/servicos/:id/imagem', verificarToken, apenasAdmin, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ sucesso: false, mensagem: 'URL da imagem em falta.' });

        // Remover do array
        await pool.query(
            `UPDATE servicos SET
                imagens    = ARRAY_REMOVE(COALESCE(imagens, ARRAY[]::TEXT[]), $1),
                imagem_url = CASE WHEN imagem_url=$1 THEN NULL ELSE imagem_url END
             WHERE id=$2`,
            [url, req.params.id]
        );

        // Apagar ficheiro físico
        const filePath = path.join(__dirname, '..', url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.json({ sucesso: true });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: e.message });
    }
});

// ── Raiz ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        mensagem: 'API Agência Funerária Kuphassana — a funcionar!',
        versao: '2.1.0',
        rotas: ['/api/empresa', '/api/servicos', '/api/contactos', '/api/auth/login', '/api/dashboard']
    });
});

// ── Setup automático da BD (apenas na primeira vez) ───────────
app.get('/api/setup', async (req, res) => {
    // Verificar chave secreta para evitar acesso não autorizado
    const key = req.query.key;
    if (key !== process.env.SETUP_KEY && key !== 'kuphassana-setup-2026') {
        return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });
    }
    try {
        // Criar todas as tabelas
        const { execSync } = require('child_process');
        execSync('node database/setup.js', { cwd: __dirname + '/..', stdio: 'pipe' });
        res.json({ sucesso: true, mensagem: 'Base de dados configurada com sucesso!' });
    } catch (e) {
        res.status(500).json({ sucesso: false, mensagem: e.message });
    }
});

app.use((req, res) => res.status(404).json({ sucesso: false, mensagem: 'Rota não encontrada.' }));

app.listen(PORT, () => {
    console.log(`🚀 Servidor em http://localhost:${PORT}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'DEFINIDA ✅' : 'NÃO DEFINIDA ❌'}`);
    console.log(`   DB_HOST: ${process.env.DB_HOST || 'não definido'}`);
});
