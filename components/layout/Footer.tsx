import { BARBER_INSTAGRAM, BARBER_PHONE, SHOP_ADDRESS, SHOP_NAME } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="border-t border-ink-400/60 bg-ink-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-gold-300 to-gold-500 text-base font-bold text-ink shadow-gold-sm">
                ✂
              </span>
              <span className="text-base font-bold text-white">{SHOP_NAME}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              أفضل تجربة حلاقة في المدينة
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              التواصل
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>{BARBER_PHONE}</li>
              <li>{BARBER_INSTAGRAM}</li>
              <li>{SHOP_ADDRESS}</li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              أوقات العمل
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>الأحد – الخميس والسبت: 09:00 – 21:00</li>
              <li>الجمعة: مغلق</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-400/40 pt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} {SHOP_NAME}. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  )
}
