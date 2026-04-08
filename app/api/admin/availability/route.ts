import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/availability
// Returns: { schedule, settings }
export async function GET() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const [{ data: schedule }, { data: settings }] = await Promise.all([
    service
      .from('calendar_settings')
      .select('*')
      .order('day_of_week'),
    service
      .from('business_settings')
      .select('booking_open, slot_interval_minutes, min_notice_hours, max_advance_days')
      .eq('id', 1)
      .single(),
  ])

  return NextResponse.json({ schedule: schedule ?? [], settings: settings ?? {} })
}

// PUT /api/admin/availability
// Body: {
//   schedule?: [{ day_of_week, is_open, open_time, close_time }],
//   settings?: { booking_open?, slot_interval_minutes?, min_notice_hours?, max_advance_days? }
// }
export async function PUT(request: NextRequest) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { schedule, settings } = body

  const service = createServiceClient()
  const TIME_RE = /^\d{2}:\d{2}$/

  // Batch upsert all days in a single round-trip
  if (Array.isArray(schedule) && schedule.length > 0) {
    const rows = schedule
      .filter((d) => typeof d.day_of_week === 'number')
      .map((d) => ({
        day_of_week: d.day_of_week,
        is_open:     Boolean(d.is_open),
        open_time:   TIME_RE.test(d.open_time)  ? d.open_time  : '09:00',
        close_time:  TIME_RE.test(d.close_time) ? d.close_time : '21:00',
      }))

    if (rows.length > 0) {
      const { error } = await service
        .from('calendar_settings')
        .upsert(rows, { onConflict: 'day_of_week' })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  // Update business_settings
  if (settings && typeof settings === 'object') {
    const allowed = ['booking_open', 'slot_interval_minutes', 'min_notice_hours', 'max_advance_days']
    const filtered = Object.fromEntries(
      Object.entries(settings).filter(([k]) => allowed.includes(k))
    )
    if (Object.keys(filtered).length > 0) {
      const { error } = await service
        .from('business_settings')
        .update(filtered)
        .eq('id', 1)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true })
}
