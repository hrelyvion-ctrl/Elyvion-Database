'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LogIn, ShieldCheck, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/resumes')
    })
  }, [supabase, router])

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    
    // Auto-detect the correct redirect URL (Local vs Vercel)
    const protocol = window.location.protocol
    const host = window.location.host
    const redirectUrl = `${protocol}//${host}/api/auth/callback`

    console.log('Redirecting to:', redirectUrl)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) {
       alert('Google Login Error: ' + error.message)
       setGoogleLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/api/auth/callback`
          }
        })
        if (error) throw error
        alert('Signup Success! Since email confirmation is off, you can now Sign In.')
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/resumes')
      }
    } catch (err: any) {
      alert('Authentication Alert: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[160px] pointer-events-none opacity-50" />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[48px] p-12 border border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] space-y-10">
          
          <div className="text-center space-y-3">
             <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_40px_-8px_rgba(99,102,241,0.5)] mb-6 transition-all hover:scale-105 active:scale-95 group cursor-pointer">
                <ShieldCheck size={36} className="text-white group-hover:rotate-12 transition-transform" />
             </div>
             <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Elyvion Access</h1>
             <p className="text-slate-400 text-xs font-semibold uppercase tracking-[0.2em]">
                {mode === 'signin' ? 'Enterprise Authentication Root' : 'Audit Protocol Registration'}
             </p>
          </div>

          <div className="space-y-8">
            <button
               onClick={handleGoogleLogin}
               disabled={googleLoading || loading}
               className="group relative w-full bg-white text-slate-950 hover:bg-slate-100 py-5 rounded-2xl font-bold flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 overflow-hidden"
            >
               {googleLoading ? (
                  <Loader2 className="animate-spin" size={20} />
               ) : (
                  <>
                     <img src="https://www.google.com/favicon.ico" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
                     <span className="text-base">Login with Google</span>
                  </>
               )}
            </button>

            <div className="flex items-center gap-6">
               <div className="h-px bg-white/10 flex-1" />
               <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.3em]">Secure Tier</span>
               <div className="h-px bg-white/10 flex-1" />
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative group">
                  <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                  <input 
                    type="text" required placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-5 pl-14 pr-5 text-sm outline-none focus:border-brand-500/50 focus:bg-black/40 transition-all text-white placeholder:text-slate-600 font-medium"
                  />
                </div>
              )}
              
              <div className="relative group">
                 <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                 <input 
                   type="email" required placeholder="Organization Email" value={email} onChange={(e) => setEmail(e.target.value)}
                   className="w-full bg-black/20 border border-white/5 rounded-2xl py-5 pl-14 pr-5 text-sm outline-none focus:border-brand-500/50 focus:bg-black/40 transition-all text-white placeholder:text-slate-600 font-medium"
                 />
              </div>

              <div className="relative group">
                 <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                 <input 
                   type="password" required placeholder="Access Key" value={password} onChange={(e) => setPassword(e.target.value)}
                   className="w-full bg-black/20 border border-white/5 rounded-2xl py-5 pl-14 pr-5 text-sm outline-none focus:border-brand-500/50 focus:bg-black/40 transition-all text-white placeholder:text-slate-600 font-medium"
                 />
              </div>

              <button
                 type="submit" disabled={loading || googleLoading}
                 className="w-full bg-brand-600 hover:bg-brand-500 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_20px_40px_-12px_rgba(99,102,241,0.4)] disabled:opacity-50"
              >
                 {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                 ) : (
                    <>
                       {mode === 'signin' ? 'Verify Identity' : 'Register Protocol'}
                       <ArrowRight size={18} />
                    </>
               )}
              </button>
            </form>

            <div className="pt-4">
               <button 
                 onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                 className="w-full text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 hover:text-white transition-colors text-center"
               >
                  {mode === 'signin' ? "Request Auditor Credentials" : "Return to Authenticator"}
               </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 text-center font-bold uppercase tracking-tight opacity-40">
             Compliance Standard 11.20-B · Secure Transmission Enabled
          </p>

        </div>
      </div>
    </div>
  )
}
