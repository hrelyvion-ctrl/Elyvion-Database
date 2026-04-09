import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { data, error } = await supabaseServer.from('resumes').select('*').eq('id', parseInt(params.id)).single()
    if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const body = await req.json()
    const id = parseInt(params.id)

    const allowed = ['status','rating','notes','tags','parsed_name','parsed_email','parsed_phone','parsed_skills']
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    for (const key of allowed) {
      if (key in body) {
        updates[key] = typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key]
      }
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data: { session } } = await supabaseServer.auth.getSession()
    const { data, error } = await supabaseServer.from('resumes').update(updates).eq('id', id).select().single()
    
    if (error) throw error

    // AUDIT LOGGING
    if (session) {
       await supabaseServer.from('audit_logs').insert({
          user_id: session.user.id,
          user_name: session.user.user_metadata?.full_name || session.user.email,
          action: 'update_resume',
          details: { resume_id: id, updates }
       })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { data: { session } } = await supabaseServer.auth.getSession()
    const { error } = await supabaseServer.from('resumes').delete().eq('id', parseInt(params.id))
    
    if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // AUDIT LOGGING
    if (session) {
       await supabaseServer.from('audit_logs').insert({
          user_id: session.user.id,
          user_name: session.user.user_metadata?.full_name || session.user.email,
          action: 'delete_resume',
          details: { resume_id: params.id }
       })
    }

    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
