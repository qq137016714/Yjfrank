'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'

interface ContentTypeStats {
  contentType: string
  scriptCount: number
  totalCost: number
  customers: number
  roi: number | null
}

interface ContentTypeAnalysisProps {
  refreshTrigger?: number
}

const fmt = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(2)}万` : n.toFixed(2)

export default function ContentTypeAnalysis({ refreshTrigger }: ContentTypeAnalysisProps) {
  const [data, setData] = useState<ContentTypeStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/stats/by-content-type')
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        }
      } catch (error) {
        console.error('Failed to load content type analysis:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">按类型分析</h2>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">按类型分析</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>请先在管理后台扫描脚本库</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h2 className="font-semibold text-gray-900">按类型分析</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">类型</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">脚本数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">总消耗</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">总获客</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">ROI</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.contentType} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.contentType}
                  </span>
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.scriptCount.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  ¥{fmt(item.totalCost)}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.customers.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.roi !== null ? item.roi.toFixed(3) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}