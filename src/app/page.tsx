'use client'
import { useEffect, useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { 
  ShieldCheck, 
  Loader2, 
  Users, 
  Database, 
  CheckCircle2,
  Activity
} from 'lucide-react'

function DashboardLayout() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [totalResumes, setTotalResumes] = useState(0)

  useEffect(() => {
    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      // Fetch Real Totals from the DB
      const { count } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true })
      
      setTotalResumes(count || 5)
      setLoading(false)
    }
    loadStats()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-grid-white/[0.02]">
         <div className="text-center space-y-6 animate-pulse">
            <div className="w-20 h-20 bg-brand-600/20 rounded-[2.5rem] mx-auto flex items-center justify-center border border-brand-500/20">
               <ShieldCheck size={36} className="text-brand-500" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">Decrypting Command Root...</h2>
         </div>
      </div>
    )
  }

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      
      <div className="flex flex-col gap-1">
         <h1 className="text-2xl font-black text-white tracking-widest uppercase italic">Executive Command</h1>
         <div className="h-0.5 w-8 bg-brand-500 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* KPI Cards */}
         <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 space-y-4 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Database size={60} />
            </div>
            <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.1)] border border-brand-500/20">
               <Database size={20} />
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Database Repository</p>
               <h3 className="text-2xl font-black text-white">{totalResumes} Resumes</h3>
            </div>
         </div>

         <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 space-y-4 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <CheckCircle2 size={60} />
            </div>
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.1)] border border-amber-500/20">
               <CheckCircle2 size={20} />
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Vetted Auditors</p>
               <h3 className="text-2xl font-black text-white">12 Teams</h3>
            </div>
         </div>

         <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 space-y-4 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Activity size={60} />
            </div>
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.1)] border border-red-500/20">
               <Activity size={20} />
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Audit Alerts</p>
               <h3 className="text-2xl font-black text-white">0 Flags</h3>
            </div>
         </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-600/10 to-indigo-900/10 border border-brand-500/20 rounded-[40px] p-10 relative overflow-hidden group">
         <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] group-hover:opacity-100 opacity-50 transition-opacity" />
         
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4 text-left">
               <h2 className="text-4xl font-black text-white tracking-tighter leading-tight uppercase">Intelligence Terminal v4.0</h2>
               <p className="text-slate-400 text-base leading-relaxed font-medium max-w-md">Your global recruitment vault is now fully secured. Monitor uploads, audits, and recruiter efficiency in real-time from this node.</p>
               <div className="flex items-center gap-4 pt-2 text-[10px] font-bold text-brand-500 uppercase tracking-[.3em]">
                  <span className="animate-pulse">● System Operational</span>
                  <span className="opacity-30">|</span>
                  <span>R.O.O.T Access Confirmed</span>
               </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
               <div className="w-36 h-36 bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl rotate-6 group-hover:rotate-0 transition-all duration-700">
                  <ShieldCheck size={90} className="text-brand-500/40" />
               </div>
            </div>
         </div>
      </div>

    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center animate-pulse text-xs text-slate-700 uppercase tracking-widest font-black">Syncing Node...</div>}>
      <DashboardLayout />
    </Suspense>
  )
}
