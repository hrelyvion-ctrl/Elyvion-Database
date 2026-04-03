'use client'
import { createBrowserClient } from '@supabase/ssr'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Search, 
  Activity, 
  Tags, 
  Settings,
  ShieldAlert,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Crown,
  History
} from 'lucide-react'

// Main Navigation Config
const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Resumes', icon: FileText, href: '/resumes' },
  { name: 'Upload', icon: Upload, href: '/upload' },
  { name: 'Search', icon: Search, href: '/search' },
  { name: 'Analytics', icon: Activity, href: '/analytics' },
  { name: 'Tags', icon: Tags, href: '/tags' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (data) setProfile(data)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }
    getProfile()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <aside className="w-full h-full bg-[#020617] flex flex-col animate-in slide-in-from-left duration-700">
      
      {/* 👑 PREMIUM ELYVION PHOENIX BRANDING */}
      <div className="p-10">
        <div className="flex items-center gap-4 group">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-amber-600 to-indigo-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/20 group-hover:scale-110 transition-all border border-amber-500/20">
             <Crown size={28} className="text-white drop-shadow-md" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">Elyvion Hub</span>
            <span className="text-[11px] text-amber-500 font-bold uppercase tracking-[.25rem] mt-1.5">V4.0 GOLD ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                ? 'bg-amber-500/10 text-white shadow-[0_0_20px_rgba(245,158,11,0.05)] ring-1 ring-amber-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-amber-500/20 shadow-lg shadow-amber-500/10 text-amber-400' : 'bg-white/5 text-slate-500 group-hover:text-amber-400'}`}>
                  <item.icon size={18} />
                </div>
                <span className={`text-[14px] tracking-wide font-bold uppercase ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                  {item.name}
                </span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]" />}
            </Link>
          )
        })}
      </nav>

      {/* Profile & Master Control */}
      <div className="p-4 mt-auto space-y-3 border-t border-white/5 bg-white/[0.01]">
        
        {loading ? (
           <div className="p-3 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded-full" />
              <div className="h-4 bg-white/5 rounded w-20" />
           </div>
        ) : (
          <div className="space-y-3">
             {/* Profile Card */}
             <div className="flex items-center gap-3 px-4 py-4 rounded-3xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all">
                <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 shadow-inner overflow-hidden shrink-0">
                   {profile?.avatar_url ? (
                     <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-xs font-black text-amber-500 uppercase">{profile?.full_name?.charAt(0) || 'E'}</span>
                   )}
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-[12px] font-black text-white truncate uppercase tracking-widest">{profile?.full_name || 'MASTER'}</span>
                   <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest opacity-80">{profile?.role || 'Auditor'}</span>
                </div>
             </div>

             {/* Master Command Hub */}
             {profile?.role === 'Master' && (
                <Link 
                  href="/admin"
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-amber-600 text-slate-950 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-400 transition-all shadow-[0_10px_30px_rgba(217,119,6,0.15)] border-t border-white/20 active:scale-[0.98] group"
                >
                   <History size={16} className="group-hover:rotate-12 transition-transform" />
                   <span>Master Command</span>
                </Link>
             )}

             <button 
               onClick={handleLogout}
               className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all text-[11px] font-bold uppercase tracking-[0.1em] border border-transparent hover:border-red-400/10"
             >
                <LogOut size={14} />
                Disconnect Session
             </button>
          </div>
        )}
      </div>

    </aside>
  )
}
