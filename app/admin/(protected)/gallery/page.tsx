'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'
import { galleryApi } from '@/lib/api'
import type { GalleryImage } from '@/lib/api'

const BUCKET = 'gallery'

export default function GalleryPage() {
  const [images,    setImages]    = useState<GalleryImage[]>([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteId,  setDeleteId]  = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)
  const [error,     setError]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await galleryApi.list()
    setImages(data?.images ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Upload ────────────────────────────────────────────────
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const invalid = files.filter((f) => !f.type.startsWith('image/'))
    if (invalid.length > 0) { setError('يرجى اختيار صور فقط'); return }

    const oversized = files.filter((f) => f.size > 5 * 1024 * 1024)
    if (oversized.length > 0) { setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت'); return }

    setError('')
    setUploading(true)
    const supabase = createClient()

    for (const file of files) {
      const ext  = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadErr) {
        setError(`فشل رفع ${file.name}: ${uploadErr.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
      await galleryApi.save({ storage_path: path, url: publicUrl })
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    await load()
  }

  // ── Delete ────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await galleryApi.delete(deleteId)
    setDeleting(false)
    setDeleteId(null)
    await load()
  }

  // ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">المعرض</h1>
        <div className="flex items-center gap-3">
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
              جارٍ الرفع...
            </div>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl bg-gradient-to-b from-gold-300 to-gold-400 px-4 py-2.5
                       text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            + رفع صور
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Setup note */}
      <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-400">
        💡 تأكد من إنشاء bucket باسم &ldquo;gallery&rdquo; في Supabase Storage وجعله عاماً (Public).
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500/60 hover:text-red-400">✕</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-ink-200" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-400 py-20 text-center transition-colors hover:border-gold-400/50"
          onClick={() => inputRef.current?.click()}
        >
          <p className="text-4xl">🖼️</p>
          <p className="mt-3 text-slate-400">لا توجد صور</p>
          <p className="mt-1 text-sm text-slate-600">اضغط لرفع صور</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-ink-400 bg-ink-200">
              <Image
                src={img.url}
                alt={img.alt_text ?? ''}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/50">
                <button
                  onClick={() => setDeleteId(img.id)}
                  className="scale-75 rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}

          {/* Upload tile */}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-400 text-slate-600 transition-colors hover:border-gold-400/50 hover:text-gold-400 disabled:opacity-50"
          >
            <span className="text-3xl">+</span>
            <span className="mt-1 text-xs">رفع</span>
          </button>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="حذف الصورة؟"
          message="سيتم حذف الصورة نهائياً من المعرض."
          confirmLabel="نعم، احذف"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
