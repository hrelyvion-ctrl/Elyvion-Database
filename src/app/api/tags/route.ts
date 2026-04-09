import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  )
  try {
    const { data: tags, error } = await supabaseServer.from('tags').select('*').order('name', { ascending: true })
    if (error) throw error
    return NextResponse.json(tags || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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
    const { name, color } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    
    const { data: { session } } = await supabaseServer.auth.getSession()

    const { data: tag, error } = await supabaseServer.from('tags').upsert(
      { name: name.trim(), color: color || '#6366f1' }, 
      { onConflict: 'name' }
    ).select().single()
    
    if (error) throw error

    // AUDIT LOGGING
    if (session) {
       await supabaseServer.from('audit_logs').insert({
          user_id: session.user.id,
          user_name: session.user.user_metadata?.full_name || session.user.email,
          action: 'create_tag',
          details: { tag_name: name }
       })
    }

    return NextResponse.json(tag)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
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
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { data: { session } } = await supabaseServer.auth.getSession()

    const { error } = await supabaseServer.from('tags').delete().eq('id', id)
    if (error) throw error

    // AUDIT LOGGING
    if (session) {
       await supabaseServer.from('audit_logs').insert({
          user_id: session.user.id,
          user_name: session.user.user_metadata?.full_name || session.user.email,
          action: 'delete_tag',
          details: { tag_id: id }
       })
    }

    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
