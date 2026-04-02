import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data: resume, error: dbError } = await supabase
      .from('resumes')
      .select('filename, original_name')
      .eq('id', id)
      .single()

    if (dbError || !resume) throw new Error('Resume not found')

    const { data: fileData, error: storageError } = await supabase.storage
      .from('resumes')
      .download(resume.filename)

    if (storageError) throw storageError

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
