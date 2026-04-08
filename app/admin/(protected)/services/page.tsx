'use client'

import { useCallback, useEffect, useState } from 'react'
import Toggle from '@/components/ui/Toggle'
import { Modal, ModalFooter } from '@/components/admin/Modal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { cn } from '@/lib/utils'
import { SERVICE_COLORS } from '@/lib/constants'
import { servicesApi } from '@/lib/api'
import type { Service } from '@/types'

// ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', description: '', duration: 30, price: 0,
  color: SERVICE_COLORS[0].value, is_active: true,
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [services,  setServices]  = useState<Service[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<Service | null>(null)
  const [deleteId,  setDeleteId]  = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)
  const [infoMsg,   setInfoMsg]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await servicesApi.list()
    setServices(data?.services ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { data } = await servicesApi.delete(deleteId)
    setDeleting(false)
    setDeleteId(null)
    if (data?.soft) setInfoMsg('تم تعطيل الخدمة لأنها مرتبطة بحجوزات نشطة')
    await load()
  }

  function openEdit(svc: Service) {
    setEditing(svc)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  // ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">الخدمات</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="rounded-xl bg-gradient-to-b from-gold-300 to-gold-400 px-4 py-2.5
                     text-sm font-semibold text-ink transition-opacity hover:opacity-90"
        >
          + خدمة جديدة
        </button>
      </div>

      {infoMsg && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-gold-400/30 bg-gold-400/8 px-4 py-3 text-sm text-gold-400">
          <span>{infoMsg}</span>
          <button onClick={() => setInfoMsg('')} className="text-gold-400/60 hover:text-gold-400">✕</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-ink-400 bg-ink-200" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-ink-400 bg-ink-100/40 py-16 text-center">
          <p className="text-4xl">✂️</p>
          <p className="mt-3 text-slate-500">لا توجد خدمات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <ServiceRow
              key={svc.id}
              service={svc}
              onEdit={() => openEdit(svc)}
              onDelete={() => setDeleteId(svc.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ServiceFormModal
          initial={editing}
          onClose={closeForm}
          onSaved={() => { closeForm(); load() }}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          title="حذف الخدمة؟"
          message="إذا كانت هناك حجوزات نشطة لهذه الخدمة، سيتم تعطيلها بدلاً من حذفها."
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
// ServiceRow
// ─────────────────────────────────────────────────────────────
function ServiceRow({
  service: svc,
  onEdit,
  onDelete,
}: {
  service: Service
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className={cn(
      'rounded-2xl border p-4 transition-colors',
      svc.is_active
        ? 'border-ink-400 bg-ink-100/60'
        : 'border-ink-300 bg-ink-100/30 opacity-60'
    )}>
      <div className="flex items-start gap-3">
        <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: svc.color }} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">{svc.name}</p>
            {!svc.is_active && (
              <span className="rounded-full bg-ink-400 px-2 py-0.5 text-xs text-slate-500">
                معطل
              </span>
            )}
          </div>
          {svc.description && (
            <p className="mt-0.5 text-sm text-slate-500">{svc.description}</p>
          )}
          <div className="mt-1.5 flex items-center gap-3 text-sm">
            <span className="font-semibold text-gold-400">₪{svc.price}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">{svc.duration} دقيقة</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={onEdit}
            className="rounded-lg border border-ink-500 px-3 py-1.5 text-xs text-slate-300
                       transition-colors hover:bg-ink-300 hover:text-white"
          >
            تعديل
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-400
                       transition-colors hover:bg-red-500/10"
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ServiceFormModal
// ─────────────────────────────────────────────────────────────
function ServiceFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Service | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState({
    name:        initial?.name        ?? EMPTY_FORM.name,
    description: initial?.description ?? EMPTY_FORM.description,
    duration:    initial?.duration    ?? EMPTY_FORM.duration,
    price:       initial?.price       ?? EMPTY_FORM.price,
    color:       initial?.color       ?? EMPTY_FORM.color,
    is_active:   initial?.is_active   ?? EMPTY_FORM.is_active,
  })
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  function set(k: string, v: unknown) { setForm((p) => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim())  { setError('اسم الخدمة مطلوب'); return }
    if (form.duration <= 0) { setError('المدة يجب أن تكون أكثر من 0'); return }
    if (form.price < 0)     { setError('السعر يجب أن يكون 0 أو أكثر'); return }

    setSaving(true)
    setError('')

    const result = isEdit
      ? await servicesApi.update(initial!.id, form)
      : await servicesApi.create(form)

    setSaving(false)
    if (result.error) { setError(result.error); return }
    onSaved()
  }

  return (
    <Modal title={isEdit ? 'تعديل الخدمة' : 'خدمة جديدة'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="اسم الخدمة *">
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="مثال: قص شعر"
            className={fieldClass}
          />
        </Field>

        <Field label="وصف مختصر">
          <input
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="مثال: قص احترافي بأحدث الأساليب"
            className={fieldClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="المدة (دقيقة) *">
            <input
              type="number" min={5} step={5}
              value={form.duration}
              onChange={(e) => set('duration', Number(e.target.value))}
              className={fieldClass}
              dir="ltr"
            />
          </Field>
          <Field label="السعر (₪) *">
            <input
              type="number" min={0} step={5}
              value={form.price}
              onChange={(e) => set('price', Number(e.target.value))}
              className={fieldClass}
              dir="ltr"
            />
          </Field>
        </div>

        {/* Color picker */}
        <div>
          <label className="mb-2 block text-sm text-slate-400">اللون</label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => set('color', c.value)}
                style={{ backgroundColor: c.value }}
                className={cn(
                  'h-8 w-8 rounded-full transition-transform hover:scale-110',
                  form.color === c.value && 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-ink-100'
                )}
              />
            ))}
          </div>
        </div>

        {/* Active toggle (edit only) */}
        {isEdit && (
          <div className="flex items-center justify-between rounded-xl border border-ink-400 bg-ink-200/50 px-4 py-3">
            <span className="text-sm text-slate-300">الخدمة متاحة للحجز</span>
            <Toggle value={form.is_active} onChange={(v) => set('is_active', v)} />
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <ModalFooter saving={saving} onClose={onClose} label={isEdit ? 'حفظ التعديلات' : 'إضافة الخدمة'} />
      </form>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────
const fieldClass =
  'w-full rounded-xl border border-ink-400 bg-ink-50 px-4 py-3 text-white placeholder-slate-600 ' +
  'transition-colors focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/30'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      {children}
    </div>
  )
}
