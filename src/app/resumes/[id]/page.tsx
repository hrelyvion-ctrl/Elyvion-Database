'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, Mail, Phone, Briefcase, GraduationCap,
  Tag, Edit3, Save, X, Trash2, Download, Loader2, User, Calendar, FileText
} from 'lucide-react'

interface Resume {
  id: number; filename: string; original_name: string; file_size: number
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
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 px-1">
        <Link href="/resumes" className="hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft size={14} />Resumes
        </Link>
        <span>/</span>
        <span className="text-slate-300">{resume.parsed_name}</span>
      </div>

      {/* Hero card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shrink-0 glow-sm">
            {(resume.parsed_name || 'U').charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">{resume.parsed_name || 'Unknown Candidate'}</h1>
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
            <a href={`/api/file/${resume.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" title="Download">
              <Download size={15} />
            </a>
            <button onClick={deleteResume} className="btn btn-danger" title="Delete">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Summary */}
            {resume.parsed_summary && (
              <div className="glass rounded-2xl p-5">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User size={14} />Summary
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">{resume.parsed_summary}</p>
              </div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase size={14} />Work Experience
                </h2>
                <div className="space-y-4">
                  {experience.map((e: any, i: number) => (
                    <div key={i} className="relative pl-5 border-l border-brand-900">
                      <div className="absolute -left-1 top-1 w-2 h-2 rounded-full bg-brand-500" />
                      <p className="font-semibold text-slate-200">{e.title}</p>
                      <p className="text-sm text-brand-400">{e.company}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{e.duration}</p>
                      {e.description && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{e.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <GraduationCap size={14} />Education
                </h2>
                <div className="space-y-3">
                  {education.map((e: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm text-slate-200">{e.degree}</p>
                        {e.institution && <p className="text-xs text-slate-400">{e.institution}</p>}
                        {e.year && <p className="text-xs text-slate-500">{e.year}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 size={14} />Recruiter Notes
                </h2>
                {!editingNotes ? (
                  <button onClick={() => setEditingNotes(true)} className="btn btn-ghost py-1 px-2 text-xs">
                    <Edit3 size={12} />Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={saveNotes} className="btn btn-primary py-1 px-2 text-xs">
                      <Save size={12} />Save
                    </button>
                    <button onClick={() => { setEditingNotes(false); setNotes(resume.notes || '') }}
                      className="btn btn-ghost py-1 px-2 text-xs"><X size={12} /></button>
                  </div>
                )}
              </div>
              {editingNotes ? (
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  className="input-dark resize-none"
                  placeholder="Add notes about this candidate..."
                />
              ) : (
                <p className="text-sm text-slate-400 min-h-[60px]">
                  {resume.notes || <span className="text-slate-600 italic">No notes yet. Click edit to add.</span>}
                </p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* PDF Preview Widget (Short) */}
            <div className="glass rounded-2xl p-5 border-brand-500/20">
               <h2 className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  Quick View
                  <button onClick={() => setActiveTab('preview')} className="text-brand-500 hover:text-brand-300 flex items-center gap-1">
                    Full Preview
                  </button>
               </h2>
               <div className="aspect-[3/4] rounded-lg overflow-hidden border border-white/5 bg-black/20">
                  <iframe 
                    src={`/api/file/${resume.id}#toolbar=0&navpanes=0`} 
                    className="w-full h-full border-0"
                    title="Resume Preview"
                  />
               </div>
            </div>

            {/* Skills */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.length === 0
                  ? <p className="text-xs text-slate-600">No skills detected</p>
                  : skills.map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-brand-900/50 text-brand-300 border border-brand-800/40 font-medium">{s}</span>
                  ))
                }
              </div>
            </div>

            {/* Tags */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag size={14} />Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0
                  ? <p className="text-xs text-slate-600">No tags</p>
                  : tags.map((t: string) => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-purple-900/30 text-purple-300 border border-purple-800/30">{t}</span>
                  ))
                }
              </div>
            </div>

            {/* File info */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={14} />File Info
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Filename</span>
                  <span className="text-slate-300 truncate max-w-[140px]" title={resume.original_name}>{resume.original_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Size</span>
                  <span className="text-slate-300">{(resume.file_size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uploaded</span>
                  <span className="text-slate-300">{new Date(resume.uploaded_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Updated</span>
                  <span className="text-slate-300">{new Date(resume.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'preview' ? (
        <div className="glass rounded-2xl overflow-hidden h-[800px]">
           <iframe 
            src={`/api/file/${resume.id}#view=FitH`} 
            className="w-full h-full border-0"
            title="Full Resume Preview"
          />
        </div>
      ) : (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Raw Extracted Text</h2>
          <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto">
            {resume.raw_text || 'No text extracted from this file.'}
          </pre>
        </div>
      )}
    </div>
  )
}
