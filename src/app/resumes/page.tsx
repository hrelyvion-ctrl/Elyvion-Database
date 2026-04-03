'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Search, Filter, SortAsc, SortDesc, Star, Trash2,
  ChevronLeft, ChevronRight, Download, Eye, Users, Loader2, X, Shield
} from 'lucide-react'
import JSZip from 'jszip'

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
  filename: string
  folder: string
}

const STATUS_OPTIONS = ['all','new','reviewed','shortlisted','rejected','hired']

function ResumesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [resumes, setResumes] = useState<Resume[]>([])
  const [folders, setFolders] = useState<string[]>(['Uncategorized','AI','Software Engineer','Sales','Marketing','Design'])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [downloadingBulk, setDownloadingBulk] = useState(false)
  const [movingToFolder, setMovingToFolder] = useState(false)
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      }
    }
    getProfile()
  }, [supabase])

  const [showFilters, setShowFilters] = useState(false)
  
  // Advanced Filter state
  const page    = parseInt(searchParams.get('page') || '1')
  const status  = searchParams.get('status') || 'all'
  const folder  = searchParams.get('folder') || 'All'
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
    if (!value || value === 'All') p.delete(key)
    else p.set(key, value)
    if (key !== 'page') p.set('page', '1')
    router.push(`/resumes?${p.toString()}`)
  }

  const setParams = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === 'All') p.delete(k)
      else p.set(k, v)
    })
    p.set('page', '1')
    router.push(`/resumes?${p.toString()}`)
  }

  const clearFilters = () => {
    router.push('/resumes?status=all&folder=All&sort=uploaded_at&order=desc')
  }

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders')
      const data = await res.json()
      if (Array.isArray(data)) setFolders(['Uncategorized', ...data.filter(f => f !== 'Uncategorized')])
    } catch {}
  }, [])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
       const res = await fetch('/api/folders', {
          method: 'POST',
          body: JSON.stringify({ name: newFolderName }),
          headers: { 'Content-Type': 'application/json' }
       })
       if (res.ok) {
         fetchFolders()
         setIsNewFolderModalOpen(false)
         setNewFolderName('')
       } else {
         const d = await res.json()
         alert('Error: ' + (d.error || 'Failed to create folder. (Have you run the SQL?)'))
       }
    } catch (err) { alert('Error creating folder') }
  }

  const handleDeleteFolder = async (e: React.MouseEvent, folderName: string) => {
    e.stopPropagation()
    if (folderName === 'Uncategorized' || folderName === 'All') return
    if (!confirm(`Delete folder "${folderName}"? Resumes in it will be moved to Uncategorized.`)) return
    
    try {
       const res = await fetch('/api/folders', {
          method: 'DELETE',
          body: JSON.stringify({ name: folderName }),
          headers: { 'Content-Type': 'application/json' }
       })
       if (res.ok) {
         if (folder === folderName) setParam('folder', 'All')
         fetchFolders()
       }
    } catch {}
  }

  const fetchResumes = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ 
      page: String(page), status, sort, order, skill, 
      minExp, maxExp, location: loc, keywords: kw, exclude: excl,
      folder: folder === 'All' ? '' : folder,
      limit: '15' 
    })
    const res = await fetch(`/api/resumes?${p}`)
    const data = await res.json()
    setResumes(data.resumes || [])
    setTotal(data.pagination?.total || 0)
    setPages(data.pagination?.pages || 1)
    setLoading(false)
  }, [page, status, folder, sort, order, skill, minExp, maxExp, loc, kw, excl])

  useEffect(() => { 
    fetchFolders()
    fetchResumes() 
  }, [fetchResumes, fetchFolders])

  if (profile && !profile.is_approved) {
    return (
      <div className="flex flex-col items-center justify-center py-40 animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-brand-600/10 rounded-3xl flex items-center justify-center mb-6 border border-brand-500/20">
           <Shield size={40} className="text-brand-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold gradient-text">Awaiting Master Approval</h2>
        <p className="text-slate-500 max-w-sm text-center mt-3 leading-relaxed">
           Your account has been created, but access to the database requires manual approval from the **Master Account**. 
        </p>
        <p className="text-[10px] text-slate-700 uppercase font-black tracking-widest mt-8 px-4 py-2 border border-white/5 rounded-full">
           Security ID: {profile.id.slice(0,8)}
        </p>
      </div>
    )
  }

  const toggleSelect = (id: number) => setSelected(prev => {
    const n = new Set(prev)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })

  const toggleAll = () => {
    if (selected.size === resumes.length) setSelected(new Set())
    else setSelected(new Set(resumes.map(r => r.id)))
  }

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selected.size} resumes?`)) return
    setDeleting(true)
    try {
      await fetch('/api/resumes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) })
      })
      setSelected(new Set())
      fetchResumes()
    } catch {}
    setDeleting(false)
  }

  const moveSelectedToFolder = async (targetFolder: string) => {
     setMovingToFolder(true)
     try {
        await fetch('/api/resumes/bulk-update', {
           method: 'PATCH',
           body: JSON.stringify({ ids: Array.from(selected), updates: { folder: targetFolder } }),
           headers: { 'Content-Type': 'application/json' }
        })
        setSelected(new Set())
        fetchResumes()
     } catch {}
     setMovingToFolder(false)
  }

  const downloadSelected = async () => {
    setDownloadingBulk(true)
    const jszip = (await import('jszip')).default
    const zip = new jszip()
    
    const selectedResumes = resumes.filter(r => selected.has(r.id))
    
    for (const r of selectedResumes) {
        try {
          const res = await fetch(`/api/resumes/download?id=${r.id}`)
          const blob = await res.blob()
          zip.file(r.original_name, blob)
        } catch (err) {
          console.error(`Failed to download ${r.original_name}`, err)
        }
    }
    
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = `resumes_bulk_${new Date().getTime()}.zip`
    a.click()
    setDownloadingBulk(false)
  }

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Experience', 'Rating', 'Status', 'Skills', 'Uploaded']
    const rows = resumes.map(r => [
      r.parsed_name,
      r.parsed_email,
      r.experience_years,
      r.rating,
      r.status,
      Array.isArray(r.parsed_skills) ? r.parsed_skills.join(', ') : r.parsed_skills,
      new Date(r.uploaded_at).toLocaleDateString()
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "resumes_export.csv")
    document.body.appendChild(link)
    link.click()
  }

  return (
    <div className="flex gap-8 items-start animate-in fade-in slide-in-from-bottom-2 duration-500 relative w-full">
      {/* Sidebar Folders */}
      <aside className="w-56 shrink-0">
         <div className="glass rounded-[32px] p-6 border-white/5 space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em]">Categories</h3>
               <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            </div>

            <nav className="space-y-1">
               {['All', ...folders].map(f => (
                  <div key={f} className="relative group/folder">
                    <button 
                      onClick={() => setParam('folder', f)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 ${folder === f ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
                    >
                       <div className="flex items-center gap-3">
                          <div className={`w-1 h-1 rounded-full ${folder === f ? 'bg-brand-400 shadow-[0_0_8px_#818cf8]' : 'bg-slate-700'}`} />
                          {f}
                       </div>
                    </button>
                    {f !== 'All' && f !== 'Uncategorized' && (
                       <button
                         onClick={(e) => handleDeleteFolder(e, f)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-700 hover:text-white hover:bg-rose-500/20 invisible group-hover/folder:visible transition-all duration-200"
                       >
                          <X size={11} />
                       </button>
                    )}
                  </div>
               ))}
            </nav>

            <button 
             onClick={() => setIsNewFolderModalOpen(true)}
             className="w-full py-4 border border-dashed border-white/5 text-slate-600 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:border-brand-500/30 hover:text-brand-400 transition-all hover:bg-brand-500/[0.02]"
            >
               + Create New Folder
            </button>
         </div>
      </aside>

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewFolderModalOpen(false)} />
           <div className="relative glass w-full max-w-sm rounded-3xl p-8 border-brand-500/20 shadow-2xl animate-in zoom-in-95">
              <h2 className="text-xl font-bold gradient-text mb-2">Create New Category</h2>
              <p className="text-xs text-slate-400 mb-6 font-medium">Categorize your resumes systematically.</p>
              <input 
                autoFocus
                className="input-dark mb-6 py-3 px-4 rounded-xl"
                placeholder="e.g. Senior Developers"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              />
              <div className="flex gap-3">
                 <button onClick={() => setIsNewFolderModalOpen(false)} className="btn flex-1 py-3 text-sm font-bold bg-white/5 text-slate-400 hover:text-white rounded-xl">Cancel</button>
                 <button onClick={handleCreateFolder} className="btn flex-1 py-3 text-sm font-bold bg-brand-600 text-white hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-500/10">Create Folder</button>
              </div>
           </div>
        </div>
      )}

      {/* Main Database Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-standard-header text-white uppercase italic">Resume Database</h1>
               <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold uppercase tracking-widest">{folder}</span>
            </div>
            <p className="text-slate-400 text-[10px] mt-1.5 uppercase font-black tracking-widest opacity-60">{total} total candidates matched in this folder</p>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <>
                <div className="relative group">
                   <button className="btn bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
                      <Filter size={16} /> Move to...
                   </button>
                   <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border-white/10 shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 p-1 overflow-hidden">
                      {folders.map(f => (
                         <button 
                           key={f}
                           onClick={() => moveSelectedToFolder(f)}
                           className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-brand-600 hover:text-white rounded-lg transition-colors capitalize"
                         >
                            Move to {f}
                         </button>
                      ))}
                   </div>
                </div>
                <button onClick={downloadSelected} disabled={downloadingBulk} className="btn bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30 px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
                  {downloadingBulk ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Download {selected.size}
                </button>
                <button onClick={deleteSelected} disabled={deleting} className="btn bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete {selected.size}
                </button>
              </>
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
          <div className="glass rounded-2xl p-2 flex flex-wrap gap-3 items-center shadow-xl border-white/5">
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
            <div className="flex items-center gap-2 pr-2">
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
                  <button onClick={fetchResumes} className="btn bg-brand-600 text-white hover:bg-brand-500 py-3 rounded-xl font-bold text-sm shadow-xl shadow-brand-500/10 transition-all active:scale-[0.98]">
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
                <tr className="bg-white/[0.01] border-b border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                  <th className="px-4 py-6 text-left w-12 text-center">
                    <input type="checkbox" checked={selected.size === resumes.length && resumes.length > 0}
                      onChange={toggleAll} className="accent-brand-500 w-4 h-4 cursor-pointer rounded-lg" />
                  </th>
                  <th className="px-4 py-6 text-left w-[240px]">Candidate</th>
                  <th className="px-4 py-6 text-left">Primary Stack</th>
                  <th className="px-4 py-6 text-left w-[80px]">Exp</th>
                  <th className="px-4 py-6 text-left w-[120px]">Rating</th>
                  <th className="px-4 py-6 text-left w-[120px]">Status</th>
                  <th className="px-4 py-6 text-left w-[120px]">Registered</th>
                  <th className="px-4 py-6 text-right pr-6 w-[60px]">Actions</th>
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
                      <p className="text-sm mt-1">Try broadening your experience range or changing folders.</p>
                    </td>
                  </tr>
                ) : resumes.map(r => {
                  let skills: string[] = []
                  try { skills = typeof r.parsed_skills === 'string' ? JSON.parse(r.parsed_skills) : r.parsed_skills } catch {}
                  return (
                    <tr key={r.id}
                      className={`border-b border-white/5 hover:bg-white/[0.03] transition-all group ${selected.has(r.id) ? 'bg-brand-900/10' : ''}`}>
                      <td className="px-4 py-5 text-center">
                        <input type="checkbox" checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)} className="accent-brand-500 w-4 h-4 cursor-pointer" />
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shrink-0">
                            {(r.parsed_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 group-hover:text-brand-400 transition-colors truncate text-xs">{r.parsed_name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-500 truncate font-medium">{r.parsed_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex gap-1.5 flex-wrap">
                          {(skills || []).slice(0, 2).map(s => (
                            <span key={s} className="text-[9px] px-2 py-0.5 rounded-md bg-brand-900/40 text-brand-300 border border-brand-800/20 font-semibold">{s}</span>
                          ))}
                          {(skills || []).length > 2 && <span className="text-[9px] text-slate-600 font-bold">+{skills.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                        <span className="text-xs font-bold text-slate-300">{r.experience_years}y</span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex gap-0.5">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} size={10} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-800'} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider badge-${r.status}`}>
                            {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-[10px] text-slate-500 font-medium whitespace-nowrap">
                        {new Date(r.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-5 text-right pr-6">
                        <Link href={`/resumes/${r.id}`} className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 text-slate-400 hover:bg-brand-500/20 hover:text-brand-400 transition-all">
                            <Eye size={14} />
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
