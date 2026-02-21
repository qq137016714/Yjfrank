'use client'

import { useState } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

interface StatData {
  matchedRows: number; uploadCount: number
  totalCost: number; impressions: number; clicks: number; customers: number
  highCourseRevenue: number; lowCourseRevenue: number
  customerCost: number | null; avgImpressionCost: number | null; avgClickCost: number | null; roi: number | null
  clickRate: number | null; playRate3s: number | null; playRate: number | null; conversionRate: number | null
  activations: number; activationCost: number | null; additions: number; additionCost: number | null
  groupJoins: number; highCourseCount: number; refunds: number; refundRate: number | null
}

interface ChannelStat {
  channel: string; matchedRows: number; totalCost: number; customers: number
  highCourseRevenue: number; roi: number | null; customerCost: number | null
  clickRate: number | null; playRate: number | null; conversionRate: number | null
}

const pct = (v: number | null) => v != null ? `${(v * 100).toFixed(2)}%` : '—'
const money = (v: number | null) => v != null ? `¥${v.toFixed(2)}` : '—'
const num = (v: number | null | undefined) => v != null ? v.toLocaleString() : '—'

function StatGrid({ stat }: { stat: StatData }) {
  const rows = [
    ['匹配行数', num(stat.matchedRows)], ['参与期数', num(stat.uploadCount)],
    ['总消耗', money(stat.totalCost)], ['总展示数', num(stat.impressions)],
    ['总点击数', num(stat.clicks)], ['总获客数', num(stat.customers)],
    ['获客成本', money(stat.customerCost)], ['平均展示消耗', money(stat.avgImpressionCost)],
    ['平均点击消耗', money(stat.avgClickCost)], ['点击率', pct(stat.clickRate)],
    ['3S完播率', pct(stat.playRate3s)], ['完播率', pct(stat.playRate)],
    ['转化率', pct(stat.conversionRate)], ['激活人数', num(stat.activations)],
    ['激活成本', money(stat.activationCost)], ['添加人数', num(stat.additions)],
    ['添加成本', money(stat.additionCost)], ['进群人数', num(stat.groupJoins)],
    ['高价课人数', num(stat.highCourseCount)], ['高价课流水', money(stat.highCourseRevenue)],
    ['低价课流水', money(stat.lowCourseRevenue)], ['ROI', stat.roi != null ? stat.roi.toFixed(3) : '—'],
    ['退款人数', num(stat.refunds)], ['退款率', pct(stat.refundRate)],
  ]
  return (
    <div className="grid grid-cols-2 divide-x divide-y border-t">
      {rows.map(([label, value]) => (
        <div key={label} className="px-3 py-2">
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-sm font-medium text-gray-900">{value}</p>
        </div>
      ))}
    </div>
  )
}

function ChannelGrid({ channels }: { channels: ChannelStat[] }) {
  const [active, setActive] = useState(channels[0]?.channel ?? '')
  const ch = channels.find(c => c.channel === active)
  if (!ch) return null
  const rows = [
    ['匹配行数', num(ch.matchedRows)], ['总消耗', money(ch.totalCost)],
    ['总获客数', num(ch.customers)], ['获客成本', money(ch.customerCost)],
    ['高价课流水', money(ch.highCourseRevenue)], ['ROI', ch.roi != null ? ch.roi.toFixed(3) : '—'],
    ['点击率', pct(ch.clickRate)], ['完播率', pct(ch.playRate)],
    ['转化率', pct(ch.conversionRate)],
  ]
  return (
    <div>
      <div className="flex gap-1 px-3 py-2 border-t bg-gray-50 flex-wrap">
        {channels.map(c => (
          <button key={c.channel} onClick={() => setActive(c.channel)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${active === c.channel ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}>
            {c.channel}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 divide-x divide-y border-t">
        {rows.map(([label, value]) => (
          <div key={label} className="px-3 py-2">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-medium text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ScriptSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ name: string; stat: StatData | null } | null>(null)
  const [channels, setChannels] = useState<ChannelStat[]>([])
  const [tab, setTab] = useState<'all' | 'channel'>('all')
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async () => {
    const name = query.trim()
    if (!name) return
    setLoading(true); setNotFound(false); setResult(null); setChannels([])
    const [r1, r2] = await Promise.all([
      fetch(`/api/scripts/${encodeURIComponent(name)}/stats`).then(r => r.json()),
      fetch(`/api/scripts/${encodeURIComponent(name)}/channel-stats`).then(r => r.json()),
    ])
    if (r1.success) {
      setResult({ name: r1.data.name, stat: r1.data.stat ?? null })
      setChannels(r2.success ? r2.data : [])
      setTab('all')
    } else {
      setNotFound(true)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="输入脚本名查询数据"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={handleSearch} disabled={loading || !query.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {notFound && <p className="text-sm text-red-500">未找到脚本「{query.trim()}」</p>}

      {result && (
        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <span className="font-semibold text-gray-900">{result.name}</span>
            <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {result.stat ? (
            <>
              {/* 全渠道 / 按渠道 Tab */}
              {channels.length > 0 && (
                <div className="flex border-b">
                  {(['all', 'channel'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                      {t === 'all' ? '全渠道汇总' : '按渠道查看'}
                    </button>
                  ))}
                </div>
              )}
              {tab === 'all' ? <StatGrid stat={result.stat} /> : <ChannelGrid channels={channels} />}
            </>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              该脚本暂无匹配数据
            </div>
          )}
        </div>
      )}
    </div>
  )
}
