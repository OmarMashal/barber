import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-ink-50 px-4 py-3 text-white placeholder-slate-600',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gold-400/30',
            error
              ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20'
              : 'border-ink-400 hover:border-ink-500 focus:border-gold-400/60',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-slate-600">{hint}</p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
