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

  const page   = parseInt(searchParams.get('page') || '1')
  const status = searchParams.get('status') || 'all'
  const sort   = searchParams.get('sort') || 'uploaded_at'
  const order  = searchParams.get('order') || 'desc'
  const skill  = searchParams.get('skill') || ''

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set(key, value)
    if (key !== 'page') p.set('page', '1')
    router.push(`/resumes?${p.toString()}`)
  }

  const fetchResumes = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), status, sort, order, skill, limit: '15' })
    const res = await fetch(`/api/resumes?${p}`)
    const data = await res.json()
    setResumes(data.resumes || [])
    setTotal(data.pagination?.total || 0)
    setPages(data.pagination?.pages || 1)
    setLoading(false)
  }, [page, status, sort, order, skill])

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
    const res = await fetch(`/api/resumes?limit=9999&status=${status}&sort=${sort}&order=${order}&skill=${skill}`)
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Resume Database</h1>
          <p className="text-slate-400 text-sm mt-1">{total} candidate{total !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={deleteSelected} disabled={deleting} className="btn btn-danger">
              {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Delete {selected.size}
            </button>
          )}
          <button onClick={exportCSV} className="btn btn-ghost"><Download size={15} /> Export CSV</button>
          <Link href="/upload" className="btn btn-primary"><Users size={15} /> Upload</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setParam('status', s)}
              className={`badge cursor-pointer transition-all ${status === s ? `badge-${s === 'all' ? 'new' : s}` : 'text-slate-500 border border-slate-800 hover:border-slate-600'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-32">
          <input
            className="input-dark text-xs py-1.5"
            placeholder="Filter by skill (e.g. React)"
            value={skill}
            onChange={e => setParam('skill', e.target.value)}
          />
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <select
            className="input-dark text-xs py-1.5 w-auto"
            value={sort}
            onChange={e => setParam('sort', e.target.value)}
          >
            <option value="uploaded_at">Date</option>
            <option value="parsed_name">Name</option>
            <option value="experience_years">Experience</option>
            <option value="rating">Rating</option>
          </select>
          <button onClick={() => setParam('order', order === 'asc' ? 'desc' : 'asc')} className="btn btn-ghost p-2">
            {order === 'asc' ? <SortAsc size={15} /> : <SortDesc size={15} />}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" checked={selected.size === resumes.length && resumes.length > 0}
                    onChange={toggleAll} className="accent-brand-500 w-4 h-4" />
                </th>
                <th className="px-4 py-3 text-left">Candidate</th>
                <th className="px-4 py-3 text-left">Skills</th>
                <th className="px-4 py-3 text-left">Exp</th>
                <th className="px-4 py-3 text-left">Rating</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-[rgba(99,102,241,0.06)]">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : resumes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-500">
                    <Users size={32} className="mx-auto mb-2 opacity-20" />
                    <p>No resumes found. Try changing filters.</p>
                  </td>
                </tr>
              ) : resumes.map(r => {
                let skills: string[] = []
                try { skills = JSON.parse(r.parsed_skills) } catch {}
                return (
                  <tr key={r.id}
                    className={`border-b border-[rgba(99,102,241,0.06)] hover:bg-white/3 transition-colors ${selected.has(r.id) ? 'bg-brand-900/20' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)} className="accent-brand-500 w-4 h-4" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(r.parsed_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 whitespace-nowrap">{r.parsed_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">{r.parsed_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {skills.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-900/50 text-brand-300 border border-brand-800/30">{s}</span>
                        ))}
                        {skills.length > 3 && <span className="text-[10px] text-slate-500">+{skills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.experience_years}y</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} size={11} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(r.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/resumes/${r.id}`} className="btn btn-ghost p-1.5"><Eye size={14} /></Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
            <p className="text-xs text-slate-500">Page {page} of {pages} · {total} results</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}
                className="btn btn-ghost py-1 px-2 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(pages - 4, page - 2)) + i
                return (
                  <button key={p} onClick={() => setParam('page', String(p))}
                    className={`btn py-1 px-3 text-xs ${p === page ? 'btn-primary' : 'btn-ghost'}`}>
                    {p}
                  </button>
                )
              })}
              <button disabled={page >= pages} onClick={() => setParam('page', String(page + 1))}
                className="btn btn-ghost py-1 px-2 disabled:opacity-30">
                <ChevronRight size={16} />
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
