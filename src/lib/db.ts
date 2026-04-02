import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Missing SUPABASE_URL")
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Missing SUPABASE_ANON_KEY")

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Legacy UPLOADS_PATH exported just in case local fallback is ever hit
import path from 'path'
export const UPLOADS_PATH = path.join(process.cwd(), 'uploads')
