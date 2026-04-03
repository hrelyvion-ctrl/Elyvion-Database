'use client'
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, LineChart, Line
} from 'recharts'
import { TrendingUp, Users, CheckCircle, XCircle, Briefcase, Star, BarChart2 } from 'lucide-react'

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ec4899','#f97316','#3b82f6','#14b8a6','#a855f7','#22d3ee','#84cc16']

interface Analytics {
  total: number; new_count: number; shortlisted: number; rejected: number
  hired: number; reviewed: number; avg_rating: number
  top_skills: { skill: string; count: number }[]
  by_experience: { range: string; count: number }[]
  recent_uploads: { date: string; count: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6 w-full animate-in fade-in duration-700">
      <div className="h-10 skeleton w-40 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(4).fill(0).map((_,i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{Array(4).fill(0).map((_,i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}</div>
    </div>
  )

  if (!data) return null

  const statusData = [
    { name: 'New', value: data.new_count, color: '#6366f1' },
    { name: 'Reviewed', value: data.reviewed, color: '#3b82f6' },
    { name: 'Shortlisted', value: data.shortlisted, color: '#22c55e' },
    { name: 'Rejected', value: data.rejected, color: '#ef4444' },
    { name: 'Hired', value: data.hired, color: '#eab308' },
  ].filter(d => d.value > 0)

  const conversionRate = data.total > 0 ? ((data.hired / data.total) * 100).toFixed(1) : '0'
  const shortlistRate = data.total > 0 ? ((data.shortlisted / data.total) * 100).toFixed(1) : '0'

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-standard-header text-white uppercase italic">Audit Analytics</h1>
        <p className="text-slate-400 text-[11px] mt-1.5 font-medium uppercase tracking-widest opacity-60">Real-time intelligence on recruitment velocity and talent density</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', value: data.total, icon: Users, color: 'bg-brand-600' },
          { label: 'Shortlisted', value: `${data.shortlisted} (${shortlistRate}%)`, icon: CheckCircle, color: 'bg-emerald-600' },
          { label: 'Hired', value: `${data.hired} (${conversionRate}%)`, icon: Briefcase, color: 'bg-amber-600' },
          { label: 'Avg Rating', value: data.avg_rating ? `${data.avg_rating}★` : 'N/A', icon: Star, color: 'bg-yellow-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} shrink-0`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pipeline status pie */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-brand-400" /> Pipeline Status
          </h2>
          {statusData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-200">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Experience distribution */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Briefcase size={16} className="text-purple-400" /> Experience Distribution
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.by_experience} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Bar dataKey="count" name="Candidates" radius={[4,4,0,0]}>
                {data.by_experience.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top skills */}
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-400" /> Top Skills in Database
          </h2>
          {data.top_skills.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No skills data yet</p>
          ) : (
            <div className="space-y-2.5">
              {data.top_skills.map((s, i) => {
                const pct = data.total > 0 ? (s.count / data.total) * 100 : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-slate-400 w-24 shrink-0">{s.skill}</span>
                    <div className="flex-1 bg-slate-900 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-xs text-slate-500 w-10 text-right">{s.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent uploads */}
        {data.recent_uploads.length > 0 && (
          <div className="glass rounded-2xl p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Upload Trend (Last 14 Days)</h2>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={data.recent_uploads}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
