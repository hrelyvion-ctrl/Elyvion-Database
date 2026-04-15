import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    let query = supabaseServer.from('resumes').select('id, filename, original_name, file_size, mime_type, parsed_name, parsed_email, parsed_phone, parsed_skills, parsed_education, parsed_summary, experience_years, status, rating, tags, notes, folder, uploaded_at, updated_at', { count: 'exact' })

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

    // Apply Global Quick Search (skill param from UI quick search box)
    if (skill) {
        query = query.or(`parsed_skills.ilike.%${skill}%,parsed_name.ilike.%${skill}%,parsed_email.ilike.%${skill}%,raw_text.ilike.%${skill}%`)
    }

    let { data: resumes, error, count } = await query
      .order(safeSort, { ascending: order })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)

    // Calculate dynamic "AI Match Score" if a search query exists
    if (resumes && (skill || keywords || location)) {
        const queryParts = [skill, keywords, location].filter(Boolean).join(' ').toLowerCase().split(/\s+/)
        resumes = resumes.map((r: any) => {
           let score = 50 // Base score
           const txt = (r.raw_text + ' ' + r.parsed_skills + ' ' + r.parsed_name).toLowerCase()
           let hits = 0
           for (const q of queryParts) {
               if (txt.includes(q)) hits++
           }
           score += hits * 18
           if (r.experience_years >= minExp && r.experience_years <= maxExp) score += 10
           if (score > 99) score = 99
           if (hits === 0 && score > 70) score = 65 // Penalize if no direct hits
           return { ...r, match_score: Math.round(score) }
        })
    }

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

    const { ids } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 })
    }

    // 1. Check Permissions
    const { data: { session } } = await supabaseServer.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || !['Senior', 'Master'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete profiles' }, { status: 403 })
    }

    const { error } = await supabaseServer.from('resumes').delete().in('id', ids)
    
    // 2. AUDIT LOGGING: Record the deletion
    if (session) {
       const { error: logError } = await supabaseServer.from('audit_logs').insert({
          user_id: session.user.id,
          user_name: session.user.user_metadata?.full_name || session.user.email,
          action: 'delete',
          details: { count: ids.length, ids }
       })
       if (logError) console.error("Audit log deletion error:", logError)
    }

    if (error) throw error
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
