'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Loader2, Search, Check } from 'lucide-react'

interface Tag { id: string; name: string; type: string }
interface Script { id: string; name: string; parent?: { id: string; name: string } | null }

interface ScriptFormProps {
  onClose: () => void
  onSuccess: () => void
  editScript?: {
    id: string; name: string
    frontContent?: string | null; midContent?: string | null; endContent?: string | null
    parentId?: string | null; tags: Tag[]
  }
  defaultParent?: { id: string; name: string } | null
}

const TYPE_LABEL: Record<string, string> = { front: '前贴', mid: '中段', end: '尾贴' }

export default function ScriptForm({ onClose, onSuccess, editScript, defaultParent }: ScriptFormProps) {
  const [name, setName] = useState(editScript?.name ?? '')
  const [nameError, setNameError] = useState('')
  const [frontContent, setFrontContent] = useState(editScript?.frontContent ?? '')
  const [midContent, setMidContent] = useState(editScript?.midContent ?? '')
  const [endContent, setEndContent] = useState(editScript?.endContent ?? '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(editScript?.tags.map(t => t.id) ?? [])
  const [parentId, setParentId] = useState<string>(editScript?.parentId ?? defaultParent?.id ?? '')
  const [parentSearch, setParentSearch] = useState(defaultParent?.name ?? '')
  const [showParentDropdown, setShowParentDropdown] = useState(false)
  const [isDerivative, setIsDerivative] = useState(!!(editScript?.parentId ?? defaultParent?.id))
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [allScripts, setAllScripts] = useState<Script[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const parentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/tags').then(r => r.json()),
      fetch('/api/scripts').then(r => r.json()),
    ]).then(([t, s]) => {
      if (t.success) setAllTags(t.data)
      if (s.success) {
        const filtered = s.data.filter((sc: Script) => sc.id !== editScript?.id)
        setAllScripts(filtered)
        // populate parentSearch when editing a script that has a parent
        if (editScript?.parentId && !defaultParent) {
          const p = filtered.find((sc: Script) => sc.id === editScript.parentId)
          if (p) setParentSearch(p.name)
        }
      }
    })
  }, [editScript?.id, editScript?.parentId, defaultParent])

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (parentRef.current && !parentRef.current.contains(e.target as Node)) {
        setShowParentDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const checkName = useCallback(async (n: string) => {
    if (!n.trim() || n === editScript?.name) { setNameError(''); return }
    const res = await fetch(`/api/scripts/check-name?name=${encodeURIComponent(n.trim())}`)
    const json = await res.json()
    if (json.success && !json.data.available) setNameError('该脚本名已存在')
    else setNameError('')
  }, [editScript?.name])

  const toggleTag = (id: string) =>
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const handleSubmit = async () => {
    if (!name.trim()) { setError('脚本名不能为空'); return }
    if (nameError) return
    setSubmitting(true); setError('')

    const body = {
      name: name.trim(),
      frontContent: frontContent || null,
      midContent:   midContent   || null,
      endContent:   endContent   || null,
      parentId:     isDerivative && parentId ? parentId : null,
      tagIds:       selectedTagIds,
    }

    const url = editScript ? `/api/scripts/${editScript.id}` : '/api/scripts'
    const method = editScript ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()

    if (json.success) { onSuccess(); onClose() }
    else setError(json.message)
    setSubmitting(false)
  }

  const tagsByType = ['front', 'mid', 'end'].map(type => ({
    type, label: TYPE_LABEL[type],
    tags: allTags.filter(t => t.type === type),
  }))

  const filteredParents = allScripts.filter(s =>
    !parentSearch || s.name.toLowerCase().includes(parentSearch.toLowerCase())
  )

  const clearParent = () => { setParentId(''); setParentSearch(''); setShowParentDropdown(false) }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">{editScript ? '编辑脚本' : '上传脚本'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 脚本名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">脚本名 <span className="text-red-500">*</span></label>
            <input type="text" value={name}
              onChange={e => { setName(e.target.value); setNameError('') }}
              onBlur={e => checkName(e.target.value)}
              placeholder="全平台唯一，建议格式：脚本001"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${nameError ? 'border-red-400' : 'border-gray-300'}`} />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>

          {/* 是否衍生 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">是否为衍生脚本</label>
            <div className="flex gap-4">
              {[false, true].map(v => (
                <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={isDerivative === v} onChange={() => { setIsDerivative(v); if (!v) clearParent() }}
                    className="accent-blue-600" />
                  <span className="text-sm text-gray-700">{v ? '是（衍生自某脚本）' : '否（原创脚本）'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 父脚本搜索选择 */}
          {isDerivative && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">父脚本 <span className="text-red-500">*</span></label>
              <div className="relative" ref={parentRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={parentSearch}
                    onChange={e => { setParentSearch(e.target.value); setParentId(''); setShowParentDropdown(true) }}
                    onFocus={() => setShowParentDropdown(true)}
                    placeholder="输入脚本名搜索..."
                    className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {(parentId || parentSearch) && (
                    <button type="button" onClick={clearParent}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {parentId && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />已选：{parentSearch}
                  </p>
                )}
                {showParentDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {filteredParents.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-gray-400 text-center">无匹配脚本</div>
                    ) : (
                      filteredParents.map(s => (
                        <button key={s.id} type="button"
                          onClick={() => { setParentId(s.id); setParentSearch(s.name); setShowParentDropdown(false) }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-blue-50 transition-colors ${parentId === s.id ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}>
                          <span>{s.name}</span>
                          {parentId === s.id && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 内容字段 */}
          {[
            { key: 'front', label: '前贴内容', value: frontContent, set: setFrontContent },
            { key: 'mid',   label: '中段内容', value: midContent,   set: setMidContent },
            { key: 'end',   label: '尾贴内容', value: endContent,   set: setEndContent },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <textarea value={f.value} onChange={e => f.set(e.target.value)} rows={3}
                placeholder={`填写${f.label}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          ))}

          {/* 标签多选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
            <div className="space-y-3">
              {tagsByType.map(({ type, label, tags }) => (
                <div key={type}>
                  <p className="text-xs text-gray-400 mb-1.5">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selectedTagIds.includes(tag.id)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                        }`}>
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t flex gap-3 sticky bottom-0 bg-white">
          <button onClick={handleSubmit} disabled={submitting || !!nameError}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {editScript ? '保存修改' : '提交脚本'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
        </div>
      </div>
    </div>
  )
}
