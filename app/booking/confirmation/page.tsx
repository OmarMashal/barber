import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/server'
import { SHOP_NAME } from '@/lib/constants'
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'

export const metadata: Metadata = {
  title: `تأكيد الحجز | ${SHOP_NAME}`,
}

interface Props {
  searchParams: Promise<{ id?: string }>
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { id } = await searchParams
  if (!id) notFound()

  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id,
      customer_name,
      customer_phone,
      duration,
      starts_at,
      ends_at,
      status,
      notes,
      services ( name, price )
    `)
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const service = booking.services as { name: string; price: number } | null

  const rows = [
    { label: 'الاسم',   value: booking.customer_name },
    { label: 'الجوال',  value: booking.customer_phone, dir: 'ltr' as const },
    { label: 'الخدمة',  value: service?.name ?? '—' },
    { label: 'التاريخ', value: formatDate(booking.starts_at) },
    { label: 'الوقت',   value: formatTime(booking.starts_at) },
    { label: 'المدة',   value: `${booking.duration} دقيقة` },
    { label: 'السعر',   value: service ? `₪${service.price}` : '—' },
  ]

  return (
    <>
      <Header />

      <main className="min-h-screen bg-spotlight px-4 py-16">
        <div className="mx-auto max-w-lg animate-slide-up">

          {/* Success icon */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 shadow-gold-sm animate-scale-in">
              <span className="text-3xl text-gold-300">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-white">تم استلام حجزك!</h1>
            <p className="mt-2 text-slate-500">
              سنتواصل معك قريباً لتأكيد الموعد
            </p>
          </div>

          {/* Booking card */}
          <Card gold className="overflow-hidden">
            {/* Reference header */}
            <div className="flex items-center justify-between border-b border-ink-400/60 bg-ink-200/60 px-6 py-3">
              <p className="text-xs text-slate-500">رقم الحجز</p>
              <code className="font-mono text-xs text-gold-400">
                #{booking.id.slice(0, 8).toUpperCase()}
              </code>
            </div>

            {/* Detail rows */}
            <div className="divide-y divide-ink-400/40 px-6">
              {rows.map(({ label, value, dir }) => (
                <div key={label} className="flex items-center justify-between py-3.5">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-white" dir={dir}>
                    {value}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-slate-500">الحالة</span>
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusLabel(booking.status)}
                </Badge>
              </div>

              {booking.notes && (
                <div className="py-3.5">
                  <p className="text-xs text-slate-600">ملاحظات</p>
                  <p className="mt-1 text-sm text-white">{booking.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="flex-1">
              <Button variant="secondary" size="lg" className="w-full">
                الرئيسية
              </Button>
            </Link>
            <Link href="/booking" className="flex-1">
              <Button size="lg" className="w-full">
                حجز آخر
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
