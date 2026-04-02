'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogIn, Globe, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
       alert('Login Error: ' + error.message)
       setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-500">
        <div className="glass rounded-[40px] p-12 border-brand-500/20 shadow-2xl space-y-8 text-center ring-1 ring-white/5 bg-white/[0.02]">
          <div className="space-y-3">
             <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-brand-500/20 group">
                <ShieldCheck size={32} className="text-white" />
             </div>
             <h1 className="text-4xl font-extrabold tracking-tighter gradient-text uppercase">Elyvion Portal</h1>
             <p className="text-slate-500 text-sm font-medium">Enterprise Access Control</p>
          </div>
          <button
             onClick={handleGoogleLogin}
             disabled={loading}
             className="w-full bg-white text-black hover:bg-slate-200 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
             {loading ? "Authenticating..." : (
                <>
                   <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                   Login with Google
                </>
             )}
          </button>
          <div className="flex items-center gap-4 py-2">
             <div className="h-px bg-white/5 flex-1" />
             <span className="text-[10px] text-slate-700 uppercase font-black tracking-widest">Master Dashboard Ready</span>
             <div className="h-px bg-white/5 flex-1" />
          </div>
          <p className="text-[10px] text-slate-600 max-w-[240px] mx-auto uppercase tracking-tighter leading-tight font-black">
             Unauthorized access is prohibited. All actions are logged and audited.
          </p>
        </div>
      </div>
    </div>
  )
}
