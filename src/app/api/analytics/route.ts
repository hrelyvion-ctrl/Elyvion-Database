import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
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
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('status, parsed_skills, experience_years, uploaded_at, rating')
    
    if (error) throw error

    const total = resumes.length
    let new_count = 0, shortlisted = 0, hired = 0, rejected = 0, reviewed = 0
    let rankSum = 0, rankCount = 0
    const skillsMap: Record<string, number> = {}
    const expMap: Record<string, number> = { '0-2 Yrs': 0, '3-5 Yrs': 0, '6-10 Yrs': 0, '10+ Yrs': 0 }
    const trendMap: Record<string, number> = {}

    for (const r of resumes) {
      if (r.status === 'new') new_count++
      if (r.status === 'shortlisted') shortlisted++
      if (r.status === 'hired') hired++
      if (r.status === 'rejected') rejected++
      if (r.status === 'reviewed') reviewed++

      if (r.rating > 0) {
        rankSum += r.rating
        rankCount++
      }

      const y = r.experience_years || 0
      if (y < 3) expMap['0-2 Yrs']++
      else if (y < 6) expMap['3-5 Yrs']++
      else if (y <= 10) expMap['6-10 Yrs']++
      else expMap['10+ Yrs']++

      try {
        const skills = typeof r.parsed_skills === 'string'
          ? JSON.parse(r.parsed_skills || '[]')
          : (r.parsed_skills || [])
        for (const s of skills) skillsMap[s] = (skillsMap[s] || 0) + 1
      } catch {}

      if (r.uploaded_at) {
        const d = r.uploaded_at.split('T')[0]
        trendMap[d] = (trendMap[d] || 0) + 1
      }
    }

    const top_skills = Object.entries(skillsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }))

    const by_experience = Object.entries(expMap)
      .map(([range, count]) => ({ range, count }))
      .filter(x => x.count > 0)

    const recent_uploads = Object.entries(trendMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      total, new_count, shortlisted, hired, rejected, reviewed,
      avg_rating: rankCount ? parseFloat((rankSum / rankCount).toFixed(1)) : 0,
      top_skills, by_experience, recent_uploads
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
