import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import JSZip from 'jszip'

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
      .select('filename, original_name, mime_type')
      .eq('id', id)
      .single()

    if (dbError || !resume) throw new Error('Resume not found')

    // 1. Fetch file from storage
    const { data: fileData, error: storageError } = await supabaseServer.storage
      .from('resumes')
      .download(resume.filename)

    if (storageError || !fileData) throw storageError || new Error('File download failed')

    // Convert Blob to ArrayBuffer for JSZip compatibility
    const arrayBuffer = await fileData.arrayBuffer()
    let finalData: Uint8Array | ArrayBuffer = arrayBuffer
    let finalMime = resume.mime_type || 'application/octet-stream'

    // If it's a zip (compressed), unzip it on the fly to return the original format
    if (resume.filename.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(arrayBuffer)
      const originalFile = Object.values(zip.files).find(f => !f.dir)
      if (originalFile) {
        finalData = await originalFile.async('uint8array')
      }
    }

    // 2. AUDIT LOGGING: Record the download
    if (session) {
       await supabaseServer.from('audit_logs').insert({
          user_id: session.user.id,
          user_name: session.user.user_metadata?.full_name || session.user.email,
          action: 'download',
          details: { filename: resume.original_name, resume_id: id }
       })
    }

    return new Response(finalData as any, {
      headers: {
        'Content-Type': finalMime,
        'Content-Disposition': `attachment; filename="${resume.original_name}"`,
      },
    })
  } catch (err: any) {
    console.error('Download API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
