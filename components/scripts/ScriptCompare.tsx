'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

interface Tag { id: string; name: string; type: string }
interface ChannelStat { channel: string; totalCost: number; customers: number; roi: number | null }
interface CompareScript {
  id: string; name: string
  tags: Tag[]
  stat?: {
    matchedRows: number; totalCost: number; roi: number | null
    customers: number; avgCustomerCost: number | null
  } | null
  channelStats?: ChannelStat[]
}

interface ScriptCompareProps {
  ids: string[]
  onClose: () => void
}

const money = (v: number | null | undefined) =>
  v == null ? '—' : v >= 10000 ? `¥${(v / 10000).toFixed(2)}万` : `¥${v.toFixed(0)}`

const METRICS = [
  { key: 'totalCost',       label: '总消耗',   fmt: (s: CompareScript) => money(s.stat?.totalCost) },
  { key: 'customers',       label: '总获客',   fmt: (s: CompareScript) => s.stat?.customers != null ? s.stat.customers.toLocaleString() : '—' },
  { key: 'roi',             label: 'ROI',      fmt: (s: CompareScript) => s.stat?.roi != null ? s.stat.roi.toFixed(3) : '—' },
  { key: 'avgCustomerCost', label: '获客成本', fmt: (s: CompareScript) => money(s.stat?.avgCustomerCost) },
  { key: 'matchedRows',     label: '匹配行数', fmt: (s: CompareScript) => s.stat?.matchedRows != null ? String(s.stat.matchedRows) : '—' },
]

const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500']
const TEXT_COLORS = ['text-blue-600', 'text-purple-600', 'text-green-600', 'text-amber-600']

export default function ScriptCompare({ ids, onClose }: ScriptCompareProps) {
  const [scripts, setScripts] = useState<CompareScript[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/scripts/compare?ids=${ids.join(',')}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setScripts(json.data)
        setLoading(false)
      })
  }, [ids])

  // find best value for highlighting
  const getBest = (key: string) => {
    if (scripts.length === 0) return null
    const vals = scripts.map(s => {
      if (key === 'totalCost') return s.stat?.totalCost ?? null
      if (key === 'customers') return s.stat?.customers ?? null
      if (key === 'roi') return s.stat?.roi ?? null
      if (key === 'avgCustomerCost') return s.stat?.avgCustomerCost ?? null
      if (key === 'matchedRows') return s.stat?.matchedRows ?? null
      return null
    })
    const valid = vals.filter(v => v != null) as number[]
    if (valid.length === 0) return null
    // lower is better for cost, higher for others
    return key === 'avgCustomerCost' ? Math.min(...valid) : Math.max(...valid)
  }

  const getVal = (s: CompareScript, key: string): number | null => {
    if (key === 'totalCost') return s.stat?.totalCost ?? null
    if (key === 'customers') return s.stat?.customers ?? null
    if (key === 'roi') return s.stat?.roi ?? null
    if (key === 'avgCustomerCost') return s.stat?.avgCustomerCost ?? null
    if (key === 'matchedRows') return s.stat?.matchedRows ?? null
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">脚本对比</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="px-6 py-5 space-y-6">
            {/* 脚本名行 */}
            <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${scripts.length}, 1fr)` }}>
              {scripts.map((s, i) => (
                <div key={s.id} className={`rounded-lg p-3 text-center text-white text-sm font-medium ${COLORS[i]}`}>
                  {s.name}
                </div>
              ))}
            </div>

            {/* 指标对比表 */}
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-gray-500 font-medium w-28">指标</th>
                    {scripts.map((s, i) => (
                      <th key={s.id} className={`text-center px-4 py-2.5 font-medium ${TEXT_COLORS[i]}`}>{s.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {METRICS.map(metric => {
                    const best = getBest(metric.key)
                    return (
                      <tr key={metric.key} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-500">{metric.label}</td>
                        {scripts.map((s, i) => {
                          const val = getVal(s, metric.key)
                          const isBest = best != null && val === best
                          return (
                            <td key={s.id} className={`px-4 py-2.5 text-center font-medium ${
                              isBest ? TEXT_COLORS[i] : 'text-gray-700'
                            }`}>
                              {isBest && <span className="mr-1 text-xs">★</span>}
                              {metric.fmt(s)}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 渠道对比 */}
            {scripts.some(s => s.channelStats && s.channelStats.length > 0) && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">渠道消耗分布</p>
                <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${scripts.length}, 1fr)` }}>
                  {scripts.map((s, i) => (
                    <div key={s.id}>
                      <p className={`text-xs font-medium mb-2 ${TEXT_COLORS[i]}`}>{s.name}</p>
                      {s.channelStats && s.channelStats.length > 0 ? (
                        <div className="space-y-1.5">
                          {s.channelStats.slice(0, 5).map(cs => (
                            <div key={cs.channel} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 truncate mr-2">{cs.channel}</span>
                              <span className="text-gray-500 shrink-0">{money(cs.totalCost)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">无数据</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
