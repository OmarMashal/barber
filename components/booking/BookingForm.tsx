'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ServiceCard from './ServiceCard'
import DatePicker from './DatePicker'
import TimeSlotPicker from './TimeSlotPicker'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { cn, isValidILPhone, normalizePhone } from '@/lib/utils'
import type { Service, Slot, CalendarDay } from '@/types'

interface FormErrors {
  customer_name?: string
  customer_phone?: string
  service?: string
  date?: string
  slot?: string
  form?: string
}

export default function BookingForm() {
  const router = useRouter()

  const [services,     setServices]     = useState<Service[]>([])
  const [schedule,     setSchedule]     = useState<CalendarDay[]>([])
  const [slots,        setSlots]        = useState<Slot[]>([])
  const [loadingSvc,   setLoadingSvc]   = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate,    setSelectedDate]    = useState('')
  const [selectedSlot,    setSelectedSlot]    = useState<Slot | null>(null)
  const [customerName,    setCustomerName]    = useState('')
  const [customerPhone,   setCustomerPhone]   = useState('')
  const [notes,           setNotes]           = useState('')
  const [errors,          setErrors]          = useState<FormErrors>({})
  const [submitting,      setSubmitting]      = useState(false)

  useEffect(() => {
    async function load() {
      const [svcRes, calRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/calendar'),
      ])
      const svcData = await svcRes.json()
      const calData = await calRes.json()
      setServices(svcData.services ?? [])
      setSchedule(calData.schedule ?? [])
      setLoadingSvc(false)
    }
    load()
  }, [])

  const fetchSlots = useCallback(async (date: string, service: Service) => {
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlot(null)
    try {
      const res = await fetch(
        `/api/bookings/available?date=${date}&serviceId=${service.id}`
      )
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  function clearError(key: keyof FormErrors) {
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleServiceSelect(service: Service) {
    setSelectedService(service)
    setSelectedSlot(null)
    setSlots([])
    clearError('service')
    if (selectedDate) fetchSlots(selectedDate, service)
  }

  function handleDateChange(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setSlots([])
    clearError('date')
    if (date && selectedService) fetchSlots(date, selectedService)
  }

  function handleSlotSelect(slot: Slot) {
    setSelectedSlot(slot)
    clearError('slot')
  }

  function validate(): boolean {
    const next: FormErrors = {}
    if (!customerName.trim())  next.customer_name  = 'الاسم مطلوب'
    if (!customerPhone.trim()) next.customer_phone = 'رقم الجوال مطلوب'
    else if (!isValidILPhone(customerPhone.trim()))
      next.customer_phone = 'رقم جوال غير صحيح (مثال: 0501234567)'
    if (!selectedService) next.service = 'اختر خدمة'
    if (!selectedDate)    next.date    = 'اختر تاريخاً'
    if (!selectedSlot)    next.slot    = 'اختر وقتاً'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !selectedSlot || !selectedService) return

    setSubmitting(true)
    setErrors({})

    try {
      const res = await fetch('/api/bookings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:  customerName.trim(),
          customer_phone: normalizePhone(customerPhone.trim()),
          service_id:     selectedService.id,
          starts_at:      selectedSlot.starts_at,
          notes:          notes.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'SLOT_TAKEN') {
          setErrors({ slot: 'هذا الوقت محجوز، اختر وقتاً آخر' })
          fetchSlots(selectedDate, selectedService)
          return
        }
        if (data.code === 'CUSTOMER_BLOCKED') {
          setErrors({ form: 'لا يمكن إتمام الحجز. تواصل معنا للمساعدة.' })
          return
        }
        throw new Error(data.error ?? 'فشل الحجز')
      }

      router.push(`/booking/confirmation?id=${data.id}`)
    } catch {
      setErrors({ form: 'حدث خطأ غير متوقع، حاول مجدداً.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10">

      {/* ── Step 1 — Service ─────────────────────────────── */}
      <section className="space-y-4">
        <StepHeading number={1} label="اختر الخدمة" done={!!selectedService} />

        {loadingSvc ? (
          <SkeletonGrid />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {services.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                selected={selectedService?.id === svc.id}
                onSelect={handleServiceSelect}
              />
            ))}
          </div>
        )}
        {errors.service && <FieldError msg={errors.service} />}
      </section>

      {/* ── Step 2 — Date & Time ─────────────────────────── */}
      <section className="space-y-4">
        <StepHeading number={2} label="اختر الموعد" done={!!selectedSlot} />

        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          schedule={schedule}
          error={errors.date}
        />

        {selectedDate && selectedService && (
          <div className="animate-slide-up">
            {loadingSlots ? (
              <div className="flex items-center gap-2.5 text-sm text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
                جارٍ تحميل المواعيد...
              </div>
            ) : (
              <TimeSlotPicker
                slots={slots}
                selectedStartsAt={selectedSlot?.starts_at ?? ''}
                onChange={handleSlotSelect}
                error={errors.slot}
              />
            )}
          </div>
        )}

        {selectedDate && !selectedService && (
          <p className="text-sm text-slate-600">اختر الخدمة أولاً لعرض المواعيد</p>
        )}
      </section>

      {/* ── Step 3 — Personal info ───────────────────────── */}
      <section className="space-y-4">
        <StepHeading number={3} label="بياناتك" done={false} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="الاسم الكامل"
            placeholder="أحمد محمد"
            value={customerName}
            onChange={(e) => { setCustomerName(e.target.value); clearError('customer_name') }}
            error={errors.customer_name}
            autoComplete="name"
          />
          <Input
            label="رقم الجوال"
            placeholder="0501234567"
            type="tel"
            value={customerPhone}
            onChange={(e) => { setCustomerPhone(e.target.value); clearError('customer_phone') }}
            error={errors.customer_phone}
            autoComplete="tel"
            dir="ltr"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">
            ملاحظات <span className="text-slate-600">(اختياري)</span>
          </label>
          <textarea
            rows={3}
            placeholder="أي تعليمات أو طلبات خاصة..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full resize-none rounded-xl border border-ink-400 bg-ink-50 px-4 py-3
                       text-white placeholder-slate-600 transition-colors duration-200
                       hover:border-ink-500 focus:border-gold-400/60 focus:outline-none
                       focus:ring-2 focus:ring-gold-400/30"
          />
        </div>
      </section>

      {/* ── Summary strip ────────────────────────────────── */}
      {selectedService && selectedSlot && (
        <div className="animate-slide-up rounded-xl border border-gold-400/20 bg-gold-400/5 px-4 py-3.5 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-300">
            <span>
              <span className="text-slate-500">الخدمة: </span>
              {selectedService.name}
            </span>
            <span>
              <span className="text-slate-500">المدة: </span>
              {selectedService.duration} دقيقة
            </span>
            <span>
              <span className="text-slate-500">السعر: </span>
              <span className="font-semibold text-gold-400">₪{selectedService.price}</span>
            </span>
          </div>
        </div>
      )}

      {/* ── Form-level error ─────────────────────────────── */}
      {errors.form && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
          {errors.form}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        loading={submitting}
        disabled={!selectedService || !selectedSlot}
        className="w-full"
      >
        تأكيد الحجز
      </Button>
    </form>
  )
}

// ── Sub-components ────────────────────────────────────────────

function StepHeading({ number, label, done }: { number: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300',
          done
            ? 'bg-gold-400 text-ink'
            : 'bg-ink-300 border border-ink-500 text-slate-400'
        )}
      >
        {done ? '✓' : number}
      </span>
      <h2 className={cn('text-lg font-semibold', done ? 'text-white' : 'text-slate-200')}>
        {label}
      </h2>
    </div>
  )
}

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-red-400">{msg}</p>
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl border border-ink-400 bg-ink-200"
        />
      ))}
    </div>
  )
}
