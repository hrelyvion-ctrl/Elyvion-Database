import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    const { searchParams } = new URL(req.url)
    const q     = searchParams.get('q')?.trim() || ''
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    if (!q) {
      return NextResponse.json({ resumes: [], pagination: { total: 0, pages: 0, page, limit } })
    }

    // Build FTS5 query — prefix each term with * for prefix search
    const ftsQuery = q
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(w => `"${w.replace(/"/g, '')}"*`)
      .join(' ')

    try {
      const resumes = db.prepare(`
        SELECT r.id, r.filename, r.original_name, r.parsed_name, r.parsed_email, r.parsed_phone,
               r.parsed_skills, r.parsed_education, r.parsed_summary, r.experience_years,
               r.status, r.rating, r.tags, r.uploaded_at,
               bm25(resumes_fts) as rank
        FROM resumes_fts
        JOIN resumes r ON r.id = resumes_fts.rowid
        WHERE resumes_fts MATCH @query
        ORDER BY rank
        LIMIT @limit OFFSET @offset
      `).all({ query: ftsQuery, limit, offset })

      const totalRow = db.prepare(`
        SELECT COUNT(*) as total FROM resumes_fts WHERE resumes_fts MATCH @query
      `).get({ query: ftsQuery }) as { total: number } | undefined

      const total = totalRow?.total ?? 0

      return NextResponse.json({
        resumes,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        query: q,
      })
    } catch (_ftsErr) {
      // Fallback: LIKE-based search
      const likeQ = `%${q}%`
      const resumes = db.prepare(`
        SELECT id, filename, original_name, parsed_name, parsed_email, parsed_phone,
               parsed_skills, parsed_education, parsed_summary, experience_years,
               status, rating, tags, uploaded_at
        FROM resumes
        WHERE parsed_name LIKE ? OR parsed_email LIKE ? OR parsed_skills LIKE ? OR raw_text LIKE ?
        ORDER BY uploaded_at DESC
        LIMIT ? OFFSET ?
      `).all(likeQ, likeQ, likeQ, likeQ, limit, offset)

      return NextResponse.json({
        resumes,
        pagination: { page, limit, total: resumes.length, pages: 1 },
        query: q,
      })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
