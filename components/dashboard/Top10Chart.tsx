'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Top10ChartProps {
  refreshTrigger?: number
}

const COLORS = [
  '#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD',
  '#BFDBFE', '#DBEAFE', '#EFF6FF', '#F0F9FF', '#E0F2FE',
]

const fmt = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toFixed(0)

export default function Top10Chart({ refreshTrigger }: Top10ChartProps) {
  const [data, setData] = useState<{ name: string; value: number }[]>([])

  const load = useCallback(async () => {
    const res = await fetch('/api/stats')
    const json = await res.json()
    if (json.success) setData(json.data.top10Cost ?? [])
  }, [])

  useEffect(() => { load() }, [load, refreshTrigger])

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-300">
        <p className="text-sm">暂无数据，请先添加脚本并上传 EXCEL</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
        <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fontSize: 12 }}
          tickFormatter={n => n.length > 8 ? n.slice(0, 8) + '…' : n}
        />
        <Tooltip formatter={(v: number) => [`¥${v.toFixed(2)}`, '总消耗']} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
