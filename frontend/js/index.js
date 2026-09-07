/**
 * index.js — Lógica da página pública principal
 */

const estado = {
    pagina: 1,
    limite: 9,
    totalPaginas: 1,
    filtros: {
        pesquisa: '', cidade: '', categoria: '', preco_min: '', preco_max: ''
    }
};

const elGrid      = document.getElementById('grid-servicos');
const elTotal     = document.getElementById('total-resultados');
const elPaginacao = document.getElementById('paginacao');
const elCats      = document.getElementById('categorias-lista');

// ── Ícones por categoria ──────────────────────────
const iconeCategoria = {
    'funeral':    '⚰️',
    'cremação':   '🕯️',
    'cremacao':   '🕯️',
    'transporte': '🚗',
    'urna':       '🏺',
    'flores':     '🌹',
    'outro':      '✦',
    'default':    '✦'
};

function getIcone(cat) {
    return iconeCategoria[(cat || '').toLowerCase()] || iconeCategoria['default'];
}

// ── Inicialização ─────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    atualizarNavbar();
    await Promise.all([
        carregarCategorias(),
        carregarServicos(),
        carregarStats()
    ]);
    configurarFormularios();
});

// ── Stats do hero ─────────────────────────────────
async function carregarStats() {
    try {
        const [resPrest, resServ] = await Promise.all([
            api.prestadores.listar(),
            api.servicos.listar({ limite: 500 })
        ]);
        const prestadores = resPrest.dados;
        const servicos    = resServ.dados;
        const cidades     = new Set(prestadores.map(p => p.cidade).filter(Boolean));

        animarNum('stat-prestadores', prestadores.length);
        animarNum('stat-servicos', servicos.length);
        animarNum('stat-cidades', cidades.size);
    } catch (_) {}
}

function animarNum(id, destino) {
    const el = document.getElementById(id);
    if (!el) return;
    let atual = 0;
    const passo = Math.ceil(destino / 30);
    const timer = setInterval(() => {
        atual = Math.min(atual + passo, destino);
        el.textContent = atual;
        if (atual >= destino) clearInterval(timer);
    }, 40);
}

// ── Navbar ────────────────────────────────────────
function atualizarNavbar() {
    const utilizador = Auth.lerUtilizador();
    const elAcesso = document.getElementById('link-acesso');
    if (!elAcesso || !utilizador) return;
    elAcesso.textContent = utilizador.nome.split(' ')[0];
    elAcesso.href = utilizador.papel === 'admin' ? 'pages/admin.html' : 'pages/painel.html';
    elAcesso.style.cssText = '';
}

// ── Categorias ────────────────────────────────────
async function carregarCategorias() {
    try {
        const resposta = await api.servicos.categorias();
        if (!elCats) return;

        const tagTodos = criarTag('Todos', '', true);
        elCats.appendChild(tagTodos);

        resposta.dados.forEach(c => {
            const tag = criarTag(
                `${getIcone(c.categoria)} ${c.categoria} (${c.total})`,
                c.categoria
            );
            elCats.appendChild(tag);
        });
    } catch (_) {}
}

function criarTag(label, valor, activa = false) {
    const btn = document.createElement('button');
    btn.className = `tag-categoria${activa ? ' activa' : ''}`;
    btn.textContent = label;
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tag-categoria').forEach(t => t.classList.remove('activa'));
        btn.classList.add('activa');
        estado.filtros.categoria = valor;
        estado.pagina = 1;
        carregarServicos();
    });
    return btn;
}

// ── Serviços ──────────────────────────────────────
async function carregarServicos() {
    mostrarLoading();
    try {
        const params = { pagina: estado.pagina, limite: estado.limite };
        Object.entries(estado.filtros).forEach(([k, v]) => { if (v) params[k] = v; });

        const res = await api.servicos.listar(params);
        estado.totalPaginas = res.paginas;

        renderizarServicos(res.dados);
        renderizarPaginacao(res.total, res.pagina, res.paginas);

        if (elTotal) {
            elTotal.textContent = `${res.total} resultado${res.total !== 1 ? 's' : ''}`;
        }
    } catch (_) {
        elGrid.innerHTML = `
            <div class="estado-vazio">
                <div class="icone">⚠️</div>
                <h3>Não foi possível carregar</h3>
                <p>Verifique se o servidor está activo e recarregue a página.</p>
            </div>`;
    }
}

// ── Renderizar cards ──────────────────────────────
function renderizarServicos(servicos) {
    if (!servicos || !servicos.length) {
        elGrid.innerHTML = `
            <div class="estado-vazio">
                <div class="icone">🔍</div>
                <h3>Nenhum serviço encontrado</h3>
                <p>Tente ajustar os filtros ou pesquisar com outros termos.</p>
            </div>`;
        return;
    }

    elGrid.innerHTML = servicos.map((s, i) => {
        let itens = [];
        try {
            itens = typeof s.itens_incluidos === 'string' ? JSON.parse(s.itens_incluidos) : (s.itens_incluidos || []);
        } catch (_) { itens = []; }

        const imgHtml = s.imagem_url ? `
            <div style="height:140px;background-image:url('${s.imagem_url}');background-size:cover;background-position:center;border-bottom:1px solid rgba(0,0,0,0.06);"></div>
        ` : '';

        return `
        <article class="card-servico" style="animation: fadeUp 0.4s ease ${i * 0.06}s both;">
            ${imgHtml}
            <span class="card-categoria-tag">${s.categoria}</span>

            <div class="card-corpo">
                ${!s.imagem_url ? `<div class="card-icon">${getIcone(s.categoria)}</div>` : ''}
                <h3>${s.nome}</h3>
                <p>${s.descricao ? truncar(s.descricao, 100) : 'Serviço profissional com elevado padrão de qualidade.'}</p>

                ${itens.length ? `
                    <div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.75rem;">
                        ${itens.slice(0, 2).map(it => `<span style="font-size:.7rem;background:#f5f4f0;color:#2c3e50;padding:.15rem .5rem;border-radius:4px;font-weight:600;">✓ ${it}</span>`).join('')}
                        ${itens.length > 2 ? `<span style="font-size:.7rem;color:var(--cor-texto-leve);">+${itens.length - 2} itens</span>` : ''}
                    </div>
                ` : ''}

                <div class="card-prestador-info">
                    <span class="dot"></span>
                    <span>${s.prestador_nome}</span>
                    ${s.cidade ? `<span style="color:var(--cor-borda)">·</span><span>${s.cidade}</span>` : ''}
                </div>

                ${s.duracao_horas ? `<div class="card-duracao">⏱ ${s.duracao_horas}h de serviço</div>` : ''}
            </div>

            <div class="card-rodape">
                <div class="card-preco">
                    <span class="de">A partir de</span>
                    <span class="valor">${formatarPreco(s.preco)}</span>
                </div>
                <button class="btn-ver" onclick="verDetalhe(${s.id})">
                    Ver detalhes <span class="seta">→</span>
                </button>
            </div>
        </article>
        `;
    }).join('');
}

// ── Paginação ─────────────────────────────────────
function renderizarPaginacao(total, paginaAtual, totalPaginas) {
    if (!elPaginacao || totalPaginas <= 1) {
        if (elPaginacao) elPaginacao.innerHTML = '';
        return;
    }

    let html = `<button class="btn-nav-pag" ${paginaAtual === 1 ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual - 1})">← Anterior</button>`;

    for (let i = 1; i <= totalPaginas; i++) {
        if (totalPaginas > 7 && Math.abs(i - paginaAtual) > 2 && i !== 1 && i !== totalPaginas) {
            if (i === 2 || i === totalPaginas - 1) html += `<button disabled style="border:none;background:none;cursor:default;">…</button>`;
            continue;
        }
        html += `<button class="${i === paginaAtual ? 'activo' : ''}" onclick="irParaPagina(${i})">${i}</button>`;
    }

    html += `<button class="btn-nav-pag" ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual + 1})">Seguinte →</button>`;
    elPaginacao.innerHTML = html;
}

function irParaPagina(n) {
    if (n < 1 || n > estado.totalPaginas) return;
    estado.pagina = n;
    carregarServicos();
    window.scrollTo({ top: document.querySelector('.container').offsetTop - 20, behavior: 'smooth' });
}

// ── Formulários ───────────────────────────────────
function configurarFormularios() {
    const formHero = document.getElementById('form-pesquisa');
    if (formHero) {
        formHero.addEventListener('submit', e => {
            e.preventDefault();
            estado.filtros.pesquisa = document.getElementById('input-pesquisa').value.trim();
            estado.filtros.cidade   = document.getElementById('input-cidade-hero').value.trim();
            estado.pagina = 1;
            carregarServicos();
            document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
        });
    }

    document.getElementById('btn-filtrar')?.addEventListener('click', () => {
        estado.filtros.preco_min = document.getElementById('filtro-preco-min').value;
        estado.filtros.preco_max = document.getElementById('filtro-preco-max').value;
        estado.filtros.cidade    = document.getElementById('filtro-cidade').value.trim();
        estado.pagina = 1;
        carregarServicos();
    });

    document.getElementById('btn-limpar')?.addEventListener('click', () => {
        estado.filtros = { pesquisa: '', cidade: '', categoria: '', preco_min: '', preco_max: '' };
        estado.pagina  = 1;
        ['input-pesquisa','input-cidade-hero','filtro-preco-min','filtro-preco-max','filtro-cidade']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        document.querySelectorAll('.tag-categoria').forEach((t, i) => t.classList.toggle('activa', i === 0));
        carregarServicos();
    });
}

// ── Ver detalhe ───────────────────────────────────
function verDetalhe(id) {
    window.location.href = `pages/servico.html?id=${id}`;
}

// ── Auxiliares ────────────────────────────────────
function mostrarLoading() {
    elGrid.innerHTML = `
        <div class="estado-loading">
            <div class="spinner"></div>
            <p>A carregar serviços…</p>
        </div>`;
}

function truncar(texto, max) {
    return texto.length > max ? texto.slice(0, max) + '…' : texto;
}
