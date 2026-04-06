'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, Mail, Phone, Briefcase, GraduationCap,
  Tag, Edit3, Save, X, Trash2, Download, Loader2, User, Calendar, FileText
} from 'lucide-react'

interface Resume {
  id: number; filename: string; original_name: string; file_size: number; mime_type: string
  raw_text: string; parsed_name: string; parsed_email: string; parsed_phone: string
  parsed_skills: string; parsed_experience: string; parsed_education: string
  parsed_summary: string; experience_years: number; status: string; rating: number
  tags: string; notes: string; uploaded_at: string; updated_at: string
}

const STATUS_COLORS: Record<string,string> = {
  new: 'badge-new', reviewed: 'badge-reviewed', shortlisted: 'badge-shortlisted',
  rejected: 'badge-rejected', hired: 'badge-hired'
}

export default function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [editingStatus, setEditingStatus] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview'|'raw'|'preview'>('overview')

  useEffect(() => {
    fetch(`/api/resumes/${id}`)
      .then(r => r.json())
      .then(data => { setResume(data); setNotes(data.notes || '') })
      .finally(() => setLoading(false))
  }, [id])

  const patch = async (data: Record<string, any>) => {
    setSaving(true)
    const res = await fetch(`/api/resumes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    })
    const updated = await res.json()
    setResume(updated)
    setSaving(false)
    return updated
  }

  const setRating = (r: number) => patch({ rating: r })
  const setStatus = (s: string) => { patch({ status: s }); setEditingStatus(false) }
  const saveNotes = () => { patch({ notes }); setEditingNotes(false) }

  const deleteResume = async () => {
    if (!confirm('Delete this resume permanently?')) return
    await fetch(`/api/resumes/${id}`, { method: 'DELETE' })
    router.push('/resumes')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="text-brand-400 animate-spin" />
    </div>
  )
  if (!resume) return (
    <div className="text-center py-20 text-slate-400">
      <p>Resume not found. <Link href="/resumes" className="text-brand-400 hover:underline">Go back</Link></p>
    </div>
  )

  let skills: string[] = []
  let experience: any[] = []
  let education: any[] = []
  let tags: string[] = []
  try { skills = typeof resume.parsed_skills === 'string' ? JSON.parse(resume.parsed_skills) : resume.parsed_skills } catch {}
  try { experience = typeof resume.parsed_experience === 'string' ? JSON.parse(resume.parsed_experience) : resume.parsed_experience } catch {}
  try { education = typeof resume.parsed_education === 'string' ? JSON.parse(resume.parsed_education) : resume.parsed_education } catch {}
  try { tags = typeof resume.tags === 'string' ? JSON.parse(resume.tags) : resume.tags } catch {}

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-700">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
        <Link href="/resumes" className="hover:text-amber-500 flex items-center gap-1 transition-colors">
          <ArrowLeft size={12} />Archive
        </Link>
        <span className="opacity-30">/</span>
        <span className="text-slate-300">{resume.parsed_name}</span>
      </div>

      {/* Hero card */}
      <div className="glass rounded-3xl p-8 border-brand-500/10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
         
        <div className="relative z-10 flex items-start gap-8">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl font-black text-slate-950 shrink-0 shadow-2xl shadow-amber-500/20 border border-white/20">
            {(resume.parsed_name || 'U').charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-standard-header text-white uppercase italic leading-none">{resume.parsed_name || 'Unknown Candidate'}</h1>
                <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-slate-400">
                  {resume.parsed_email && (
                    <a href={`mailto:${resume.parsed_email}`} className="flex items-center gap-1.5 hover:text-brand-400 transition-colors">
                      <Mail size={13} />{resume.parsed_email}
                    </a>
                  )}
                  {resume.parsed_phone && (
                    <span className="flex items-center gap-1.5"><Phone size={13} />{resume.parsed_phone}</span>
                  )}
                  <span className="flex items-center gap-1.5"><Briefcase size={13} />{resume.experience_years}y experience</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />{new Date(resume.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status dropdown */}
              <div className="relative">
                <button onClick={() => setEditingStatus(!editingStatus)} className={`badge ${STATUS_COLORS[resume.status] || 'badge-new'} cursor-pointer`}>
                  {resume.status}
                </button>
                {editingStatus && (
                  <div className="absolute right-0 top-8 z-20 glass rounded-xl border border-[var(--border)] overflow-hidden min-w-[140px] shadow-2xl">
                    {['new','reviewed','shortlisted','rejected','hired'].map(s => (
                      <button key={s} onClick={() => setStatus(s)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 flex items-center gap-2">
                        <span className={`badge badge-${s}`}>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-3">
              {Array(5).fill(0).map((_, i) => (
                <button key={i} onClick={() => setRating(i + 1)} className="star">
                  <Star size={20} className={i < resume.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700 hover:text-yellow-400'} />
                </button>
              ))}
              <span className="text-xs text-slate-500 ml-2">{resume.rating > 0 ? `${resume.rating}/5` : 'Not rated'}</span>
              {saving && <Loader2 size={12} className="animate-spin text-brand-400 ml-2" />}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <a href={`/api/resumes/download?id=${resume.id}`} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-500 transition-all shadow-lg flex items-center gap-3" title="Download Resume (Original Format)">
              <Download size={15} />
              <span>Download Dataset</span>
            </a>
            <button onClick={deleteResume} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-xl" title="Delete Profile">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1 w-fit">
        {(['overview', 'preview', 'raw'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {tab === 'raw' ? 'Raw Text' : tab === 'preview' ? 'PDF Preview' : 'Overview'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            {resume.parsed_summary && (
              <div className="glass rounded-[32px] p-8 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl group-hover:bg-brand-500/10 transition-colors" />
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  Executive Summary
                </h2>
                <p className="text-[13px] text-slate-400 leading-relaxed font-medium">{resume.parsed_summary}</p>
              </div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <div className="glass rounded-[32px] p-8 border-white/5 relative">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Work Experience
                </h2>
                <div className="space-y-8">
                  {experience.map((e: any, i: number) => (
                    <div key={i} className="relative pl-10 border-l-2 border-white/5 group">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-brand-500 group-hover:scale-125 transition-transform" />
                      <div className="space-y-1">
                        <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-brand-400 transition-colors">{e.title}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-brand-500/80 tracking-widest uppercase italic">
                           <span>{e.company}</span>
                           <span className="text-slate-700">•</span>
                           <span className="text-slate-500">{e.duration}</span>
                        </div>
                        {e.description && <p className="text-[12px] text-slate-500 mt-3 leading-relaxed font-medium">{e.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="glass rounded-[32px] p-8 border-white/5 relative">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Education Profile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {education.map((e: any, i: number) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 border border-purple-500/20">
                         <GraduationCap size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-slate-200 leading-tight mb-1">{e.degree}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{e.institution}</p>
                        {e.year && <p className="text-[9px] text-slate-700 font-black mt-1 italic">{e.year}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Optimized Quick View */}
            <div className="glass rounded-[32px] p-8 border-white/5">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Preview</h2>
                  <button onClick={() => setActiveTab('preview')} className="text-[9px] font-black text-brand-500 hover:text-brand-300 uppercase tracking-widest border-b border-brand-500/20 pb-0.5 transition-all">Maximized</button>
               </div>
               
               {resume.original_name.toLowerCase().endsWith('.docx') ? (
                  <div className="aspect-[3/4] bg-white/[0.02] rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center p-6 text-center space-y-4">
                     <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500">
                        <Briefcase size={22} />
                     </div>
                     <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight">Word Archive</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Native preview unsupported for .docx</p>
                     </div>
                     <a href={`/api/resumes/download?id=${resume.id}`} className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-500 transition-all shadow-xl">Download to View</a>
                  </div>
               ) : (
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-black/40 relative group">
                    <iframe 
                        src={`/api/file/${resume.id}#toolbar=0&navpanes=0`} 
                        className="w-full h-full border-0 absolute inset-0 z-10"
                        title="Resume Preview"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <Loader2 size={24} className="text-brand-500/20 animate-spin" />
                    </div>
                  </div>
               )}
            </div>

            {/* Skills */}
            <div className="glass rounded-[32px] p-8 border-white/5">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Competencies</h2>
              <div className="flex flex-wrap gap-2">
                {skills.length === 0
                  ? <p className="text-[10px] text-slate-700 font-black italic">No automated skill fingerprints detected</p>
                  : skills.map(s => (
                    <span key={s} className="text-[10px] px-3 py-1.5 rounded-xl bg-brand-900/10 text-brand-400 border border-brand-500/20 font-black uppercase tracking-widest transition-all hover:bg-brand-500 hover:text-white cursor-default">{s}</span>
                  ))
                }
              </div>
            </div>

            {/* File metadata section */}
            <div className="bg-white/[0.01] rounded-[32px] p-8 border border-white/5 shadow-inner">
               <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">Archive Metadata</h3>
               <div className="space-y-4">
                  {[
                    { label: 'Identifier', value: `#${resume.id}` },
                    { label: 'File Hash', value: resume.filename.slice(0, 16) },
                    { label: 'Payload Header', value: resume.mime_type || 'Unknown' },
                    { label: 'Volume Density', value: `${(resume.file_size / 1024).toFixed(1)} KB` },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{stat.label}</span>
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight">{stat.value}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'preview' ? (
        <div className="glass rounded-[32px] overflow-hidden h-[900px] border-white/5 shadow-2xl relative">
            {resume.original_name.toLowerCase().endsWith('.docx') ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
                 <div className="w-24 h-24 bg-brand-500/10 rounded-[3rem] flex items-center justify-center text-brand-500 border border-brand-500/20">
                    <Briefcase size={40} />
                 </div>
                 <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Maximized Document Preview</h2>
                 <p className="text-sm text-slate-500 max-w-sm uppercase font-black tracking-widest leading-relaxed">
                    This profile is archived in Microsoft Word (.docx) format. 
                    Browsers cannot natively render Word documents.
                 </p>
                 <a href={`/api/resumes/download?id=${resume.id}`} className="px-10 py-5 bg-brand-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-500 transition-all shadow-[0_20px_40px_rgba(99,102,241,0.2)]">Download Original Archive</a>
              </div>
            ) : (
              <>
                <iframe 
                  src={`/api/file/${resume.id}#view=FitH`} 
                  className="w-full h-full border-0 absolute inset-0 z-10"
                  title="Full Resume Preview"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="text-center space-y-4">
                      <Loader2 size={40} className="text-brand-500/10 animate-spin mx-auto" />
                      <p className="text-[10px] text-slate-800 font-black uppercase tracking-[0.5em]">Synchronizing Stream...</p>
                   </div>
                </div>
              </>
            )}
        </div>
      ) : (
        <div className="glass rounded-[32px] p-10 border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 pb-4 border-b border-white/5 flex items-center justify-between">
             Extracted Logic Layer
             <span className="text-emerald-500/50 italic font-black">Raw Data Output</span>
          </h2>
          <pre className="text-[13px] text-slate-500 whitespace-pre-wrap font-mono leading-relaxed max-h-[700px] overflow-y-auto scrollbar-hide">
            {resume.raw_text || 'No automated text layer extracted from this archive.'}
          </pre>
        </div>
      )}
    </div>
  )
}
