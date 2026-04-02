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
  Crown
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

export default function Sidebar() {
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
    <aside className="w-72 h-screen bg-[#020617] border-r border-white/5 flex flex-col sticky top-0 animate-in slide-in-from-left duration-700">
      
      {/* 👑 PREMIUM ELYVION BRANDING */}
      <div className="p-10">
        <div className="flex items-center gap-4 group">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-amber-600 to-indigo-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/10 group-hover:scale-110 transition-all border border-amber-500/20">
             <Crown size={28} className="text-white drop-shadow-md" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">Elyvion</span>
            <span className="text-[10px] text-amber-500 font-black uppercase tracking-[.3em] mt-1">Recruiter Hub</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-5 py-4 rounded-3xl transition-all group ${
                isActive 
                ? 'bg-brand-500/10 text-white shadow-xl ring-1 ring-brand-500/20' 
                : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} className={isActive ? 'text-brand-400' : 'text-slate-700 group-hover:text-brand-400'} />
                <span className={`text-sm tracking-wide font-black uppercase ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{item.name}</span>
              </div>
              {isActive && <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse shadow-2xl shadow-brand-500" />}
            </Link>
          )
        })}
      </nav>

      {/* Profile & Master Control */}
      <div className="p-6 mt-auto space-y-4 border-t border-white/5 bg-white/[0.01]">
        
        {loading ? (
           <div className="p-4 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-full" />
              <div className="h-4 bg-white/5 rounded w-24" />
           </div>
        ) : (
          <div className="space-y-4">
             {/* Profile Card */}
             <div className="flex items-center gap-4 px-5 py-5 rounded-[40px] bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-brand-500/20 shadow-xl overflow-hidden">
                   <span className="text-sm font-black text-brand-500 uppercase">{profile?.full_name?.charAt(0) || 'E'}</span>
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-[10px] font-black text-white truncate uppercase tracking-widest">{profile?.full_name || 'Recruiter'}</span>
                   <span className="text-[9px] text-brand-500 font-extrabold uppercase tracking-widest">{profile?.role || 'Auditor'}</span>
                </div>
             </div>

             {/* Master Command Hub - Unlocks with SQL */}
             {profile?.role === 'Master' && (
                <Link 
                  href="/admin"
                  className="flex items-center gap-4 px-5 py-5 rounded-[40px] bg-amber-500 text-slate-950 font-black uppercase tracking-[.25em] text-[10px] hover:bg-amber-400 transition-all shadow-2xl shadow-amber-500/20 border-t border-white/20 active:scale-[0.98]"
                >
                   <ShieldAlert size={20} />
                   <span>Master Command</span>
                </Link>
             )}

             <button 
               onClick={handleLogout}
               className="w-full flex items-center gap-4 px-5 py-4 rounded-3xl text-slate-600 hover:text-red-500 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-widest"
             >
                <LogOut size={18} />
                Terminate Session
             </button>
          </div>
        )}
      </div>

    </aside>
  )
}
