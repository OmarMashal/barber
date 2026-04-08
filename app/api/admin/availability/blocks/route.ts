import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { isValidISO } from '@/lib/utils'

// GET /api/admin/availability/blocks
export async function GET() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: blocks, error } = await service
    .from('blocked_times')
    .select('id, reason, starts_at, ends_at, is_full_day, created_at')
    .order('starts_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ blocks: blocks ?? [] })
}

// POST /api/admin/availability/blocks
// Body: { reason?, starts_at, ends_at, is_full_day }
export async function POST(request: NextRequest) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { reason, starts_at, ends_at, is_full_day } = body

  if (!starts_at || !isValidISO(starts_at)) {
    return NextResponse.json({ error: 'Invalid starts_at' }, { status: 400 })
  }
  if (!ends_at || !isValidISO(ends_at)) {
    return NextResponse.json({ error: 'Invalid ends_at' }, { status: 400 })
  }
  if (new Date(ends_at) <= new Date(starts_at)) {
    return NextResponse.json({ error: 'ends_at must be after starts_at' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('blocked_times')
    .insert({
      reason:      reason?.trim() || null,
      starts_at,
      ends_at,
      is_full_day: !!is_full_day,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
