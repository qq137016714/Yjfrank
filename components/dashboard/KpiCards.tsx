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

interface KpiCardsProps {
  refreshTrigger?: number
  uploadId?: string | null
}

const fmt = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(2)}万` : n.toFixed(2)

export default function KpiCards({ refreshTrigger, uploadId }: KpiCardsProps) {
  const [data, setData] = useState<StatsData | null>(null)

  const load = useCallback(async () => {
    const url = uploadId ? `/api/stats?uploadId=${uploadId}` : '/api/stats'
    const res = await fetch(url)
    const json = await res.json()
    if (json.success) setData(json.data)
  }, [uploadId])

  useEffect(() => { load() }, [load, refreshTrigger])

  if (!data) return null

  const cards = [
    {
      label: '总消耗',
      value: `¥${fmt(data.totalCost)}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: '总获客数',
      value: data.totalCustomers.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: '平均获客成本',
      value: data.avgCustomerCost != null ? `¥${data.avgCustomerCost.toFixed(2)}` : '—',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: '整体 ROI',
      value: data.roi != null ? data.roi.toFixed(3) : '—',
      icon: <BarChart2 className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl border p-4">
          <div className={`inline-flex p-2 rounded-lg ${c.color} mb-3`}>
            {c.icon}
          </div>
          <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          <p className="text-sm text-gray-500 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  )
}
