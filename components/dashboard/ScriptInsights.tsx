'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, GitBranch, TrendingUp, Users } from 'lucide-react'

interface SourceScript {
  id: string
  name: string
  _count?: { children: number }
  ownStat?: { customers: number; totalCost: number; roi: number | null } | null
  aggregatedCustomers: number
  aggregatedCost: number
}

interface IterationScript {
  id: string
  name: string
  stat?: { totalCost: number; roi: number | null; customers: number } | null
  parent?: { name: string } | null
}

interface InsightsProps {
  refreshTrigger?: number
}

const money = (v: number) => v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${v.toFixed(0)}`
const medals = ['🥇', '🥈', '🥉']

export default function ScriptInsights({ refreshTrigger }: InsightsProps) {
  const [topSource, setTopSource] = useState<SourceScript[]>([])
  const [topIteration, setTopIteration] = useState<IterationScript[]>([])

  const load = useCallback(async () => {
    const res = await fetch('/api/stats')
    const json = await res.json()
    if (json.success) {
      setTopSource(json.data.topSourceScripts ?? [])
      setTopIteration(json.data.topIterationScripts ?? [])
    }
  }, [])

  useEffect(() => { load() }, [load, refreshTrigger])

  if (topSource.length === 0 && topIteration.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 最佳源脚本 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm text-gray-700">最佳源脚本</span>
          <span className="text-xs text-gray-400 ml-auto">含迭代 · 按总获客排序</span>
        </div>
        {topSource.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">暂无数据</p>
        ) : (
          <ol className="space-y-2.5">
            {topSource.map((s, i) => (
              <li key={s.id} className="flex items-start justify-between gap-2">
                <span className="flex items-start gap-2 min-w-0">
                  <span className="shrink-0 mt-0.5">{medals[i]}</span>
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-800 truncate">{s.name}</span>
                    <span className="text-xs text-gray-400">
                      消耗 {money(s.aggregatedCost)}
                      {(s._count?.children ?? 0) > 0 && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-blue-400">
                          <GitBranch className="w-3 h-3" />含 {s._count!.children} 个迭代
                        </span>
                      )}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 flex items-center gap-1 text-sm font-semibold text-blue-600">
                  <Users className="w-3.5 h-3.5" />
                  {s.aggregatedCustomers.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* 最佳迭代脚本 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4 text-purple-500" />
          <span className="font-semibold text-sm text-gray-700">最佳迭代脚本</span>
          <span className="text-xs text-gray-400 ml-auto">按 ROI 排序</span>
        </div>
        {topIteration.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">暂无数据</p>
        ) : (
          <ol className="space-y-2.5">
            {topIteration.map((s, i) => (
              <li key={s.id} className="flex items-start justify-between gap-2">
                <span className="flex items-start gap-2 min-w-0">
                  <span className="shrink-0 mt-0.5">{medals[i]}</span>
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-800 truncate">{s.name}</span>
                    <span className="text-xs text-gray-400">
                      消耗 {money(s.stat?.totalCost ?? 0)}
                      {s.parent && (
                        <span className="ml-2 text-purple-400">← {s.parent.name}</span>
                      )}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 flex items-center gap-1 text-sm font-semibold text-purple-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {s.stat?.roi != null ? s.stat.roi.toFixed(3) : '—'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
