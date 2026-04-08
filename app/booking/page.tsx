import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import BookingForm from '@/components/booking/BookingForm'
import { SHOP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `احجز موعدك | ${SHOP_NAME}`,
}

export default function BookingPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-spotlight px-4 py-14">
        <div className="mx-auto max-w-2xl animate-fade-in">
          {/* Page header */}
          <div className="mb-8 text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gold-400">
              حجز موعد
            </p>
            <h1 className="text-3xl font-bold text-white">احجز موعدك</h1>
            <p className="mt-2 text-slate-500">
              اختر الخدمة والوقت المناسب لك
            </p>
          </div>

          <Card className="p-6 sm:p-8">
            <BookingForm />
          </Card>
        </div>
      </main>

      <Footer />
    </>
  )
}
