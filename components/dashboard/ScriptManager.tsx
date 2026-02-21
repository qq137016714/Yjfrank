'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Loader2, FileText } from 'lucide-react'

interface Script {
  id: string
  name: string
  stat?: { matchedRows: number; totalCost: number } | null
}

interface ScriptManagerProps {
  isAdmin: boolean
  onChanged?: () => void
}

export default function ScriptManager({ isAdmin, onChanged }: ScriptManagerProps) {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/scripts')
    const json = await res.json()
    if (json.success) setScripts(json.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const json = await res.json()
    if (json.success) {
      setNewName('')
      await load()
      onChanged?.()
    } else {
      setError(json.message)
    }
    setAdding(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确认删除脚本「${name}」？相关统计数据也将清除。`)) return
    setDeletingId(id)
    await fetch(`/api/scripts/${id}`, { method: 'DELETE' })
    setScripts(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
    onChanged?.()
  }

  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="输入脚本名，回车添加"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : scripts.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">暂无脚本{isAdmin ? '，请添加' : ''}</p>
        </div>
      ) : (
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {scripts.map(s => (
            <li key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">
              <span className="text-gray-800 truncate flex-1">{s.name}</span>
              <span className="text-xs text-gray-400 mx-2 shrink-0">
                {s.stat ? `${s.stat.matchedRows} 行` : '未匹配'}
              </span>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  disabled={deletingId === s.id}
                  className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
                >
                  {deletingId === s.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
