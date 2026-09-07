import { useState } from 'react'
import { api } from '../lib/api'

export default function ContactForm({ servicoId, onServiceChange, servicos }) {
  const [form, setForm] = useState({
    nome: '', telefone: '', email: '',
    servico_id: servicoId ?? '', mensagem: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.nome.trim()) return setError('Indique o seu nome.')
    if (!form.telefone.trim() && !form.email.trim())
      return setError('Indique o seu telefone ou email.')
    setLoading(true)
    try {
      await api.contactos.send({
        nome:       form.nome,
        telefone:   form.telefone,
        email:      form.email,
        servico_id: form.servico_id || null,
        mensagem:   form.mensagem,
      })
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-10 px-4">
        <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full
          flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-serif text-xl text-brand-800 mb-2">Mensagem enviada</h3>
        <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
          Recebemos o seu contacto. A nossa equipa responderá com a maior brevidade possível.
        </p>
      </div>
    )
  }

  const inputCls = `w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm
    text-brand-800 placeholder:text-stone-400 outline-none transition-all
    focus:border-brand-gold focus:bg-white focus:ring-2 focus:ring-brand-gold/10`

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
          Nome *
        </label>
        <input
          type="text"
          className={inputCls}
          placeholder="Nome completo"
          value={form.nome}
          onChange={e => set('nome', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
            Telefone / WhatsApp *
          </label>
          <input
            type="tel"
            className={inputCls}
            placeholder="+258 84 000 0000"
            value={form.telefone}
            onChange={e => set('telefone', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
            Email
          </label>
          <input
            type="email"
            className={inputCls}
            placeholder="email@exemplo.co.mz"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
          Serviço de interesse
        </label>
        <select
          className={inputCls}
          value={form.servico_id}
          onChange={e => set('servico_id', e.target.value)}
        >
          <option value="">Seleccionar (opcional)</option>
          {servicos?.map(s => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
          Mensagem
        </label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={4}
          placeholder="Como podemos ajudá-lo?"
          value={form.mensagem}
          onChange={e => set('mensagem', e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-brand-800 text-white font-semibold text-sm rounded-xl
          hover:bg-brand-gold hover:text-brand-950 disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200"
      >
        {loading ? 'A enviar...' : 'Enviar mensagem'}
      </button>
      <p className="text-center text-[11px] text-stone-400 mt-3">
        * Telefone ou email são obrigatórios para podermos responder.
      </p>
    </form>
  )
}
