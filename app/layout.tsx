import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { SHOP_NAME } from '@/lib/constants'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${SHOP_NAME} – احجز موعدك`,
    template: `%s | ${SHOP_NAME}`,
  },
  description: 'احجز موعد حلاقتك بكل سهولة وسرعة',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body>{children}</body>
    </html>
  )
}
