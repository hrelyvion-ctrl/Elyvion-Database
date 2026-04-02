'use client'
import { useEffect, useState } from 'react'
import { Tag, Plus, Trash2, Loader2 } from 'lucide-react'

interface TagType { id: number; name: string; color: string; created_at: string }

const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#3b82f6','#06b6d4','#10b981',
  '#22c55e','#f59e0b','#ec4899','#f97316','#ef4444','#eab308','#84cc16'
]

export default function TagsPage() {
  const [tags, setTags] = useState<TagType[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const fetchTags = () => {
    fetch('/api/tags').then(r => r.json()).then(setTags).finally(() => setLoading(false))
  }
  useEffect(() => { fetchTags() }, [])

  const createTag = async () => {
    if (!newName.trim()) return
    setCreating(true)
    await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    })
    setNewName('')
    fetchTags()
    setCreating(false)
  }

  const deleteTag = async (id: number) => {
    if (!confirm('Delete this tag?')) return
    setDeleting(id)
    await fetch('/api/tags', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchTags()
    setDeleting(null)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Tags</h1>
        <p className="text-slate-400 text-sm mt-1">Organize candidates with color-coded labels</p>
      </div>

      {/* Create tag */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Plus size={15} />Create Tag</h2>
        <div className="flex gap-3">
          <input
            className="input-dark flex-1"
            placeholder="Tag name (e.g. Senior Developer)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createTag()}
          />
          <div className="flex gap-1.5 flex-wrap max-w-[200px]">
            {PRESET_COLORS.map(c => (
              <button
                key={c} onClick={() => setNewColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110'}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <button onClick={createTag} disabled={creating || !newName.trim()} className="btn btn-primary shrink-0 disabled:opacity-50">
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create
          </button>
        </div>
        {newName && (
          <div className="mt-3">
            <span className="text-xs text-slate-400 mr-2">Preview:</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${newColor}20`, color: newColor, border: `1px solid ${newColor}40` }}>
              {newName}
            </span>
          </div>
        )}
      </div>

      {/* Tags grid */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Tag size={15} />All Tags ({tags.length})</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_,i) => <div key={i} className="h-12 skeleton rounded-xl" />)}
          </div>
        ) : tags.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">No tags yet. Create one above.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 group hover:border-white/10 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: tag.color }} />
                  <span className="text-sm text-slate-300 font-medium">{tag.name}</span>
                </div>
                <button onClick={() => deleteTag(tag.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-rose-400">
                  {deleting === tag.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-4 text-xs text-slate-500">
        <p>💡 Tags can be assigned to candidates from their resume detail page.</p>
      </div>
    </div>
  )
}
