import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Admin route protection ────────────────────────────────
  const isAdminLoginPage = pathname === '/admin/login'
  const isAdminPage =
    pathname.startsWith('/admin') && !isAdminLoginPage

  if (isAdminPage && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Redirect logged-in admin away from login page
  if (isAdminLoginPage && user) {
    return NextResponse.redirect(new URL('/admin/bookings', request.url))
  }

  // ── Legacy /admin/dashboard redirect ─────────────────────
  if (pathname === '/admin/dashboard' || pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/bookings', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
