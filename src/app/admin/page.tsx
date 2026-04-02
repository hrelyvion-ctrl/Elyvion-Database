'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState, useCallback } from 'react'
import { 
  Users, Shield, CheckCircle, XCircle, Clock, 
  Activity, ChevronRight, UserMinus
} from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  email: string
  role: 'Master' | 'Senior' | 'Recruiter'
  is_approved: boolean
  last_login: string
}

interface AuditLog {
  id: number
  user_name: string
  action: string
  details: any
  created_at: string
}

export default function AdminDashboard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: pData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: lData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
    
    if (pData) setProfiles(pData)
    if (lData) setLogs(lData)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleApproval = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ is_approved: !current }).eq('id', id)
    fetchData()
  }

  const changeRole = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold gradient-text">Master Control Room</h1>
            <p className="text-slate-400 text-sm mt-1">Manage accounts, roles, and enterprise security.</p>
         </div>
         <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
               <Users size={14} className="inline mr-2" /> Team Accounts
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'logs' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
               <Activity size={14} className="inline mr-2" /> System Logs
            </button>
         </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40 text-brand-500 animate-pulse">
           <Shield size={64} />
        </div>
      ) : activeTab === 'users' ? (
        <div className="glass rounded-[32px] overflow-hidden border-white/5 shadow-2xl">
           <table className="w-full text-sm text-left">
              <thead>
                 <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                    <th className="px-6 py-5">User Account</th>
                    <th className="px-6 py-5">Role</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Last Login</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {profiles.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.01] transition-colors group">
                       <td className="px-6 py-6 font-medium text-slate-200">
                          {p.full_name || p.email}
                       </td>
                       <td className="px-6 py-6">
                          <select 
                            value={p.role} 
                            onChange={(e) => changeRole(p.id, e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg text-xs p-1 text-slate-300 outline-none"
                          >
                             <option value="Recruiter">Recruiter</option>
                             <option value="Senior">Senior Recruiter</option>
                             <option value="Master">Master Admin</option>
                          </select>
                       </td>
                       <td className="px-6 py-6">
                          <button 
                            onClick={() => toggleApproval(p.id, p.is_approved)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${p.is_approved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}
                          >
                             {p.is_approved ? <CheckCircle size={12} /> : <XCircle size={12} />}
                             {p.is_approved ? 'Approved' : 'Pending'}
                          </button>
                       </td>
                       <td className="px-6 py-6 text-xs text-slate-500 font-medium">
                          {p.last_login ? new Date(p.last_login).toLocaleString() : 'Never'}
                       </td>
                       <td className="px-6 py-6 text-right">
                          <button className="text-slate-700 hover:text-rose-500">
                             <UserMinus size={18} />
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      ) : (
        <div className="glass rounded-[32px] overflow-hidden border-white/5">
           <div className="p-6 border-b border-white/5 bg-white/[0.01]">
              <h2 className="text-xs uppercase font-black text-slate-500 tracking-widest text-center">Activity Timeline</h2>
           </div>
           <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto p-4 space-y-3">
              {logs.map(log => (
                 <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group">
                    <div className="w-8 h-8 rounded-xl bg-brand-600/10 flex items-center justify-center shrink-0">
                       <Clock size={14} className="text-brand-400" />
                    </div>
                    <div className="flex-1">
                       <p className="text-sm text-slate-300">
                          <span className="font-bold text-white uppercase">{log.user_name}</span> 
                          <span className="mx-2 text-[10px] uppercase font-black tracking-widest text-slate-700">performed</span> 
                          <span className="px-2 py-0.5 rounded bg-brand-600/20 text-brand-400 text-[10px] font-bold uppercase tracking-widest">{log.action}</span>
                       </p>
                       <p className="text-[11px] text-slate-600 mt-1 font-medium italic">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-800" />
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  )
}
