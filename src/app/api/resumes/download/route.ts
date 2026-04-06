import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/db'

export async function GET(req: NextRequest) {
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

  const { data: { session } } = await supabaseServer.auth.getSession()

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data: resume, error: dbError } = await supabaseServer
      .from('resumes')
      .select('filename, original_name')
      .eq('id', id)
      .single()

    if (dbError || !resume) throw new Error('Resume not found')

    // 1. Fetch file from storage using the authenticated client
    const { data: fileData, error: storageError } = await supabaseServer.storage
      .from('resumes')
      .download(resume.filename)

    if (storageError) throw storageError

    // 2. AUDIT LOGGING: Record the download
    if (session) {
       await supabaseServer.from('audit_logs').insert({
          user_id: session.user.id,
          user_name: session.user.user_metadata?.full_name || session.user.email,
          action: 'download',
          details: { filename: resume.original_name, resume_id: id }
       })
    }

    return new Response(fileData, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${resume.original_name}"`,
      },
    })
  } catch (err: any) {
    console.error('Download API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
