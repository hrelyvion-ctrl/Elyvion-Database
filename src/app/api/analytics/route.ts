import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()

    const totals = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='new'         THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status='shortlisted' THEN 1 ELSE 0 END) as shortlisted,
        SUM(CASE WHEN status='rejected'    THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status='hired'       THEN 1 ELSE 0 END) as hired,
        SUM(CASE WHEN status='reviewed'    THEN 1 ELSE 0 END) as reviewed,
        ROUND(AVG(CASE WHEN rating > 0 THEN rating END), 1) as avg_rating
      FROM resumes
    `).get() as any

    // Skill frequency across all resumes
    const allSkillRows = db.prepare(
      `SELECT parsed_skills FROM resumes WHERE parsed_skills != '[]'`
    ).all() as { parsed_skills: string }[]

    const skillMap = new Map<string, number>()
    for (const row of allSkillRows) {
      try {
        const skills: string[] = JSON.parse(row.parsed_skills)
        for (const s of skills) skillMap.set(s, (skillMap.get(s) || 0) + 1)
      } catch {}
    }
    const top_skills = Array.from(skillMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([skill, count]) => ({ skill, count }))

    // Experience distribution buckets
    const buckets = [
      { range: '0-1 yrs', min: 0,  max: 1  },
      { range: '1-3 yrs', min: 1,  max: 3  },
      { range: '3-5 yrs', min: 3,  max: 5  },
      { range: '5-8 yrs', min: 5,  max: 8  },
      { range: '8+ yrs',  min: 8,  max: 999 },
    ]
    const by_experience = buckets.map(({ range, min, max }) => {
      const row = db.prepare(
        `SELECT COUNT(*) as count FROM resumes WHERE experience_years >= ? AND experience_years < ?`
      ).get(min, max) as { count: number }
      return { range, count: row?.count ?? 0 }
    })

    // Upload trend — last 14 days
    const recent_uploads = db.prepare(`
      SELECT date(uploaded_at) as date, COUNT(*) as count
      FROM resumes
      WHERE uploaded_at >= date('now', '-14 days')
      GROUP BY date(uploaded_at)
      ORDER BY date ASC
    `).all() as { date: string; count: number }[]

    return NextResponse.json({
      ...(totals ?? {}),
      top_skills,
      by_experience,
      recent_uploads,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
