'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Loader2, BarChart3 } from 'lucide-react'

interface ChannelStats {
  channel: string
  totalCost: number
  customers: number
  highCourseRevenue: number
  roi: number | null
  impressions: number
  clicks: number
  clickRate: number | null
  conversionRate: number | null
  customerCost: number | null
  activations: number
  additions: number
  highCourseCount: number
  refunds: number
  refundRate: number | null
  periods: number
}

interface ChannelAnalysisProps {
  refreshTrigger?: number
  uploadId?: string | null
}

const fmt = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(2)}万` : n.toFixed(2)

export default function ChannelAnalysis({ refreshTrigger, uploadId }: ChannelAnalysisProps) {
  const [data, setData] = useState<ChannelStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const url = uploadId ? `/api/stats/channel-analysis?uploadId=${uploadId}` : '/api/stats/channel-analysis'
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        }
      } catch (error) {
        console.error('Failed to load channel analysis:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [refreshTrigger, uploadId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">渠道分析</h2>
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
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">渠道分析</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>暂无渠道数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h2 className="font-semibold text-gray-900">渠道分析</h2>
        <span className="text-sm text-gray-500">({data.length} 个渠道)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">渠道</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">总消耗</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">获客数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">高价课流水</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">ROI</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">获客成本</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">展示数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">点击率</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">转化率</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">激活数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">添加数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">高价课人数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">退款率</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.channel} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {item.channel}
                  </span>
                </td>
                <td className="text-right py-3 px-4 text-gray-900 font-medium">
                  ¥{fmt(item.totalCost)}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.customers.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-900 font-medium">
                  ¥{fmt(item.highCourseRevenue)}
                </td>
                <td className="text-right py-3 px-4">
                  <span className={`font-medium ${
                    item.roi !== null && item.roi > 1
                      ? 'text-green-600'
                      : item.roi !== null && item.roi > 0.5
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}>
                    {item.roi !== null ? item.roi.toFixed(3) : '—'}
                  </span>
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.customerCost !== null ? `¥${item.customerCost.toFixed(2)}` : '—'}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {fmt(item.impressions)}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.clickRate !== null ? `${(item.clickRate * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.conversionRate !== null ? `${(item.conversionRate * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.activations.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.additions.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.highCourseCount.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-900">
                  {item.refundRate !== null ? `${(item.refundRate * 100).toFixed(2)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 汇总信息 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">总消耗：</span>
            <span className="font-medium">¥{fmt(data.reduce((sum, item) => sum + item.totalCost, 0))}</span>
          </div>
          <div>
            <span className="text-gray-500">总获客：</span>
            <span className="font-medium">{data.reduce((sum, item) => sum + item.customers, 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">总流水：</span>
            <span className="font-medium">¥{fmt(data.reduce((sum, item) => sum + item.highCourseRevenue, 0))}</span>
          </div>
          <div>
            <span className="text-gray-500">整体ROI：</span>
            <span className="font-medium">
              {(() => {
                const totalCost = data.reduce((sum, item) => sum + item.totalCost, 0)
                const totalRevenue = data.reduce((sum, item) => sum + item.highCourseRevenue, 0)
                return totalCost > 0 ? (totalRevenue / totalCost).toFixed(3) : '—'
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}