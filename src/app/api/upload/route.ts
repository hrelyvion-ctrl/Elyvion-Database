import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { parseResume } from '@/lib/parser'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import path from 'path'

async function extractDocumentData(buffer: Buffer, ext: string) {
    let rawText = '';
    if (ext === '.pdf') {
        const data = await pdf(buffer);
        rawText = data.text;
    } else if (ext === '.docx') {
        const data = await mammoth.extractRawText({ buffer });
        rawText = data.value;
    } else if (ext === '.txt') {
        rawText = buffer.toString('utf-8');
    }
    const parsed = parseResume(rawText);
    return { rawText, ...parsed };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 })

    const results = []

    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const ext = path.extname(file.name).toLowerCase()
        const mimeType = file.type || (ext === '.pdf' ? 'application/pdf' : 'application/octet-stream')
        const uniqueName = Date.now() + '-' + Math.random().toString(36).slice(2) + ext

        // Upload physical file to Supabase Storage Bucket
        const { error: storageError } = await supabase.storage
          .from('resumes')
          .upload(uniqueName, buffer, {
             contentType: mimeType,
             upsert: true
          });

        if (storageError) throw storageError;

        // Parse content natively
        let parsed: any = { rawText: '', name: '', email: '', phone: '', skills: [], experience: [], education: [], summary: '', experienceYears: 0 }
        if (['.pdf', '.docx', '.txt'].includes(ext)) {
            parsed = await extractDocumentData(buffer, ext)
        }

        // Insert to Supabase Postgres Database
        const { data, error } = await supabase.from('resumes').insert({
            original_name: file.name,
            filename: uniqueName,
            file_path: uniqueName,
            file_size: buffer.length,
            mime_type: mimeType,
            raw_text: parsed.rawText,
            parsed_name: parsed.name,
            parsed_email: parsed.email,
            parsed_phone: parsed.phone,
            parsed_skills: JSON.stringify(parsed.skills),
            parsed_experience: JSON.stringify(parsed.experience),
            parsed_education: JSON.stringify(parsed.education),
            parsed_summary: parsed.summary,
            experience_years: parsed.experienceYears || 0,
            status: 'new'
        }).select().single()

        if (error) throw error

        results.push({ name: file.name, status: 'success', id: data.id })
      } catch (fErr: any) {
        results.push({ name: file.name, status: fErr.message })
      }
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
