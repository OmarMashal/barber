import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/services — returns all (including inactive)
export async function GET() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: services, error } = await service
    .from('services')
    .select('*')
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ services: services ?? [] })
}

// POST /api/admin/services — create new service
export async function POST(request: NextRequest) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, duration, price, color, is_active, sort_order } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }
  const dur = Number(duration)
  if (!dur || dur <= 0 || !Number.isInteger(dur)) {
    return NextResponse.json({ error: 'Duration must be a positive integer (minutes)' }, { status: 400 })
  }
  const prc = Number(price)
  if (isNaN(prc) || prc < 0) {
    return NextResponse.json({ error: 'Price must be a non-negative number' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('services')
    .insert({
      name:        name.trim(),
      description: description?.trim() || null,
      duration:    dur,
      price:       prc,
      color:       color || '#d4a843',
      is_active:   is_active !== false,
      sort_order:  Number(sort_order) || 0,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
