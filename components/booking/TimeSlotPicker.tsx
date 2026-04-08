'use client'

import { cn, formatSlotLabel } from '@/lib/utils'
import type { Slot } from '@/types'

interface TimeSlotPickerProps {
  slots: Slot[]
  selectedStartsAt: string
  onChange: (slot: Slot) => void
  error?: string
}

export default function TimeSlotPicker({
  slots,
  selectedStartsAt,
  onChange,
  error,
}: TimeSlotPickerProps) {
  const available = slots.filter((s) => s.is_available)
  const taken     = slots.filter((s) => !s.is_available)

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-ink-400 bg-ink-100/40 px-4 py-8 text-center text-sm text-slate-600">
        لا توجد مواعيد متاحة في هذا اليوم
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-slate-300">
        اختر الوقت
        {available.length > 0 && (
          <span className="me-2 text-xs text-slate-600">
            ({available.length} متاح)
          </span>
        )}
      </p>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const isSelected = slot.starts_at === selectedStartsAt

          return (
            <button
              key={slot.starts_at}
              type="button"
              disabled={!slot.is_available}
              onClick={() => onChange(slot)}
              className={cn(
                'rounded-xl border py-2.5 text-sm font-medium transition-all duration-150 ease-spring',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60',
                !slot.is_available
                  ? 'cursor-not-allowed border-ink-300 bg-ink-50/30 text-slate-600 line-through'
                  : isSelected
                  ? 'border-gold-400/50 bg-gold-400/10 text-gold-300 shadow-gold-sm glow-gold'
                  : 'border-ink-400 bg-ink-100/60 text-slate-300 hover:border-ink-500 hover:text-white'
              )}
            >
              {formatSlotLabel(slot.slot_time)}
            </button>
          )
        })}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {taken.length > 0 && available.length > 0 && (
        <p className="text-xs text-slate-600">
          المواعيد المشطوبة محجوزة مسبقاً
        </p>
      )}
    </div>
  )
}
