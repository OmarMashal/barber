import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  gold?: boolean
}

export default function Card({ hover, gold, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-ink-100/80 backdrop-blur-sm shadow-card',
        gold
          ? 'border-gold-400/20'
          : 'border-ink-400',
        hover && [
          'cursor-pointer transition-all duration-200 ease-spring',
          gold
            ? 'hover:border-gold-400/40 hover:shadow-gold-sm'
            : 'hover:border-ink-500 hover:bg-ink-200/80',
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
