/**
 * api.js — Comunicação com a API da Agência Funerária Kuphassana
 */

// Detectar automaticamente o ambiente
const API_BASE = (() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:3000/api'; // desenvolvimento
    }
    return '/api'; // produção (Nginx proxy)
})();

// URL base para imagens (uploads)
const SIMG_BASE = (() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    return ''; // produção — Nginx serve os uploads na mesma origem
})();

const Auth = {
    guardarToken:   (t) => localStorage.setItem('token', t),
    lerToken:       ()  => localStorage.getItem('token'),
    guardarAdmin:   (u) => localStorage.setItem('admin', JSON.stringify(u)),
    lerAdmin:       ()  => { const u = localStorage.getItem('admin'); return u ? JSON.parse(u) : null },
    estaLogado:     ()  => !!localStorage.getItem('token'),
    terminarSessao: ()  => {
        localStorage.removeItem('token')
        localStorage.removeItem('admin')
        window.location.href = '/pages/admin-login.html'
    }
}

async function pedido(metodo, rota, corpo = null, token = null) {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const opcoes = { method: metodo, headers }
    if (corpo) opcoes.body = JSON.stringify(corpo)
    const res   = await fetch(`${API_BASE}${rota}`, opcoes)
    const dados = await res.json()
    if (!res.ok) throw new Error(dados.mensagem || 'Erro de comunicação.')
    return dados
}

const api = {
    empresa: {
        obter:     ()    => pedido('GET', '/empresa'),
        atualizar: (d)   => pedido('PUT', '/empresa', d, Auth.lerToken()),
    },
    servicos: {
        listar:     (p)  => {
            const qs = p ? '?' + new URLSearchParams(p).toString() : ''
            return pedido('GET', `/servicos${qs}`)
        },
        categorias: ()   => pedido('GET', '/servicos/categorias'),
        obter:      (id) => pedido('GET', `/servicos/${id}`),
        criar:      (d)  => pedido('POST', '/servicos', d, Auth.lerToken()),
        atualizar:  (id, d) => pedido('PUT', `/servicos/${id}`, d, Auth.lerToken()),
        eliminar:   (id) => pedido('DELETE', `/servicos/${id}`, null, Auth.lerToken()),
    },
    contactos: {
        enviar:      (d)  => pedido('POST', '/contactos', d),
        listar:      ()   => pedido('GET',  '/contactos', null, Auth.lerToken()),
        marcarLido:  (id) => pedido('PUT',  `/contactos/${id}/lido`, null, Auth.lerToken()),
        eliminar:    (id) => pedido('DELETE',`/contactos/${id}`, null, Auth.lerToken()),
    },
    auth: {
        login:  (email, senha) => pedido('POST', '/auth/login', { email, senha }),
        perfil: ()             => pedido('GET',  '/auth/perfil', null, Auth.lerToken()),
    },
    dashboard: {
        obter: () => pedido('GET', '/dashboard', null, Auth.lerToken()),
    }
}

function formatarPreco(valor) {
    if (!valor) return 'Consultar'
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency', currency: 'MZN', minimumFractionDigits: 0
    }).format(valor)
}

function formatarData(str) {
    return new Date(str).toLocaleDateString('pt-MZ', {
        day: '2-digit', month: 'short', year: 'numeric'
    })
}

function mostrarToast(msg, tipo = 'ok') {
    let el = document.getElementById('toast')
    if (!el) {
        el = document.createElement('div')
        el.id = 'toast'
        el.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;padding:.85rem 1.4rem;
            border-radius:10px;font-size:.875rem;font-weight:500;z-index:9999;
            opacity:0;transform:translateY(10px);transition:all .3s;max-width:340px;
            font-family:Inter,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.2);`
        document.body.appendChild(el)
    }
    el.textContent = msg
    el.style.background = tipo === 'erro' ? '#7a2030' : '#1a1a2e'
    el.style.color = '#fff'
    el.style.borderLeft = `3px solid ${tipo === 'erro' ? '#e74c3c' : '#c8a45a'}`
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)' }, 10)
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)' }, 3500)
}
