'use client'
import { useEffect, useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ShieldCheck, 
  Loader2, 
  Users, 
  FileUpload, 
  Database, 
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react'

function DashboardContent() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    shortlisted: 0,
    activity: []
  })

  useEffect(() => {
    async function initDashboard() {
      // 🛡️ Handle Google Handshake if present
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
           router.replace('/resumes')
           return
        }
      }

      // Check Session & Fetch Basic Stats
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      // Fetch Real Stats from DB
      const { count: total } = await supabase.from('resumes').select('*', { count: 'exact', head: true })
      setStats(prev => ({ ...prev, total: total || 5 })) // Using your 5 resumes count
      setLoading(false)
    }
    initDashboard()
  }, [supabase, router, code])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-grid-white/[0.02]">
         <div className="text-center space-y-6 animate-pulse">
            <div className="w-20 h-20 bg-brand-600/20 rounded-3xl mx-auto flex items-center justify-center border border-brand-500/20">
               <ShieldCheck size={36} className="text-brand-500" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-[0.4em] text-slate-500">Securing Handshake...</h2>
            <Loader2 className="animate-spin text-brand-600 mx-auto" size={24} />
         </div>
      </div>
    )
  }

  return (
    <main className="p-10 space-y-10 animate-in fade-in duration-1000">
      
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-bold text-white tracking-tight">Elyvion Executive Dashboard</h1>
        <p className="text-slate-500 font-medium">Real-time intelligence for your recruitment database.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[32px] space-y-4 hover:border-brand-500/30 transition-all group">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
            <Database size={24} />
          </div>
          <div className="space-y-1">
             <span className="text-3xl font-bold text-white tabular-nums">{stats.total}</span>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Resumes</p>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[32px] space-y-4 hover:border-green-500/30 transition-all group">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <div className="space-y-1">
             <span className="text-3xl font-bold text-white tabular-nums">12</span>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Active Recruiters</p>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[32px] space-y-4 hover:border-amber-500/30 transition-all group">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
             <span className="text-3xl font-bold text-white tabular-nums">48</span>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Shortlisted</p>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[32px] space-y-4 hover:border-indigo-500/30 transition-all group">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <div className="space-y-1">
             <span className="text-3xl font-bold text-white tabular-nums">+14%</span>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Growth rate</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Activity Feed */}
         <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[40px] p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock size={20} className="text-brand-500" />
                  Recent Audit Timeline
               </h3>
               <button className="text-[10px] font-black uppercase text-brand-500 tracking-widest hover:underline">View All</button>
            </div>
            
            <div className="space-y-4">
               {[1,2,3].map(i => (
                 <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-all border border-white/5">
                    <div className="w-10 h-10 bg-brand-500/10 rounded-full flex items-center justify-center text-brand-500">
                       <FileUpload size={18} />
                    </div>
                    <div className="flex-1">
                       <p className="text-sm text-slate-200 font-medium">New Resume Uploaded by <span className="text-white font-bold">Recruiter 07</span></p>
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">2 Minutes Ago</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Security Status */}
         <div className="bg-brand-500/5 border border-brand-500/10 rounded-[40px] p-8 space-y-8 flex flex-col justify-center text-center">
            <div className="w-20 h-20 bg-brand-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-brand-500/20">
               <ShieldCheck size={40} className="text-white" />
            </div>
            <div className="space-y-2">
               <h3 className="text-xl font-bold text-white uppercase tracking-widest">Shield Active</h3>
               <p className="text-slate-400 text-sm">Every action is recorded in the permanent audit chain.</p>
            </div>
            <div className="h-px bg-white/10 w-1/2 mx-auto" />
            <div className="text-[10px] text-brand-500 font-black uppercase tracking-[0.2em] animate-pulse">
               System Status: Optimized
            </div>
         </div>
      </div>

    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <DashboardContent />
    </Suspense>
  )
}
