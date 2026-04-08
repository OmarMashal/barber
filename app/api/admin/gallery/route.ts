import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/gallery — all images (including inactive)
export async function GET() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: images, error } = await service
    .from('gallery_images')
    .select('id, storage_path, url, alt_text, sort_order, is_active, created_at')
    .order('sort_order')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ images: images ?? [] })
}

// POST /api/admin/gallery — save image record after client uploads to Storage
// Body: { storage_path, url, alt_text? }
export async function POST(request: NextRequest) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { storage_path, url, alt_text } = body

  if (!storage_path || !url) {
    return NextResponse.json({ error: 'storage_path and url required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('gallery_images')
    .insert({
      storage_path,
      url,
      alt_text: alt_text?.trim() || null,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
