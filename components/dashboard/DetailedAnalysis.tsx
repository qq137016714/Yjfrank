'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Loader2, TrendingUp, Users, DollarSign, Target } from 'lucide-react'

interface DetailedStats {
  // 基础数据
  totalCost: number
  customers: number
  highCourseRevenue: number
  roi: number | null

  // 展示和点击数据
  impressions: number
  clicks: number
  clickRate: number | null
  avgImpressionCost: number | null
  avgClickCost: number | null

  // 转化漏斗数据
  conversionRate: number | null
  landingConvRate: number | null
  customerCost: number | null

  // 激活和添加数据
  activations: number
  activationRate: number | null
  activationCost: number | null
  additions: number
  additionRate: number | null
  additionCost: number | null

  // 社群数据
  wechatFollowers: number
  wechatFollowRate: number | null
  groupJoins: number
  groupJoinRate: number | null

  // 播放数据
  playRate3s: number | null
  playRate: number | null
  day1PlayRate: number | null
  day2PlayRate: number | null
  day3PlayRate: number | null
  day4PlayRate: number | null
  day5PlayRate: number | null

  // 高沉浸数据
  deepUsers: number
  deepRate: number | null
  day3DeepPlayRate: number | null
  day3DeepConvRate: number | null

  // 高价课数据
  highCourseCount: number
  highCoursePayRate: number | null
  day3HighCourse: number
  day4HighCourse: number
  day5HighCourse: number

  // 低价课数据
  lowCourseCount: number
  lowCourseRevenue: number

  // 退款数据
  refunds: number
  refundRate: number | null
}

interface DetailedAnalysisProps {
  refreshTrigger?: number
  uploadId?: string | null
}

const fmt = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(2)}万` : n.toFixed(2)

const percentage = (n: number | null) =>
  n !== null ? `${(n * 100).toFixed(2)}%` : '—'

export default function DetailedAnalysis({ refreshTrigger, uploadId }: DetailedAnalysisProps) {
  const [data, setData] = useState<DetailedStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const url = uploadId ? `/api/stats/detailed?uploadId=${uploadId}` : '/api/stats/detailed'
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        }
      } catch (error) {
        console.error('Failed to load detailed analysis:', error)
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
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900">详细数据分析</h2>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900">详细数据分析</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>暂无数据</p>
        </div>
      </div>
    )
  }

  const sections = [
    {
      title: '核心指标',
      icon: <DollarSign className="w-4 h-4" />,
      color: 'blue',
      metrics: [
        { label: '总消耗', value: `¥${fmt(data.totalCost)}`, important: true },
        { label: '获客数', value: data.customers.toLocaleString(), important: true },
        { label: '高价课流水', value: `¥${fmt(data.highCourseRevenue)}`, important: true },
        { label: 'ROI', value: data.roi !== null ? data.roi.toFixed(3) : '—', important: true },
        { label: '获客成本', value: data.customerCost !== null ? `¥${data.customerCost.toFixed(2)}` : '—' },
        { label: '低价课流水', value: `¥${fmt(data.lowCourseRevenue)}` }
      ]
    },
    {
      title: '展示与点击',
      icon: <Target className="w-4 h-4" />,
      color: 'green',
      metrics: [
        { label: '展示数', value: fmt(data.impressions) },
        { label: '点击数', value: data.clicks.toLocaleString() },
        { label: '点击率', value: percentage(data.clickRate) },
        { label: '平均展示消耗', value: data.avgImpressionCost !== null ? `¥${data.avgImpressionCost.toFixed(4)}` : '—' },
        { label: '平均点击消耗', value: data.avgClickCost !== null ? `¥${data.avgClickCost.toFixed(2)}` : '—' }
      ]
    },
    {
      title: '转化漏斗',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'orange',
      metrics: [
        { label: '转化率', value: percentage(data.conversionRate) },
        { label: '落地页转化率', value: percentage(data.landingConvRate) },
        { label: '激活人数', value: data.activations.toLocaleString() },
        { label: '激活率', value: percentage(data.activationRate) },
        { label: '激活成本', value: data.activationCost !== null ? `¥${data.activationCost.toFixed(2)}` : '—' },
        { label: '添加人数', value: data.additions.toLocaleString() },
        { label: '添加率', value: percentage(data.additionRate) },
        { label: '添加成本', value: data.additionCost !== null ? `¥${data.additionCost.toFixed(2)}` : '—' }
      ]
    },
    {
      title: '社群数据',
      icon: <Users className="w-4 h-4" />,
      color: 'purple',
      metrics: [
        { label: '公众号关注人数', value: data.wechatFollowers.toLocaleString() },
        { label: '公众号关注率', value: percentage(data.wechatFollowRate) },
        { label: '进群人数', value: data.groupJoins.toLocaleString() },
        { label: '进群率', value: percentage(data.groupJoinRate) }
      ]
    },
    {
      title: '播放数据',
      icon: <BarChart3 className="w-4 h-4" />,
      color: 'indigo',
      metrics: [
        { label: '3S完播率', value: percentage(data.playRate3s) },
        { label: '完播率', value: percentage(data.playRate) },
        { label: '第一天到播率', value: percentage(data.day1PlayRate) },
        { label: '第二天到播率', value: percentage(data.day2PlayRate) },
        { label: '第三天到播率', value: percentage(data.day3PlayRate) },
        { label: '第四天到播率', value: percentage(data.day4PlayRate) },
        { label: '第五天到播率', value: percentage(data.day5PlayRate) }
      ]
    },
    {
      title: '高沉浸数据',
      icon: <Target className="w-4 h-4" />,
      color: 'pink',
      metrics: [
        { label: '高沉浸用户数', value: data.deepUsers.toLocaleString() },
        { label: '高沉浸率', value: percentage(data.deepRate) },
        { label: '第三天高沉浸到播率', value: percentage(data.day3DeepPlayRate) },
        { label: '第三天高沉浸转化率', value: percentage(data.day3DeepConvRate) }
      ]
    },
    {
      title: '高价课数据',
      icon: <DollarSign className="w-4 h-4" />,
      color: 'yellow',
      metrics: [
        { label: '高价课人数', value: data.highCourseCount.toLocaleString() },
        { label: '高价课支付率', value: percentage(data.highCoursePayRate) },
        { label: '第三天高价课人数', value: data.day3HighCourse.toLocaleString() },
        { label: '第四天高价课人数', value: data.day4HighCourse.toLocaleString() },
        { label: '第五天高价课人数', value: data.day5HighCourse.toLocaleString() },
        { label: '低价课人数', value: data.lowCourseCount.toLocaleString() }
      ]
    },
    {
      title: '退款数据',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'red',
      metrics: [
        { label: '退款人数', value: data.refunds.toLocaleString() },
        { label: '退款率', value: percentage(data.refundRate) }
      ]
    }
  ]

  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    pink: 'text-pink-600 bg-pink-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50'
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-purple-600" />
        <h2 className="font-semibold text-gray-900">详细数据分析</h2>
        <span className="text-sm text-gray-500">全维度数据展示</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.title} className="border border-gray-200 rounded-lg p-4">
            <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${colorClasses[section.color as keyof typeof colorClasses]}`}>
              {section.icon}
              <h3 className="font-medium text-sm">{section.title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {section.metrics.map((metric) => (
                <div key={metric.label} className="text-sm">
                  <div className="text-gray-500 text-xs mb-1">{metric.label}</div>
                  <div className={`font-medium ${metric.important ? 'text-gray-900 text-base' : 'text-gray-700'}`}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}