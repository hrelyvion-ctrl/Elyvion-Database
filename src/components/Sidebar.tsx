'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Upload, Search, Tag, BarChart2,
  Briefcase, ChevronRight, Database
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { label: 'Dashboard',  href: '/',          icon: LayoutDashboard },
  { label: 'Resumes',    href: '/resumes',    icon: Users },
  { label: 'Upload',     href: '/upload',     icon: Upload },
  { label: 'Search',     href: '/search',     icon: Search },
  { label: 'Analytics',  href: '/analytics',  icon: BarChart2 },
  { label: 'Tags',       href: '/tags',       icon: Tag },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-[var(--border)] flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center glow-sm">
            <Database size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm gradient-text tracking-wide">ELYVION</p>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase">Resume Database</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              <Icon size={17} className={active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto text-brand-500" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            HR
          </div>
          <div>
            <p className="text-xs font-medium text-slate-300">HR Manager</p>
            <p className="text-[10px] text-slate-600">admin@elyvion.io</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-700 text-center mt-3">Elyvion v1.0 · Free Edition</p>
      </div>
    </aside>
  )
}
