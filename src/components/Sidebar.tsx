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
  ShieldCheck
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
          // Fetch the profile for the logged in user
          const { data, error } = await supabase
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
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 h-screen bg-[#020617] border-r border-white/5 flex flex-col sticky top-0 animate-in slide-in-from-left-8 duration-700">
      
      {/* Branding */}
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3 group px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:rotate-12 transition-all">
             <ShieldCheck size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-widest uppercase">Elyvion RMS</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Recruiter Portal</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${
                isActive 
                ? 'bg-brand-500/10 text-white shadow-sm ring-1 ring-brand-500/20' 
                : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={isActive ? 'text-brand-400' : 'text-slate-600 group-hover:text-slate-400'} />
                <span className="text-sm font-semibold tracking-wide">{item.name}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse shadow-sm shadow-brand-500" />}
            </Link>
          )
        })}
      </nav>

      {/* Profile & Master Control */}
      <div className="p-4 mt-auto space-y-2 border-t border-white/5 bg-white/[0.01]">
        
        {loading ? (
           <div className="p-4 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 bg-white/5 rounded-full" />
              <div className="space-y-2 flex-1">
                 <div className="h-2 bg-white/5 rounded w-3/4" />
                 <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
           </div>
        ) : (
          <div className="space-y-4">
             {/* Profile Card */}
             <div className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-brand-600/20 rounded-full flex items-center justify-center border border-brand-500/20 ring-1 ring-brand-500/10 overflow-hidden">
                   {profile?.full_name?.charAt(0) || <ShieldCheck size={16} className="text-brand-500" />}
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-xs font-bold text-white truncate uppercase tracking-widest">{profile?.full_name || 'Recruiter'}</span>
                   <span className="text-[10px] text-brand-500 font-black uppercase tracking-widest">{profile?.role || 'Guest'}</span>
                </div>
             </div>

             {/* Master Dashboard Icon - The "Gear" */}
             {profile?.role === 'Master' && (
                <Link 
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all group shadow-lg shadow-amber-500/5"
                >
                   <ShieldAlert size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                   <span className="text-[11px] font-black uppercase tracking-widest">Master Control Room</span>
                   <ChevronRight size={14} className="ml-auto opacity-50" />
                </Link>
             )}

             <button 
               onClick={handleLogout}
               className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-[11px] font-black uppercase tracking-[0.2em]"
             >
                <LogOut size={16} />
                Sign Out Control
             </button>
          </div>
        )}
      </div>

    </aside>
  )
}
