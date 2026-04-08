import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/calendar — public, returns weekly schedule
// Used by DatePicker to grey out closed days client-side.
export async function GET() {
  const supabase = await createClient()

  const { data: schedule, error } = await supabase
    .from('calendar_settings')
    .select('day_of_week, name_ar, is_open, open_time, close_time')
    .order('day_of_week', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ schedule: schedule ?? [] })
}
