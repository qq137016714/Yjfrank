'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, Users, DollarSign, BarChart2 } from 'lucide-react'

interface StatsData {
  totalCost: number
  totalCustomers: number
  avgCustomerCost: number | null
  roi: number | null
  scriptCount: number
  top10Cost: { name: string; value: number }[]
  top3Cost: { name: string; value: number }[]
  top3Revenue: { name: string; value: number }[]
}

interface MarketData {
  totalCost: number
  totalCustomers: number
  avgCustomerCost: number | null
  roi: number | null
}

interface CombinedKpiSectionProps {
  refreshTrigger?: number
  uploadId?: string | null
}

const fmt = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(2)}万` : n.toFixed(2)

export default function CombinedKpiSection({ refreshTrigger, uploadId }: CombinedKpiSectionProps) {
  const [scriptData, setScriptData] = useState<StatsData | null>(null)
  const [marketData, setMarketData] = useState<MarketData | null>(null)

  const loadScriptData = useCallback(async () => {
    const url = uploadId ? `/api/stats?uploadId=${uploadId}` : '/api/stats'
    const res = await fetch(url)
    const json = await res.json()
    if (json.success) setScriptData(json.data)
  }, [uploadId])

  const loadMarketData = useCallback(async () => {
    const res = await fetch('/api/stats/market')
    const json = await res.json()
    if (json.success) setMarketData(json.data)
  }, [])

  useEffect(() => {
    loadScriptData()
    loadMarketData()
  }, [loadScriptData, loadMarketData, refreshTrigger])

  if (!scriptData || !marketData) return null

  const scriptCards = [
    {
      label: '总消耗',
      value: `¥${fmt(scriptData.totalCost)}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-50',
      scriptValue: scriptData.totalCost,
      marketValue: marketData.totalCost,
      showProgress: true,
    },
    {
      label: '总获客数',
      value: scriptData.totalCustomers.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      color: 'text-green-600 bg-green-50',
      scriptValue: scriptData.totalCustomers,
      marketValue: marketData.totalCustomers,
      showProgress: true,
    },
    {
      label: '平均获客成本',
      value: scriptData.avgCustomerCost != null ? `¥${scriptData.avgCustomerCost.toFixed(2)}` : '—',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-orange-600 bg-orange-50',
      showProgress: false,
    },
    {
      label: '整体 ROI',
      value: scriptData.roi != null ? scriptData.roi.toFixed(3) : '—',
      icon: <BarChart2 className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-50',
      showProgress: false,
    },
  ]

  const marketCards = [
    {
      label: '总消耗',
      value: `¥${fmt(marketData.totalCost)}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: '总获客数',
      value: marketData.totalCustomers.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: '平均获客成本',
      value: marketData.avgCustomerCost != null ? `¥${marketData.avgCustomerCost.toFixed(2)}` : '—',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: '整体 ROI',
      value: marketData.roi != null ? marketData.roi.toFixed(3) : '—',
      icon: <BarChart2 className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 脚本库数据 */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">现有脚本库数据</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {scriptCards.map(c => (
            <div key={c.label} className="bg-white rounded-xl border p-4">
              <div className={`inline-flex p-2 rounded-lg ${c.color} mb-3`}>
                {c.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-sm text-gray-500 mt-1">{c.label}</p>

              {/* 进度条 */}
              {c.showProgress && (c.marketValue ?? 0) > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((c.scriptValue! / c.marketValue!) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    脚本库占大盘 {((c.scriptValue! / c.marketValue!) * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 大盘数据 */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">大盘整体数据</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {marketCards.map(c => (
            <div key={c.label} className="bg-white rounded-xl border p-4">
              <div className={`inline-flex p-2 rounded-lg ${c.color} mb-3`}>
                {c.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-sm text-gray-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}