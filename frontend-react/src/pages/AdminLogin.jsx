import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, auth } from '../lib/api'

export default function AdminLogin() {
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.login(email, senha)
      auth.save(res.token, res.utilizador)
      navigate('/admin/painel')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center
            mx-auto mb-4">
            <span className="text-brand-950 font-bold text-lg">✝</span>
          </div>
          <h1 className="font-serif text-white text-2xl mb-1">Área Administrativa</h1>
          <p className="text-white/40 text-sm">Acesso exclusivo para administradores</p>
        </div>

        {/* Card */}
        <div className="bg-brand-800 border border-white/8 rounded-2xl p-8">
          <div className="h-0.5 bg-gold rounded-t-2xl -mt-8 mb-8 -mx-8" />

          {error && (
            <div className="mb-5 text-sm text-red-400 bg-red-500/10 border border-red-500/20
              rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-widest
                text-white/40 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-brand-900 border border-white/10 rounded-xl
                  text-white text-sm placeholder:text-white/25 outline-none
                  focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 transition-all"
                placeholder="admin@empresa.co.mz"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-[11px] font-bold uppercase tracking-widest
                text-white/40 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full px-4 py-3 bg-brand-900 border border-white/10 rounded-xl
                  text-white text-sm placeholder:text-white/25 outline-none
                  focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gold text-brand-950 font-bold text-sm rounded-xl
                hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(200,164,90,.4)]
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'A verificar...' : 'Entrar no painel'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6">
          <a href="/" className="text-white/25 text-xs hover:text-white/50 transition-colors">
            Voltar ao website
          </a>
        </p>
      </div>
    </div>
  )
}
