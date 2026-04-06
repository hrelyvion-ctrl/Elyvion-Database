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

    const { data, error: storageError } = await supabaseServer.storage
      .from('resumes')
      .download(record.filename)

    if (storageError || !data) throw storageError || new Error('File download failed')

    let finalData: Buffer | Blob = data
    let finalMime = record.mime_type || 'application/pdf'

    // If it was compressed, unzip it on the fly for preview
    if (record.filename.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(data)
      const originalFile = Object.values(zip.files).find(f => !f.dir)
      if (originalFile) {
        const buffer = await originalFile.async('nodebuffer')
        finalData = buffer
      }
    }

    return new Response(finalData, {
      headers: {
        'Content-Type': finalMime,
        'Content-Disposition': `inline; filename="${record.original_name}"`,
      },
    })
  } catch (err: any) {
    console.error('File Proxy Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
