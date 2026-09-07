const BASE = '/api'

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res  = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.mensagem || 'Erro de comunicação com o servidor.')
  return data
}

const token = () => localStorage.getItem('token')

export const api = {
  empresa: {
    get:    ()       => request('GET', '/empresa'),
    update: (data)   => request('PUT', '/empresa', data, token()),
  },
  servicos: {
    list:       (params) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request('GET', `/servicos${qs}`)
    },
    categories: ()       => request('GET', '/servicos/categorias'),
    get:        (id)     => request('GET', `/servicos/${id}`),
    create:     (data)   => request('POST', '/servicos', data, token()),
    update:     (id, d)  => request('PUT', `/servicos/${id}`, d, token()),
    delete:     (id)     => request('DELETE', `/servicos/${id}`, null, token()),
  },
  contactos: {
    send:      (data)  => request('POST', '/contactos', data),
    list:      ()      => request('GET', '/contactos', null, token()),
    markRead:  (id)    => request('PUT', `/contactos/${id}/lido`, null, token()),
    delete:    (id)    => request('DELETE', `/contactos/${id}`, null, token()),
  },
  auth: {
    login:   (email, senha) => request('POST', '/auth/login', { email, senha }),
    profile: ()             => request('GET', '/auth/perfil', null, token()),
  },
  dashboard: {
    get: () => request('GET', '/dashboard', null, token()),
  },
}

export function formatPrice(value) {
  if (!value) return 'Consultar preço'
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatDate(str) {
  return new Date(str).toLocaleDateString('pt-MZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export const auth = {
  save:      (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },
  clear:     () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
  isLogged:  () => !!localStorage.getItem('token'),
  getUser:   () => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  },
}
