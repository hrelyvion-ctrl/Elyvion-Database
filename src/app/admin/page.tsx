'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState, useCallback } from 'react'
import { 
  Users, Shield, CheckCircle, XCircle, Clock, 
  Activity, UserMinus, Upload, Download, Trash2,
  LogIn, FolderPlus, Tag, RefreshCw, AlertCircle
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

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  upload:        { label: 'Upload',         color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Upload },
  download:      { label: 'Download',       color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20',         icon: Download },
  delete:        { label: 'Delete',         color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       icon: Trash2 },
  delete_resume: { label: 'Delete Resume',  color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       icon: Trash2 },
  update_resume: { label: 'Update Resume',  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     icon: Activity },
  bulk_update:   { label: 'Bulk Update',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     icon: Activity },
  login:         { label: 'Login',          color: 'text-brand-400',   bg: 'bg-brand-600/10 border-brand-500/20',     icon: LogIn },
  create_folder: { label: 'Create Folder',  color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20',   icon: FolderPlus },
  delete_folder: { label: 'Delete Folder',  color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       icon: Trash2 },
  create_tag:    { label: 'Create Tag',     color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/20',       icon: Tag },
  delete_tag:    { label: 'Delete Tag',     color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       icon: Tag },
}

function getActionDetail(log: AuditLog): string {
  const d = log.details
  if (!d) return ''
  if (log.action === 'upload')        return d.filename ? `File: ${d.filename}` : ''
  if (log.action === 'download')      return d.filename ? `File: ${d.filename}` : ''
  if (log.action === 'delete')        return d.count ? `${d.count} resume(s) deleted` : ''
  if (log.action === 'delete_resume') return d.resume_id ? `Resume ID: ${d.resume_id}` : ''
  if (log.action === 'update_resume') return d.updates ? `Changed: ${Object.keys(d.updates).join(', ')}` : ''
  if (log.action === 'bulk_update')   return d.count ? `${d.count} resume(s) updated` : ''
  if (log.action === 'login')        return d.ip ? `IP: ${d.ip}` : 'Session started'
  if (log.action === 'create_folder') return d.folder_name ? `Folder: ${d.folder_name}` : ''
  if (log.action === 'delete_folder') return d.folder_name ? `Folder: ${d.folder_name}` : ''
  if (log.action === 'create_tag')   return d.tag_name ? `Tag: ${d.tag_name}` : ''
  if (log.action === 'delete_tag')   return d.tag_id ? `Tag ID: ${d.tag_id}` : ''
  return ''
}

export default function AdminDashboard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshingLogs, setRefreshingLogs] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users')

  const fetchLogs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshingLogs(true)
    try {
      const logsRes = await fetch('/api/admin/logs?limit=100')
      if (logsRes.ok) {
        const lData = await logsRes.json()
        if (Array.isArray(lData)) setLogs(lData)
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    }
    if (showRefresh) setRefreshingLogs(false)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    // Fetch profiles directly - RLS allows authenticated users to read profiles
    const { data: pData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (pData) setProfiles(pData)

    // Fetch audit logs via server-side API route to bypass RLS restrictions
    await fetchLogs()
    setLoading(false)
  }, [supabase, fetchLogs])

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
         <div className="flex items-center gap-3">
           {activeTab === 'logs' && (
             <button
               onClick={() => fetchLogs(true)}
               disabled={refreshingLogs}
               className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all"
             >
               <RefreshCw size={13} className={refreshingLogs ? 'animate-spin' : ''} />
               Refresh
             </button>
           )}
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
                 {logs.length > 0 && (
                   <span className="ml-1.5 px-1.5 py-0.5 text-[9px] rounded-full bg-brand-500/20 text-brand-400">{logs.length}</span>
                 )}
              </button>
           </div>
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
           <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <h2 className="text-xs uppercase font-black text-slate-500 tracking-widest">Activity Timeline</h2>
              <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                {logs.length} event{logs.length !== 1 ? 's' : ''} recorded
              </span>
           </div>
           <div className="max-h-[680px] overflow-y-auto p-4 space-y-2">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                    <AlertCircle size={24} className="text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">No activity recorded yet</p>
                    <p className="text-[10px] text-slate-700 mt-1 font-medium">Actions by your team will appear here automatically.</p>
                  </div>
                </div>
              ) : logs.map(log => {
                const cfg = ACTION_CONFIG[log.action] || {
                  label: log.action,
                  color: 'text-slate-400',
                  bg: 'bg-white/5 border-white/10',
                  icon: Clock
                }
                const IconComp = cfg.icon
                const detail = getActionDetail(log)
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.03] transition-colors group">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <IconComp size={13} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white uppercase tracking-tight">
                          {log.user_name || 'System'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {detail && (
                          <span className="text-[10px] text-slate-600 font-medium truncate max-w-[240px]">{detail}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-700 mt-0.5 font-medium">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
           </div>
        </div>
      )}
    </div>
  )
}
