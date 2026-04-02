import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const page    = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit   = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset  = (page - 1) * limit
    const status  = searchParams.get('status') || 'all'
    const sort    = searchParams.get('sort')   || 'uploaded_at'
    const order   = searchParams.get('order') === 'asc'
    const skill   = searchParams.get('skill')  || ''

    const allowedSorts = ['uploaded_at','parsed_name','experience_years','rating','updated_at']
    const safeSort = allowedSorts.includes(sort) ? sort : 'uploaded_at'

    let query = supabase.from('resumes').select('id, filename, original_name, file_size, mime_type, parsed_name, parsed_email, parsed_phone, parsed_skills, parsed_education, parsed_summary, experience_years, status, rating, tags, notes, uploaded_at, updated_at', { count: 'exact' })

    if (status !== 'all') query = query.eq('status', status)
    if (skill) query = query.ilike('parsed_skills', `%${skill}%`)

    const { data: resumes, error, count } = await query
      .order(safeSort, { ascending: order })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)

    return NextResponse.json({
      resumes: resumes || [],
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 })
    }
    const { error } = await supabase.from('resumes').delete().in('id', ids)
    if (error) throw error
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
