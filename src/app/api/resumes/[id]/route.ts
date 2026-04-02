import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb()
    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(parseInt(params.id))
    if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(resume)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb()
    const body = await req.json()
    const id = parseInt(params.id)

    const allowed = ['status','rating','notes','tags','parsed_name','parsed_email','parsed_phone','parsed_skills']
    const updates: string[] = []
    const values: Record<string, any> = { id }

    for (const key of allowed) {
      if (key in body) {
        updates.push(`${key} = @${key}`)
        values[key] = typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key]
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    updates.push(`updated_at = datetime('now')`)

    db.prepare(
      `UPDATE resumes SET ${updates.join(', ')} WHERE id = @id`
    ).run(values)

    const updated = db.prepare('SELECT * FROM resumes WHERE id = ?').get(id)
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb()
    const id = parseInt(params.id)
    const result = db.prepare('DELETE FROM resumes WHERE id = ?').run(id)
    if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
