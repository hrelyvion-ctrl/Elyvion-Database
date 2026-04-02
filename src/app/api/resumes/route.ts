import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    const { searchParams } = new URL(req.url)

    const page    = Math.max(1, parseInt(searchParams.get('page')   || '1'))
    const limit   = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset  = (page - 1) * limit
    const status  = searchParams.get('status') || 'all'
    const sort    = searchParams.get('sort')   || 'uploaded_at'
    const order   = searchParams.get('order') === 'asc' ? 'ASC' : 'DESC'
    const skill   = searchParams.get('skill')  || ''
    const minExp  = parseFloat(searchParams.get('minExp')   || '0')
    const maxExp  = parseFloat(searchParams.get('maxExp')   || '99')
    const minRating = parseInt(searchParams.get('minRating') || '0')

    const allowedSorts = ['uploaded_at','parsed_name','experience_years','rating','updated_at']
    const safeSort = allowedSorts.includes(sort) ? sort : 'uploaded_at'

    const where: string[] = []
    const params: Record<string, any> = { limit, offset }

    if (status !== 'all')  { where.push('status = @status');              params.status    = status }
    if (skill)             { where.push('parsed_skills LIKE @skill');      params.skill     = `%${skill}%` }
    if (minExp > 0)        { where.push('experience_years >= @minExp');    params.minExp    = minExp }
    if (maxExp < 99)       { where.push('experience_years <= @maxExp');    params.maxExp    = maxExp }
    if (minRating > 0)     { where.push('rating >= @minRating');           params.minRating = minRating }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

    const resumes = db.prepare(`
      SELECT id, filename, original_name, file_size, mime_type,
             parsed_name, parsed_email, parsed_phone, parsed_skills,
             parsed_education, parsed_summary, experience_years,
             status, rating, tags, notes, uploaded_at, updated_at
      FROM resumes ${whereClause}
      ORDER BY ${safeSort} ${order}
      LIMIT @limit OFFSET @offset
    `).all(params)

    const totalRow = db.prepare(
      `SELECT COUNT(*) as total FROM resumes ${whereClause}`
    ).get(params) as { total: number } | undefined

    const total = totalRow?.total ?? 0

    return NextResponse.json({
      resumes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    const { ids } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 })
    }
    const placeholders = ids.map(() => '?').join(',')
    const result = db.prepare(`DELETE FROM resumes WHERE id IN (${placeholders})`).run(...ids)
    return NextResponse.json({ deleted: result.changes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
