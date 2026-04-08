import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { isValidISO, isValidUUID } from '@/lib/utils'
import type { BookingStatus } from '@/types'

// PATCH /api/admin/bookings/:id
// Body: { status? } | { starts_at? }  (one or both)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 })
  }

  const body: { status?: BookingStatus; starts_at?: string } = await request.json()

  const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'no_show']
  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (body.starts_at !== undefined && !isValidISO(body.starts_at)) {
    return NextResponse.json({ error: 'Invalid starts_at timestamp' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.status    !== undefined) updates.status    = body.status
  if (body.starts_at !== undefined) updates.starts_at = body.starts_at

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('bookings')
    .update(updates)
    .eq('id', id)

  if (error) {
    if (error.message.includes('DOUBLE_BOOKING')) {
      return NextResponse.json(
        { error: 'الوقت الجديد محجوز مسبقاً', code: 'SLOT_TAKEN' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/bookings/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.from('bookings').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
