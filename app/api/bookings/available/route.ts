import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/bookings/available?date=YYYY-MM-DD&serviceId=<uuid>
//
// Delegates entirely to the get_available_slots() Postgres function.
// That function handles:
//   - is the day open? (calendar_settings)
//   - any full-day blocks? (blocked_times)
//   - any active booking overlaps? (bookings)
//   - any partial blocked_time overlaps?
//   - is the slot before the min-notice cutoff?
//
// Returns the full slot list with is_available on each entry
// so the UI can render taken slots as greyed-out (not invisible).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const date      = searchParams.get('date')
  const serviceId = searchParams.get('serviceId')

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid or missing date (YYYY-MM-DD)' }, { status: 400 })
  }

  if (!serviceId) {
    return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 })
  }

  const supabase = await createClient()

  // Call the Postgres function directly
  const { data: slots, error } = await supabase.rpc('get_available_slots', {
    p_date:       date,
    p_service_id: serviceId,
  })

  if (error) {
    // SERVICE_NOT_FOUND is a known user error
    if (error.message.includes('SERVICE_NOT_FOUND')) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ slots: slots ?? [] })
}
