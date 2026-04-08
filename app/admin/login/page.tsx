'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { SHOP_NAME } from '@/lib/constants'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      setLoading(false)
      return
    }

    router.push('/admin/bookings')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-spotlight bg-grid px-4">
      <div className="w-full max-w-sm animate-scale-in">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-gold-300 to-gold-500 text-2xl font-bold text-ink shadow-gold">
            ✂
          </div>
          <h1 className="text-xl font-bold text-white">{SHOP_NAME}</h1>
          <p className="mt-1 text-sm text-slate-500">لوحة تحكم الإدارة</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-ink-400 bg-ink-100/80 p-6 shadow-modal backdrop-blur-sm"
        >
          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            dir="ltr"
            required
          />
          <Input
            label="كلمة المرور"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            dir="ltr"
            required
          />

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-sm text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            تسجيل الدخول
          </Button>
        </form>
      </div>
    </div>
  )
}
