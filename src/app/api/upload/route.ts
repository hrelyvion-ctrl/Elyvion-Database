import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { parseResume } from '@/lib/parser'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
const embedder = genAI.getGenerativeModel({ model: 'text-embedding-004' })

async function generateEmbedding(text: string) {
  try {
    const result = await embedder.embedContent(text.slice(0, 10000))
    return result.embedding.values
  } catch (err) {
    console.error('Embedding error:', err)
    return null
  }
}

async function extractWithAI(rawText: string) {
  try {
    const prompt = `
      You are an expert HR resume parser. Extract the following information from the resume text provided below into a structured JSON format. 
      Be extremely accurate with name, email, and total years of professional experience.
      
      Resume Text:
      """
      ${rawText.slice(0, 8000)} 
      """

      Return ONLY a JSON object with exactly these keys:
      {
        "name": "Full Name",
        "email": "Email Address",
        "phone": "Phone Number",
        "skills": ["Skill 1", "Skill 2"],
        "experience": [{"title": "Job Title", "company": "Company Name", "duration": "Dates", "description": "Summary"}],
        "education": [{"degree": "Degree Name", "institution": "School Name", "year": "Year"}],
        "summary": "Professional summary paragraph",
        "experienceYears": 0.0
      }
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Clean JSON response (GEMINI sometimes wraps in ```json ... ```)
    const cleanJson = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleanJson)
  } catch (err) {
    console.error('Gemini Parse Error, falling back to Regex:', err)
    return parseResume(rawText) // Fallback to our local parser
  }
}

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
    
    // Using Gemini for High Precision Extraction
    const parsed = await extractWithAI(rawText);
    
    // Generate embedding for Semantic Search
    const embedding = await generateEmbedding(rawText);

    return { rawText, embedding, ...parsed };
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

        // Parse content with AI
        let parsed: any = { rawText: '', embedding: null, name: '', email: '', phone: '', skills: [], experience: [], education: [], summary: '', experienceYears: 0 }
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
            embedding: parsed.embedding,
            parsed_name: parsed.name,
            parsed_email: parsed.email,
            parsed_phone: parsed.phone,
            parsed_skills: JSON.stringify(parsed.skills),
            parsed_experience: JSON.stringify(parsed.experience),
            parsed_education: JSON.stringify(parsed.education),
            parsed_summary: parsed.parsed_summary || parsed.summary || '',
            experience_years: parsed.experienceYears || parsed.experience_years || 0,
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
