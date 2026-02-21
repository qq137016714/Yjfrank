'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, Loader2, FileText } from 'lucide-react'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/scripts')
    const json = await res.json()
    if (json.success) setScripts(json.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

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
