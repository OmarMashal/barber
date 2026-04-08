import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { isValidUUID } from '@/lib/utils'

// PATCH /api/admin/reviews/:id — toggle approval
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
  }

  const body = await request.json()
  if (typeof body.is_approved !== 'boolean') {
    return NextResponse.json({ error: 'is_approved must be a boolean' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('reviews')
    .update({ is_approved: body.is_approved })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/reviews/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.from('reviews').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
