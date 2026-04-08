'use client'

import { cn } from '@/lib/utils'
import type { Service } from '@/types'

interface ServiceCardProps {
  service: Service
  selected: boolean
  onSelect: (service: Service) => void
}

export default function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className={cn(
        'w-full rounded-2xl border p-4 text-right transition-all duration-200 ease-spring',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60',
        selected
          ? 'border-gold-400/50 bg-gold-400/8 shadow-gold-sm glow-gold'
          : 'border-ink-400 bg-ink-100/60 hover:border-ink-500 hover:bg-ink-200/60'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Color dot */}
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: service.color }}
        />

        <div className="flex-1 text-right">
          <p className={cn('font-semibold', selected ? 'text-white' : 'text-slate-200')}>
            {service.name}
          </p>
          {service.description && (
            <p className="mt-0.5 text-sm text-slate-500">{service.description}</p>
          )}
          <p className="mt-1.5 text-xs text-slate-600">{service.duration} دقيقة</p>
        </div>

        <div className="shrink-0 text-right">
          <span className={cn('text-xl font-bold', selected ? 'text-gold-300' : 'text-gold-400')}>
            {service.price}
          </span>
          <span className="me-0.5 text-xs text-slate-600"> ₪</span>
        </div>
      </div>

      {selected && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gold-400">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          محدد
        </div>
      )}
    </button>
  )
}
