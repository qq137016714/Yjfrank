'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Trash2, Loader2, FileText, GitBranch, SlidersHorizontal, Upload, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import ScriptForm from './ScriptForm'
import ScriptDetail from './ScriptDetail'
import ScriptCompare from './ScriptCompare'
import ScriptImport from './ScriptImport'

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
const TYPE_ACTIVE: Record<string, string> = {
  front: 'bg-blue-600 text-white border-blue-600',
  mid:   'bg-purple-600 text-white border-purple-600',
  end:   'bg-green-600 text-white border-green-600',
}
const money = (v: number) => v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${v.toFixed(0)}`

const PAGE_SIZE = 20

export default function ScriptList() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'
  const userId = session?.user?.id

  const [scripts, setScripts] = useState<Script[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])
  const [hasDataOnly, setHasDataOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editScript, setEditScript] = useState<Script | null>(null)
  const [detailScript, setDetailScript] = useState<Script | null>(null)
  const [iterateFrom, setIterateFrom] = useState<{ id: string; name: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/scripts')
    const json = await res.json()
    if (json.success) setScripts(json.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    fetch('/api/tags').then(r => r.json()).then(j => { if (j.success) setAllTags(j.data) })
  }, [load])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确认删除脚本「${name}」？此操作不可恢复。`)) return
    setDeletingId(id)
    await fetch(`/api/scripts/${id}`, { method: 'DELETE' })
    setScripts(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
  }

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`确认删除选中的 ${selectedIds.size} 条脚本？此操作不可恢复。`)) return
    setBatchDeleting(true)
    const res = await fetch('/api/scripts/batch-delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    })
    const json = await res.json()
    if (json.success) {
      setScripts(prev => prev.filter(s => !selectedIds.has(s.id)))
      setSelectedIds(new Set())
      setSelectMode(false)
    }
    setBatchDeleting(false)
  }

  const handleIterate = (script: Script) => {
    setDetailScript(null)
    setIterateFrom({ id: script.id, name: script.name })
    setEditScript(null)
    setShowForm(true)
  }

  const toggleFilterTag = (id: string) => {
    setFilterTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
    setPage(1)
  }

  const toggleCompare = (id: string) =>
    setCompareIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 4 ? [...prev, id] : prev)

  const filtered = scripts.filter(s => {
    if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false
    if (hasDataOnly && (!s.stat || s.stat.matchedRows === 0)) return false
    if (filterTagIds.length > 0 && !filterTagIds.some(tid => s.tags.some(t => t.id === tid))) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const tagsByType = ['front', 'mid', 'end'].map(type => ({
    type,
    label: type === 'front' ? '前贴' : type === 'mid' ? '中段' : '尾贴',
    tags: allTags.filter(t => t.type === type),
  }))

  const activeFilterCount = filterTagIds.length + (hasDataOnly ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="搜索脚本名..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
            activeFilterCount > 0 ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}>
          <SlidersHorizontal className="w-4 h-4" />
          筛选{activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
        </button>
        <button onClick={() => { setEditScript(null); setIterateFrom(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" />上传脚本
        </button>
        <button onClick={() => setShowImport(true)}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          <Upload className="w-4 h-4" />批量导入
        </button>
        {isAdmin && (
          <button onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()) }}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              selectMode ? 'bg-red-50 border-red-300 text-red-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
            <CheckSquare className="w-4 h-4" />{selectMode ? '退出多选' : '多选'}
          </button>
        )}
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium w-10 shrink-0">快速</span>
            <button onClick={() => { setHasDataOnly(!hasDataOnly); setPage(1) }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                hasDataOnly ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}>
              有投放数据
            </button>
            {activeFilterCount > 0 && (
              <button onClick={() => { setFilterTagIds([]); setHasDataOnly(false); setPage(1) }}
                className="px-3 py-1 rounded-full text-xs text-red-500 border border-red-200 hover:bg-red-50">
                清除筛选
              </button>
            )}
          </div>
          {tagsByType.map(({ type, label, tags }) => tags.length > 0 && (
            <div key={type} className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-medium w-10 shrink-0">{label}</span>
              {tags.map(tag => (
                <button key={tag.id} onClick={() => toggleFilterTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filterTagIds.includes(tag.id) ? TYPE_ACTIVE[type] : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}>
                  {tag.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 批量删除栏 */}
      {selectMode && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm">
          <span className="text-red-700 font-medium">已选 {selectedIds.size} 条</span>
          <div className="flex-1" />
          <button onClick={() => setSelectedIds(new Set(filtered.map(s => s.id)))}
            className="text-red-500 hover:text-red-700 text-xs">全选当前页</button>
          <button onClick={() => setSelectedIds(new Set())}
            className="text-gray-400 hover:text-gray-600 text-xs">取消全选</button>
          <button onClick={handleBatchDelete} disabled={batchDeleting || selectedIds.size === 0}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 disabled:opacity-50">
            {batchDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            删除选中
          </button>
        </div>
      )}

      {/* 对比栏 */}
      {compareIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <span className="text-amber-700 font-medium">已选 {compareIds.length} 条脚本对比</span>
          <span className="text-amber-500 text-xs">（最多4条）</span>
          <div className="flex-1" />
          <button onClick={() => setCompareIds([])} className="text-amber-500 hover:text-amber-700 text-xs">清除</button>
          <button onClick={() => setShowCompare(true)}
            className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600">
            开始对比
          </button>
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{query || activeFilterCount > 0 ? '没有匹配的脚本' : '暂无脚本，点击「上传脚本」开始'}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map(script => (
            <div key={script.id}
              className={`border rounded-xl p-4 hover:bg-gray-50 transition-colors ${
                compareIds.includes(script.id) ? 'border-amber-400 bg-amber-50' :
                selectedIds.has(script.id) ? 'border-red-300 bg-red-50' : ''
              } ${!selectMode ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={() => selectMode ? toggleSelect(script.id) : setDetailScript(script)}>
              <div className="flex items-start justify-between gap-3">
                {selectMode && (
                  <input type="checkbox" checked={selectedIds.has(script.id)}
                    onChange={() => toggleSelect(script.id)}
                    onClick={e => e.stopPropagation()}
                    className="mt-1 rounded border-gray-300 text-red-500 shrink-0" />
                )}
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

                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleCompare(script.id)}
                    title="加入对比"
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      compareIds.includes(script.id)
                        ? 'text-amber-600 bg-amber-100'
                        : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                    }`}>
                    对比
                  </button>
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

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>第 {page}/{totalPages} 页</span>
                <span>·</span>
                <span>共 {filtered.length} 条</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <ScriptForm
          onClose={() => { setShowForm(false); setEditScript(null); setIterateFrom(null) }}
          onSuccess={load}
          editScript={editScript ?? undefined}
          defaultParent={iterateFrom}
        />
      )}

      {detailScript && (
        <ScriptDetail
          scriptId={detailScript.id}
          onClose={() => setDetailScript(null)}
          canEdit={isAdmin || detailScript.uploader?.id === userId}
          onEdit={() => { setEditScript(detailScript); setDetailScript(null); setIterateFrom(null); setShowForm(true) }}
          onIterate={() => handleIterate(detailScript)}
        />
      )}

      {showCompare && compareIds.length >= 2 && (
        <ScriptCompare ids={compareIds} onClose={() => setShowCompare(false)} />
      )}

      {showImport && (
        <ScriptImport onClose={() => setShowImport(false)} onSuccess={load} />
      )}
    </div>
  )
}
