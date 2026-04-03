'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
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
  const [selectedFolder, setSelectedFolder] = useState('Uncategorized')
  const [folders, setFolders] = useState<string[]>(['Uncategorized','AI','Software Engineer','Sales','Marketing','Design'])
  const [compressEnabled, setCompressEnabled] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders')
      const data = await res.json()
      if (Array.isArray(data)) setFolders(['Uncategorized', ...data.filter(f => f !== 'Uncategorized')])
    } catch {}
  }, [])

  useEffect(() => { fetchFolders() }, [fetchFolders])

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
    
    // Auto-Compression Logic
    const JSZip = (await import('jszip')).default
    
    for (const f of pending) {
      if (compressEnabled && f.file.size > 50 * 1024) { // Only compress if over 50KB
        try {
          const zip = new JSZip()
          zip.file(f.file.name, f.file)
          const zippedBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } })
          const compressedFile = new File([zippedBlob], f.file.name + '.zip', { type: 'application/zip' })
          formData.append('files', compressedFile)
        } catch (e) {
          formData.append('files', f.file)
        }
      } else {
        formData.append('files', f.file)
      }
    }
    
    formData.append('folder', selectedFolder)
    formData.append('compressed', String(compressEnabled))

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
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Upload Resumes</h1>
        <p className="text-slate-400 text-sm mt-1">Drag &amp; drop PDF, DOCX, or TXT files — we&apos;ll parse them automatically</p>
      </div>

      {/* Compression Toggle */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between border-brand-500/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
         <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${compressEnabled ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
               <CloudUpload size={20} />
            </div>
            <div>
               <p className="text-[11px] font-black text-white uppercase tracking-widest">Resume Auto-Compression</p>
               <p className="text-[10px] text-slate-500 font-medium">Bypass storage limits by zipping files before upload</p>
            </div>
         </div>
         <button 
           onClick={() => setCompressEnabled(!compressEnabled)}
           className={`w-12 h-6 rounded-full transition-all relative ${compressEnabled ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-700'}`}
         >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${compressEnabled ? 'left-7' : 'left-1'}`} />
         </button>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone p-12 text-center cursor-pointer transition-all border-dashed ${dragging ? 'active scale-[0.99]' : 'hover:scale-[1.01]'}`}
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
        <div className={`w-16 h-16 mx-auto mb-5 rounded-3xl bg-brand-600/10 border border-brand-500/10 flex items-center justify-center transition-transform ${dragging ? 'scale-110' : ''}`}>
          <Upload size={28} className="text-brand-500" />
        </div>
        <p className="text-white font-bold text-xl tracking-tight">
          {dragging ? 'Release to Start Extraction' : 'Drop resumes or click to browse'}
        </p>
        <p className="text-slate-500 text-[11px] font-medium mt-1 uppercase tracking-widest leading-loose">Support PDF, DOCX, TXT · Multiple files simultaneously</p>
        <div className="flex gap-2.5 justify-center mt-6">
          {['PDF', 'DOCX', 'TXT'].map(t => (
            <span key={t} className="text-[10px] font-black px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500 uppercase tracking-widest">{t}</span>
          ))}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
            <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              {files.length} file{files.length !== 1 ? 's' : ''} in queue
              {doneCount > 0 && <span className="text-emerald-400 ml-2">· {doneCount} completed</span>}
            </p>
            <div className="flex gap-2">
              {doneCount > 0 && (
                <button onClick={clearDone} className="text-[10px] font-black uppercase text-brand-400 tracking-wider hover:text-brand-300 transition-colors">Clear completed</button>
              )}
            </div>
          </div>

          <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
            {files.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.01] transition-colors group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.status === 'done' ? 'bg-emerald-500/10' :
                  item.status === 'error' ? 'bg-rose-500/10' :
                  'bg-white/5'
                }`}>
                  <FileText size={18} className={
                    item.status === 'done' ? 'text-emerald-400' :
                    item.status === 'error' ? 'text-rose-400' :
                    item.status === 'uploading' ? 'text-brand-400 animate-pulse' :
                    'text-slate-500'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{item.file.name}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-0.5">
                    {(item.file.size / 1024).toFixed(1)} KB
                    {item.message && <span className="text-rose-400 ml-2 font-black">· {item.message}</span>}
                    {item.status === 'done' && item.id && (
                      <Link href={`/resumes/${item.id}`} className="text-brand-400 ml-2 hover:text-brand-300 transition-colors underline underline-offset-4 decoration-brand-500/20">View Resume →</Link>
                    )}
                  </p>
                </div>
                <div className="shrink-0">
                  {item.status === 'pending' && (
                    <button onClick={() => removeFile(idx)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-slate-300 hover:bg-white/5 transition-all">
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

          <div className="px-5 py-6 border-t border-white/5 bg-white/[0.01]">
            <div className="mb-6 space-y-3">
               <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Target Folder / Category</label>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {folders.map((f: string) => (
                     <button
                        key={f}
                        onClick={() => setSelectedFolder(f)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedFolder === f ? 'bg-brand-600/10 border-brand-500/30 text-brand-400' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-400'}`}
                     >
                        {f}
                     </button>
                  ))}
               </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={uploadAll}
                disabled={uploading || pendingCount === 0}
                className="btn bg-brand-600 text-white hover:bg-brand-500 py-3.5 flex-1 justify-center rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {uploading ? <><Loader2 size={16} className="animate-spin mr-2" /> Uploading...</> : <><Upload size={16} className="mr-2" /> Start Uploading {pendingCount > 0 ? `${pendingCount} Resume${pendingCount > 1 ? 's' : ''}` : ''}</>}
              </button>
              {hasErrors && (
                <button
                  onClick={() => setFiles(prev => prev.map(f => f.status === 'error' ? { ...f, status: 'pending', message: undefined } : f))}
                  className="btn bg-white/5 text-slate-400 hover:text-white border border-white/5 px-4 rounded-xl text-xs font-bold"
                >Retry Failed</button>
              )}
            </div>
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
