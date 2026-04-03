'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ShieldCheck, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'

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

  // Watch for session
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/resumes')
        router.refresh()
      }
    })
  }, [supabase, router])

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    
    // Using simple redirectTo for maximum compatibility
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/api/auth/callback',
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
            emailRedirectTo: window.location.origin + '/api/auth/callback'
          }
        })
        if (error) throw error
        alert('Signup Success! Since email confirmation is off, you can now Sign In.')
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/resumes')
        router.refresh()
      }
    } catch (err: any) {
      alert('Authentication Alert: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-grid-white/[0.02]">
      {/* Background Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[160px] pointer-events-none opacity-50" />
      
      <div className="w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-500">
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[40px] p-10 border border-white/5 shadow-2xl space-y-6 ring-1 ring-white/5">
          
          <div className="text-center space-y-2">
             <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-brand-500/20 mb-4 transition-transform hover:scale-110">
                <ShieldCheck size={32} className="text-white" />
             </div>
             <h1 className="text-3xl font-extrabold tracking-tighter text-white uppercase">Elyvion Access</h1>
             <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] leading-tight">
                {mode === 'signin' ? 'Verify Recruiter Identity' : 'Audit Protocol Registration'}
             </p>
          </div>

          <div className="space-y-6 pt-2">
            {/* Google OAuth (Primary) */}
            <button
               onClick={handleGoogleLogin}
               disabled={googleLoading || loading}
               className="group relative w-full bg-white text-black hover:bg-slate-200 py-4.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl disabled:opacity-50"
            >
               {googleLoading ? (
                  <Loader2 className="animate-spin text-brand-600" size={20} />
               ) : (
                  <>
                     <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                     Login with Google SSO
                  </>
               )}
            </button>

            <div className="flex items-center gap-4 py-1">
               <div className="h-px bg-white/5 flex-1" />
               <span className="text-[10px] text-slate-700 uppercase font-black tracking-widest">or</span>
               <div className="h-px bg-white/5 flex-1" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative group">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-500 transition-colors" />
                  <input 
                    type="text" required placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm outline-none focus:border-brand-500/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-slate-700 font-medium"
                  />
                </div>
              )}
              
              <div className="relative group">
                 <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-500 transition-colors" />
                 <input 
                   type="email" required placeholder="Work Email" value={email} onChange={(e) => setEmail(e.target.value)}
                   className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm outline-none focus:border-brand-500/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-slate-700 font-medium"
                 />
              </div>

              <div className="relative group pb-2">
                 <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-500 transition-colors" />
                 <input 
                   type="password" required placeholder="Security Key" value={password} onChange={(e) => setPassword(e.target.value)}
                   className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm outline-none focus:border-brand-500/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-slate-700 font-medium"
                 />
              </div>

              <button
                 type="submit" disabled={loading || googleLoading}
                 className="w-full bg-brand-600 hover:bg-brand-500 text-white py-4.5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_20px_40px_-12px_rgba(99,102,241,0.4)] disabled:opacity-50"
              >
                 {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                       {mode === 'signin' ? 'Verify Identity' : 'Register Auditor'}
                       <ArrowRight size={18} />
                    </>
               )}
              </button>
            </form>

            <div className="pt-2 text-center">
               <button 
                 onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                 className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600 hover:text-brand-400 transition-colors"
               >
                  {mode === 'signin' ? "Request Access Protocol" : "Return to Authenticator"}
               </button>
            </div>
          </div>

          <p className="text-[9px] text-slate-800 text-center font-black uppercase tracking-tight opacity-40">
             Audit System 7-A · Enterprise Tier Protection
          </p>

        </div>
      </div>
    </div>
  )
}
