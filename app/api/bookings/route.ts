import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isValidISO, isValidUUID } from '@/lib/utils'
import {
  sendBookingConfirmationToCustomer,
  sendNewBookingAlertToBarber,
} from '@/lib/sms'

// GET /api/bookings — admin only, returns all bookings with service name
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: bookings, error } = await service
    .from('bookings')
    .select(`
      id,
      customer_name,
      customer_phone,
      service_id,
      duration,
      starts_at,
      ends_at,
      status,
      notes,
      created_at,
      updated_at,
      services ( name, price )
    `)
    .order('starts_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings })
}


// POST /api/bookings — public, creates a new booking
//
// Expected body:
// {
//   customer_name: string
//   customer_phone: string
//   service_id: string (uuid)
//   starts_at: string  (ISO 8601 UTC timestamp — built by client from slot.starts_at)
//   notes?: string
// }
//
// The trigger fn_prevent_double_booking() on the bookings table
// will raise DOUBLE_BOOKING if the slot is taken, even under concurrent load.
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { customer_name, customer_phone, service_id, starts_at, notes } = body

  // Input validation
  if (!customer_name?.trim()) {
    return NextResponse.json({ error: 'customer_name is required' }, { status: 400 })
  }
  if (!customer_phone?.trim()) {
    return NextResponse.json({ error: 'customer_phone is required' }, { status: 400 })
  }
  if (!service_id || !isValidUUID(service_id)) {
    return NextResponse.json({ error: 'Invalid service_id' }, { status: 400 })
  }
  if (!starts_at || !isValidISO(starts_at)) {
    return NextResponse.json({ error: 'Invalid starts_at timestamp' }, { status: 400 })
  }
  // Prevent obviously stale submissions (more than 5 minutes in the past)
  if (new Date(starts_at) < new Date(Date.now() - 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Slot time is in the past', code: 'SLOT_EXPIRED' }, { status: 400 })
  }

  const supabase = await createClient()

  // Check blocked customer before hitting the DB
  const { data: isBlocked } = await supabase.rpc('is_customer_blocked', {
    p_phone: customer_phone.trim(),
  })

  if (isBlocked) {
    return NextResponse.json(
      { error: 'Unable to process booking', code: 'CUSTOMER_BLOCKED' },
      { status: 403 }
    )
  }

  // Fetch service to get duration and name (never trust client-supplied duration)
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name, duration, is_active')
    .eq('id', service_id)
    .eq('is_active', true)
    .single()

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  // Insert — the DB trigger handles double-booking atomically
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_name:  customer_name.trim(),
      customer_phone: customer_phone.trim(),
      service_id:     service.id,
      duration:       service.duration,  // always from DB, not client
      starts_at,
      notes:          notes?.trim() || null,
      status:         'pending',
    })
    .select('id')
    .single()

  if (error) {
    // Trigger raises 'DOUBLE_BOOKING' when slot is taken
    if (error.message.includes('DOUBLE_BOOKING')) {
      return NextResponse.json(
        { error: 'Slot already taken', code: 'SLOT_TAKEN' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Dispatch SMS notifications — fire-and-forget, never block the response
  const smsPayload = {
    customerName:  customer_name.trim(),
    customerPhone: customer_phone.trim(),
    serviceName:   service.name,
    startsAt:      starts_at,
  }
  void Promise.all([
    sendBookingConfirmationToCustomer(smsPayload),
    sendNewBookingAlertToBarber(smsPayload),
  ])

  return NextResponse.json({ id: data.id }, { status: 201 })
}
