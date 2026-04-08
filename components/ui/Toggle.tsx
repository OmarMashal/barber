'use client'

import { cn } from '@/lib/utils'

interface ToggleProps {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

export default function Toggle({ value, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        value ? 'bg-gold-400' : 'bg-ink-500'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
          value ? '-translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}
