import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    const tags = db.prepare('SELECT * FROM tags ORDER BY name ASC').all()
    return NextResponse.json(tags)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    const { name, color } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    db.prepare('INSERT OR IGNORE INTO tags (name, color) VALUES (@name, @color)').run({ name: name.trim(), color: color || '#6366f1' })
    const tag = db.prepare('SELECT * FROM tags WHERE name = ?').get(name.trim())
    return NextResponse.json(tag)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    db.prepare('DELETE FROM tags WHERE id = ?').run(id)
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
