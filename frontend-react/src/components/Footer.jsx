export default function Footer({ empresa }) {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-brand-950 text-white/40 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10
          border-b border-white/7">

          {/* Marca */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-brand-950 font-bold text-sm">✝</span>
              </div>
              <span className="font-serif text-white text-base">
                {empresa?.nome ?? 'Agência Funerária'}
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              {empresa?.slogan ?? 'Serviços funerários com dignidade e respeito em Moçambique.'}
            </p>
          </div>

          {/* Serviços */}
          <div>
            <h4 className="text-white text-[11px] font-bold uppercase tracking-widest mb-4">
              Serviços
            </h4>
            {['Funeral Completo', 'Cremação', 'Transporte', 'Arranjos Florais', 'Documentação'].map(s => (
              <a key={s} href="#servicos"
                className="block text-sm mb-2.5 hover:text-brand-gold transition-colors">
                {s}
              </a>
            ))}
          </div>

          {/* Contactos */}
          <div>
            <h4 className="text-white text-[11px] font-bold uppercase tracking-widest mb-4">
              Contactos
            </h4>
            {empresa?.telefone && (
              <a href={`tel:${empresa.telefone.replace(/\s/g, '')}`}
                className="block text-sm mb-2.5 hover:text-brand-gold transition-colors">
                {empresa.telefone}
              </a>
            )}
            {empresa?.email && (
              <a href={`mailto:${empresa.email}`}
                className="block text-sm mb-2.5 hover:text-brand-gold transition-colors">
                {empresa.email}
              </a>
            )}
            {empresa?.morada && (
              <p className="text-sm mb-2.5">
                {empresa.morada}{empresa?.cidade ? `, ${empresa.cidade}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>
            &copy; {year} {empresa?.nome ?? 'Agência Funerária'}
            {empresa?.cidade ? ` — ${empresa.cidade}, Moçambique` : ' — Moçambique'}
          </span>
          <a href="/admin" className="text-white/15 hover:text-white/30 transition-colors">
            Área Administrativa
          </a>
        </div>

      </div>
    </footer>
  )
}
