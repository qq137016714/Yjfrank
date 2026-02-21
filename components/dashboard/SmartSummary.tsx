'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trophy } from 'lucide-react'

interface SummaryProps {
  refreshTrigger?: number
  uploadId?: string | null
}

const fmt = (n: number) => n >= 10000 ? `¥${(n / 10000).toFixed(2)}万` : `¥${n.toFixed(2)}`

export default function SmartSummary({ refreshTrigger, uploadId }: SummaryProps) {
  const [top3Cost, setTop3Cost] = useState<{ name: string; value: number }[]>([])
  const [top3Revenue, setTop3Revenue] = useState<{ name: string; value: number }[]>([])

  const load = useCallback(async () => {
    const url = uploadId ? `/api/stats?uploadId=${uploadId}` : '/api/stats'
    const res = await fetch(url)
    const json = await res.json()
    if (json.success) {
      setTop3Cost(json.data.top3Cost ?? [])
      setTop3Revenue(json.data.top3Revenue ?? [])
    }
  }, [uploadId])

  useEffect(() => { load() }, [load, refreshTrigger])

  if (top3Cost.length === 0 && top3Revenue.length === 0) return null

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-sm text-gray-700">消耗 TOP3</span>
        </div>
        <ol className="space-y-2">
          {top3Cost.map((item, i) => (
            <li key={item.name} className="flex items-center justify-between text-sm gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{medals[i]}</span>
                <span className="text-gray-700 truncate">{item.name}</span>
              </span>
              <span className="font-medium text-gray-900 shrink-0">{fmt(item.value)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-purple-500" />
          <span className="font-semibold text-sm text-gray-700">高价课流水 TOP3</span>
        </div>
        <ol className="space-y-2">
          {top3Revenue.map((item, i) => (
            <li key={item.name} className="flex items-center justify-between text-sm gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{medals[i]}</span>
                <span className="text-gray-700 truncate">{item.name}</span>
              </span>
              <span className="font-medium text-gray-900 shrink-0">{fmt(item.value)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
