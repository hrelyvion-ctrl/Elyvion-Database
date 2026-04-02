import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { getDb, UPLOADS_PATH } from '@/lib/db'
import { parseResume } from '@/lib/parser'

function uniqueFilename(originalName: string): string {
  const ext = path.extname(originalName)
  const id = Math.random().toString(36).slice(2, 10) + Date.now()
  return `${id}${ext}`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const db = await getDb()
    const results: { name: string; id: number; status: string }[] = []

    for (const file of files) {
      try {
        const allowedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ]
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
          results.push({ name: file.name, id: -1, status: 'error: unsupported file type' })
          continue
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const filename = uniqueFilename(file.name)
        const filePath = path.join(UPLOADS_PATH, filename)
        await writeFile(filePath, buffer)

        // Extract text from file
        let rawText = ''
        try {
          if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const pdfParse = (await import('pdf-parse')).default
            const data = await pdfParse(buffer)
            rawText = data.text
          } else if (file.name.endsWith('.docx')) {
            const mammoth = await import('mammoth')
            const result = await mammoth.extractRawText({ buffer })
            rawText = result.value
          } else {
            rawText = buffer.toString('utf-8')
          }
        } catch (_parseErr) {
          rawText = ''
        }

        // Parse structured data from text
        const parsed = parseResume(rawText)

        const result = db.prepare(`
          INSERT INTO resumes (
            filename, original_name, file_path, file_size, mime_type, raw_text,
            parsed_name, parsed_email, parsed_phone, parsed_skills, parsed_experience,
            parsed_education, parsed_summary, experience_years
          ) VALUES (
            @filename, @original_name, @file_path, @file_size, @mime_type, @raw_text,
            @parsed_name, @parsed_email, @parsed_phone, @parsed_skills, @parsed_experience,
            @parsed_education, @parsed_summary, @experience_years
          )
        `).run({
          filename,
          original_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          raw_text: rawText.slice(0, 50000),
          parsed_name: parsed.name,
          parsed_email: parsed.email,
          parsed_phone: parsed.phone,
          parsed_skills: JSON.stringify(parsed.skills),
          parsed_experience: JSON.stringify(parsed.experience),
          parsed_education: JSON.stringify(parsed.education),
          parsed_summary: parsed.summary,
          experience_years: parsed.experienceYears,
        })

        results.push({ name: file.name, id: Number(result.lastInsertRowid), status: 'success' })
      } catch (err: any) {
        results.push({ name: file.name, id: -1, status: `error: ${err.message}` })
      }
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
