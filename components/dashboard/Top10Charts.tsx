'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Metric = 'cost' | 'customers' | 'roi'

interface Top10ChartsProps {
  refreshTrigger?: number
  uploadId?: string | null
}

const COLORS = ['#1E40AF','#2563EB','#3B82F6','#60A5FA','#93C5FD','#BFDBFE','#DBEAFE','#EFF6FF','#F0F9FF','#E0F2FE']

const METRICS: { key: Metric; label: string; unit: string }[] = [
  { key: 'cost',      label: '消耗 TOP10',   unit: '¥' },
  { key: 'customers', label: '获客数 TOP10',  unit: '' },
  { key: 'roi',       label: 'ROI TOP10',    unit: '' },
]

const fmt = (v: number, unit: string) => {
  if (unit === '¥') return v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toFixed(0)
  return v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toFixed(unit === '' && v < 10 ? 3 : 0)
}

export default function Top10Charts({ refreshTrigger, uploadId }: Top10ChartsProps) {
  const [metric, setMetric] = useState<Metric>('cost')
  const [allData, setAllData] = useState<Record<Metric, { name: string; value: number }[]>>({
    cost: [], customers: [], roi: [],
  })

  const load = useCallback(async () => {
    const url = uploadId ? `/api/stats?uploadId=${uploadId}` : '/api/stats'
    const res = await fetch(url)
    const json = await res.json()
    if (json.success) {
      setAllData({
        cost:      json.data.top10Cost ?? [],
        customers: json.data.top10Customers ?? [],
        roi:       json.data.top10Roi ?? [],
      })
    }
  }, [uploadId])

  useEffect(() => { load() }, [load, refreshTrigger])

  const current = METRICS.find(m => m.key === metric)!
  const data = allData[metric]

  return (
    <div>
      {/* 指标切换 Tab */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              metric === m.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
          <p className="text-sm">暂无数据，请先添加脚本并上传 EXCEL</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={v => fmt(v, current.unit)} tick={{ fontSize: 12 }} />
            <YAxis
              type="category" dataKey="name" width={90} tick={{ fontSize: 12 }}
              tickFormatter={n => n.length > 8 ? n.slice(0, 8) + '…' : n}
            />
            <Tooltip formatter={(v: number) => [`${current.unit}${v.toFixed(current.key === 'roi' ? 3 : 2)}`, current.label.replace(' TOP10', '')]} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
