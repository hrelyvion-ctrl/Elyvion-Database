'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Star, Loader2, X, ArrowRight } from 'lucide-react'

interface SearchResult {
  id: number; parsed_name: string; parsed_email: string; parsed_skills: string
  parsed_summary: string; experience_years: number; status: string; rating: number
  uploaded_at: string; rank?: number
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text
  const parts = text.split(new RegExp(`(${query.split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi'))
  return parts.map((p, i) =>
    parts.length > 1 && i % 2 === 1
      ? <mark key={i} className="bg-brand-500/30 text-brand-200 rounded px-0.5 not-italic">{p}</mark>
      : p
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.resumes || [])
      setTotal(data.pagination?.total || 0)
      setSearched(true)
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Smart Search</h1>
        <p className="text-slate-400 text-sm mt-1">Full-text search across all resume content</p>
      </div>

      {/* Search box */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="input-dark pl-11 pr-11 py-3.5 text-base rounded-2xl"
          placeholder="Search by name, skill, email, or any keyword..."
          id="search-input"
        />
        {loading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-brand-400" />}
        {query && !loading && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500">Quick search:</span>
        {['React', 'Python', 'Node.js', 'DevOps', 'ML', 'AWS', 'TypeScript'].map(s => (
          <button key={s} onClick={() => setQuery(s)}
            className="px-3 py-1 rounded-full bg-brand-900/40 text-brand-300 border border-brand-800/30 hover:bg-brand-800/40 transition-colors">
            {s}
          </button>
        ))}
      </div>

      {/* Results */}
      {searched && (
        <div>
          <p className="text-xs text-slate-500 mb-3">
            {total} result{total !== 1 ? 's' : ''} for "<span className="text-brand-400">{query}</span>"
          </p>
          <div className="space-y-3">
            {results.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <Search size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-slate-500">No results found. Try different keywords.</p>
              </div>
            ) : results.map(r => {
              let skills: string[] = []
              try { skills = JSON.parse(r.parsed_skills) } catch {}
              return (
                <Link key={r.id} href={`/resumes/${r.id}`}
                  className="glass glass-hover rounded-2xl p-5 flex gap-4 group transition-all hover:-translate-y-0.5">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {(r.parsed_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-200 group-hover:text-brand-400 transition-colors">
                          {highlight(r.parsed_name || 'Unknown', query)}
                        </p>
                        <p className="text-xs text-slate-500">{highlight(r.parsed_email || '', query)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`badge badge-${r.status}`}>{r.status}</span>
                        <ArrowRight size={16} className="text-slate-600 group-hover:text-brand-400 transition-colors" />
                      </div>
                    </div>
                    {r.parsed_summary && (
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {highlight(r.parsed_summary.slice(0, 200), query)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {skills.slice(0, 5).map(s => (
                          <span key={s}
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${query.toLowerCase().includes(s.toLowerCase()) ? 'bg-brand-500/20 text-brand-300 border-brand-500/40' : 'bg-brand-900/30 text-brand-400 border-brand-900/50'}`}>
                            {highlight(s, query)}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-slate-600 ml-auto shrink-0">{r.experience_years}y exp</span>
                      <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} size={10} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'} />
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!searched && !loading && (
        <div className="text-center py-16 text-slate-600">
          <Search size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Start typing to search resumes</p>
          <p className="text-xs mt-1">Powered by SQLite FTS5 full-text search</p>
        </div>
      )}
    </div>
  )
}
