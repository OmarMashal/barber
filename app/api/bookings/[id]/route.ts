import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { isValidUUID } from '@/lib/utils'
import type { BookingStatus } from '@/types'

// PATCH /api/bookings/:id — admin only, update status
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

  const { status }: { status: BookingStatus } = await request.json()

  const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'no_show']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('bookings')
    .update({ status })
    .eq('id', id)

  if (error) {
    // Trigger fires if admin tries to re-activate a cancelled booking into a taken slot
    if (error.message.includes('DOUBLE_BOOKING')) {
      return NextResponse.json(
        { error: 'Cannot re-activate: slot is already taken', code: 'SLOT_TAKEN' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
