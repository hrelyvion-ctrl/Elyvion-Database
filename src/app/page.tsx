'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Upload, Star, TrendingUp, Clock, Briefcase,
  CheckCircle, XCircle, ArrowUpRight, Sparkles
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

interface Analytics {
  total: number
  new_count: number
  shortlisted: number
  rejected: number
  hired: number
  reviewed: number
  avg_rating: number
  top_skills: { skill: string; count: number }[]
  by_experience: { range: string; count: number }[]
  recent_uploads: { date: string; count: number }[]
}

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ec4899','#f97316','#3b82f6','#14b8a6','#a855f7','#22d3ee','#84cc16']

function StatCard({ label, value, icon: Icon, color, sub, href }: any) {
  return (
    <Link href={href || '#'} className="glass glass-hover rounded-2xl p-5 flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-100 mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      <ArrowUpRight size={16} className="text-slate-600 group-hover:text-brand-400 transition-colors mt-1" />
    </Link>
  )
}

interface RecentResume {
  id: number
  parsed_name: string
  parsed_email: string
  status: string
  experience_years: number
  uploaded_at: string
  parsed_skills: string
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [recents, setRecents] = useState<RecentResume[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then(r => r.json()),
      fetch('/api/resumes?limit=5&sort=uploaded_at&order=desc').then(r => r.json()),
    ]).then(([a, r]) => {
      setAnalytics(a)
      setRecents(r.resumes || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const stats = [
    { label: 'Total Resumes',  value: analytics?.total,       icon: Users,       color: 'bg-brand-600',  href: '/resumes' },
    { label: 'New',            value: analytics?.new_count,   icon: Sparkles,    color: 'bg-purple-600', href: '/resumes?status=new' },
    { label: 'Shortlisted',    value: analytics?.shortlisted, icon: CheckCircle, color: 'bg-emerald-600',href: '/resumes?status=shortlisted' },
    { label: 'Hired',          value: analytics?.hired,       icon: Briefcase,   color: 'bg-amber-600',  href: '/resumes?status=hired' },
    { label: 'Rejected',       value: analytics?.rejected,    icon: XCircle,     color: 'bg-rose-600',   href: '/resumes?status=rejected' },
    { label: 'Avg Rating',     value: analytics?.avg_rating ? `${analytics.avg_rating}★` : 'N/A', icon: Star, color: 'bg-yellow-600', href: '/resumes' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back — here&apos;s what&apos;s happening</p>
        </div>
        <Link href="/upload" className="btn btn-primary glow-sm">
          <Upload size={16} /> Upload Resumes
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills chart */}
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-400" /> Top Skills
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics?.top_skills || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                cursor={{ fill: 'rgba(99,102,241,0.05)' }}
              />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {analytics?.top_skills?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Experience Pie */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Briefcase size={16} className="text-purple-400" /> Experience Levels
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={analytics?.by_experience || []} dataKey="count" nameKey="range" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {analytics?.by_experience.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {analytics?.by_experience.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-400">{e.range}</span>
                </div>
                <span className="text-slate-300 font-medium">{e.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent uploads trend */}
      {analytics?.recent_uploads && analytics.recent_uploads.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-cyan-400" /> Upload Trend (Last 14 Days)
          </h2>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={analytics.recent_uploads}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent resumes */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300">Recent Uploads</h2>
          <Link href="/resumes" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        {recents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Upload size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No resumes yet. <Link href="/upload" className="text-brand-400 hover:underline">Upload your first one →</Link></p>
          </div>
        ) : (
          <div className="space-y-2">
            {recents.map(r => {
              let skills: string[] = []
              try { skills = JSON.parse(r.parsed_skills) } catch {}
              return (
                <Link key={r.id} href={`/resumes/${r.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {(r.parsed_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-brand-400 transition-colors">{r.parsed_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 truncate">{r.parsed_email}</p>
                  </div>
                  <div className="hidden md:flex gap-1.5 flex-wrap max-w-xs">
                    {skills.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-900/50 text-brand-300 border border-brand-800/50">{s}</span>
                    ))}
                  </div>
                  <span className={`badge badge-${r.status} shrink-0`}>{r.status}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-12 skeleton w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 skeleton rounded-2xl lg:col-span-2" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </div>
  )
}
