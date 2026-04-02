'use client'
import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, CloudUpload } from 'lucide-react'
import Link from 'next/link'

interface FileItem {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  message?: string
  id?: number
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain']
    const newItems: FileItem[] = []
    for (const f of Array.from(incoming)) {
      if (allowed.includes(f.type) || f.name.match(/\.(pdf|docx|txt)$/i)) {
        newItems.push({ file: f, status: 'pending' })
      }
    }
    setFiles(prev => [...prev, ...newItems])
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const uploadAll = async () => {
    const pending = files.filter(f => f.status === 'pending')
    if (pending.length === 0) return
    setUploading(true)

    // Update all pending to uploading
    setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'uploading' } : f))

    const formData = new FormData()
    pending.forEach(f => formData.append('files', f.file))

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      setFiles(prev => {
        const results: Record<string, any> = {}
        for (const r of (data.results || [])) results[r.name] = r
        return prev.map(f => {
          if (f.status !== 'uploading') return f
          const r = results[f.file.name]
          if (!r) return { ...f, status: 'error', message: 'Unknown error' }
          if (r.status === 'success') return { ...f, status: 'done', id: r.id }
          return { ...f, status: 'error', message: r.status }
        })
      })
    } catch (err: any) {
      setFiles(prev => prev.map(f =>
        f.status === 'uploading' ? { ...f, status: 'error', message: err.message } : f
      ))
    }
    setUploading(false)
  }

  const clearDone = () => setFiles(prev => prev.filter(f => f.status !== 'done'))
  const hasErrors = files.some(f => f.status === 'error')
  const doneCount = files.filter(f => f.status === 'done').length
  const pendingCount = files.filter(f => f.status === 'pending').length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Upload Resumes</h1>
        <p className="text-slate-400 text-sm mt-1">Drag &amp; drop PDF, DOCX, or TXT files — we&apos;ll parse them automatically</p>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone p-14 text-center cursor-pointer transition-all ${dragging ? 'active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-600/20 flex items-center justify-center transition-transform ${dragging ? 'scale-110' : ''}`}>
          <CloudUpload size={32} className="text-brand-400" />
        </div>
        <p className="text-slate-300 font-semibold text-lg">
          {dragging ? 'Drop them here!' : 'Drop resumes here or click to browse'}
        </p>
        <p className="text-slate-500 text-sm mt-1">Supports PDF, DOCX, TXT · Multiple files at once</p>
        <div className="flex gap-2 justify-center mt-4">
          {['PDF', 'DOCX', 'TXT'].map(t => (
            <span key={t} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">{t}</span>
          ))}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-medium text-slate-300">
              {files.length} file{files.length !== 1 ? 's' : ''} queued
              {doneCount > 0 && <span className="text-emerald-400 ml-2">· {doneCount} uploaded</span>}
            </p>
            <div className="flex gap-2">
              {doneCount > 0 && (
                <button onClick={clearDone} className="btn btn-ghost text-xs py-1 px-3">Clear done</button>
              )}
            </div>
          </div>

          <div className="divide-y divide-[rgba(99,102,241,0.08)] max-h-80 overflow-y-auto">
            {files.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-5 py-3">
                <FileText size={18} className={
                  item.status === 'done' ? 'text-emerald-400' :
                  item.status === 'error' ? 'text-rose-400' :
                  item.status === 'uploading' ? 'text-brand-400 animate-pulse' :
                  'text-slate-500'
                } />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{item.file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(item.file.size / 1024).toFixed(1)} KB
                    {item.message && <span className="text-rose-400 ml-2">· {item.message}</span>}
                    {item.status === 'done' && item.id && (
                      <Link href={`/resumes/${item.id}`} className="text-brand-400 ml-2 hover:underline">View →</Link>
                    )}
                  </p>
                </div>
                <div className="shrink-0">
                  {item.status === 'pending' && (
                    <button onClick={() => removeFile(idx)} className="text-slate-600 hover:text-slate-300 transition-colors">
                      <X size={16} />
                    </button>
                  )}
                  {item.status === 'uploading' && <Loader2 size={16} className="text-brand-400 animate-spin" />}
                  {item.status === 'done' && <CheckCircle size={16} className="text-emerald-400" />}
                  {item.status === 'error' && <AlertCircle size={16} className="text-rose-400" />}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-[var(--border)] flex gap-3">
            <button
              onClick={uploadAll}
              disabled={uploading || pendingCount === 0}
              className="btn btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload {pendingCount > 0 ? `${pendingCount} Files` : 'Files'}</>}
            </button>
            {hasErrors && (
              <button
                onClick={() => setFiles(prev => prev.map(f => f.status === 'error' ? { ...f, status: 'pending', message: undefined } : f))}
                className="btn btn-ghost"
              >Retry Errors</button>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">What gets extracted automatically</p>
        <div className="grid grid-cols-2 gap-2">
          {['👤 Candidate Name', '📧 Email Address', '📱 Phone Number', '🛠️ Skills & Tech Stack',
            '💼 Work Experience', '🎓 Education', '📝 Summary', '⏱️ Years of Experience'].map(item => (
            <div key={item} className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle size={12} className="text-emerald-500 shrink-0" />{item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
