'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Legend,
} from 'recharts'

interface ChannelOverall {
  channel: string; totalCost: number; customers: number
  highCourseRevenue: number; roi: number | null; customerCost: number | null; periodCount: number
}
interface PeriodChannel {
  channel: string; hasData: boolean
  totalCost?: number; customers?: number; roi?: number | null; customerCost?: number | null
  clickRate?: number | null; playRate?: number | null; conversionRate?: number | null
}
interface PeriodData { uploadId: string; period: string; channels: PeriodChannel[] }
interface ChannelData { allChannels: string[]; overall: ChannelOverall[]; byPeriod: PeriodData[] }

interface ChannelChartsProps { refreshTrigger?: number }

const COLORS = ['#1E40AF','#7C3AED','#16A34A','#D97706','#DC2626','#0891B2','#9333EA','#EA580C','#0D9488','#BE185D']
const money = (v: number) => v >= 10000 ? `¥${(v / 10000).toFixed(2)}万` : `¥${v.toFixed(2)}`
const pct = (v: number | null | undefined) => v != null ? `${(v * 100).toFixed(1)}%` : '—'

type Tab = 'overall' | 'period'

export default function ChannelCharts({ refreshTrigger }: ChannelChartsProps) {
  const [data, setData] = useState<ChannelData | null>(null)
  const [tab, setTab] = useState<Tab>('overall')

  const load = useCallback(async () => {
    const res = await fetch('/api/stats/channel')
    const json = await res.json()
    if (json.success) setData(json.data)
  }, [])

  useEffect(() => { load() }, [load, refreshTrigger])

  if (!data || data.allChannels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-300">
        <p className="text-sm">暂无渠道数据，上传 EXCEL 后自动识别</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([['overall', '总体汇总'], ['period', '按期次明细']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overall' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 渠道消耗占比饼图 */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">渠道消耗占比</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.overall} dataKey="totalCost" nameKey="channel"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {data.overall.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [money(v), '消耗']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 渠道 ROI 对比 */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">渠道 ROI 对比</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.overall.filter(d => d.roi != null).map(d => ({ name: d.channel, value: +(d.roi!.toFixed(3)) }))}
                margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [v.toFixed(3), 'ROI']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.overall.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 总体汇总表 */}
          <div className="md:col-span-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-xs">
                  <th className="text-left py-2 pr-4">渠道</th>
                  <th className="text-right py-2 pr-4">总消耗</th>
                  <th className="text-right py-2 pr-4">总获客</th>
                  <th className="text-right py-2 pr-4">获客成本</th>
                  <th className="text-right py-2 pr-4">高价课流水</th>
                  <th className="text-right py-2 pr-4">ROI</th>
                  <th className="text-right py-2">参与期数</th>
                </tr>
              </thead>
              <tbody>
                {data.overall.map((d, i) => (
                  <tr key={d.channel} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium" style={{ color: COLORS[i % COLORS.length] }}>{d.channel}</td>
                    <td className="text-right py-2 pr-4">{money(d.totalCost)}</td>
                    <td className="text-right py-2 pr-4">{d.customers.toLocaleString()}</td>
                    <td className="text-right py-2 pr-4">{d.customerCost != null ? money(d.customerCost) : '—'}</td>
                    <td className="text-right py-2 pr-4">{money(d.highCourseRevenue)}</td>
                    <td className="text-right py-2 pr-4">{d.roi != null ? d.roi.toFixed(3) : '—'}</td>
                    <td className="text-right py-2">{d.periodCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 按期次明细表（渠道为列，期次为行） */
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 border text-gray-600 font-medium whitespace-nowrap">期次</th>
                {data.allChannels.map((ch, i) => (
                  <th key={ch} className="text-center px-3 py-2 border font-medium whitespace-nowrap" style={{ color: COLORS[i % COLORS.length] }}>
                    {ch}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.byPeriod.map(period => (
                <tr key={period.uploadId} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border font-medium text-gray-700 whitespace-nowrap">{period.period}</td>
                  {period.channels.map(ch => (
                    <td key={ch.channel} className="px-3 py-2 border text-center">
                      {ch.hasData ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-gray-900">{money(ch.totalCost ?? 0)}</div>
                          <div className="text-xs text-gray-400">
                            ROI {ch.roi != null ? ch.roi.toFixed(3) : '—'} · 获客 {ch.customers?.toLocaleString() ?? '—'}
                          </div>
                          <div className="text-xs text-gray-400">
                            完播 {pct(ch.playRate)} · 转化 {pct(ch.conversionRate)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
