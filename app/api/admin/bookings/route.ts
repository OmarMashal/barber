import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { isValidISO, isValidUUID, getTzOffset } from '@/lib/utils'

// GET /api/admin/bookings?filter=today|upcoming|all
export async function GET(request: NextRequest) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const filter = searchParams.get('filter') ?? 'all'

  const service = createServiceClient()
  let query = service
    .from('bookings')
    .select(`
      id, customer_name, customer_phone,
      service_id, duration, starts_at, ends_at,
      status, notes, created_at, updated_at,
      services ( name, price, color )
    `)
    .order('starts_at', { ascending: true })

  const now = new Date()

  if (filter === 'today') {
    // Build start/end of day in Jerusalem timezone (has DST — offset computed dynamically)
    const today  = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
    const offset = getTzOffset('Asia/Jerusalem', now)
    const start  = new Date(`${today}T00:00:00${offset}`).toISOString()
    const end    = new Date(`${today}T23:59:59${offset}`).toISOString()
    query = query.gte('starts_at', start).lte('starts_at', end)
  } else if (filter === 'upcoming') {
    // Exclude both cancelled and no_show — only actionable future bookings
    query = query
      .gte('starts_at', now.toISOString())
      .not('status', 'in', '(cancelled,no_show)')
  }

  const { data: bookings, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bookings: bookings ?? [] })
}


// POST /api/admin/bookings — manual booking (admin, bypasses min_notice check)
export async function POST(request: NextRequest) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { customer_name, customer_phone, service_id, starts_at, notes } = body

  if (!customer_name?.trim() || !customer_phone?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!service_id || !isValidUUID(service_id)) {
    return NextResponse.json({ error: 'Invalid service_id' }, { status: 400 })
  }
  if (!starts_at || !isValidISO(starts_at)) {
    return NextResponse.json({ error: 'Invalid starts_at timestamp' }, { status: 400 })
  }

  const service = createServiceClient()

  // Fetch service to snapshot duration
  const { data: svc, error: svcErr } = await service
    .from('services')
    .select('id, duration')
    .eq('id', service_id)
    .single()

  if (svcErr || !svc) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  const { data, error } = await service
    .from('bookings')
    .insert({
      customer_name:  customer_name.trim(),
      customer_phone: customer_phone.trim(),
      service_id:     svc.id,
      duration:       svc.duration,
      starts_at,
      notes: notes?.trim() || null,
      status: 'confirmed',  // admin-added bookings auto-confirm
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('DOUBLE_BOOKING')) {
      return NextResponse.json({ error: 'الوقت محجوز مسبقاً', code: 'SLOT_TAKEN' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
