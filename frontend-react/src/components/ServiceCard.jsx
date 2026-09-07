import { useNavigate } from 'react-router-dom'
import { formatPrice } from '../lib/api'

const CATEGORY_ICONS = {
  'funeral completo': '†',
  'cremação':         '◈',
  'cremacao':         '◈',
  'transporte':       '◫',
  'urna':             '◻',
  'flores':           '✿',
  'documentação':     '▤',
  'documentacao':     '▤',
}

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[(cat || '').toLowerCase()] ?? '◆'
}

export default function ServiceCard({ service, onContact }) {
  const navigate = useNavigate()

  return (
    <article
      className={`group bg-white rounded-2xl border flex flex-col overflow-hidden
        transition-all duration-300 hover:-translate-y-1.5
        hover:shadow-[0_20px_60px_rgba(0,0,0,.12)]
        ${service.destaque
          ? 'border-brand-gold/40 shadow-[0_4px_20px_rgba(200,164,90,.1)]'
          : 'border-stone-200 shadow-sm'
        }`}
    >
      {/* Faixa topo */}
      <div className={`h-0.5 transition-opacity duration-300
        ${service.destaque ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        bg-gradient-to-r from-brand-gold via-[#e2c07e] to-brand-gold`}
      />

      <div className="p-7 flex-1 flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-5">
          <div className="w-11 h-11 rounded-xl bg-stone-50 border border-stone-200
            flex items-center justify-center text-brand-700 font-serif text-lg">
            {getCategoryIcon(service.categoria)}
          </div>
          {service.destaque
            ? (
              <span className="text-[10px] font-bold uppercase tracking-widest
                text-brand-950 bg-gold px-2.5 py-0.5 rounded-full">
                Destaque
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wider
                text-brand-gold border border-brand-gold/30 bg-brand-gold/8
                px-2.5 py-0.5 rounded-full">
                {service.categoria}
              </span>
            )
          }
        </div>

        {/* Conteúdo */}
        <h3 className="font-serif text-[1.08rem] text-brand-800 mb-2.5 leading-snug">
          {service.nome}
        </h3>
        <p className="text-sm text-stone-500 leading-relaxed flex-1 line-clamp-3">
          {service.descricao ?? 'Serviço prestado com profissionalismo e respeito.'}
        </p>

        {/* Tags */}
        {service.duracao_horas && (
          <div className="mt-4 flex gap-2">
            <span className="text-[11px] text-stone-400 border border-stone-200
              bg-stone-50 px-2.5 py-0.5 rounded-full">
              Duração: {service.duracao_horas}h
            </span>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="px-7 py-4 border-t border-stone-100 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-0.5">Valor</p>
          <p className="font-serif text-[1.2rem] font-semibold text-brand-800">
            {service.preco && service.preco_visivel
              ? formatPrice(service.preco)
              : <span className="font-sans text-sm font-normal text-stone-400">Consultar</span>
            }
          </p>
        </div>
        <button
          onClick={() => onContact(service.id, service.nome)}
          className="text-sm font-semibold text-white bg-brand-800 px-4 py-2 rounded-full
            hover:bg-brand-gold hover:text-brand-950 transition-all duration-200
            whitespace-nowrap"
        >
          Pedir informação
        </button>
      </div>
    </article>
  )
}
