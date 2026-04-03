'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Star, Loader2, X, ArrowRight } from 'lucide-react'

interface SearchResult {
  id: number; parsed_name: string; parsed_email: string; parsed_skills: string
  parsed_summary: string; experience_years: number; status: string; rating: number
  uploaded_at: string; match_score?: number
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
  const [isSemantic, setIsSemantic] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.resumes || [])
        setIsSemantic(data.is_semantic || false)
        setTotal(data.resumes?.length || 0)
        setSearched(true)
      } catch (e) {
        console.error('Search failed:', e)
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-widest leading-none">Smart Search</h1>
          <p className="text-slate-400 text-[11px] mt-1.5 font-medium uppercase tracking-widest opacity-60">AI-powered semantic search across your entire database</p>
        </div>
        {isSemantic && searched && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[9px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            AI Semantic Search Active
          </div>
        )}
      </div>

      {/* Search box */}
      <div className="relative group">
        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="input-dark pl-12 pr-12 py-4 text-base rounded-xl border-white/5 focus:border-brand-500/30 bg-white/[0.03] placeholder:text-slate-600 transition-all shadow-2xl"
          placeholder="e.g. 'Senior dev with React experience and leadership skills'"
          id="search-input"
        />
        {loading && <Loader2 size={18} className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-brand-400" />}
        {query && !loading && (
          <button onClick={() => setQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 text-xs items-center px-1">
        <span className="text-slate-500 font-medium mr-1">Trending:</span>
        {['Cloud Architects', 'Lead Node.js', 'Python Specialists', 'Frontend Engineers', 'Remote Only'].map(s => (
          <button key={s} onClick={() => setQuery(s)}
            className="px-3.5 py-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/5 hover:bg-brand-500/10 hover:border-brand-500/20 hover:text-brand-300 transition-all">
            {s}
          </button>
        ))}
      </div>

      {/* Results */}
      {searched && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between mb-4 px-1">
             <p className="text-xs text-slate-500">
               Found <span className="text-slate-300 font-bold">{total}</span> candidates matching your criteria
             </p>
             <div className="text-[10px] text-slate-600 italic">Showing top results by relevance</div>
          </div>
          
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="glass rounded-3xl p-16 text-center border-dashed border-white/5">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="opacity-20" />
                </div>
                <p className="text-slate-300 font-medium">No direct matches found</p>
                <p className="text-slate-500 text-sm mt-1">Try broadening your search terms or using conceptual phrases.</p>
              </div>
            ) : results.map(r => {
              let skills: string[] = []
              try { skills = typeof r.parsed_skills === 'string' ? JSON.parse(r.parsed_skills) : r.parsed_skills } catch {}
              return (
                <Link key={r.id} href={`/resumes/${r.id}`}
                  className="glass group rounded-2xl p-6 flex gap-6 items-start transition-all hover:bg-white/[0.04] border-white/5 hover:border-brand-500/20 shadow-xl">
                  
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {(r.parsed_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    {r.match_score && r.match_score > 70 && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 border-2 border-[var(--bg)] flex items-center justify-center shadow-lg" title={`Match Score: ${r.match_score}%`}>
                        <Star size={10} className="text-white fill-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                           <p className="text-lg font-bold text-slate-100 group-hover:text-brand-400 transition-colors truncate">
                             {highlight(r.parsed_name || 'Unknown', query)}
                           </p>
                           {r.match_score && (
                             <span className={`text-[10px] px-2 py-0.5 rounded border ${r.match_score > 80 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-brand-500/10 text-brand-400 border-brand-500/20'}`}>
                               {r.match_score}% Match
                             </span>
                           )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{highlight(r.parsed_email || '', query)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`badge badge-${r.status}`}>{r.status}</span>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-all">
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>

                    {r.parsed_summary && (
                      <p className="text-sm text-slate-400 mt-3 line-clamp-2 leading-relaxed italic border-l-2 border-white/5 pl-4 py-0.5">
                        {highlight(r.parsed_summary.slice(0, 250), query)}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
                        {(skills || []).slice(0, 6).map(s => (
                          <span key={s}
                            className={`text-[10px] px-2.5 py-1 rounded-md border font-medium ${query.toLowerCase().includes(s.toLowerCase()) ? 'bg-brand-500/20 text-brand-200 border-brand-500/30' : 'bg-white/5 text-slate-400 border-white/5'}`}>
                            {highlight(s, query)}
                          </span>
                        ))}
                        {(skills || []).length > 6 && <span className="text-[10px] text-slate-600">+{skills.length - 6} more</span>}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-4 border-l border-white/5 pl-4">
                         <div className="text-right">
                           <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Experience</p>
                           <p className="text-xs font-bold text-slate-300">{r.experience_years} Years</p>
                         </div>
                         <div className="flex gap-0.5">
                           {Array(5).fill(0).map((_, i) => (
                             <Star key={i} size={11} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-800'} />
                           ))}
                         </div>
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
        <div className="glass rounded-3xl p-20 text-center border-white/5 mt-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-b from-brand-500/20 to-transparent flex items-center justify-center mx-auto mb-6">
             <Search size={40} className="text-brand-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-200">What are you looking for today?</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
            Our AI understands concepts, not just words. Try searching for skills, roles, or even complex requirements.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-white/5 pt-8">
             <div className="text-center">
                <p className="text-lg font-bold text-slate-300">Fast</p>
                <p className="text-[10px] text-slate-600 uppercase">Vector Search</p>
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="text-center">
                <p className="text-lg font-bold text-slate-300">Gemini</p>
                <p className="text-[10px] text-slate-600 uppercase">Powered AI</p>
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="text-center">
                <p className="text-lg font-bold text-slate-300">99%</p>
                <p className="text-[10px] text-slate-600 uppercase">Parsing Accuracy</p>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
