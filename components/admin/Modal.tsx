'use client'

// Shared modal primitives for admin pages.
// Usage:
//   <Modal title="..." onClose={...}>
//     <ModalInput label="..." value={...} onChange={...} />
//     <ModalFooter saving={...} onClose={...} label="..." />
//   </Modal>

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl border border-ink-400 bg-ink-100 p-6 shadow-modal sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 transition-colors hover:text-white"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface ModalInputProps {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  dir?: string
}

export function ModalInput({
  label, type = 'text', value, onChange, placeholder, dir,
}: ModalInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full rounded-xl border border-ink-400 bg-ink-50 px-4 py-3 text-white placeholder-slate-600
                   transition-colors hover:border-ink-500
                   focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/30
                   [color-scheme:dark]"
      />
    </div>
  )
}

interface ModalFooterProps {
  saving: boolean
  onClose: () => void
  label: string
}

export function ModalFooter({ saving, onClose, label }: ModalFooterProps) {
  return (
    <div className="flex gap-3 pt-1">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="flex-1 rounded-xl border border-ink-500 py-2.5 text-sm text-slate-300
                   transition-colors hover:bg-ink-300 disabled:opacity-50"
      >
        رجوع
      </button>
      <button
        type="submit"
        disabled={saving}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl
                   bg-gradient-to-b from-gold-300 to-gold-400 py-2.5
                   text-sm font-semibold text-ink transition-opacity
                   hover:opacity-90 disabled:opacity-50"
      >
        {saving && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {label}
      </button>
    </div>
  )
}
