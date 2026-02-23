'use client'

import { useEffect, useState } from 'react'
import { Tag, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface TagStats {
  tagName: string
  scriptCount: number
  totalCost: number
  customers: number
  roi: number | null
}

interface TagAnalysisData {
  front: TagStats[]
  mid: TagStats[]
  end: TagStats[]
}

interface TagAnalysisProps {
  refreshTrigger?: number
  uploadId?: string | null
}

const SEGMENT_LABELS = { front: '前贴', mid: '中段', end: '尾贴' } as const
const SEGMENT_COLORS = {
  front: 'bg-blue-100 text-blue-800',
  mid:   'bg-purple-100 text-purple-800',
  end:   'bg-green-100 text-green-800',
} as const

const fmt = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(2)}万` : n.toFixed(2)

function SegmentTable({ items, label, colorClass }: { items: TagStats[]; label: string; colorClass: string }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
          {label}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          {items.length} 个标签
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          {items.length === 0 ? (
            <p className="text-center py-6 text-sm text-gray-400">暂无数据</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-medium text-gray-600">标签名</th>
                  <th className="text-right py-2 px-4 font-medium text-gray-600">脚本数</th>
                  <th className="text-right py-2 px-4 font-medium text-gray-600">总消耗</th>
                  <th className="text-right py-2 px-4 font-medium text-gray-600">总获客</th>
                  <th className="text-right py-2 px-4 font-medium text-gray-600">ROI</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.tagName} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4 text-gray-900">{item.tagName}</td>
                    <td className="text-right py-2 px-4 text-gray-900">{item.scriptCount.toLocaleString()}</td>
                    <td className="text-right py-2 px-4 text-gray-900">¥{fmt(item.totalCost)}</td>
                    <td className="text-right py-2 px-4 text-gray-900">{item.customers.toLocaleString()}</td>
                    <td className="text-right py-2 px-4 text-gray-900">
                      {item.roi !== null ? item.roi.toFixed(3) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default function TagAnalysis({ refreshTrigger, uploadId }: TagAnalysisProps) {
  const [data, setData] = useState<TagAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const url = uploadId ? `/api/stats/by-tag?uploadId=${uploadId}` : '/api/stats/by-tag'
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch (error) {
        console.error('Failed to load tag analysis:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [refreshTrigger, uploadId])

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-purple-600" />
        <h2 className="font-semibold text-gray-900">标签分析</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : !data || (data.front.length === 0 && data.mid.length === 0 && data.end.length === 0) ? (
        <div className="text-center py-8 text-gray-500">
          <p>暂无标签数据，请先导入脚本</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(['front', 'mid', 'end'] as const).map(seg => (
            <SegmentTable
              key={seg}
              items={data[seg]}
              label={SEGMENT_LABELS[seg]}
              colorClass={SEGMENT_COLORS[seg]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
