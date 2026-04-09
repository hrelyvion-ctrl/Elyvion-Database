import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PATCH(req: NextRequest) {
  const cookieStore = cookies()
  const supabaseServer = createServerClient(
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

  try {
    const { ids, updates } = await req.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const { data: { session } } = await supabaseServer.auth.getSession()

    const { data, error } = await supabaseServer
      .from('resumes')
      .update(updates)
      .in('id', ids)
      .select()

    if (error) throw error

    // AUDIT LOGGING
    if (session) {
       await supabaseServer.from('audit_logs').insert({
          user_id: session.user.id,
          user_name: session.user.user_metadata?.full_name || session.user.email,
          action: 'bulk_update',
          details: { count: ids.length, updates, ids }
       })
    }

    return NextResponse.json({ success: true, count: data?.length })
  } catch (err: any) {
    console.error('Bulk update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
