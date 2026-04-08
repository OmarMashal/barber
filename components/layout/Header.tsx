import Link from 'next/link'
import { SHOP_NAME } from '@/lib/constants'
import Button from '@/components/ui/Button'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-400/60 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-gold-300 to-gold-500 text-base font-bold text-ink shadow-gold-sm transition-shadow duration-200 group-hover:shadow-gold">
            ✂
          </span>
          <span className="text-base font-bold text-white">{SHOP_NAME}</span>
        </Link>

        <nav>
          <Link href="/booking">
            <Button size="sm">احجز الآن</Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
