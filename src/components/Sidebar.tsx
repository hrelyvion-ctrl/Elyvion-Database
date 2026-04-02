'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  LayoutDashboard, Users, Upload, Search, Tag, BarChart2,
  ChevronRight, Database, Shield, LogOut
} from 'lucide-react'
import { clsx } from 'clsx'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      }
    }
    getProfile()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { label: 'Dashboard',  href: '/',          icon: LayoutDashboard },
    { label: 'Resumes',    href: '/resumes',    icon: Users },
    { label: 'Upload',     href: '/upload',     icon: Upload },
    { label: 'Search',     href: '/search',     icon: Search },
    { label: 'Analytics',  href: '/analytics',  icon: BarChart2 },
    { label: 'Tags',       href: '/tags',       icon: Tag },
  ]

  // Add Admin link if Master
  if (profile?.role === 'Master') {
    navItems.push({ label: 'Master Control', href: '/admin', icon: Shield })
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-white/5 flex flex-col z-50 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-600/5 to-transparent pointer-events-none" />
      
      {/* Logo */}
      <div className="p-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tighter uppercase gradient-text">Elyvion RMS</p>
            <p className="text-[10px] text-slate-500 tracking-[0.2em] font-black uppercase">Recruiter Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 relative z-10 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group relative',
                active
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'
              )}
            >
              <Icon size={18} className={active ? 'text-brand-400' : 'text-slate-600 group-hover:text-slate-300'} />
              <span>{label}</span>
              {active && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_10px_#6366f1]" />}
            </Link>
          )
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-white/5 bg-white/[0.01] relative z-20 space-y-4">
        {profile ? (
           <div className="flex items-center gap-3 px-3 py-1">
              <div className="w-9 h-9 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
                 {profile.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                 <p className="text-xs font-bold text-slate-200 truncate">{profile.full_name || 'Incomplete'}</p>
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-black tracking-widest text-brand-500">{profile.role}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <span className="text-[9px] text-slate-600 truncate">{profile.email}</span>
                 </div>
              </div>
           </div>
        ) : (
           <div className="animate-pulse flex items-center gap-3 px-3 py-1">
              <div className="w-9 h-9 bg-white/5 rounded-2xl" />
              <div className="space-y-2 flex-1">
                 <div className="h-2 bg-white/5 rounded w-2/3" />
                 <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
           </div>
        )}
        
        <button 
           onClick={handleLogout}
           className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
        >
           <LogOut size={14} /> Sign Out Control
        </button>
      </div>
    </aside>
  )
}
