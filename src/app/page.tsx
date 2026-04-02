'use client'
import { useEffect, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'

function HomeContent() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  useEffect(() => {
    async function handleAuth() {
      // If we see a Google code in the URL, exchange it IMMEDIATELY
      if (code) {
        console.log('Detected Google code on Home Page. Exchanging...')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
           router.push('/resumes')
           return
        }
      }

      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/resumes')
      } else {
        router.push('/login')
      }
    }
    handleAuth()
  }, [supabase, router, code])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-grid-white/[0.02]">
       <div className="text-center space-y-6 animate-pulse">
          <div className="w-20 h-20 bg-brand-600/20 rounded-3xl mx-auto flex items-center justify-center border border-brand-500/20">
             <ShieldCheck size={36} className="text-brand-500" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-[0.4em] text-slate-500">Security Handshake Enabled...</h2>
          <Loader2 className="animate-spin text-brand-600 mx-auto" size={24} />
       </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center p-6 bg-grid-white/[0.02] animate-pulse" />}>
      <HomeContent />
    </Suspense>
  )
}
