'use client'

import { useCallback, useEffect, useState } from 'react'
import { Modal, ModalInput, ModalFooter } from '@/components/admin/Modal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { cn, formatDate, formatTime, getStatusColor, getStatusLabel, getTzOffset } from '@/lib/utils'
import { bookingsApi, servicesApi, type BookingWithService } from '@/lib/api'
import type { BookingStatus, Service } from '@/types'

type Filter = 'today' | 'upcoming' | 'all'

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [bookings,      setBookings]      = useState<BookingWithService[]>([])
  const [filter,        setFilter]        = useState<Filter>('today')
  const [loading,       setLoading]       = useState(true)
  const [services,      setServices]      = useState<Service[]>([])
  const [actionError,   setActionError]   = useState('')

  const [showAdd,       setShowAdd]       = useState(false)
  const [reschedule,    setReschedule]    = useState<BookingWithService | null>(null)
  const [confirm,       setConfirm]       = useState<{ id: string; action: 'cancel' | 'delete' } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // ── Fetch bookings ─────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setActionError('')
    const { data } = await bookingsApi.list(filter)
    setBookings(data?.bookings ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    servicesApi.list().then(({ data }) => setServices(data?.services ?? []))
  }, [])

  // ── Status update — returns true on success ────────────────
  async function updateStatus(id: string, status: BookingStatus): Promise<boolean> {
    const { error } = await bookingsApi.update(id, { status })
    if (error) { setActionError(error); return false }
    return true
  }

  // ── Confirm dialog handler ─────────────────────────────────
  async function handleConfirm() {
    if (!confirm) return
    setActionLoading(true)
    setActionError('')

    let ok = false
    if (confirm.action === 'cancel') {
      ok = await updateStatus(confirm.id, 'cancelled')
    } else {
      const { error } = await bookingsApi.delete(confirm.id)
      ok = !error
      if (error) setActionError(error)
    }

    setConfirm(null)
    setActionLoading(false)
    if (ok) load()
  }

  // ── Direct status actions ──────────────────────────────────
  async function handleStatusAction(id: string, status: BookingStatus) {
    setActionLoading(true)
    setActionError('')
    const ok = await updateStatus(id, status)
    setActionLoading(false)
    if (ok) load()
  }

  const pending   = bookings.filter((b) => b.status === 'pending').length
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length

  return (
    <>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">الحجوزات</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-gold-300 to-gold-400
                     px-4 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
        >
          + إضافة حجز
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: 'الكل',         value: bookings.length, accent: false },
          { label: 'قيد الانتظار', value: pending,         accent: true  },
          { label: 'مؤكد',         value: confirmed,       accent: false },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-ink-400 bg-ink-100/60 p-3 text-center">
            <p className={`text-2xl font-bold ${s.accent ? 'text-gold-400' : 'text-white'}`}>
              {s.value}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {([
          { value: 'today',    label: 'اليوم'   },
          { value: 'upcoming', label: 'القادمة' },
          { value: 'all',      label: 'الجميع'  },
        ] as { value: Filter; label: string }[]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-gold-400 text-ink'
                : 'bg-ink-200 text-slate-400 hover:bg-ink-300 hover:text-white'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Action error */}
      {actionError && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      )}

      {/* Booking list */}
      {loading ? (
        <PageSkeleton />
      ) : bookings.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              disabled={actionLoading}
              onConfirm={() => handleStatusAction(b.id, 'confirmed')}
              onCancel={() => setConfirm({ id: b.id, action: 'cancel' })}
              onDelete={() => setConfirm({ id: b.id, action: 'delete' })}
              onReschedule={() => setReschedule(b)}
              onNoShow={() => handleStatusAction(b.id, 'no_show')}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <ManualBookingModal
          services={services}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load() }}
        />
      )}

      {reschedule && (
        <RescheduleModal
          booking={reschedule}
          onClose={() => setReschedule(null)}
          onSaved={() => { setReschedule(null); load() }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'cancel' ? 'إلغاء الحجز؟' : 'حذف الحجز؟'}
          message={
            confirm.action === 'cancel'
              ? 'سيتم إلغاء هذا الحجز ولن يُحتسب في المواعيد.'
              : 'سيتم حذف الحجز نهائياً ولا يمكن التراجع.'
          }
          confirmLabel={confirm.action === 'cancel' ? 'نعم، ألغِ الحجز' : 'نعم، احذف'}
          loading={actionLoading}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// BookingCard
// ─────────────────────────────────────────────────────────────
function BookingCard({
  booking: b, disabled,
  onConfirm, onCancel, onDelete, onReschedule, onNoShow,
}: {
  booking: BookingWithService
  disabled: boolean
  onConfirm: () => void
  onCancel: () => void
  onDelete: () => void
  onReschedule: () => void
  onNoShow: () => void
}) {
  return (
    <div className="rounded-2xl border border-ink-400 bg-ink-100/60 p-4">
      {/* Time + status */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-white">{formatTime(b.starts_at)}</p>
          <p className="text-xs text-slate-500">{formatDate(b.starts_at)}</p>
        </div>
        <span className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
          getStatusColor(b.status)
        )}>
          {getStatusLabel(b.status)}
        </span>
      </div>

      {/* Customer */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-300 text-sm font-bold text-gold-400">
          {b.customer_name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">{b.customer_name}</p>
          <a href={`tel:${b.customer_phone}`} className="text-sm text-gold-400 hover:underline" dir="ltr">
            {b.customer_phone}
          </a>
        </div>
      </div>

      {/* Service */}
      <div className="mt-3 flex items-center gap-2">
        {b.services?.color && (
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.services.color }} />
        )}
        <span className="text-sm text-slate-300">{b.services?.name ?? '—'}</span>
        <span className="text-slate-600">·</span>
        <span className="text-sm text-slate-500">{b.duration} دقيقة</span>
      </div>

      {b.notes && (
        <p className="mt-2 rounded-lg bg-ink-300/60 px-3 py-1.5 text-xs text-slate-400">{b.notes}</p>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {b.status === 'pending' && (
          <ActionBtn onClick={onConfirm} disabled={disabled} color="green" label="✓ تأكيد" />
        )}
        {b.status !== 'cancelled' && b.status !== 'no_show' && (
          <ActionBtn onClick={onReschedule} disabled={disabled} color="blue" label="↗ تعديل الوقت" />
        )}
        {b.status !== 'cancelled' && b.status !== 'no_show' && (
          <ActionBtn onClick={onCancel} disabled={disabled} color="red" label="✕ إلغاء" />
        )}
        {b.status === 'confirmed' && (
          <ActionBtn onClick={onNoShow} disabled={disabled} color="gray" label="غياب" />
        )}
        <ActionBtn onClick={onDelete} disabled={disabled} color="ghost" label="حذف" />
      </div>
    </div>
  )
}

type ActionColor = 'green' | 'red' | 'blue' | 'gray' | 'ghost'

const ACTION_STYLES: Record<ActionColor, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  red:   'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20',
  blue:  'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
  gray:  'bg-ink-300/50 text-slate-400 border-ink-500 hover:bg-ink-400',
  ghost: 'text-slate-600 border-transparent hover:text-red-400',
}

function ActionBtn({ onClick, disabled, color, label }: {
  onClick: () => void; disabled: boolean; color: ActionColor; label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40',
        ACTION_STYLES[color]
      )}
    >
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// ManualBookingModal
// ─────────────────────────────────────────────────────────────
function ManualBookingModal({
  services, onClose, onSaved,
}: {
  services: Service[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '',
    service_id: '', date: '', time: '', notes: '',
  })
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { customer_name, customer_phone, service_id, date, time } = form
    if (!customer_name || !customer_phone || !service_id || !date || !time) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    const offset = getTzOffset('Asia/Jerusalem', new Date(`${date}T12:00:00Z`))
    const starts_at = new Date(`${date}T${time}:00${offset}`).toISOString()

    setSaving(true)
    setError('')
    const { error: apiError, code } = await bookingsApi.create({
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      service_id,
      starts_at,
      notes: form.notes || undefined,
    })
    setSaving(false)

    if (apiError) {
      setError(code === 'SLOT_TAKEN' ? 'هذا الوقت محجوز مسبقاً' : apiError)
      return
    }
    onSaved()
  }

  const activeServices = services.filter((s) => s.is_active !== false)

  return (
    <Modal title="إضافة حجز يدوي" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ModalInput label="اسم العميل *" value={form.customer_name} onChange={(v) => set('customer_name', v)} placeholder="أحمد محمد" />
        <ModalInput label="رقم الجوال *" value={form.customer_phone} onChange={(v) => set('customer_phone', v)} placeholder="0501234567" dir="ltr" type="tel" />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">الخدمة *</label>
          <select
            value={form.service_id}
            onChange={(e) => set('service_id', e.target.value)}
            className="w-full rounded-xl border border-ink-400 bg-ink-50 px-4 py-3 text-white
                       focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/30"
          >
            <option value="">اختر الخدمة</option>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.duration} دقيقة</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ModalInput label="التاريخ *" type="date" value={form.date} onChange={(v) => set('date', v)} />
          <ModalInput label="الوقت *"   type="time" value={form.time} onChange={(v) => set('time', v)} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">ملاحظات</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="w-full resize-none rounded-xl border border-ink-400 bg-ink-50 px-4 py-3
                       text-white placeholder-slate-600
                       focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/30"
            placeholder="أي ملاحظات..."
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <ModalFooter saving={saving} onClose={onClose} label="إضافة الحجز" />
      </form>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────
// RescheduleModal
// ─────────────────────────────────────────────────────────────
function RescheduleModal({
  booking, onClose, onSaved,
}: {
  booking: BookingWithService
  onClose: () => void
  onSaved: () => void
}) {
  const localDate = new Date(booking.starts_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
  const localTime = new Date(booking.starts_at).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem',
  })

  const [date,   setDate]   = useState(localDate)
  const [time,   setTime]   = useState(localTime)
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !time) { setError('يرجى اختيار تاريخ ووقت'); return }

    const offset = getTzOffset('Asia/Jerusalem', new Date(`${date}T12:00:00Z`))
    const starts_at = new Date(`${date}T${time}:00${offset}`).toISOString()
    setSaving(true)
    const { error: apiError, code } = await bookingsApi.update(booking.id, { starts_at })
    setSaving(false)

    if (apiError) {
      setError(code === 'SLOT_TAKEN' ? 'هذا الوقت محجوز مسبقاً' : apiError)
      return
    }
    onSaved()
  }

  return (
    <Modal title={`تعديل موعد — ${booking.customer_name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="rounded-xl bg-ink-300 px-4 py-2.5 text-sm text-slate-300">
          الموعد الحالي:{' '}
          <span className="text-white">{formatTime(booking.starts_at)}</span>
          {' · '}
          <span className="text-white">{formatDate(booking.starts_at)}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ModalInput label="التاريخ الجديد" type="date" value={date} onChange={setDate} />
          <ModalInput label="الوقت الجديد"   type="time" value={time} onChange={setTime} />
        </div>
        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <ModalFooter saving={saving} onClose={onClose} label="حفظ الموعد الجديد" />
      </form>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────
// Skeletons / empty states
// ─────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-ink-400 bg-ink-200" />
      ))}
    </div>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="rounded-2xl border border-ink-400 bg-ink-100/40 py-16 text-center">
      <p className="text-4xl">📅</p>
      <p className="mt-3 text-slate-500">
        {filter === 'today' ? 'لا توجد حجوزات اليوم' : 'لا توجد حجوزات'}
      </p>
    </div>
  )
}
