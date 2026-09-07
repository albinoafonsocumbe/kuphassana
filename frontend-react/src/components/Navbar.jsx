import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar({ empresa }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { label: 'Serviços', href: '#servicos' },
    { label: 'Sobre Nós', href: '#sobre' },
    { label: 'Contacto', href: '#contacto' },
  ]

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
      ${scrolled
        ? 'bg-brand-950/95 backdrop-blur-xl shadow-2xl border-b border-white/5'
        : 'bg-brand-950/80 backdrop-blur-lg border-b border-brand-gold/15'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[70px] flex items-center justify-between">

        {/* Marca */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-brand-950 font-bold text-sm font-serif">✝</span>
          </div>
          <span className="font-serif text-white text-[1.1rem] tracking-wide">
            {empresa?.nome ?? 'Agência Funerária'}
          </span>
        </a>

        {/* Links desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="text-white/65 text-sm font-medium hover:text-white transition-colors relative
                after:absolute after:bottom-[-3px] after:left-0 after:h-[1.5px] after:w-0
                after:bg-brand-gold after:transition-all hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contacto"
            className="bg-gold text-brand-950 text-sm font-bold px-5 py-2 rounded-full
              hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(200,164,90,.45)]
              transition-all duration-200"
          >
            Contactar Agora
          </a>
        </div>

        {/* Botão mobile */}
        <button
          className="md:hidden text-white/70 hover:text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen
            ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          }
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-brand-900 border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-white/75 text-sm font-medium py-2 border-b border-white/5"
               onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#contacto" className="bg-gold text-brand-950 text-sm font-bold text-center px-4 py-3 rounded-lg"
             onClick={() => setMenuOpen(false)}>
            Contactar Agora
          </a>
        </div>
      )}
    </nav>
  )
}
