import { cn } from '@/lib/utils'
import { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export default function Select({ label, id, className, children, ...props }: SelectProps) {
  const selectId = id ?? label

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-xl border border-ink-400 bg-ink-50 px-4 py-3 text-white',
          'transition-colors duration-200',
          'focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/30',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
