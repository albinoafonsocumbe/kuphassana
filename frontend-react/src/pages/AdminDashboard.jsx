import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, auth, formatPrice, formatDate } from '../lib/api'

const TABS = ['dashboard', 'servicos', 'contactos', 'empresa']

export default function AdminDashboard() {
  const navigate  = useNavigate()
  const user      = auth.getUser()
  const [tab, setTab]             = useState('dashboard')
  const [stats, setStats]         = useState(null)
  const [servicos, setServicos]   = useState([])
  const [contactos, setContactos] = useState([])
  const [empresa, setEmpresa]     = useState(null)
  const [modal, setModal]         = useState(null) // { type: 'create'|'edit', data? }
  const [form, setForm]           = useState({})
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [d, s, c, e] = await Promise.allSettled([
      api.dashboard.get(),
      api.servicos.list(),
      api.contactos.list(),
      api.empresa.get(),
    ])
    if (d.status === 'fulfilled') setStats(d.value.dados)
    if (s.status === 'fulfilled') setServicos(s.value.dados)
    if (c.status === 'fulfilled') setContactos(c.value.dados)
    if (e.status === 'fulfilled') setEmpresa(e.value.dados)
  }

  function logout() { auth.clear(); navigate('/admin') }

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function saveServico() {
    setError(''); setSaving(true)
    try {
      const payload = {
        nome:         form.nome,
        descricao:    form.descricao ?? '',
        categoria:    form.categoria,
        preco:        form.preco ? Number(form.preco) : null,
        preco_visivel:form.preco_visivel !== false,
        duracao_horas:form.duracao_horas ? Number(form.duracao_horas) : null,
        destaque:     !!form.destaque,
        estado:       form.estado ?? 'ativo',
        ordem:        form.ordem ? Number(form.ordem) : 0,
      }
      if (modal.type === 'edit') await api.servicos.update(modal.data.id, payload)
      else                       await api.servicos.create(payload)
      const s = await api.servicos.list()
      setServicos(s.dados)
      setModal(null)
    } catch (e) { setError(e.message) }
    finally     { setSaving(false) }
  }

  async function deleteServico(id) {
    if (!window.confirm('Eliminar este serviço?')) return
    await api.servicos.delete(id)
    setServicos(p => p.filter(s => s.id !== id))
  }

  async function markRead(id) {
    await api.contactos.markRead(id)
    setContactos(p => p.map(c => c.id === id ? { ...c, lido: true } : c))
  }

  async function deleteContacto(id) {
    if (!window.confirm('Eliminar este contacto?')) return
    await api.contactos.delete(id)
    setContactos(p => p.filter(c => c.id !== id))
  }

  async function saveEmpresa() {
    setError(''); setSaving(true)
    try {
      await api.empresa.update(empresa)
      setSaving(false)
    } catch (e) { setError(e.message); setSaving(false) }
  }

  const inputCls = `w-full px-3 py-2.5 bg-brand-900 border border-white/10 rounded-lg
    text-white text-sm placeholder:text-white/25 outline-none
    focus:border-brand-gold/50 transition-all`

  const CATEGORIES = ['Funeral Completo','Cremação','Transporte','Urna','Flores','Documentação','Outro']

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white flex flex-col">

      {/* Navbar admin */}
      <header className="bg-brand-950 border-b border-white/7 px-8 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center text-brand-950 font-bold text-sm">✝</div>
          <span className="font-serif text-white text-base">Painel Administrativo</span>
          <span className="text-[10px] text-brand-gold uppercase tracking-widest font-bold bg-brand-gold/10 px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-xs">{user?.nome}</span>
          <button onClick={logout} className="text-white/40 text-xs hover:text-white transition-colors">Sair</button>
        </div>
      </header>

      <div className="flex flex-1">

        {/* Sidebar */}
        <aside className="w-56 bg-brand-950 border-r border-white/7 py-6 flex-shrink-0 hidden md:block">
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'servicos',  label: 'Serviços' },
            { key: 'contactos', label: `Contactos${contactos.filter(c=>!c.lido).length ? ` (${contactos.filter(c=>!c.lido).length})` : ''}` },
            { key: 'empresa',   label: 'Empresa' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full text-left px-6 py-3 text-sm transition-colors
                ${tab === t.key
                  ? 'text-brand-gold font-semibold bg-brand-gold/5 border-r-2 border-brand-gold'
                  : 'text-white/45 hover:text-white/80'
                }`}
            >
              {t.label}
            </button>
          ))}
        </aside>

        {/* Conteúdo */}
        <main className="flex-1 p-8 overflow-y-auto">

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <div>
              <h2 className="font-serif text-xl text-white mb-6">Dashboard</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Serviços activos', value: stats?.servicos_ativos ?? '—' },
                  { label: 'Categorias',        value: stats?.categorias ?? '—' },
                  { label: 'Contactos totais',  value: stats?.total_contactos ?? '—' },
                  { label: 'Não lidos',         value: stats?.nao_lidos ?? '—' },
                ].map(s => (
                  <div key={s.label} className="bg-brand-900 border border-white/7 rounded-xl p-5">
                    <p className="font-serif text-2xl font-bold text-white mb-1">{s.value}</p>
                    <p className="text-xs text-white/40 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
              {contactos.filter(c => !c.lido).length > 0 && (
                <div className="bg-brand-gold/8 border border-brand-gold/20 rounded-xl p-5">
                  <p className="text-brand-gold text-sm font-semibold mb-1">
                    {contactos.filter(c => !c.lido).length} contacto(s) por responder
                  </p>
                  <button onClick={() => setTab('contactos')} className="text-xs text-white/50 hover:text-white transition-colors">
                    Ver contactos →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── SERVIÇOS ── */}
          {tab === 'servicos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl text-white">Serviços</h2>
                <button
                  onClick={() => { setForm({ estado: 'ativo', preco_visivel: true }); setModal({ type: 'create' }) }}
                  className="bg-gold text-brand-950 text-xs font-bold px-4 py-2 rounded-lg hover:-translate-y-0.5 transition-all"
                >
                  Novo serviço
                </button>
              </div>
              <div className="bg-brand-900 border border-white/7 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/7">
                      <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/35 font-semibold">Nome</th>
                      <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/35 font-semibold hidden md:table-cell">Categoria</th>
                      <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/35 font-semibold hidden lg:table-cell">Preço</th>
                      <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/35 font-semibold">Estado</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {servicos.map(s => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3.5 text-white/80 font-medium">{s.nome}</td>
                        <td className="px-5 py-3.5 text-white/40 hidden md:table-cell">{s.categoria}</td>
                        <td className="px-5 py-3.5 text-white/40 hidden lg:table-cell">{s.preco ? formatPrice(s.preco) : 'Consultar'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                            ${s.estado === 'ativo' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {s.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => { setForm({...s}); setModal({ type: 'edit', data: s }) }}
                              className="text-xs text-white/40 hover:text-white transition-colors px-2 py-1 rounded">
                              Editar
                            </button>
                            <button onClick={() => deleteServico(s.id)}
                              className="text-xs text-red-500/60 hover:text-red-400 transition-colors px-2 py-1 rounded">
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {servicos.length === 0 && (
                  <p className="text-center text-white/30 text-sm py-10">Nenhum serviço registado.</p>
                )}
              </div>
            </div>
          )}

          {/* ── CONTACTOS ── */}
          {tab === 'contactos' && (
            <div>
              <h2 className="font-serif text-xl text-white mb-6">Contactos recebidos</h2>
              <div className="flex flex-col gap-3">
                {contactos.map(c => (
                  <div key={c.id}
                    className={`bg-brand-900 border rounded-xl p-5 transition-all
                      ${c.lido ? 'border-white/7 opacity-60' : 'border-brand-gold/20'}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-white font-semibold text-sm mb-1">{c.nome}</p>
                        <div className="flex gap-3 flex-wrap">
                          {c.telefone && <span className="text-xs text-white/45">{c.telefone}</span>}
                          {c.email    && <span className="text-xs text-white/45">{c.email}</span>}
                          {c.servico_nome && <span className="text-xs text-brand-gold/70">Re: {c.servico_nome}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30">{formatDate(c.criado_em)}</span>
                        {!c.lido && (
                          <button onClick={() => markRead(c.id)}
                            className="text-[10px] bg-brand-gold/10 text-brand-gold px-2 py-1 rounded-full hover:bg-brand-gold/20 transition-colors">
                            Marcar como lido
                          </button>
                        )}
                        <button onClick={() => deleteContacto(c.id)}
                          className="text-[10px] text-red-500/50 hover:text-red-400 transition-colors px-2 py-1">
                          Eliminar
                        </button>
                      </div>
                    </div>
                    {c.mensagem && (
                      <p className="mt-3 text-white/50 text-xs leading-relaxed border-t border-white/7 pt-3">
                        {c.mensagem}
                      </p>
                    )}
                  </div>
                ))}
                {contactos.length === 0 && (
                  <p className="text-center text-white/30 text-sm py-10">Nenhum contacto recebido ainda.</p>
                )}
              </div>
            </div>
          )}

          {/* ── EMPRESA ── */}
          {tab === 'empresa' && empresa && (
            <div className="max-w-lg">
              <h2 className="font-serif text-xl text-white mb-6">Dados da empresa</h2>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{error}</p>}
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Nome', key: 'nome' },
                  { label: 'Slogan', key: 'slogan' },
                  { label: 'Telefone', key: 'telefone' },
                  { label: 'WhatsApp (apenas números com prefixo)', key: 'whatsapp' },
                  { label: 'Email', key: 'email' },
                  { label: 'Morada', key: 'morada' },
                  { label: 'Cidade', key: 'cidade' },
                  { label: 'Horário', key: 'horario' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1.5">{f.label}</label>
                    <input type="text" className={inputCls} value={empresa[f.key] ?? ''}
                      onChange={e => setEmpresa(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1.5">Sobre nós</label>
                  <textarea className={`${inputCls} resize-none`} rows={5} value={empresa.sobre ?? ''}
                    onChange={e => setEmpresa(p => ({ ...p, sobre: e.target.value }))} />
                </div>
                <button onClick={saveEmpresa} disabled={saving}
                  className="mt-2 bg-gold text-brand-950 font-bold text-sm py-3 rounded-xl hover:-translate-y-0.5 transition-all disabled:opacity-50">
                  {saving ? 'A guardar...' : 'Guardar alterações'}
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL SERVIÇO ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-brand-900 border border-white/10 rounded-2xl p-7 w-full max-w-lg
            max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg text-white">
                {modal.type === 'edit' ? 'Editar serviço' : 'Novo serviço'}
              </h3>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex flex-col gap-3">
              {[
                { label: 'Nome *', key: 'nome', type: 'text' },
                { label: 'Preço (MZN)', key: 'preco', type: 'number' },
                { label: 'Duração (horas)', key: 'duracao_horas', type: 'number' },
                { label: 'Ordem de exibição', key: 'ordem', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1.5">{f.label}</label>
                  <input type={f.type} className={inputCls} value={form[f.key] ?? ''}
                    onChange={e => setF(f.key, e.target.value)} />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1.5">Categoria *</label>
                <select className={inputCls} value={form.categoria ?? ''} onChange={e => setF('categoria', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1.5">Descrição</label>
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.descricao ?? ''}
                  onChange={e => setF('descricao', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1.5">Estado</label>
                <select className={inputCls} value={form.estado ?? 'ativo'} onChange={e => setF('estado', e.target.value)}>
                  <option value="ativo">Activo</option>
                  <option value="inativo">Inactivo</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={!!form.destaque} onChange={e => setF('destaque', e.target.checked)}
                  className="w-4 h-4 accent-brand-gold" />
                <span className="text-sm text-white/60">Marcar como destaque</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.preco_visivel !== false} onChange={e => setF('preco_visivel', e.target.checked)}
                  className="w-4 h-4 accent-brand-gold" />
                <span className="text-sm text-white/60">Mostrar preço no website</span>
              </label>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-white/10 text-white/60 text-sm rounded-xl hover:border-white/25 transition-colors">
                  Cancelar
                </button>
                <button onClick={saveServico} disabled={saving}
                  className="flex-1 py-2.5 bg-gold text-brand-950 text-sm font-bold rounded-xl hover:-translate-y-0.5 transition-all disabled:opacity-50">
                  {saving ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
