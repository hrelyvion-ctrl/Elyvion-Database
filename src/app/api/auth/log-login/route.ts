import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Update profile last login
  await supabase.from('profiles').update({ 
    last_login: new Date().toISOString() 
  }).eq('id', session.user.id)

  // Record audit log
  await supabase.from('audit_logs').insert({
    user_id: session.user.id,
    user_name: session.user.user_metadata?.full_name || session.user.email,
    action: 'login',
    details: { user_agent: req.headers.get('user-agent'), ip: req.headers.get('x-forwarded-for') }
  })

  return NextResponse.json({ success: true })
}
