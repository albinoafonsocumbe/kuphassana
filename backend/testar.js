/**
 * testar.js — Testes automáticos completos da API
 * Executar: node testar.js
 */

const API = 'http://localhost:3000/api';
let passados = 0, falhados = 0;
let tokenCliente, tokenPrestador, tokenAdmin;
let prestadorId, servicoId;

// ── Utilitários ───────────────────────────────────────────────
async function req(metodo, rota, corpo = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opcoes = { method: metodo, headers };
    if (corpo) opcoes.body = JSON.stringify(corpo);
    const res = await fetch(`${API}${rota}`, opcoes);
    const dados = await res.json();
    return { status: res.status, dados };
}

function ok(nome, condicao, detalhe = '') {
    if (condicao) {
        console.log(`  ✅ ${nome}`);
        passados++;
    } else {
        console.log(`  ❌ ${nome}${detalhe ? ' — ' + detalhe : ''}`);
        falhados++;
    }
}

function secao(titulo) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  ${titulo}`);
    console.log('─'.repeat(50));
}

// ══════════════════════════════════════════════════════════════
async function correr() {

    // ── 1. SAÚDE DA API ───────────────────────────────────────
    secao('1. Saúde da API');
    const s1 = await req('GET', '/../../');
    // testar-bd não está em /api mas em /
    const resBD = await fetch('http://localhost:3000/testar-bd');
    const bd = await resBD.json();
    ok('Base de dados ligada', bd.sucesso);

    // ── 2. REGISTO ────────────────────────────────────────────
    secao('2. Registo de utilizadores');

    // Cliente novo
    const ts = Date.now();
    const rCliente = await req('POST', '/auth/registar-cliente', {
        nome: 'Teste Cliente', email: `cliente${ts}@teste.pt`,
        senha: '123456', telefone: '910000001', cidade: 'Lisboa'
    });
    ok('Registar cliente', rCliente.status === 201);
    ok('Token retornado (cliente)', !!rCliente.dados.token);
    ok('Papel = cliente', rCliente.dados.utilizador?.papel === 'cliente');
    tokenCliente = rCliente.dados.token;

    // Prestador novo
    const rPrestador = await req('POST', '/auth/registar', {
        nome: 'Funerária Teste', email: `prestador${ts}@teste.pt`,
        senha: '123456', telefone: '910000002', cidade: 'Porto'
    });
    ok('Registar prestador', rPrestador.status === 201);
    ok('Papel = prestador', rPrestador.dados.utilizador?.papel === 'prestador');
    tokenPrestador = rPrestador.dados.token;
    prestadorId    = rPrestador.dados.utilizador?.id;

    // Email duplicado
    const rDup = await req('POST', '/auth/registar-cliente', {
        nome: 'Dup', email: `cliente${ts}@teste.pt`, senha: '123456'
    });
    ok('Bloquear email duplicado', rDup.status === 409);

    // ── 3. LOGIN ──────────────────────────────────────────────
    secao('3. Login');

    const lCliente = await req('POST', '/auth/login', { email: `cliente${ts}@teste.pt`, senha: '123456' });
    ok('Login cliente OK', lCliente.status === 200);
    ok('Papel cliente no login', lCliente.dados.utilizador?.papel === 'cliente');

    const lPrestador = await req('POST', '/auth/login', { email: `prestador${ts}@teste.pt`, senha: '123456' });
    ok('Login prestador OK', lPrestador.status === 200);
    ok('Papel prestador no login', lPrestador.dados.utilizador?.papel === 'prestador');

    const lAdmin = await req('POST', '/auth/login', { email: 'admin@plataforma.pt', senha: 'password' });
    ok('Login admin OK', lAdmin.status === 200);
    ok('Papel admin no login', lAdmin.dados.utilizador?.papel === 'admin');
    tokenAdmin = lAdmin.dados.token;

    const lErrado = await req('POST', '/auth/login', { email: `cliente${ts}@teste.pt`, senha: 'errada' });
    ok('Rejeitar senha errada (401)', lErrado.status === 401);

    // ── 4. PERFIL ─────────────────────────────────────────────
    secao('4. Perfil autenticado');

    const pCliente = await req('GET', '/auth/perfil', null, tokenCliente);
    ok('Perfil cliente', pCliente.status === 200 && pCliente.dados.utilizador?.papel === 'cliente');

    const pPrestador = await req('GET', '/auth/perfil', null, tokenPrestador);
    ok('Perfil prestador', pPrestador.status === 200 && pPrestador.dados.utilizador?.papel === 'prestador');

    const pAdmin = await req('GET', '/auth/perfil', null, tokenAdmin);
    ok('Perfil admin', pAdmin.status === 200 && pAdmin.dados.utilizador?.papel === 'admin');

    const semToken = await req('GET', '/auth/perfil');
    ok('Rejeitar sem token (401)', semToken.status === 401);

    // ── 5. PRESTADORES ───────────────────────────────────────
    secao('5. Prestadores');

    const listP = await req('GET', '/prestadores');
    ok('Listar prestadores (público)', listP.status === 200 && Array.isArray(listP.dados.dados));

    const getP = await req('GET', `/prestadores/${prestadorId}`);
    ok('Buscar prestador por ID', getP.status === 200);

    // ── 6. SERVIÇOS ───────────────────────────────────────────
    secao('6. Serviços (CRUD)');

    // Criar serviço (prestador autenticado)
    const criarSrv = await req('POST', '/servicos', {
        nome: 'Funeral Completo Teste', categoria: 'Funeral',
        preco: 1500, descricao: 'Serviço de teste', duracao_horas: 4
    }, tokenPrestador);
    ok('Criar serviço', criarSrv.status === 201, JSON.stringify(criarSrv.dados));
    servicoId = criarSrv.dados.dados?.id;

    // Criar sem token
    const srvSemAuth = await req('POST', '/servicos', { nome: 'X', categoria: 'Funeral', preco: 100 });
    ok('Bloquear criar serviço sem auth (401)', srvSemAuth.status === 401);

    // Listar (público)
    const listSrv = await req('GET', '/servicos');
    ok('Listar serviços (público)', listSrv.status === 200);

    // Listar por prestador
    const srvPrest = await req('GET', `/servicos/prestador/${prestadorId}`);
    ok('Listar serviços por prestador', srvPrest.status === 200);

    // Buscar por ID
    if (servicoId) {
        const getSrv = await req('GET', `/servicos/${servicoId}`);
        ok('Buscar serviço por ID', getSrv.status === 200);
        ok('Tem telefone do prestador', getSrv.dados.dados?.telefone !== undefined);

        // Atualizar (próprio prestador)
        const attSrv = await req('PUT', `/servicos/${servicoId}`, {
            nome: 'Funeral Atualizado', categoria: 'Funeral',
            preco: 1800, descricao: 'Atualizado', estado: 'ativo'
        }, tokenPrestador);
        ok('Atualizar serviço (prestador)', attSrv.status === 200);

        // Atualizar com token errado (cliente)
        const attSrvCliente = await req('PUT', `/servicos/${servicoId}`, {
            nome: 'X', categoria: 'Funeral', preco: 100, estado: 'ativo'
        }, tokenCliente);
        ok('Bloquear update serviço por cliente (403)', attSrvCliente.status === 403);
    }

    // Filtros
    const filtCidade = await req('GET', '/servicos?cidade=Porto');
    ok('Filtro por cidade', filtCidade.status === 200);

    const filtCat = await req('GET', '/servicos?categoria=Funeral');
    ok('Filtro por categoria', filtCat.status === 200);

    const filtPreco = await req('GET', '/servicos?preco_min=100&preco_max=2000');
    ok('Filtro por preço', filtPreco.status === 200);

    const paginacao = await req('GET', '/servicos?pagina=1&limite=5');
    ok('Paginação', paginacao.status === 200 && paginacao.dados.limite === 5);

    const categorias = await req('GET', '/servicos/categorias');
    ok('Listar categorias', categorias.status === 200);

    // ── 7. CLIENTE — atualizar perfil ─────────────────────────
    secao('7. Perfil do cliente');

    const clienteInfo = await req('GET', '/auth/perfil', null, tokenCliente);
    const cId = clienteInfo.dados.utilizador?.id;

    if (cId) {
        const attCliente = await req('PUT', `/clientes/${cId}`, {
            nome: 'Teste Cliente Atualizado', telefone: '920000001', cidade: 'Faro'
        }, tokenCliente);
        ok('Atualizar perfil cliente', attCliente.status === 200);

        // Outro cliente não pode editar
        const attOutro = await req('PUT', `/clientes/${cId}`, {
            nome: 'X', telefone: '', cidade: ''
        }, tokenPrestador);
        ok('Bloquear update cliente por prestador (403)', attOutro.status === 403);
    }

    // ── 8. ELIMINAR (limpeza) ─────────────────────────────────
    secao('8. Eliminar (limpeza dos dados de teste)');

    if (servicoId) {
        const delSrv = await req('DELETE', `/servicos/${servicoId}`, null, tokenPrestador);
        ok('Eliminar serviço (próprio prestador)', delSrv.status === 200);
    }

    // ── RESULTADO FINAL ───────────────────────────────────────
    const total = passados + falhados;
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  RESULTADO: ${passados}/${total} testes passaram`);
    if (falhados === 0) {
        console.log('  🎉 Todos os testes passaram!');
    } else {
        console.log(`  ⚠️  ${falhados} teste(s) falharam — ver acima`);
    }
    console.log('═'.repeat(50));
}

correr().catch(e => {
    console.error('\n❌ Erro fatal:', e.message);
    console.error('   Certifica-te que o backend está a correr em localhost:3000');
});
