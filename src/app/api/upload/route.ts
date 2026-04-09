import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { parseResume } from '@/lib/parser'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'
import JSZip from 'jszip'

/**
 * Sanitize a filename for Supabase Storage.
 * Replaces spaces and any character that is not alphanumeric, dash, underscore, or dot with underscores.
 */
function sanitizeStorageKey(filename: string): string {
  return filename
    .replace(/\s+/g, '_')            // spaces → underscore
    .replace(/[^a-zA-Z0-9._\-]/g, '_') // any other special char → underscore
    .replace(/_+/g, '_')              // collapse consecutive underscores
}

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
      ${rawText.slice(0, 10000)} 
      """

      Return ONLY a JSON object with exactly these keys:
      {
        "name": "Full Name",
        "email": "Email Address",
        "phone": "Phone Number",
        "location": "City, Country",
        "currentSalary": "Salary if mentioned",
        "skills": ["Skill 1", "Skill 2"],
        "experience": [{"title": "Job Title", "company": "Company Name", "duration": "Dates", "description": "Summary"}],
        "education": [{"degree": "Degree Name", "institution": "School Name", "year": "Year"}],
        "summary": "Professional summary paragraph",
        "experienceYears": 0.0,
        "suggestedFolder": "AI | Software Engineer | Sales | Marketing | Design | Uncategorized"
      }

      CRITICAL EXTRACTION RULES (Current Date: April 2026):
      1. NAME: The name is usually at the very top of the text. Do not return "Unknown" or "N/A" if any human-like name is present. CRITICAL: Do NOT extract document titles or section headers like "RESUME", "CURRICULUM VITAE", "CV", "ACADEMIC PROFILE", "PROFILE", "CAREER OBJECTIVE", "OBJECTIVE", or "PERSONAL DETAILS" as the name. Look for the actual human name (e.g., "John Doe", "Naresh Pal Singh"). Sometimes the name is explicitly labeled inside the document (e.g., "Name : Naresh Pal Singh" or "Name- Naresh").
      2. EXPERIENCE YEARS: Calculate 'experienceYears' as a single decimal (e.g., 3.5). Sum up all unique professional work durations.
      3. HANDLING "PRESENT": If a job says "to Present" or "to Current", use April 2026 as the end date.
      4. IGNORE EDUCATION: Do NOT add years from education, degrees, 10th/12th grade, or university duration into 'experienceYears'. 
      5. OVERLAPS: If multiple jobs overlap in time, do not double-count those years.
      6. PRECISION: If the resume summarizes it (e.g., "11+ years of expertise"), use that value (11.0).
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
  const cookieStore = cookies()
  const supabaseServer = createServerClient(
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
  
  const { data: { session } } = await supabaseServer.auth.getSession()

  try {
    const formData = await req.formData()
    const folder = formData.get('folder') as string || 'Uncategorized'
    const files = formData.getAll('files') as File[]
    
    console.log(`Received upload request with ${files.length} files. Folder: ${folder}`)
    
    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    const results = []
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const ext = path.extname(file.name).toLowerCase()
        const mimeType = file.type || 'application/octet-stream'
        // Sanitize filename so Supabase Storage doesn't reject it (no brackets, spaces, etc.)
        const sanitizedName = sanitizeStorageKey(file.name)
        const uniqueName = `${Date.now()}-${sanitizedName}`

        // Keep the human-readable display name (original filename without .zip)
        let displayName = file.name
        if (displayName.endsWith('.zip')) {
           displayName = displayName.replace(/\.zip$/, '')
        }

        // 1. Upload to Storage using the authenticated server client
        const { error: storageError } = await supabaseServer.storage
          .from('resumes')
          .upload(uniqueName, buffer, { contentType: mimeType, upsert: true });

        if (storageError) throw storageError;

        // 2. AI Parse
        let parsed: any = { rawText: '', embedding: null, name: '', email: '', phone: '', location: '', currentSalary: '', skills: [], experience: [], education: [], summary: '', experienceYears: 0, suggestedFolder: 'Uncategorized' }
        
        let parseBuffer = buffer;
        let parseExt = ext;
        
        // Handle Auto-Compressed (Zipped) files
        if (ext === '.zip') {
            try {
                const zip = new JSZip();
                const contents = await zip.loadAsync(buffer);
                const firstFile = Object.values(contents.files)[0];
                if (firstFile && !firstFile.dir) {
                    parseBuffer = Buffer.from(await firstFile.async('arraybuffer'));
                    parseExt = path.extname(firstFile.name).toLowerCase();
                }
            } catch (e) {
                console.error('Unzip error:', e);
            }
        }

        if (['.pdf', '.docx', '.txt'].includes(parseExt)) {
            parsed = await extractDocumentData(parseBuffer, parseExt)
        }

        const finalFolder = (folder === 'Uncategorized' && parsed.suggestedFolder) 
            ? parsed.suggestedFolder 
            : folder;

        // 3. Database Insert using the authenticated server client
        const { data, error } = await supabaseServer.from('resumes').insert({
            original_name: displayName,
            filename: uniqueName,
            file_path: uniqueName,
            file_size: buffer.length,
            mime_type: mimeType,
            raw_text: parsed.rawText,
            embedding: parsed.embedding,
            parsed_name: parsed.name,
            parsed_email: parsed.email,
            parsed_phone: parsed.phone,
            parsed_location: parsed.location,
            parsed_salary: parsed.currentSalary,
            parsed_skills: parsed.skills,
            parsed_experience: parsed.experience,
            parsed_education: parsed.education,
            parsed_summary: parsed.summary,
            experience_years: parsed.experienceYears,
            folder: finalFolder,
        }).select().single()

        if (error) {
            console.error('Supabase DB Insert Error:', error)
            throw error
        }

        // 4. AUDIT LOGGING: Record the upload
        if (session) {
           await supabaseServer.from('audit_logs').insert({
              user_id: session.user.id,
              user_name: session.user.user_metadata?.full_name || session.user.email,
              action: 'upload',
              details: { filename: file.name, folder: finalFolder, resume_id: data.id }
           })
        }

        results.push({ name: file.name, status: 'success', id: data.id })
      } catch (fErr: any) {
        console.error(`Error processing file ${file.name}:`, fErr)
        results.push({ name: file.name, status: fErr.message })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
