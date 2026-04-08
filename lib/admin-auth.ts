import { createClient } from '@/lib/supabase/server'

/**
 * Throws 'UNAUTHORIZED' if no valid session exists.
 * Use inside API route handlers with try/catch to return 401.
 *
 * Pattern:
 *   try { await requireAdmin() } catch {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 */
export async function requireAdmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')
}
