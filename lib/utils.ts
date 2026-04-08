export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Jerusalem',
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ar', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jerusalem',
  })
}

// Format a local HH:MM string (slot_time) for display — already 24-hour format from the DB
export function formatSlotLabel(time: string): string {
  const [h, m] = time.split(':')
  return `${h.padStart(2, '0')}:${m}`
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending:   'قيد الانتظار',
    confirmed: 'مؤكد',
    cancelled: 'ملغي',
    no_show:   'غياب',
  }
  return labels[status] ?? status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
    no_show:   'bg-slate-500/15 text-slate-400 border-slate-500/30',
  }
  return colors[status] ?? 'bg-slate-500/15 text-slate-400'
}

// Returns today's date string in Jerusalem timezone as YYYY-MM-DD
export function getTodayString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
}

export function getMinBookingDate(): string {
  return getTodayString()
}

// Returns the max bookable date by adding maxDays UTC days to today.
// Formatted in Jerusalem timezone so the displayed date is correct
// regardless of the server/browser timezone.
export function getMaxBookingDate(maxDays = 30): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + maxDays)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
}

// Format a blocked-time date for display in the admin list
export function formatBlockDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Jerusalem',
  })
}

// Format a blocked-time range (start → end) for display
export function formatBlockTime(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('ar', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem',
    })
  return `${fmt(start)} — ${fmt(end)}`
}

// Returns the UTC offset string (e.g. "+02:00" or "+03:00") for a given timezone
// at a specific point in time. Jerusalem uses DST so the offset changes seasonally.
export function getTzOffset(tz: string, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(at)
  const p = (type: string) => parts.find(x => x.type === type)?.value ?? '00'
  const hour = p('hour') === '24' ? '00' : p('hour')
  const localAsUTC = new Date(
    `${p('year')}-${p('month')}-${p('day')}T${hour}:${p('minute')}:${p('second')}Z`
  )
  const diffMins = Math.round((localAsUTC.getTime() - at.getTime()) / 60000)
  const sign = diffMins >= 0 ? '+' : '-'
  const abs  = Math.abs(diffMins)
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

// ── Phone helpers ─────────────────────────────────────────────
//
// Accepted input formats:
//   05XXXXXXXX     — local Israeli/Palestinian mobile (10 digits)
//   +9725XXXXXXXX  — international E.164
//   009725XXXXXXXX — international with 00 prefix
//   972XXXXXXXXX   — without leading +
//
// All normalize to +972XXXXXXXXX

export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, '')
  if (cleaned.startsWith('00972')) return `+972${cleaned.slice(5)}`
  if (cleaned.startsWith('+972'))  return cleaned
  if (cleaned.startsWith('972'))   return `+${cleaned}`
  if (cleaned.startsWith('0'))     return `+972${cleaned.slice(1)}`
  return cleaned
}

// Valid Israeli/Palestinian numbers in +972 form:
//   Mobile:   +9725[023456789]XXXXXXX (12 chars)
//   Landline: +972[2-9]XXXXXXXX       (11–12 chars)
const IL_PHONE_RE = /^\+972[2-9]\d{7,8}$/

export function isValidILPhone(raw: string): boolean {
  return IL_PHONE_RE.test(normalizePhone(raw))
}

// Validates a UUID v4 string (Supabase IDs are UUID v4)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id)
}

// Validates that a string is a parseable ISO 8601 timestamp and not NaN
export function isValidISO(ts: string): boolean {
  if (!ts || typeof ts !== 'string') return false
  const d = new Date(ts)
  return !isNaN(d.getTime())
}
