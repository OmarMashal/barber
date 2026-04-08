'use client'

import Input from '@/components/ui/Input'
import { getMaxBookingDate, getMinBookingDate } from '@/lib/utils'
import type { CalendarDay } from '@/types'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  schedule: CalendarDay[]
  error?: string
}

export default function DatePicker({ value, onChange, schedule, error }: DatePickerProps) {
  // Build a human-readable closed days label from schedule
  const closedDays = schedule
    .filter((d) => !d.is_open)
    .map((d) => d.name_ar)
    .join('، ')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (!raw) { onChange(''); return }

    // Determine day-of-week (0=Sun) of the selected date
    const [y, m, d] = raw.split('-').map(Number)
    const dayOfWeek = new Date(y, m - 1, d).getDay()  // local JS day

    // Check if this day is closed
    const dayConfig = schedule.find((s) => s.day_of_week === dayOfWeek)
    if (dayConfig && !dayConfig.is_open) return  // silently block closed days

    onChange(raw)
  }

  return (
    <Input
      type="date"
      label="اختر التاريخ"
      value={value}
      onChange={handleChange}
      min={getMinBookingDate()}
      max={getMaxBookingDate()}
      error={error}
      hint={closedDays ? `أيام الإغلاق: ${closedDays}` : undefined}
      className="[color-scheme:dark]"
    />
  )
}
