'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SHOP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin/bookings',     emoji: '📋', label: 'الحجوزات'  },
  { href: '/admin/availability', emoji: '🕐', label: 'الأوقات'   },
  { href: '/admin/services',     emoji: '✂️', label: 'الخدمات'   },
  { href: '/admin/gallery',      emoji: '🖼️', label: 'المعرض'    },
  { href: '/admin/reviews',      emoji: '⭐', label: 'التقييمات' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-ink pb-20 md:pb-0">

      {/* ── Top header ───────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-ink-400/60 bg-ink/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 text-sm font-bold text-ink shadow-gold-sm">
              ✂
            </span>
            <div>
              <p className="text-sm font-bold leading-none text-white">{SHOP_NAME}</p>
              <p className="mt-0.5 text-xs leading-none text-slate-500">لوحة الإدارة</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="rounded-lg border border-ink-500 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-ink-500 hover:text-slate-300"
          >
            خروج
          </button>
        </div>

        {/* Desktop tab nav */}
        <nav className="mx-auto hidden max-w-4xl overflow-x-auto px-4 md:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 border-b-2 px-5 py-2.5 text-sm transition-colors',
                  active
                    ? 'border-gold-400 text-gold-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                )}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </header>

      {/* ── Page content ─────────────────────────── */}
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>

      {/* ── Mobile bottom nav ────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-400/60 bg-ink/95 backdrop-blur-md md:hidden">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors',
                active ? 'text-gold-400' : 'text-slate-600 active:text-slate-400'
              )}
            >
              <span className="text-lg leading-none">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
