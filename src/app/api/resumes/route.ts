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
    const folder  = searchParams.get('folder') || ''
    
    // Advanced Filters (Naukri style)
    const skill   = searchParams.get('skill')  || ''
    const minExp  = parseFloat(searchParams.get('minExp') || '0')
    const maxExp  = parseFloat(searchParams.get('maxExp') || '50')
    const location = searchParams.get('location') || ''
    const keywords = searchParams.get('keywords') || ''
    const exclude = searchParams.get('exclude')   || ''

    const allowedSorts = ['uploaded_at','parsed_name','experience_years','rating','updated_at']
    const safeSort = allowedSorts.includes(sort) ? sort : 'uploaded_at'

    let query = supabase.from('resumes').select('id, filename, original_name, file_size, mime_type, parsed_name, parsed_email, parsed_phone, parsed_skills, parsed_education, parsed_summary, experience_years, status, rating, tags, notes, folder, uploaded_at, updated_at', { count: 'exact' })

    // Apply Standard Filters
    if (status !== 'all') query = query.eq('status', status)
    if (folder && folder !== 'All') query = query.eq('folder', folder)
    
    // Apply Experience Range (Naukri)
    if (minExp > 0) query = query.gte('experience_years', minExp)
    if (maxExp < 50) query = query.lte('experience_years', maxExp)

    // Apply Location (Searching in raw_text or location col)
    if (location) {
        query = query.or(`raw_text.ilike.%${location}%,parsed_summary.ilike.%${location}%`)
    }

    // Apply Mandatory Keywords (Boolean logic)
    if (keywords) {
        // Simple spaces-to-AND logic: convert "React Python" into multiple filters
        const kArr = keywords.split(/\s+/).filter(Boolean)
        for (const k of kArr) {
            query = query.ilike('raw_text', `%${k}%`)
        }
    }

    // Apply Exclude Keywords
    if (exclude) {
        const eArr = exclude.split(/\s+/).filter(Boolean)
        for (const e of eArr) {
            query = query.not('raw_text', 'ilike', `%${e}%`)
        }
    }

    // Apply Legacy Skill filter
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
