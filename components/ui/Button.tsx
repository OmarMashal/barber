import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: [
    'bg-gradient-to-b from-gold-300 to-gold-400 text-ink',
    'font-bold shadow-gold-sm',
    'hover:from-gold-200 hover:to-gold-300 hover:shadow-gold',
    'active:from-gold-400 active:to-gold-500',
    'shine',
  ].join(' '),

  secondary: [
    'bg-ink-100 border border-ink-400 text-white',
    'hover:bg-ink-200 hover:border-ink-500',
  ].join(' '),

  outline: [
    'border border-gold-400/40 text-gold-400',
    'hover:bg-gold-400/8 hover:border-gold-400/70',
  ].join(' '),

  ghost: [
    'text-slate-400',
    'hover:text-white hover:bg-ink-200',
  ].join(' '),

  danger: [
    'bg-red-500/8 border border-red-500/25 text-red-400',
    'hover:bg-red-500/15 hover:border-red-500/50',
  ].join(' '),
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'px-2.5 py-1   text-xs  rounded-lg',
  sm: 'px-3.5 py-1.5 text-sm  rounded-xl',
  md: 'px-5   py-2.5 text-sm  rounded-xl',
  lg: 'px-7   py-3.5 text-base rounded-2xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'transition-all duration-200 ease-spring',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        'select-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
export default Button
