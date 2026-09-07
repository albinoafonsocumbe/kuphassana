import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import Navbar from '../components/Navbar'
import ServiceCard from '../components/ServiceCard'
import ContactForm from '../components/ContactForm'
import Footer from '../components/Footer'

export default function Home() {
  const [empresa, setEmpresa]         = useState(null)
  const [servicos, setServicos]       = useState([])
  const [categorias, setCategorias]   = useState([])
  const [categoria, setCategoria]     = useState('')
  const [loading, setLoading]         = useState(true)
  const [preSelectedId, setPreSelectedId] = useState('')
  const contactRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.empresa.get().then(r => setEmpresa(r.dados)),
      api.servicos.categories().then(r => setCategorias(r.dados)),
    ])
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = categoria ? { categoria } : {}
    api.servicos.list(params)
      .then(r => setServicos(r.dados))
      .finally(() => setLoading(false))
  }, [categoria])

  function handleContact(id, nome) {
    setPreSelectedId(String(id))
    contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const whatsappUrl = empresa?.whatsapp
    ? `https://wa.me/${empresa.whatsapp}?text=${encodeURIComponent('Olá! Preciso de apoio urgente dos vossos serviços funerários.')}`
    : null

  return (
    <div className="min-h-screen">
      <Navbar empresa={empresa} />

      {/* ── HERO ── */}
      <section
        className="min-h-screen flex items-center justify-center text-center px-6 pt-20
          bg-gradient-to-br from-brand-950 via-brand-800 to-[#1e1e35] relative overflow-hidden"
      >
        {/* Gradiente radial decorativo */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 25% 45%, rgba(200,164,90,.07) 0%, transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(200,164,90,.05) 0%, transparent 45%)'
          }}
        />
        {/* Linha dourada inferior */}
        <div className="absolute bottom-0 left-[10%] right-[10%] h-px
          bg-gradient-to-r from-transparent via-brand-gold to-transparent" />

        <div className="relative z-10 max-w-3xl mx-auto">

          {/* Pill de disponibilidade */}
          <div className="inline-flex items-center gap-2.5 bg-brand-gold/10 border
            border-brand-gold/25 text-brand-gold-light rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[1.5px]">
              {empresa?.horario ?? 'Disponível 24 horas, 7 dias por semana'}
            </span>
          </div>

          <h1 className="font-serif font-bold leading-[1.18] tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.1rem, 5.5vw, 3.6rem)', color: '#ffffff' }}>
            Cuidamos da sua Família<br />
            <span className="text-gold">com Dignidade e Respeito</span>
          </h1>

          <p className="text-white/55 font-light leading-relaxed mb-10 max-w-xl mx-auto"
            style={{ fontSize: 'clamp(.95rem, 2vw, 1.1rem)' }}>
            {empresa?.cidade
              ? `Serviços funerários profissionais em ${empresa.cidade} e em todo o país.`
              : 'Serviços funerários profissionais em Moçambique.'
            } Estamos consigo nos momentos mais difíceis.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gold text-brand-950 font-bold px-8 py-3.5 rounded-full text-sm
                  hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(200,164,90,.5)]
                  transition-all duration-200"
              >
                Contactar via WhatsApp
              </a>
            )}
            <a
              href="#servicos"
              className="border border-white/20 text-white/80 font-medium px-7 py-3.5
                rounded-full text-sm hover:bg-white/8 hover:text-white transition-all"
            >
              Ver os nossos serviços
            </a>
          </div>

          {/* Métricas */}
          <div className="flex justify-center gap-12 mt-16 pt-10
            border-t border-white/8 flex-wrap">
            {[
              { valor: '24/7',              rotulo: 'Disponibilidade' },
              { valor: servicos.length || '—', rotulo: 'Serviços' },
              { valor: '100%',             rotulo: 'Profissionalismo' },
            ].map(m => (
              <div key={m.rotulo} className="text-center">
                <span className="font-serif text-brand-gold font-bold block leading-none"
                  style={{ fontSize: '2rem' }}>
                  {m.valor}
                </span>
                <span className="text-[11px] text-white/40 uppercase tracking-widest mt-1.5 block">
                  {m.rotulo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVIÇOS ── */}
      <section id="servicos" className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          <div className="text-center mb-14">
            <span className="text-brand-gold text-[11px] font-bold uppercase tracking-[2.5px] block mb-3">
              O que oferecemos
            </span>
            <h2 className="font-serif font-bold text-brand-800 mb-4"
              style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.4rem)' }}>
              Os Nossos Serviços
            </h2>
            <p className="text-stone-500 text-sm max-w-md mx-auto leading-relaxed">
              Tratamos de cada detalhe com cuidado para que a família possa
              estar presente nos momentos que realmente importam.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex gap-2.5 justify-center flex-wrap mb-10">
            <button
              onClick={() => setCategoria('')}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all border
                ${categoria === ''
                  ? 'bg-brand-800 text-white border-brand-800'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-brand-gold hover:text-brand-gold'
                }`}
            >
              Todos os serviços
            </button>
            {categorias.map(c => (
              <button
                key={c.categoria}
                onClick={() => setCategoria(c.categoria)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all border
                  ${categoria === c.categoria
                    ? 'bg-brand-800 text-white border-brand-800'
                    : 'bg-white text-stone-500 border-stone-200 hover:border-brand-gold hover:text-brand-gold'
                  }`}
              >
                {c.categoria}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-stone-200 border-t-brand-gold
                rounded-full animate-spin" />
            </div>
          ) : servicos.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <p className="text-sm">Nenhum serviço disponível nesta categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {servicos.map(s => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  onContact={handleContact}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SOBRE ── */}
      <section id="sobre"
        className="py-24 bg-gradient-to-br from-brand-950 via-brand-800 to-[#1e1e35]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Texto */}
            <div>
              <span className="text-brand-gold text-[11px] font-bold uppercase tracking-[2.5px] block mb-3">
                Quem somos
              </span>
              <h2 className="font-serif font-bold text-white mb-5"
                style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
                A Nossa Missão
              </h2>
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                {empresa?.sobre ?? 'Somos uma agência funerária comprometida em oferecer serviços de qualidade, com respeito, dignidade e compaixão em cada momento. A nossa equipa está sempre disponível para apoiar as famílias nas horas mais difíceis.'}
              </p>

              <div className="flex flex-col gap-3">
                {[
                  { label: 'Localização', value: empresa?.morada ? `${empresa.morada}${empresa.cidade ? ', ' + empresa.cidade : ''} — Moçambique` : 'Maputo, Moçambique' },
                  { label: 'Horário',     value: empresa?.horario ?? 'Disponível 24 horas, todos os dias' },
                  { label: 'Email',       value: empresa?.email ?? '—' },
                ].map(item => (
                  <div key={item.label}
                    className="flex gap-4 p-4 bg-white/4 border border-white/8 rounded-xl
                      hover:border-brand-gold/25 transition-colors">
                    <div className="flex-1">
                      <p className="text-brand-gold text-[10px] font-bold uppercase tracking-widest mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-white/60 text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card urgência */}
            <div className="bg-brand-gold/8 border border-brand-gold/20 rounded-2xl p-8">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border
                border-green-500/20 text-green-400 text-[10px] font-bold uppercase
                tracking-widest rounded-full px-3 py-1 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Serviço de Urgência
              </div>

              <h3 className="font-serif text-xl text-white mb-3">
                Precisa de ajuda urgente?
              </h3>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                A nossa equipa está disponível a qualquer hora do dia ou da noite.
                Contacte-nos imediatamente.
              </p>

              <div className="flex flex-col gap-3">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-[#25D366]/10 border
                      border-[#25D366]/20 text-white rounded-xl hover:bg-[#25D366]/20
                      transition-all group"
                  >
                    <div className="w-10 h-10 bg-[#25D366]/15 rounded-lg flex items-center
                      justify-center text-[#25D366] text-sm font-bold flex-shrink-0">
                      WA
                    </div>
                    <div>
                      <p className="text-sm font-semibold">WhatsApp</p>
                      <p className="text-[11px] text-white/45">Resposta imediata</p>
                    </div>
                  </a>
                )}
                {empresa?.telefone && (
                  <a
                    href={`tel:${empresa.telefone.replace(/\s/g, '')}`}
                    className="flex items-center gap-3 p-4 bg-white/5 border
                      border-white/10 text-white rounded-xl hover:bg-white/10
                      transition-all"
                  >
                    <div className="w-10 h-10 bg-white/8 rounded-lg flex items-center
                      justify-center text-white/70 text-xs font-bold flex-shrink-0">
                      TEL
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{empresa.telefone}</p>
                      <p className="text-[11px] text-white/45">Chamada directa</p>
                    </div>
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CONTACTO ── */}
      <section id="contacto" ref={contactRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">

            {/* Info */}
            <div>
              <span className="text-brand-gold text-[11px] font-bold uppercase tracking-[2.5px] block mb-3">
                Fale connosco
              </span>
              <h2 className="font-serif font-bold text-brand-800 mb-4"
                style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
                Entre em Contacto
              </h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-8">
                Preencha o formulário ou utilize os contactos directos.
                Respondemos sempre com a maior brevidade.
              </p>

              <div className="flex flex-col gap-3">
                {empresa?.telefone && (
                  <a href={`tel:${empresa.telefone.replace(/\s/g,'')}`}
                    className="flex items-center gap-4 p-4 bg-white border border-stone-200
                      rounded-xl hover:border-brand-gold hover:shadow-sm transition-all group">
                    <div className="w-11 h-11 bg-stone-100 rounded-xl flex items-center
                      justify-center text-xs font-bold text-stone-600 flex-shrink-0">
                      TEL
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-800">Chamada telefónica</p>
                      <p className="text-xs text-stone-400">{empresa.telefone}</p>
                    </div>
                  </a>
                )}
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white border border-stone-200
                      rounded-xl hover:border-[#25D366]/50 hover:shadow-sm transition-all">
                    <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center
                      justify-content-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                      WA
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-800">WhatsApp</p>
                      <p className="text-xs text-stone-400">Enviar mensagem agora</p>
                    </div>
                  </a>
                )}
                {empresa?.email && (
                  <a href={`mailto:${empresa.email}`}
                    className="flex items-center gap-4 p-4 bg-white border border-stone-200
                      rounded-xl hover:border-brand-gold/50 hover:shadow-sm transition-all">
                    <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center
                      justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                      EM
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-800">Email</p>
                      <p className="text-xs text-stone-400">{empresa.email}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
              <h3 className="font-serif text-lg text-brand-800 mb-6">Enviar mensagem</h3>
              <ContactForm
                servicoId={preSelectedId}
                servicos={servicos}
              />
            </div>

          </div>
        </div>
      </section>

      <Footer empresa={empresa} />
    </div>
  )
}
