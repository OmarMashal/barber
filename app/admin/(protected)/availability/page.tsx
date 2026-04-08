'use client'

import { useCallback, useEffect, useState } from 'react'
import Toggle from '@/components/ui/Toggle'
import Select from '@/components/ui/Select'
import { Modal, ModalFooter } from '@/components/admin/Modal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { cn, formatBlockDate, formatBlockTime, getTzOffset } from '@/lib/utils'
import { availabilityApi, type DaySchedule, type AvailabilitySettings, type BlockedTime } from '@/lib/api'

// ─────────────────────────────────────────────────────────────

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day_of_week: 0, name_ar: 'الأحد',    is_open: true,  open_time: '09:00', close_time: '21:00' },
  { day_of_week: 1, name_ar: 'الاثنين',  is_open: true,  open_time: '09:00', close_time: '21:00' },
  { day_of_week: 2, name_ar: 'الثلاثاء', is_open: true,  open_time: '09:00', close_time: '21:00' },
  { day_of_week: 3, name_ar: 'الأربعاء', is_open: true,  open_time: '09:00', close_time: '21:00' },
  { day_of_week: 4, name_ar: 'الخميس',   is_open: true,  open_time: '09:00', close_time: '21:00' },
  { day_of_week: 5, name_ar: 'الجمعة',   is_open: false, open_time: '14:00', close_time: '21:00' },
  { day_of_week: 6, name_ar: 'السبت',    is_open: true,  open_time: '09:00', close_time: '21:00' },
]

const DEFAULT_SETTINGS: AvailabilitySettings = {
  booking_open: true, slot_interval_minutes: 30, min_notice_hours: 1,
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function AvailabilityPage() {
  const [schedule,     setSchedule]     = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [settings,     setSettings]     = useState<AvailabilitySettings>(DEFAULT_SETTINGS)
  const [blocks,       setBlocks]       = useState<BlockedTime[]>([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [showBlock,    setShowBlock]    = useState(false)
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── Load ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    const [avResult, blResult] = await Promise.all([
      availabilityApi.get(),
      availabilityApi.blocks.list(),
    ])

    if (avResult.data) {
      // Merge DB rows with defaults for any missing days
      const merged = DEFAULT_SCHEDULE.map((def) => {
        const db = avResult.data!.schedule.find((d) => d.day_of_week === def.day_of_week)
        return db ?? def
      })
      setSchedule(merged)
      setSettings({ ...DEFAULT_SETTINGS, ...avResult.data.settings })
    }
    if (blResult.data) setBlocks(blResult.data.blocks)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Update a single day field ─────────────────────────────
  function updateDay(index: number, key: keyof DaySchedule, value: unknown) {
    setSchedule((prev) => prev.map((d, i) => i === index ? { ...d, [key]: value } : d))
    setSaved(false)
  }

  // ── Save schedule + settings ──────────────────────────────
  async function save() {
    setSaving(true)
    await availabilityApi.save(schedule, settings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── Delete a block ────────────────────────────────────────
  async function handleDeleteBlock() {
    if (!deleteBlockId) return
    setDeleting(true)
    await availabilityApi.blocks.delete(deleteBlockId)
    setDeleting(false)
    setDeleteBlockId(null)
    await load()
  }

  // ─────────────────────────────────────────────────────────
  if (loading) return <PageSkeleton />

  return (
    <>
      <h1 className="mb-6 text-xl font-bold text-white">أوقات العمل</h1>

      {/* ── Global booking toggle ─────────────────────────── */}
      <section className="mb-5 rounded-2xl border border-ink-400 bg-ink-100/60 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">قبول الحجوزات</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {settings.booking_open ? 'الحجوزات مفتوحة للعملاء' : 'الحجوزات مغلقة مؤقتاً'}
            </p>
          </div>
          <Toggle
            value={settings.booking_open}
            onChange={(v) => setSettings((p) => ({ ...p, booking_open: v }))}
          />
        </div>
      </section>

      {/* ── Slot & notice settings ────────────────────────── */}
      <section className="mb-5 rounded-2xl border border-ink-400 bg-ink-100/60 p-5">
        <p className="mb-4 font-semibold text-white">إعدادات المواعيد</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="مدة الفترة (دقائق)"
            value={settings.slot_interval_minutes}
            onChange={(e) => setSettings((p) => ({ ...p, slot_interval_minutes: Number(e.target.value) }))}
          >
            {[15, 20, 30, 45, 60].map((v) => (
              <option key={v} value={v}>{v} دقيقة</option>
            ))}
          </Select>
          <Select
            label="الحجز المسبق (ساعات)"
            value={settings.min_notice_hours}
            onChange={(e) => setSettings((p) => ({ ...p, min_notice_hours: Number(e.target.value) }))}
          >
            {[0, 1, 2, 3, 6, 12, 24].map((v) => (
              <option key={v} value={v}>{v === 0 ? 'بدون حد أدنى' : `${v} ساعة`}</option>
            ))}
          </Select>
        </div>
      </section>

      {/* ── Weekly schedule ───────────────────────────────── */}
      <section className="mb-5">
        <p className="mb-3 font-semibold text-white">جدول الأسبوع</p>
        <div className="space-y-2">
          {schedule.map((day, i) => (
            <div
              key={day.day_of_week}
              className={cn(
                'rounded-xl border p-4 transition-colors',
                day.is_open ? 'border-ink-400 bg-ink-100/60' : 'border-ink-300 bg-ink-100/30'
              )}
            >
              <div className="flex items-center gap-4">
                <Toggle
                  value={day.is_open}
                  onChange={(v) => updateDay(i, 'is_open', v)}
                />
                <span className={cn('w-20 text-sm font-medium', day.is_open ? 'text-white' : 'text-slate-600')}>
                  {day.name_ar}
                </span>
                {day.is_open ? (
                  <div className="flex flex-1 items-center gap-2">
                    <TimeInput
                      value={day.open_time}
                      onChange={(v) => updateDay(i, 'open_time', v)}
                      label="من"
                    />
                    <span className="text-slate-600">—</span>
                    <TimeInput
                      value={day.close_time}
                      onChange={(v) => updateDay(i, 'close_time', v)}
                      label="إلى"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-slate-600">مغلق</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={save}
        disabled={saving}
        className={cn(
          'mb-8 w-full rounded-xl py-3 text-sm font-semibold transition-all',
          saved
            ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
            : 'bg-gradient-to-b from-gold-300 to-gold-400 text-ink hover:opacity-90',
          saving && 'opacity-60'
        )}
      >
        {saving ? 'جارٍ الحفظ...' : saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
      </button>

      {/* ── Blocked times ─────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-white">أوقات الإغلاق</p>
          <button
            onClick={() => setShowBlock(true)}
            className="rounded-xl border border-ink-500 bg-ink-200 px-4 py-2 text-sm text-slate-300
                       transition-colors hover:bg-ink-300 hover:text-white"
          >
            + إضافة
          </button>
        </div>

        {blocks.length === 0 ? (
          <div className="rounded-xl border border-ink-400 bg-ink-100/30 py-8 text-center text-sm text-slate-600">
            لا توجد أوقات مغلقة مضافة
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-ink-400 bg-ink-100/60 p-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    {b.is_full_day ? '🔒 يوم كامل' : formatBlockTime(b.starts_at, b.ends_at)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatBlockDate(b.starts_at)}{b.reason ? ` · ${b.reason}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteBlockId(b.id)}
                  className="me-3 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-400
                             transition-colors hover:bg-red-500/10"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Add block modal ───────────────────────────────── */}
      {showBlock && (
        <AddBlockModal
          onClose={() => setShowBlock(false)}
          onSaved={() => { setShowBlock(false); load() }}
        />
      )}

      {/* ── Delete block confirm ──────────────────────────── */}
      {deleteBlockId && (
        <ConfirmDialog
          title="حذف وقت الإغلاق؟"
          message="سيتم إزالة هذا الوقت المغلق وستظهر فتراته متاحة للحجز."
          confirmLabel="نعم، احذف"
          loading={deleting}
          onConfirm={handleDeleteBlock}
          onCancel={() => setDeleteBlockId(null)}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// AddBlockModal
// ─────────────────────────────────────────────────────────────
function AddBlockModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [isFullDay,  setIsFullDay]  = useState(false)
  const [date,       setDate]       = useState('')
  const [startTime,  setStartTime]  = useState('12:00')
  const [endTime,    setEndTime]    = useState('13:00')
  const [reason,     setReason]     = useState('')
  const [error,      setError]      = useState('')
  const [saving,     setSaving]     = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) { setError('يرجى اختيار التاريخ'); return }

    const offset = getTzOffset('Asia/Jerusalem', new Date(`${date}T12:00:00Z`))
    const starts_at = isFullDay
      ? new Date(`${date}T00:00:00${offset}`).toISOString()
      : new Date(`${date}T${startTime}:00${offset}`).toISOString()
    const ends_at = isFullDay
      ? new Date(`${date}T23:59:59${offset}`).toISOString()
      : new Date(`${date}T${endTime}:00${offset}`).toISOString()

    if (new Date(ends_at) <= new Date(starts_at)) {
      setError('وقت الانتهاء يجب أن يكون بعد وقت البداية')
      return
    }

    setSaving(true)
    const { error: apiError } = await availabilityApi.blocks.create({
      reason: reason || undefined, starts_at, ends_at, is_full_day: isFullDay,
    })
    setSaving(false)
    if (apiError) { setError('فشل الحفظ'); return }
    onSaved()
  }

  return (
    <Modal title="إضافة وقت مغلق" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {/* Full day toggle */}
        <div className="flex items-center justify-between rounded-xl border border-ink-400 bg-ink-200/50 px-4 py-3">
          <span className="text-sm text-slate-300">إغلاق يوم كامل</span>
          <Toggle value={isFullDay} onChange={setIsFullDay} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">التاريخ *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-ink-400 bg-ink-50 px-4 py-3 text-white
                       focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/30
                       [color-scheme:dark]"
          />
        </div>

        {!isFullDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">من</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-ink-400 bg-ink-50 px-4 py-3 text-white
                           focus:border-gold-400/60 focus:outline-none [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">إلى</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-ink-400 bg-ink-50 px-4 py-3 text-white
                           focus:border-gold-400/60 focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm text-slate-400">السبب (اختياري)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: إجازة، صيانة..."
            className="w-full rounded-xl border border-ink-400 bg-ink-50 px-4 py-3 text-white
                       placeholder-slate-600 focus:border-gold-400/60 focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <ModalFooter saving={saving} onClose={onClose} label="إضافة" />
      </form>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────
function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-600">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-ink-400 bg-ink-200 px-2 py-1 text-sm text-white
                   focus:border-gold-400/60 focus:outline-none [color-scheme:dark]"
      />
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl border border-ink-400 bg-ink-200" />
      ))}
    </div>
  )
}
