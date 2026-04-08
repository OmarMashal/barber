'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StatsCard from '@/components/admin/StatsCard'
import BookingTable from '@/components/admin/BookingTable'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getTodayString } from '@/lib/utils'
import { SHOP_NAME } from '@/lib/constants'
import type { Booking, BookingStatus } from '@/types'

type Filter = 'all' | BookingStatus

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'الكل', value: 'all' },
  { label: 'قيد الانتظار', value: 'pending' },
  { label: 'مؤكد', value: 'confirmed' },
  { label: 'ملغي', value: 'cancelled' },
]

export default function AdminDashboardPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/bookings')
    const data = await res.json()
    setBookings(data.bookings ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  async function handleStatusChange(id: string, status: BookingStatus) {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchBookings()
  }

  const today = getTodayString()
  const todayBookings = bookings.filter((b) => b.date === today)
  const pending = bookings.filter((b) => b.status === 'pending')
  const confirmed = bookings.filter((b) => b.status === 'confirmed')

  const filtered =
    filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  return (
    <div className="min-h-screen bg-ink px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{SHOP_NAME}</h1>
            <p className="text-sm text-slate-500">لوحة إدارة الحجوزات</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            تسجيل الخروج
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard label="إجمالي الحجوزات" value={bookings.length} />
          <StatsCard label="اليوم" value={todayBookings.length} accent />
          <StatsCard label="قيد الانتظار" value={pending.length} />
          <StatsCard label="مؤكد" value={confirmed.length} />
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-gradient-to-b from-gold-300 to-gold-400 text-ink'
                  : 'bg-ink-200 text-slate-400 hover:bg-ink-300 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="mr-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBookings}
              loading={loading}
            >
              تحديث
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
            <span className="mr-3">جارٍ التحميل...</span>
          </div>
        ) : (
          <BookingTable
            bookings={filtered}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  )
}
