import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import JSZip from 'jszip'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    const id = parseInt(params.id)
    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const { data: record, error: dbError } = await supabaseServer
      .from('resumes')
      .select('filename, mime_type, original_name')
      .eq('id', id)
      .single()

    if (dbError || !record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: fileData, error: storageError } = await supabaseServer.storage
      .from('resumes')
      .download(record.filename)

    if (storageError || !fileData) throw storageError || new Error('File download failed')

    // Convert Blob to ArrayBuffer for JSZip compatibility
    const arrayBuffer = await fileData.arrayBuffer()
    let finalData: Uint8Array | ArrayBuffer = arrayBuffer
    let finalMime = record.mime_type || 'application/pdf'

    // If it was compressed, unzip it on the fly for preview
    if (record.filename.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(arrayBuffer)
      const originalFile = Object.values(zip.files).find(f => !f.dir)
      if (originalFile) {
        finalData = await originalFile.async('uint8array')
        // Correct mime-type based on extracted file extension
        const ext = originalFile.name.toLowerCase().split('.').pop()
        if (ext === 'pdf') finalMime = 'application/pdf'
        else if (ext === 'docx') finalMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else if (ext === 'txt') finalMime = 'text/plain'
      }
    }

    return new Response(finalData as any, {
      headers: {
        'Content-Type': finalMime,
        'Content-Disposition': `inline; filename="${record.original_name}"`,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err: any) {
    console.error('File Proxy Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
