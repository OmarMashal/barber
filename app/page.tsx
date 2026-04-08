import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/server'
import { BARBER_NAME, SHOP_NAME } from '@/lib/constants'
import type { Service } from '@/types'

async function getServices(): Promise<Service[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('id, name, description, duration, price, color, sort_order')
    .eq('is_active', true)
    .order('sort_order')
  return data ?? []
}

export default async function HomePage() {
  const services = await getServices()

  return (
    <>
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pb-28 pt-24 text-center bg-spotlight bg-grid">
          {/* Ambient glow blob */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
            <div className="h-64 w-96 rounded-full bg-gold-400/6 blur-[100px]" />
          </div>

          <div className="relative mx-auto max-w-2xl">
            {/* Badge */}
            <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/8 px-4 py-1.5 text-sm text-gold-400 delay-75 fill-both">
              ✂ حجز فوري · بدون انتظار
            </div>

            {/* Headline */}
            <h1 className="animate-slide-up text-5xl font-extrabold leading-tight tracking-tight text-white delay-150 fill-both sm:text-6xl">
              إطلالتك المثالية
              <br />
              <span className="text-gold">تبدأ من هنا</span>
            </h1>

            <p className="animate-slide-up mt-5 text-lg text-slate-400 delay-200 fill-both">
              احجز موعدك مع{' '}
              <span className="font-semibold text-white">{BARBER_NAME}</span>{' '}
              في ثوانٍ
            </p>

            <div className="animate-slide-up mt-10 delay-300 fill-both">
              <Link href="/booking">
                <Button size="lg" className="px-10">احجز موعدك الآن</Button>
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="animate-slide-up relative mx-auto mt-16 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-2xl border border-ink-400 bg-ink-400 delay-400 fill-both">
            {[
              { value: '+١٠٠٠', label: 'عميل سعيد' },
              { value: '+١٠',   label: 'سنوات خبرة' },
              { value: '١٠٠٪', label: 'رضا مضمون' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center bg-ink-100 px-4 py-5">
                <span className="text-2xl font-bold text-gold-400">{stat.value}</span>
                <span className="mt-0.5 text-xs text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Services ─────────────────────────────────────── */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-400">
                الخدمات
              </p>
              <h2 className="text-3xl font-bold text-white">كل ما تحتاجه</h2>
              <p className="mt-2 text-slate-500">في مكان واحد</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <Card
                  key={service.id}
                  hover
                  gold
                  className={`p-5 animate-scale-in fill-both delay-${[75, 150, 200, 300][i] ?? 300}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: service.color }}
                        />
                        <h3 className="font-semibold text-white">{service.name}</h3>
                      </div>
                      {service.description && (
                        <p className="text-sm text-slate-500">{service.description}</p>
                      )}
                      <p className="mt-3 text-xs text-slate-600">
                        {service.duration} دقيقة
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gold-400">
                        {service.price}
                      </span>
                      <p className="text-xs text-slate-600">₪</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link href="/booking">
                <Button variant="outline" size="lg">
                  احجز الآن
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Why us ───────────────────────────────────────── */}
        <section className="bg-ink-50 px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-400">
                لماذا نحن
              </p>
              <h2 className="text-3xl font-bold text-white">{SHOP_NAME}</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {[
                { icon: '🎯', title: 'دقة في المواعيد', desc: 'نحترم وقتك، لا انتظار ولا تأخير' },
                { icon: '💈', title: 'خبرة احترافية',  desc: 'أكثر من 10 سنوات في فن الحلاقة' },
                { icon: '✨', title: 'نتيجة مضمونة',  desc: 'رضاك هو أولويتنا دائماً' },
              ].map((item) => (
                <Card key={item.title} className="p-6 text-center">
                  <div className="mb-4 text-4xl">{item.icon}</div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-2xl rounded-3xl border border-gold-400/20 bg-gold-400/5 p-12 text-center shadow-gold-sm">
            <h2 className="text-3xl font-bold text-white">جاهز لتجديد إطلالتك؟</h2>
            <p className="mt-3 text-slate-500">الحجز مجاني والإلغاء سهل</p>
            <Link href="/booking" className="mt-8 inline-block">
              <Button size="lg" className="px-12">احجز الآن مجاناً</Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
