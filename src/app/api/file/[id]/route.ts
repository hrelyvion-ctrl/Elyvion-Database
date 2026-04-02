import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import fs from 'fs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb()
    const resume = db.prepare(
      'SELECT file_path, original_name, mime_type FROM resumes WHERE id = ?'
    ).get(parseInt(params.id)) as { file_path: string; original_name: string; mime_type: string } | undefined

    if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!fs.existsSync(resume.file_path)) {
      return NextResponse.json({ error: 'File not on disk' }, { status: 404 })
    }

    const buffer = fs.readFileSync(resume.file_path)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': resume.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(resume.original_name)}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
