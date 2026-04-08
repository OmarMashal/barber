'use client'

import { useCallback, useEffect, useState } from 'react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import StatsCard from '@/components/admin/StatsCard'
import { reviewsApi } from '@/lib/api'
import type { Review } from '@/lib/api'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'pending' | 'approved'

export default function ReviewsPage() {
  const [reviews,   setReviews]   = useState<Review[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<Filter>('all')
  const [deleteId,  setDeleteId]  = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)
  const [toggling,  setToggling]  = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await reviewsApi.list()
    setReviews(data?.reviews ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleApproval(id: string, current: boolean) {
    setToggling(id)
    await reviewsApi.toggleApproval(id, !current)
    await load()
    setToggling(null)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await reviewsApi.delete(deleteId)
    setDeleting(false)
    setDeleteId(null)
    await load()
  }

  const filtered =
    filter === 'all'     ? reviews :
    filter === 'pending' ? reviews.filter((r) => !r.is_approved) :
                           reviews.filter((r) =>  r.is_approved)

  const pending  = reviews.filter((r) => !r.is_approved).length
  const approved = reviews.filter((r) =>  r.is_approved).length

  // ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">التقييمات</h1>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatsCard label="الكل"   value={reviews.length} />
        <StatsCard label="معلق"   value={pending}  accent={pending > 0} />
        <StatsCard label="معتمد"  value={approved} />
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2">
        {([
          { value: 'all',      label: 'الكل'   },
          { value: 'pending',  label: 'معلق'   },
          { value: 'approved', label: 'معتمد'  },
        ] as { value: Filter; label: string }[]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-gradient-to-b from-gold-300 to-gold-400 text-ink'
                : 'bg-ink-200 text-slate-400 hover:bg-ink-300 hover:text-white'
            )}
          >
            {f.label}
            {f.value === 'pending' && pending > 0 && (
              <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Review list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-ink-400 bg-ink-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-400 bg-ink-100/40 py-16 text-center">
          <p className="text-4xl">⭐</p>
          <p className="mt-3 text-slate-500">لا توجد تقييمات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              toggling={toggling === r.id}
              onToggle={() => toggleApproval(r.id, r.is_approved)}
              onDelete={() => setDeleteId(r.id)}
            />
          ))}
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="حذف التقييم؟"
          message="سيتم حذف هذا التقييم نهائياً."
          confirmLabel="نعم، احذف"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// ReviewCard
// ─────────────────────────────────────────────────────────────
function ReviewCard({
  review: r, toggling, onToggle, onDelete,
}: {
  review: Review
  toggling: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-2xl border border-ink-400 bg-ink-100/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Stars */}
          <div className="mb-1.5 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= r.rating ? 'text-gold-400' : 'text-ink-500'}
              >
                ★
              </span>
            ))}
            <span className="mr-1 text-xs text-slate-500">({r.rating}/5)</span>
          </div>

          {/* Comment */}
          {r.comment && (
            <p className="text-sm text-slate-300">{r.comment}</p>
          )}

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{r.customer_name}</span>
            <span>·</span>
            <span>
              {new Date(r.created_at).toLocaleDateString('ar', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <span className={cn(
          'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium',
          r.is_approved
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-gold-400/30 bg-gold-400/10 text-gold-400'
        )}>
          {r.is_approved ? 'معتمد' : 'معلق'}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={onToggle}
          disabled={toggling}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
            r.is_approved
              ? 'border-ink-500 text-slate-400 hover:bg-ink-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
          )}
        >
          {toggling && (
            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          )}
          {r.is_approved ? 'إلغاء الاعتماد' : '✓ اعتماد'}
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
        >
          حذف
        </button>
      </div>
    </div>
  )
}
