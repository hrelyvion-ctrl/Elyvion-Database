import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini for query embedding
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const embedder = genAI.getGenerativeModel({ model: 'text-embedding-004' })

export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
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

  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''

    if (!q) {
      return NextResponse.json({ resumes: [], pagination: { total: 0, pages: 0, page: 1, limit: 10 } })
    }

    // 1. Generate Query Embedding
    let queryEmbedding
    try {
      const result = await embedder.embedContent(q)
      queryEmbedding = result.embedding.values
    } catch (e) {
      console.error('Embedding error, falling back to ILIKE search:', e)
    }

    // 2. Perform Search
    if (queryEmbedding) {
      // Semantic vector search via Supabase RPC
      const { data: resumes, error } = await supabase.rpc('match_resumes', {
        query_embedding: queryEmbedding,
        match_threshold: 0.25,
        match_count: 20
      })

      if (error) throw new Error(error.message)

      return NextResponse.json({
        resumes: (resumes || []).map((r: any) => ({
           ...r,
           match_score: Math.round(r.similarity * 100)
        })),
        is_semantic: true
      })
    } else {
      // Fallback: ILIKE keyword matching
      const likeQ = `%${q}%`
      const { data: resumes, error } = await supabase.from('resumes')
        .select('id, parsed_name, parsed_email, parsed_phone, parsed_skills, parsed_summary, experience_years, status, rating, folder, uploaded_at, original_name, filename')
        .or(`parsed_name.ilike.${likeQ},parsed_email.ilike.${likeQ},parsed_skills.ilike.${likeQ},raw_text.ilike.${likeQ}`)
        .order('uploaded_at', { ascending: false })
        .limit(20)

      if (error) throw new Error(error.message)

      return NextResponse.json({
        resumes: resumes || [],
        is_semantic: false
      })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
