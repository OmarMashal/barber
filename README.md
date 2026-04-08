# Barber Booking — موقع حجز صالون الحلاقة

موقع متكامل لإدارة حجوزات صالون الحلاقة، مبني بـ **Next.js 15** و**Supabase**، يتيح للعملاء حجز المواعيد وللمدير إدارة كل شيء من لوحة تحكم واحدة.

---

## المميزات

**للعملاء**
- حجز موعد بخطوات بسيطة (اختيار خدمة → تاريخ → وقت → بيانات)
- عرض الخدمات المتاحة مع الأسعار والمدة
- صفحة تأكيد الحجز مع تفاصيل الموعد
- استقبال رسائل SMS للتأكيد

**للمدير (Admin Panel)**
- لوحة إحصاءات (حجوزات اليوم، الإيرادات، الحالات)
- إدارة الحجوزات (تأكيد / إلغاء / تحديث الحالة)
- إدارة الخدمات (إضافة / تعديل / حذف)
- ضبط أوقات العمل لكل يوم من الأسبوع
- حجب أوقات معينة أو أيام كاملة
- إدارة معرض الصور
- إدارة التقييمات والموافقة عليها
- إشعارات SMS تلقائية للحجوزات الجديدة

---

## التقنيات المستخدمة

| التقنية | الاستخدام |
|---|---|
| [Next.js 15](https://nextjs.org/) | React framework (App Router) |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [Supabase](https://supabase.com/) | قاعدة البيانات + المصادقة + RLS |
| [Twilio](https://www.twilio.com/) | إشعارات SMS |

---

## هيكل المشروع

```
├── app/
│   ├── page.tsx                  # الصفحة الرئيسية
│   ├── booking/                  # صفحات الحجز للعملاء
│   │   ├── page.tsx
│   │   └── confirmation/
│   ├── admin/                    # لوحة التحكم
│   │   ├── login/
│   │   └── (protected)/          # صفحات محمية بالمصادقة
│   │       ├── page.tsx          # Dashboard
│   │       ├── bookings/
│   │       ├── services/
│   │       ├── availability/
│   │       ├── gallery/
│   │       └── reviews/
│   └── api/                      # API Routes
│       ├── bookings/
│       ├── services/
│       ├── admin/
│       └── calendar/
├── components/
│   ├── admin/
│   ├── booking/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── supabase/                 # Supabase client/server
│   ├── sms.ts                    # Twilio SMS
│   └── utils.ts
├── supabase/
│   └── schema.sql                # قاعدة البيانات الكاملة
└── types/
    └── index.ts
```

---

## الإعداد والتشغيل

### المتطلبات
- Node.js 18+
- حساب [Supabase](https://supabase.com/)
- حساب [Twilio](https://www.twilio.com/) (للـ SMS)

### 1. استنساخ المشروع

```bash
git clone https://github.com/OmarMashal/barber.git
cd barber
```

### 2. تثبيت الحزم

```bash
npm install
```

### 3. إعداد متغيرات البيئة

```bash
cp .env.local.example .env.local
```

ثم عبّي القيم في `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
BARBER_SMS_NUMBER=+1234567890
```

### 4. إعداد قاعدة البيانات

في لوحة Supabase → **SQL Editor** → شغّل كامل ملف `supabase/schema.sql`

هذا الملف ينشئ:
- جميع الجداول (الحجوزات، الخدمات، الإعدادات، ...)
- الـ Triggers (منع الحجوزات المتداخلة، حساب أوقات الانتهاء)
- دالة `get_available_slots` لحساب الأوقات المتاحة
- Row Level Security policies

### 5. تشغيل المشروع

```bash
npm run dev
```

الموقع يعمل على: `http://localhost:3000`

---

## الصفحات

| الصفحة | الرابط |
|---|---|
| الصفحة الرئيسية | `/` |
| حجز موعد | `/booking` |
| تأكيد الحجز | `/booking/confirmation` |
| تسجيل دخول المدير | `/admin/login` |
| لوحة التحكم | `/admin` |
| الحجوزات | `/admin/bookings` |
| الخدمات | `/admin/services` |
| أوقات العمل | `/admin/availability` |
| معرض الصور | `/admin/gallery` |
| التقييمات | `/admin/reviews` |

---

## قاعدة البيانات

| الجدول | الوصف |
|---|---|
| `business_settings` | إعدادات الصالون العامة |
| `calendar_settings` | أوقات العمل لكل يوم |
| `services` | الخدمات المقدمة |
| `bookings` | الحجوزات |
| `blocked_times` | أوقات وأيام الإغلاق |
| `blocked_customers` | قائمة الأرقام المحظورة |
| `gallery_images` | صور المعرض |
| `reviews` | تقييمات العملاء |
| `sms_settings` | إعدادات الرسائل النصية |

---

## نشر المشروع (Deployment)

الأنسب للنشر هو [Vercel](https://vercel.com/):

1. ارفع الكود على GitHub
2. اربط الـ repo بـ Vercel
3. أضف متغيرات البيئة في إعدادات Vercel
4. Deploy

---

## الأمان

- `.env.local` **لا يُرفع أبداً** على GitHub (محمي بـ `.gitignore`)
- جميع الـ API Routes الإدارية محمية بـ middleware
- Row Level Security مفعّل على جميع الجداول في Supabase
- مفاتيح Twilio وService Role Key تُستخدم فقط server-side
