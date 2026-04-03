'use client'
import { useEffect, useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShieldCheck, 
  Loader2, 
  Users, 
  Database, 
  CheckCircle2,
  Activity,
  Search,
  Map,
  Terminal
} from 'lucide-react'

function DashboardLayout() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [totalResumes, setTotalResumes] = useState(0)
  const [recentResumes, setRecentResumes] = useState<any[]>([])
  const [topSkills, setTopSkills] = useState<string[]>([])

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
      
      setTotalResumes(count || 0)

      // Fetch Recent
      const { data: recent } = await supabase
        .from('resumes')
        .select('id, parsed_name, status, uploaded_at, parsed_skills')
        .order('uploaded_at', { ascending: false })
        .limit(5)
      
      setRecentResumes(recent || [])

      // Mock top skills for UI value
      setTopSkills(['React.js', 'Python', 'AWS', 'Next.js', 'TypeScript', 'Node.js', 'SQL'])
      
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
         <h1 className="text-standard-header text-white uppercase italic">Executive Command</h1>
         <div className="h-0.5 w-8 bg-brand-500 rounded-full" />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Audit Search', icon: Search, desc: 'Query database' },
          { title: 'Map Talent', icon: Map, desc: 'Visualize density' },
          { title: 'System Health', icon: Terminal, desc: 'Node status' }
        ].map((action) => (
          <button key={action.title} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all text-left group">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
              <action.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase">{action.title}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">{action.desc}</p>
            </div>
          </button>
        ))}
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
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.1)] border border-brand-500/20">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Recent Activity Feed */}
         <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Live Accession Feed</h3>
               <Link href="/resumes" className="text-[10px] uppercase font-bold text-brand-500 hover:text-brand-400 transition-colors">Digital Archive →</Link>
            </div>
            
            <div className="space-y-4">
               {recentResumes.length === 0 ? (
                  <p className="text-xs text-slate-600 italic py-4">No recent accessions found.</p>
               ) : recentResumes.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all group cursor-pointer" onClick={() => router.push(`/resumes/${r.id}`)}>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600/20 to-brand-900/20 flex items-center justify-center text-[10px] font-bold text-brand-500 border border-brand-500/10">
                           {r.parsed_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-100 group-hover:text-brand-400 transition-colors">{r.parsed_name}</p>
                           <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-0.5">{new Date(r.uploaded_at).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border border-white/10 ${r.status === 'new' ? 'text-brand-400 bg-brand-400/5' : 'text-slate-500'}`}>{r.status}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Talent Density Map */}
         <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 space-y-8">
            <div>
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Core Talent Density</h3>
               <div className="flex flex-wrap gap-2">
                  {topSkills.map((s, i) => (
                     <div key={s} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-400 hover:border-brand-500/30 hover:text-brand-400 transition-all flex items-center gap-2">
                        {s}
                     </div>
                  ))}
               </div>
            </div>
            
            <div className="space-y-6 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <p className="text-[8px] uppercase font-black text-slate-600 tracking-widest mb-1">Node Stability</p>
                      <p className="text-xl font-black text-amber-500">98.4%</p>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <p className="text-[8px] uppercase font-black text-slate-600 tracking-widest mb-1">Decrypt Speed</p>
                      <p className="text-xl font-black text-brand-400">1.2s</p>
                   </div>
                </div>
                
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-slate-500">Resource Utilization</span>
                      <span className="text-[9px] font-bold text-brand-400">42%</span>
                   </div>
                   <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-brand-500 h-full w-[42%] shadow-[0_0_10px_#6366f1]" />
                   </div>
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
