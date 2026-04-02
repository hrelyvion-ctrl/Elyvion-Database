import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const { data: record, error } = await supabase.from('resumes').select('file_path').eq('id', id).single()
    if (error || !record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data } = supabase.storage.from('resumes').getPublicUrl(record.file_path)

    return NextResponse.redirect(data.publicUrl)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
