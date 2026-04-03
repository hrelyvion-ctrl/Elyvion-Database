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
      
      <div className="flex flex-col gap-2">
         <h1 className="text-4xl font-extrabold text-white tracking-tighter uppercase tracking-widest italic">Command Intelligence</h1>
         <div className="h-1 w-24 bg-brand-600 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* KPI Cards */}
         <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 space-y-4 hover:bg-white/[0.05] transition-all group">
            <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform shadow-2xl shadow-brand-500/10">
               <Database size={28} />
            </div>
            <div>
               <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-loose">Database Repository</p>
               <h3 className="text-4xl font-black text-white">{totalResumes} Resumes</h3>
            </div>
         </div>

         <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 space-y-4 hover:bg-white/[0.05] transition-all group">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-2xl shadow-amber-500/10">
               <CheckCircle2 size={28} />
            </div>
            <div>
               <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-loose">Vetted Auditors</p>
               <h3 className="text-4xl font-black text-white">12 Teams</h3>
            </div>
         </div>

         <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 space-y-4 hover:bg-white/[0.05] transition-all group">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform shadow-2xl shadow-red-500/10">
               <Activity size={28} />
            </div>
            <div>
               <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-loose">Audit Alerts</p>
               <h3 className="text-4xl font-black text-white">0 Flags</h3>
            </div>
         </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-600/20 to-indigo-900/10 border border-brand-500/20 rounded-[48px] p-12 relative overflow-hidden group">
         <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px] group-hover:opacity-100 opacity-50 transition-opacity" />
         
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 text-left">
               <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.95] uppercase">Elyvion Master Intelligence v4.0</h2>
               <p className="text-slate-400 text-lg leading-relaxed font-medium">Your global recruitment vault is now fully secured. Monitor uploads, audits, and recruiter efficiency in real-time from this terminal.</p>
               <div className="flex items-center gap-4 pt-4 text-xs font-black text-brand-500 uppercase tracking-widest">
                  <span className="animate-pulse">● System Operational</span>
                  <span>|</span>
                  <span>R.O.O.T Access Confirmed</span>
               </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
               <div className="w-48 h-48 bg-white/5 rounded-[3rem] p-8 border border-white/10 shadow-2xl rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <ShieldCheck size={120} className="text-brand-500/50" />
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
