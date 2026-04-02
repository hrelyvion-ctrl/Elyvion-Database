import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q     = searchParams.get('q')?.trim() || ''
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    if (!q) {
      return NextResponse.json({ resumes: [], pagination: { total: 0, pages: 0, page, limit } })
    }

    // Try a simple text search in Supabase using ILIKE
    const likeQ = `%${q}%`
    
    const { data: resumes, error, count } = await supabase.from('resumes')
      .select('id, filename, original_name, parsed_name, parsed_email, parsed_phone, parsed_skills, parsed_education, parsed_summary, experience_years, status, rating, tags, uploaded_at', { count: 'exact' })
      .or(`parsed_name.ilike.${likeQ},parsed_email.ilike.${likeQ},parsed_skills.ilike.${likeQ},raw_text.ilike.${likeQ}`)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)

    return NextResponse.json({
      resumes,
      pagination: { 
        page, 
        limit, 
        total: count || 0, 
        pages: Math.ceil((count || 0) / limit) 
      },
      query: q,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
