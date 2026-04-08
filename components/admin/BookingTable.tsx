'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { Booking, BookingStatus } from '@/types'

interface BookingTableProps {
  bookings: Booking[]
  onStatusChange: (id: string, status: BookingStatus) => Promise<void>
}

const STATUS_ACTIONS: {
  label: string
  status: BookingStatus
  excludeWhen: BookingStatus[]
  cls: string
}[] = [
  {
    label: 'تأكيد',
    status: 'confirmed',
    excludeWhen: ['confirmed'],
    cls: 'text-emerald-400 hover:text-emerald-300',
  },
  {
    label: 'غياب',
    status: 'no_show',
    excludeWhen: ['cancelled', 'no_show'],
    cls: 'text-slate-400 hover:text-slate-300',
  },
  {
    label: 'إلغاء',
    status: 'cancelled',
    excludeWhen: ['cancelled'],
    cls: '',
  },
]

export default function BookingTable({ bookings, onStatusChange }: BookingTableProps) {
  const [updating, setUpdating] = useState<string | null>(null)

  async function handleStatus(id: string, status: BookingStatus) {
    setUpdating(id)
    await onStatusChange(id, status)
    setUpdating(null)
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-400 bg-ink-100/40 px-8 py-16 text-center">
        <p className="text-4xl">📅</p>
        <p className="mt-3 text-slate-400">لا توجد حجوزات</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-400">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-400 bg-ink-200/80 text-slate-400">
            <th className="px-4 py-3 text-right font-medium">العميل</th>
            <th className="px-4 py-3 text-right font-medium">الخدمة</th>
            <th className="px-4 py-3 text-right font-medium">الموعد</th>
            <th className="px-4 py-3 text-right font-medium">الحالة</th>
            <th className="px-4 py-3 text-right font-medium">إجراء</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-400/60">
          {bookings.map((b) => {
            const svcName = (b.services as { name: string } | undefined)?.name ?? '—'

            return (
              <tr
                key={b.id}
                className="bg-ink-100/30 transition-colors hover:bg-ink-100/60"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{b.customer_name}</p>
                  <p className="text-xs text-slate-500" dir="ltr">
                    {b.customer_phone}
                  </p>
                </td>

                <td className="px-4 py-3">
                  <p className="text-slate-300">{svcName}</p>
                  <p className="text-xs text-slate-500">{b.duration} دقيقة</p>
                </td>

                <td className="px-4 py-3">
                  <p className="text-slate-300">{formatDate(b.starts_at)}</p>
                  <p className="text-xs text-slate-500">{formatTime(b.starts_at)}</p>
                </td>

                <td className="px-4 py-3">
                  <Badge className={getStatusColor(b.status)}>
                    {getStatusLabel(b.status)}
                  </Badge>
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {STATUS_ACTIONS.filter(
                      (a) => !a.excludeWhen.includes(b.status)
                    ).map((action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant={action.status === 'cancelled' ? 'danger' : 'secondary'}
                        loading={updating === b.id}
                        onClick={() => handleStatus(b.id, action.status)}
                        className={action.cls}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
