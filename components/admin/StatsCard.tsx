import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: number | string
  sub?: string
  accent?: boolean
}

export default function StatsCard({ label, value, sub, accent }: StatsCardProps) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={cn('mt-1 text-3xl font-bold', accent ? 'text-gold-400' : 'text-white')}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-600">{sub}</p>}
    </Card>
  )
}
