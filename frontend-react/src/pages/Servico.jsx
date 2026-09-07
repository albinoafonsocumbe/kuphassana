import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, formatPrice } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Servico() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.empresa.get().then(r => setEmpresa(r.dados))
    api.servicos.get(id)
      .then(r => { setData(r.dados); document.title = `${r.dados.nome} — Agência Funerária Silva` })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-stone-200 border-t-brand-gold rounded-full animate-spin" />
    </div>
  )

  const s   = data
  const emp = s?.empresa ?? empresa
  const tel = emp?.telefone?.replace(/\s/g, '') ?? ''
  const wa  = emp?.whatsapp
  const msg = encodeURIComponent(`Olá! Vi o serviço "${s?.nome}" no vosso website e gostaria de obter mais informações.`)

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar empresa={emp} />

      <div className="max-w-3xl mx-auto px-6 lg:px-8 pt-28 pb-20">

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-stone-400 text-sm mb-8
            hover:text-brand-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar aos serviços
        </button>

        {/* Cabeçalho do serviço */}
        <div className="bg-gradient-to-br from-brand-950 via-brand-800 to-[#1e1e35]
          rounded-2xl overflow-hidden mb-6 relative">
          <div className="absolute bottom-0 left-[10%] right-[10%] h-px
            bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
          <div className="p-8 relative z-10">
            <span className="inline-block text-brand-gold text-[10px] font-bold uppercase
              tracking-widest border border-brand-gold/30 bg-brand-gold/10 px-3 py-1
              rounded-full mb-4">
              {s.categoria}
            </span>
            <h1 className="font-serif text-white font-bold mb-3"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
              {s.nome}
            </h1>
            <p className="text-white/50 text-sm">
              {emp?.nome ?? 'Agência Funerária'}{emp?.cidade ? ` — ${emp.cidade}` : ''}
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-3 divide-x divide-stone-200 bg-white border
          border-stone-200 rounded-2xl mb-6">
          <div className="px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Valor</p>
            <p className="font-serif text-lg font-semibold text-brand-800">
              {s.preco && s.preco_visivel ? formatPrice(s.preco) : 'Consultar'}
            </p>
          </div>
          {s.duracao_horas && (
            <div className="px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Duração</p>
              <p className="font-serif text-lg font-semibold text-brand-800">{s.duracao_horas}h</p>
            </div>
          )}
          <div className="px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Disponibilidade</p>
            <p className={`text-sm font-semibold ${s.estado === 'ativo' ? 'text-green-700' : 'text-red-700'}`}>
              {s.estado === 'ativo' ? 'Disponível' : 'Indisponível'}
            </p>
          </div>
        </div>

        {/* Descrição */}
        {s.descricao && (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 mb-6">
            <h2 className="font-serif text-brand-800 font-semibold text-lg mb-4">
              Sobre este serviço
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed">{s.descricao}</p>
          </div>
        )}

        {/* Contacto direto */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="bg-brand-950 px-8 py-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-gold/15 rounded-xl flex items-center
              justify-center font-serif font-bold text-brand-gold text-sm flex-shrink-0">
              {(emp?.nome ?? 'AF').charAt(0)}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{emp?.nome ?? 'Agência Funerária'}</p>
              <p className="text-white/40 text-xs">{emp?.cidade ?? 'Moçambique'}</p>
            </div>
          </div>
          <div className="p-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-4">
              Contacte directamente
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {wa && (
                <a
                  href={`https://wa.me/${wa}?text=${msg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                    bg-[#25D366] text-white font-semibold text-sm
                    hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,211,102,.35)]
                    transition-all"
                >
                  <span className="text-xs font-bold">WA</span>
                  WhatsApp
                </a>
              )}
              {tel && (
                <a
                  href={`tel:${tel}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                    bg-brand-800 text-white font-semibold text-sm
                    hover:bg-brand-950 hover:-translate-y-0.5 transition-all"
                >
                  Ligar
                </a>
              )}
              {tel && (
                <a
                  href={`sms:${tel}?body=${msg}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                    bg-blue-600 text-white font-semibold text-sm
                    hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                >
                  SMS
                </a>
              )}
              {emp?.email && (
                <a
                  href={`mailto:${emp.email}?subject=${encodeURIComponent('Pedido de informações — ' + s.nome)}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                    bg-white text-brand-800 font-semibold text-sm border border-stone-200
                    hover:border-brand-gold transition-all sm:col-span-2 lg:col-span-1"
                >
                  Email
                </a>
              )}
            </div>
            <p className="text-[11px] text-stone-400 mt-4 text-center">
              O contacto é feito directamente com a agência — sem intermediários.
            </p>
          </div>
        </div>

      </div>

      <Footer empresa={emp} />
    </div>
  )
}
