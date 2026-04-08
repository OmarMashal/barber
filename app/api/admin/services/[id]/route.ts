import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { isValidUUID } from '@/lib/utils'

// PATCH /api/admin/services/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid service id' }, { status: 400 })
  }

  const body = await request.json()
  const allowed = ['name', 'description', 'duration', 'price', 'color', 'is_active', 'sort_order']
  const updates: Record<string, unknown> = {}

  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (updates.name)                         updates.name     = (updates.name as string).trim()
  if (updates.duration !== undefined)       updates.duration = Number(updates.duration)
  if (updates.price    !== undefined)       updates.price    = Number(updates.price)
  if (updates.sort_order !== undefined)     updates.sort_order = Number(updates.sort_order)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.from('services').update(updates).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/services/:id
// Soft-delete: marks inactive rather than hard-deleting (preserves booking history)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid service id' }, { status: 400 })
  }

  const service = createServiceClient()

  // Check if any non-cancelled/no_show bookings reference this service.
  // Note: PostgREST 'in' filter uses unquoted values: (val1,val2)
  const { data: active } = await service
    .from('bookings')
    .select('id')
    .eq('service_id', id)
    .not('status', 'in', '(cancelled,no_show)')
    .limit(1)

  if (active && active.length > 0) {
    // Soft-delete: just deactivate so existing bookings remain valid
    const { error } = await service
      .from('services')
      .update({ is_active: false })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ soft: true, message: 'تم تعطيل الخدمة (يوجد حجوزات نشطة)' })
  }

  // Hard delete when safe
  const { error } = await service.from('services').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
