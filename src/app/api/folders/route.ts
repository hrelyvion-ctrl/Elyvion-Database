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
    const { data, error } = await supabaseServer
      .from('folders')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    // If no folders exist, return the defaults
    if (!data || data.length === 0) {
        return NextResponse.json(['Uncategorized','AI','Software Engineer','Sales','Marketing','Design'])
    }

    return NextResponse.json(data.map(f => f.name))
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
    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const { data: { session } } = await supabaseServer.auth.getSession()

    const { data, error } = await supabaseServer
      .from('folders')
      .insert({ name })
      .select()
      .single()

    if (error) throw error

    // AUDIT LOGGING
    if (session) {
       await supabaseServer.from('audit_logs').insert({
          user_id: session.user.id,
          user_name: session.user.user_metadata?.full_name || session.user.email,
          action: 'create_folder',
          details: { folder_name: name }
       })
    }

    return NextResponse.json(data)
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
    const { name } = await req.json()
    if (!name || name === 'Uncategorized') {
        return NextResponse.json({ error: 'Valid folder name required' }, { status: 400 })
    }

    const { data: { session } } = await supabaseServer.auth.getSession()

    // 1. Move all resumes in this folder to 'Uncategorized'
    await supabaseServer
      .from('resumes')
      .update({ folder: 'Uncategorized' })
      .eq('folder', name)

    // 2. Delete the folder record
    const { error } = await supabaseServer
      .from('folders')
      .delete()
      .eq('name', name)

    if (error) throw error

    // AUDIT LOGGING
    if (session) {
       await supabaseServer.from('audit_logs').insert({
          user_id: session.user.id,
          user_name: session.user.user_metadata?.full_name || session.user.email,
          action: 'delete_folder',
          details: { folder_name: name }
       })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
