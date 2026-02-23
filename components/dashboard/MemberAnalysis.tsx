'use client'

import { useEffect, useState } from 'react'
import { Users, Loader2 } from 'lucide-react'

interface MemberStat {
  name: string
  rowCount: number
  totalCost: number
  customers: number
  highCourseRevenue: number
  roi: number | null
  customerCost: number | null
}

interface MemberAnalysisProps {
  refreshTrigger?: number
  uploadId?: string | null
}

const fmt = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(2)}万` : n.toFixed(2)

function MemberTable({ data }: { data: MemberStat[] }) {
  if (data.length === 0) return <p className="text-center py-6 text-sm text-gray-400">暂无数据（请先在管理后台配置命名规则关键词）</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-4 font-medium text-gray-600">姓名</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">素材数</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">总消耗</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">获客数</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">高价课流水</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">ROI</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">获客成本</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="py-2 px-4 font-medium text-gray-900">{item.name}</td>
              <td className="text-right py-2 px-4 text-gray-600">{item.rowCount}</td>
              <td className="text-right py-2 px-4 text-gray-900">¥{fmt(item.totalCost)}</td>
              <td className="text-right py-2 px-4 text-gray-900">{item.customers.toLocaleString()}</td>
              <td className="text-right py-2 px-4 text-gray-900">¥{fmt(item.highCourseRevenue)}</td>
              <td className="text-right py-2 px-4">
                <span className={`font-medium ${item.roi !== null && item.roi > 1 ? 'text-green-600' : item.roi !== null && item.roi > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {item.roi !== null ? item.roi.toFixed(3) : '—'}
                </span>
              </td>
              <td className="text-right py-2 px-4 text-gray-900">
                {item.customerCost !== null ? `¥${item.customerCost.toFixed(2)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function MemberAnalysis({ refreshTrigger, uploadId }: MemberAnalysisProps) {
  const [data, setData] = useState<{ editors: MemberStat[]; cutters: MemberStat[] }>({ editors: [], cutters: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'editor' | 'cutter'>('editor')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const url = uploadId ? `/api/stats/member-analysis?uploadId=${uploadId}` : '/api/stats/member-analysis'
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch (e) {
        console.error('Failed to load member analysis:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshTrigger, uploadId])

  const current = tab === 'editor' ? data.editors : data.cutters

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">成员数据分析</h2>
          <span className="text-sm text-gray-500">({current.length} 人)</span>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setTab('editor')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${tab === 'editor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            编导
          </button>
          <button onClick={() => setTab('cutter')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${tab === 'cutter' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            剪辑
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : (
        <MemberTable data={current} />
      )}
    </div>
  )
}
