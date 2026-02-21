'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Trash2, Loader2, FileText, GitBranch } from 'lucide-react'
import { useSession } from 'next-auth/react'
import ScriptForm from './ScriptForm'
import ScriptDetail from './ScriptDetail'

interface Tag { id: string; name: string; type: string }
interface Script {
  id: string; name: string; createdAt: string
  frontContent?: string | null; midContent?: string | null; endContent?: string | null
  parentId?: string | null
  tags: Tag[]
  uploader?: { id: string; username: string } | null
  parent?: { id: string; name: string } | null
  children?: { id: string; name: string }[]
  _count?: { children: number }
  stat?: { matchedRows: number; totalCost: number; roi: number | null; customers: number } | null
}

const TYPE_COLOR: Record<string, string> = {
  front: 'bg-blue-100 text-blue-700',
  mid:   'bg-purple-100 text-purple-700',
  end:   'bg-green-100 text-green-700',
}
const money = (v: number) => v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${v.toFixed(0)}`

export default function ScriptList() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'
  const userId = session?.user?.id

  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editScript, setEditScript] = useState<Script | null>(null)
  const [detailScript, setDetailScript] = useState<Script | null>(null)
  const [iterateFrom, setIterateFrom] = useState<{ id: string; name: string } | null>(null)
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
    if (!confirm(`确认删除脚本「${name}」？此操作不可恢复。`)) return
    setDeletingId(id)
    await fetch(`/api/scripts/${id}`, { method: 'DELETE' })
    setScripts(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
  }

  const handleIterate = (script: Script) => {
    setDetailScript(null)
    setIterateFrom({ id: script.id, name: script.name })
    setEditScript(null)
    setShowForm(true)
  }

  const filtered = scripts.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="搜索脚本名..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => { setEditScript(null); setIterateFrom(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" />上传脚本
        </button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{query ? '没有匹配的脚本' : '暂无脚本，点击「上传脚本」开始'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(script => (
            <div key={script.id}
              className="border rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setDetailScript(script)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{script.name}</span>
                    {script.parentId && (
                      <span className="flex items-center gap-1 text-xs text-blue-500">
                        <GitBranch className="w-3 h-3" />衍生
                      </span>
                    )}
                    {(script._count?.children ?? 0) > 0 && (
                      <span className="text-xs text-gray-400">{script._count!.children} 个衍生</span>
                    )}
                  </div>

                  {/* 标签 */}
                  {script.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {script.tags.slice(0, 5).map(tag => (
                        <span key={tag.id} className={`px-2 py-0.5 rounded-full text-xs ${TYPE_COLOR[tag.type]}`}>
                          {tag.name}
                        </span>
                      ))}
                      {script.tags.length > 5 && (
                        <span className="text-xs text-gray-400">+{script.tags.length - 5}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {script.uploader && <span>{script.uploader.username}</span>}
                    <span>{new Date(script.createdAt).toLocaleDateString('zh-CN')}</span>
                    {script.stat && script.stat.matchedRows > 0 && (
                      <span className="text-blue-500">消耗 {money(script.stat.totalCost)} · ROI {script.stat.roi?.toFixed(3) ?? '—'}</span>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {(isAdmin || script.uploader?.id === userId) && (
                    <button onClick={() => { setEditScript(script); setIterateFrom(null); setShowForm(true) }}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                      编辑
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(script.id, script.name)}
                      disabled={deletingId === script.id}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50">
                      {deletingId === script.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 表单弹窗 */}
      {showForm && (
        <ScriptForm
          onClose={() => { setShowForm(false); setEditScript(null); setIterateFrom(null) }}
          onSuccess={load}
          editScript={editScript ?? undefined}
          defaultParent={iterateFrom}
        />
      )}

      {/* 详情弹窗 */}
      {detailScript && (
        <ScriptDetail
          script={detailScript}
          onClose={() => setDetailScript(null)}
          canEdit={isAdmin || detailScript.uploader?.id === userId}
          onEdit={() => { setEditScript(detailScript); setDetailScript(null); setIterateFrom(null); setShowForm(true) }}
          onIterate={() => handleIterate(detailScript)}
        />
      )}
    </div>
  )
}
