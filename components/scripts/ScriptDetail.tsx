'use client'

import { X, GitBranch, BarChart2 } from 'lucide-react'

interface Tag { id: string; name: string; type: string }
interface ScriptDetailProps {
  script: {
    id: string; name: string
    frontContent?: string | null; midContent?: string | null; endContent?: string | null
    tags: Tag[]
    uploader?: { username: string } | null
    parent?: { id: string; name: string } | null
    children?: { id: string; name: string }[]
    stat?: { matchedRows: number; totalCost: number; roi: number | null; customers: number } | null
    createdAt: string
  }
  onClose: () => void
  onEdit?: () => void
  onIterate?: () => void
  canEdit: boolean
}

const TYPE_LABEL: Record<string, string> = { front: '前贴', mid: '中段', end: '尾贴' }
const TYPE_COLOR: Record<string, string> = {
  front: 'bg-blue-100 text-blue-700',
  mid:   'bg-purple-100 text-purple-700',
  end:   'bg-green-100 text-green-700',
}
const money = (v: number) => v >= 10000 ? `¥${(v / 10000).toFixed(2)}万` : `¥${v.toFixed(2)}`

export default function ScriptDetail({ script, onClose, onEdit, onIterate, canEdit }: ScriptDetailProps) {
  const tagsByType = ['front', 'mid', 'end'].map(type => ({
    type, label: TYPE_LABEL[type],
    tags: script.tags.filter(t => t.type === type),
  })).filter(g => g.tags.length > 0)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900 truncate pr-4">{script.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 元信息 */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            {script.uploader && <span>上传者：{script.uploader.username}</span>}
            <span>创建于 {new Date(script.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>

          {/* 父子关系 */}
          {(script.parent || (script.children && script.children.length > 0)) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {script.parent && (
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">衍生自：</span>
                  <span className="font-medium text-blue-600">{script.parent.name}</span>
                </div>
              )}
              {script.children && script.children.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <GitBranch className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-500">衍生脚本：</span>
                  <div className="flex flex-wrap gap-1">
                    {script.children.map(c => (
                      <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{c.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 数据摘要 */}
          {script.stat && script.stat.matchedRows > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '总消耗', value: money(script.stat.totalCost) },
                { label: '总获客', value: script.stat.customers.toLocaleString() },
                { label: 'ROI',    value: script.stat.roi != null ? script.stat.roi.toFixed(3) : '—' },
              ].map(item => (
                <div key={item.label} className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-500">{item.label}</p>
                  <p className="font-semibold text-blue-900 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* 内容 */}
          {[
            { label: '前贴内容', value: script.frontContent },
            { label: '中段内容', value: script.midContent },
            { label: '尾贴内容', value: script.endContent },
          ].filter(f => f.value).map(f => (
            <div key={f.label}>
              <p className="text-sm font-medium text-gray-700 mb-1">{f.label}</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{f.value}</p>
            </div>
          ))}

          {/* 标签 */}
          {tagsByType.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">标签</p>
              <div className="space-y-2">
                {tagsByType.map(({ type, label, tags }) => (
                  <div key={type} className="flex items-start gap-2">
                    <span className="text-xs text-gray-400 mt-1 w-8 shrink-0">{label}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(tag => (
                        <span key={tag.id} className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[type]}`}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-2 sticky bottom-0 bg-white">
          <button onClick={onIterate}
            className="flex-1 flex items-center justify-center gap-2 border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-50">
            <GitBranch className="w-4 h-4" />以此脚本迭代
          </button>
          {canEdit && (
            <button onClick={onEdit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              编辑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
