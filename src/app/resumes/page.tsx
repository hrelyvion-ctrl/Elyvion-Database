'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, Filter, SortAsc, SortDesc, Star, Trash2,
  ChevronLeft, ChevronRight, Download, Eye, Users, Loader2
} from 'lucide-react'

interface Resume {
  id: number
  parsed_name: string
  parsed_email: string
  parsed_phone: string
  parsed_skills: string
  parsed_summary: string
  experience_years: number
  status: string
  rating: number
  tags: string
  uploaded_at: string
  original_name: string
}

const STATUS_OPTIONS = ['all','new','reviewed','shortlisted','rejected','hired']

function ResumesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const [showFilters, setShowFilters] = useState(false)
  
  // Advanced Filter state
  const page    = parseInt(searchParams.get('page') || '1')
  const status  = searchParams.get('status') || 'all'
  const sort    = searchParams.get('sort') || 'uploaded_at'
  const order   = searchParams.get('order') || 'desc'
  const skill   = searchParams.get('skill') || ''
  const minExp  = searchParams.get('minExp') || ''
  const maxExp  = searchParams.get('maxExp') || ''
  const loc     = searchParams.get('location') || ''
  const kw      = searchParams.get('keywords') || ''
  const excl    = searchParams.get('exclude') || ''

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (!value) p.delete(key)
    else p.set(key, value)
    if (key !== 'page') p.set('page', '1')
    router.push(`/resumes?${p.toString()}`)
  }

  const setParams = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (!v) p.delete(k)
      else p.set(k, v)
    })
    p.set('page', '1')
    router.push(`/resumes?${p.toString()}`)
  }

  const clearFilters = () => {
    router.push('/resumes?status=all&sort=uploaded_at&order=desc')
  }

  const fetchResumes = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ 
      page: String(page), status, sort, order, skill, 
      minExp, maxExp, location: loc, keywords: kw, exclude: excl,
      limit: '15' 
    })
    const res = await fetch(`/api/resumes?${p}`)
    const data = await res.json()
    setResumes(data.resumes || [])
    setTotal(data.pagination?.total || 0)
    setPages(data.pagination?.pages || 1)
    setLoading(false)
  }, [page, status, sort, order, skill, minExp, maxExp, loc, kw, excl])

  useEffect(() => { fetchResumes() }, [fetchResumes])

  const toggleSelect = (id: number) => setSelected(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  const toggleAll = () => {
    if (selected.size === resumes.length) setSelected(new Set())
    else setSelected(new Set(resumes.map(r => r.id)))
  }

  const deleteSelected = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} resume(s)?`)) return
    setDeleting(true)
    await fetch('/api/resumes', { method: 'DELETE', body: JSON.stringify({ ids: Array.from(selected) }), headers: { 'Content-Type': 'application/json' } })
    setSelected(new Set())
    fetchResumes()
    setDeleting(false)
  }

  const exportCSV = async () => {
    const res = await fetch(`/api/resumes?limit=9999&status=${status}&sort=${sort}&order=${order}&skill=${skill}&minExp=${minExp}&maxExp=${maxExp}`)
    const data = await res.json()
    const rows: Resume[] = data.resumes || []
    const headers = ['id','name','email','phone','experience_years','status','rating','uploaded_at','skills']
    const csv = [headers.join(','), ...rows.map(r => {
      let skills: string[] = []
      try { skills = JSON.parse(r.parsed_skills) } catch {}
      return [r.id, `"${r.parsed_name}"`, `"${r.parsed_email}"`, `"${r.parsed_phone}"`,
              r.experience_years, r.status, r.rating, r.uploaded_at, `"${skills.join('; ')}"`].join(',')
    })].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'resumes.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Resume Database</h1>
          <p className="text-slate-400 text-sm mt-1">{total} total candidates matched</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={deleteSelected} disabled={deleting} className="btn bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete {selected.size}
            </button>
          )}
          <button onClick={exportCSV} className="btn bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
          <Link href="/upload" className="btn bg-brand-600 text-white hover:bg-brand-500 px-3 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-brand-500/20">
            <Users size={16} /> Upload New
          </Link>
        </div>
      </div>

      {/* Main Filter Bar */}
      <div className="space-y-3">
        <div className="glass rounded-2xl p-2 flex flex-wrap gap-3 items-center">
          <div className="flex bg-black/20 rounded-xl p-1 gap-1">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => setParam('status', s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${status === s ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[280px] relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400" />
            <input
              className="input-dark pl-10 pr-4 py-2 text-sm rounded-xl border-white/5 group-focus-within:border-brand-500/30"
              placeholder="Quick search by skill, name or email..."
              value={skill}
              onChange={e => setParam('skill', e.target.value)}
            />
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition-all ${showFilters ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}
          >
            <Filter size={16} />
            Advanced
          </button>

          <div className="h-6 w-px bg-white/5 mx-1" />

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
              value={sort}
              onChange={e => setParam('sort', e.target.value)}
            >
              <option value="uploaded_at">Sort by Date</option>
              <option value="parsed_name">Sort by Name</option>
              <option value="experience_years">Sort by Exp</option>
              <option value="rating">Sort by Rating</option>
            </select>
            <button onClick={() => setParam('order', order === 'asc' ? 'desc' : 'asc')} className="text-slate-500 hover:text-brand-400 transition-colors">
              {order === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            </button>
          </div>
        </div>

        {/* Expanded Advanced Filters Panel */}
        {showFilters && (
          <div className="glass rounded-2xl p-6 border-brand-500/20 animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Keywords Section */}
              <div className="space-y-4">
                <div>
                   <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block">Boolean Keywords Search</label>
                   <input 
                      value={kw}
                      onChange={e => setParam('keywords', e.target.value)}
                      placeholder="e.g. React AND Node NOT PHP" 
                      className="input-dark py-2.5 rounded-xl text-sm"
                   />
                   <p className="text-[10px] text-slate-600 mt-1.5 italic">Search occurs inside entire resume text</p>
                </div>
                <div>
                   <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block">Exclude Keywords</label>
                   <input 
                      value={excl}
                      onChange={e => setParam('exclude', e.target.value)}
                      placeholder="Keywords to ignore..." 
                      className="input-dark py-2.5 rounded-xl text-sm border-red-500/10 focus:border-red-500/30"
                   />
                </div>
              </div>

              {/* Range & Location Section */}
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block">Experience Range (Years)</label>
                    <div className="flex items-center gap-3">
                       <input 
                          type="number" 
                          value={minExp}
                          onChange={e => setParam('minExp', e.target.value)}
                          placeholder="Min" 
                          className="input-dark py-2.5 rounded-xl text-sm text-center"
                       />
                       <span className="text-slate-600">to</span>
                       <input 
                          type="number" 
                          value={maxExp}
                          onChange={e => setParam('maxExp', e.target.value)}
                          placeholder="Max" 
                          className="input-dark py-2.5 rounded-xl text-sm text-center"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block">Desired Location</label>
                    <input 
                       value={loc}
                       onChange={e => setParam('location', e.target.value)}
                       placeholder="e.g. Bangalore, Remote" 
                       className="input-dark py-2.5 rounded-xl text-sm"
                    />
                 </div>
              </div>

              {/* Filter Actions */}
              <div className="flex flex-col justify-end gap-3">
                 <button onClick={fetchResumes} className="btn bg-brand-600 text-white hover:bg-brand-500 py-3 rounded-xl font-bold text-sm shadow-xl shadow-brand-500/10">
                    Apply Advanced Filters
                 </button>
                 <button onClick={clearFilters} className="btn border border-white/5 text-slate-500 hover:text-slate-300 py-2.5 rounded-xl text-sm">
                    Reset All Filters
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="glass rounded-2xl overflow-hidden border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <th className="px-5 py-4 text-left w-12">
                  <input type="checkbox" checked={selected.size === resumes.length && resumes.length > 0}
                    onChange={toggleAll} className="accent-brand-500 w-4 h-4 cursor-pointer" />
                </th>
                <th className="px-5 py-4 text-left">Candidate Info</th>
                <th className="px-5 py-4 text-left">Top Skills</th>
                <th className="px-5 py-4 text-left">Exp</th>
                <th className="px-5 py-4 text-left">Rating</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Uploaded</th>
                <th className="px-5 py-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={8} className="px-5 py-4">
                      <div className="skeleton h-10 rounded-xl w-full opacity-50" />
                    </td>
                  </tr>
                ))
              ) : resumes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-slate-500 bg-black/10">
                    <Users size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-lg font-medium text-slate-400">No candidates match these criteria</p>
                    <p className="text-sm mt-1">Try broadening your experience range or removing keywords.</p>
                  </td>
                </tr>
              ) : resumes.map(r => {
                let skills: string[] = []
                try { skills = typeof r.parsed_skills === 'string' ? JSON.parse(r.parsed_skills) : r.parsed_skills } catch {}
                return (
                  <tr key={r.id}
                    className={`border-b border-white/5 hover:bg-white/[0.03] transition-all group ${selected.has(r.id) ? 'bg-brand-900/10' : ''}`}>
                    <td className="px-5 py-5">
                      <input type="checkbox" checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)} className="accent-brand-500 w-4 h-4 cursor-pointer" />
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-sm font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
                          {(r.parsed_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-200 group-hover:text-brand-400 transition-colors truncate max-w-[200px]">{r.parsed_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[180px] font-medium">{r.parsed_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex gap-1.5 flex-wrap max-w-[240px]">
                        {(skills || []).slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-brand-900/40 text-brand-300 border border-brand-800/20 font-semibold">{s}</span>
                        ))}
                        {(skills || []).length > 3 && <span className="text-[10px] text-slate-600 font-bold">+{skills.length - 3} more</span>}
                      </div>
                    </td>
                    <td className="px-5 py-5 whitespace-nowrap">
                       <span className="text-sm font-bold text-slate-300">{r.experience_years}y</span>
                       <p className="text-[10px] text-slate-600 uppercase font-bold">Exp</p>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} size={11} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-800'} />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-5">
                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider badge-${r.status}`}>
                          {r.status}
                       </span>
                    </td>
                    <td className="px-5 py-5 text-xs text-slate-500 font-medium whitespace-nowrap">
                       {new Date(r.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-5 text-right pr-6">
                       <Link href={`/resumes/${r.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 text-slate-400 hover:bg-brand-500/20 hover:text-brand-400 transition-all">
                          <Eye size={16} />
                       </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white/[0.01]">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
               Page {page} <span className="mx-1 opacity-30">/</span> {pages}
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 transition-all">
                <ChevronLeft size={18} />
              </button>
              
              <button disabled={page >= pages} onClick={() => setParam('page', String(page + 1))}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResumesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading resumes...</div>
      </div>
    }>
      <ResumesContent />
    </Suspense>
  )
}
