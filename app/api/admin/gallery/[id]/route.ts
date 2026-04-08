import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { isValidUUID } from '@/lib/utils'

// DELETE /api/admin/gallery/:id
// Also removes the file from Supabase Storage
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const service = createServiceClient()

  // Fetch the record to get storage_path for cleanup
  const { data: image } = await service
    .from('gallery_images')
    .select('storage_path')
    .eq('id', id)
    .single()

  // Delete from Storage (best-effort — don't fail the request if this errors)
  if (image?.storage_path) {
    await service.storage.from('gallery').remove([image.storage_path])
  }

  // Delete DB record
  const { error } = await service.from('gallery_images').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
