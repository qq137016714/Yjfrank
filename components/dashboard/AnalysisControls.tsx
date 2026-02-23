'use client'

import { useState } from 'react'
import { RefreshCw, BarChart3, TrendingUp, Calculator } from 'lucide-react'

interface AnalysisControlsProps {
  onRefresh?: () => void
}

export default function AnalysisControls({ onRefresh }: AnalysisControlsProps) {
  const [calculating, setCalculating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const handleRecalculate = async () => {
    setCalculating(true)
    try {
      // 触发重新计算所有统计数据
      const res = await fetch('/api/admin/recalculate-stats', { method: 'POST' })
      const json = await res.json()

      if (json.success) {
        setLastUpdate(new Date())
        onRefresh?.()
        alert(`数据重算完成！处理了 ${json.data.scriptsProcessed} 个脚本，${json.data.channelsProcessed} 个渠道`)
      } else {
        alert('重算失败：' + json.error)
      }
    } catch (error) {
      alert('重算失败：' + error)
    } finally {
      setCalculating(false)
    }
  }

  const handleChannelAnalysis = async () => {
    setCalculating(true)
    try {
      const res = await fetch('/api/admin/recalculate-channel-stats', { method: 'POST' })
      const json = await res.json()

      if (json.success) {
        setLastUpdate(new Date())
        onRefresh?.()
        alert(`渠道数据重算完成！处理了 ${json.data.channelsProcessed} 个渠道`)
      } else {
        alert('渠道重算失败：' + json.error)
      }
    } catch (error) {
      alert('渠道重算失败：' + error)
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h2 className="font-semibold text-gray-900">数据分析控制</h2>
      </div>

      <div className="space-y-4">
        {/* 状态信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>上次更新：{lastUpdate ? lastUpdate.toLocaleString('zh-CN') : '未知'}</span>
          {calculating && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>计算中...</span>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleRecalculate}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BarChart3 className="w-4 h-4" />
            {calculating ? '重算中...' : '重算所有数据'}
          </button>

          <button
            onClick={handleChannelAnalysis}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp className="w-4 h-4" />
            {calculating ? '重算中...' : '重算渠道数据'}
          </button>
        </div>

        {/* 说明文字 */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>• 重算所有数据：重新计算所有脚本的ROI、获客成本等指标</p>
          <p>• 重算渠道数据：重新计算各渠道的投放效果统计</p>
          <p>• 建议在上传新数据后手动触发重算，避免自动计算造成性能压力</p>
        </div>
      </div>
    </div>
  )
}