'use client'
import { useEffect, useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShieldCheck, 
  Loader2, 
  Database, 
  Trash2,
  Activity,
  History,
  TrendingUp,
  BarChart3,
  Calendar,
  UserCheck
} from 'lucide-react'

function DashboardLayout() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [totalResumes, setTotalResumes] = useState(0)
  const [analytics, setAnalytics] = useState<any>(null)
  const [sessionUser, setSessionUser] = useState<any>(null)

  useEffect(() => {
    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setSessionUser(session.user)

      // 1. Fetch Real Totals from the DB
      const { count } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true })
      setTotalResumes(count || 0)

      // 2. Log Login activity
      await fetch('/api/auth/log-login', { method: 'POST' }).catch(console.error)

      // 3. Fetch Analytics Stats
      const res = await fetch('/api/analytics/stats')
      const data = await res.json()
      setAnalytics(data)
      
      setLoading(false)
    }
    loadStats()
  }, [supabase, router])

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 bg-grid-white/[0.02]">
         <div className="text-center space-y-8 animate-pulse">
            <div className="w-24 h-24 bg-brand-600/20 rounded-[2.5rem] mx-auto flex items-center justify-center border border-brand-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
               <ShieldCheck size={44} className="text-brand-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-[0.6em] text-white">Elyvion Intelligence</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">Synchronizing Audit Protocols...</p>
            </div>
         </div>
      </div>
    )
  }

  return (
    <div className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-1000 max-w-[1600px] mx-auto">
      
      {/* Dynamic Command Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div className="space-y-1.5 flex flex-col items-start">
            <div className="px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full flex items-center gap-2 mb-2">
               <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-ping" />
               <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest">Digital Nexus Online</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
              Nexus <span className="text-brand-500">Command</span>
            </h1>
            <p className="text-[11px] text-slate-500 uppercase font-black tracking-[0.3em] pl-1">Auditor Control Protocol v4.0</p>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex flex-col items-end pr-4 border-r border-white/10">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pb-1">System Operator</span>
               <span className="text-sm font-black text-white uppercase">{sessionUser?.user_metadata?.full_name || sessionUser?.email?.split('@')[0]}</span>
            </div>
            <Link href="/upload" className="px-6 py-3.5 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-500 transition-all flex items-center gap-3 shadow-[0_15px_35px_-5px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 active:scale-95 group">
                <Database size={16} />
                <span>Upload Dataset</span>
            </Link>
         </div>
      </div>

      {/* Intelligence Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Network Repository', value: totalResumes, sub: 'Total Profiles', icon: Database, color: 'text-brand-400', bg: 'bg-brand-400/10' },
           { label: 'Data Accessions', value: analytics.totalUploads, sub: 'Current Year', icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
           { label: 'Audit Deletions', value: analytics.totalDeletes, sub: 'Current Year', icon: Trash2, color: 'text-rose-400', bg: 'bg-rose-400/10' },
           { label: 'Operator Logins', value: analytics.totalLogins, sub: 'Current Year', icon: UserCheck, color: 'text-amber-400', bg: 'bg-amber-400/10' },
         ].map((stat) => (
           <div key={stat.label} className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 space-y-4 hover:bg-white/[0.04] transition-all relative overflow-hidden group">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                 <stat.icon size={24} />
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                 <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value.toLocaleString()}</h3>
                 <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">{stat.sub}</p>
              </div>
              <Activity size={80} className="absolute -bottom-4 -right-4 opacity-[0.03] text-white group-hover:opacity-[0.06] transition-all -rotate-12" />
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-10">
         
         {/* Individual Recruiter Analytics (Intelligence Stats) */}
         <div className="lg:col-span-4 bg-[#050505]/40 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden flex flex-col shadow-2xl relative">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500 border border-brand-500/20">
                     <History size={18} />
                  </div>
                  <div>
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Individual Operator Intelligence</h3>
                     <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mt-1">Audit Tracking Metrics (Full Year)</p>
                  </div>
               </div>
               <TrendingUp size={20} className="text-slate-800" />
            </div>

            <div className="flex-1 overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white/[0.01] text-[9px] uppercase font-black text-slate-700 tracking-[0.25rem]">
                        <th className="px-8 py-4">Operator Name</th>
                        <th className="px-8 py-4 text-center">Logins</th>
                        <th className="px-8 py-4 text-center">Uploads</th>
                        <th className="px-8 py-4 text-center">Deletes</th>
                        <th className="px-8 py-4 text-right">Activity Level</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {analytics.individual.map((u: any) => {
                        const total = u.logins + u.uploads + u.deletes
                        const max = Math.max(...analytics.individual.map((i: any) => i.logins + i.uploads + i.deletes)) || 1
                        const percentage = (total / max) * 100
                        return (
                           <tr key={u.name} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase border border-white/5 group-hover:border-brand-500/30 group-hover:text-brand-400 transition-all">
                                       {u.name.charAt(0)}
                                    </div>
                                    <span className="text-xs font-black text-slate-300 uppercase truncate max-w-[150px]">{u.name}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-center text-xs font-black text-amber-500/80">{u.logins}</td>
                              <td className="px-8 py-6 text-center text-xs font-black text-emerald-500/80">{u.uploads}</td>
                              <td className="px-8 py-6 text-center text-xs font-black text-rose-500/80">{u.deletes}</td>
                              <td className="px-8 py-6">
                                <div className="flex items-center justify-end gap-3">
                                   <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden shrink-0">
                                      <div 
                                        className="bg-brand-500 h-full transition-all duration-1000" 
                                        style={{ width: `${percentage}%`, boxShadow: '0 0 10px rgba(99,102,241,0.5)' }} 
                                      />
                                   </div>
                                   <span className="text-[10px] font-black text-slate-600">{Math.round(percentage)}%</span>
                                </div>
                              </td>
                           </tr>
                        )
                     })}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Time-Series Monthly Trends */}
         <div className="lg:col-span-3 bg-[#050505]/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 flex flex-col space-y-8 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                     <Calendar size={18} />
                  </div>
                  <div>
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Temporal Trends</h3>
                     <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mt-1">Audit Flux by Month</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 flex flex-col justify-between pt-4">
               <div className="flex items-end justify-between h-[180px] gap-3 px-2">
                  {analytics.monthly.map((m: any) => {
                     const total = m.uploads + m.deletes
                     const max = Math.max(...analytics.monthly.map((i: any) => i.uploads + i.deletes)) || 1
                     const height = (total / max) * 100
                     return (
                        <div key={m.month} className="flex-1 group relative flex flex-col items-center gap-3">
                           {total > 0 && (
                             <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-600 text-[8px] font-black px-2 py-1 rounded shadow-xl pointer-events-none z-10">
                                {m.uploads}U | {m.deletes}D
                             </div>
                           )}
                           <div className="w-full flex flex-col gap-0.5 justify-end h-full">
                              <div 
                                className="w-full bg-emerald-500/40 rounded-t-sm group-hover:bg-emerald-500 transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                                style={{ height: `${m.uploads > 0 ? (m.uploads / max) * 100 : 0}%` }} 
                              />
                              <div 
                                className="w-full bg-rose-500/40 rounded-b-sm group-hover:bg-rose-500 transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)] group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]" 
                                style={{ height: `${m.deletes > 0 ? (m.deletes / max) * 100 : 0}%` }} 
                              />
                           </div>
                           <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter transition-colors group-hover:text-slate-400">{m.month}</span>
                        </div>
                     )
                  })}
               </div>

               <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500" />
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entry Protcols</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-rose-500" />
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Termination Logs</span>
                  </div>
               </div>
            </div>

            <Activity size={120} className="absolute -bottom-10 -right-10 opacity-[0.02] text-white rotate-12" />
         </div>

      </div>

    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 bg-grid-white/[0.02]">
       <div className="text-center space-y-4 animate-pulse">
          <Loader2 size={36} className="text-brand-500 mx-auto animate-spin" />
          <p className="text-[10px] text-slate-700 uppercase tracking-[0.4em] font-black">Connecting Nexus Control...</p>
       </div>
    </div>}>
      <DashboardLayout />
    </Suspense>
  )
}
