'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/ui/Navbar'
import ExcelUploader from '@/components/dashboard/ExcelUploader'
import UploadHistory from '@/components/dashboard/UploadHistory'
import CombinedKpiSection from '@/components/dashboard/CombinedKpiSection'
import Top10Charts from '@/components/dashboard/Top10Charts'
import ChannelCharts from '@/components/dashboard/ChannelCharts'
import SmartSummary from '@/components/dashboard/SmartSummary'
import ScriptInsights from '@/components/dashboard/ScriptInsights'
import PeriodSelector from '@/components/dashboard/PeriodSelector'
import ScriptManager from '@/components/dashboard/ScriptManager'
import ScriptSearch from '@/components/dashboard/ScriptSearch'
import ContentTypeAnalysis from '@/components/dashboard/ContentTypeAnalysis'
import AnalysisControls from '@/components/dashboard/AnalysisControls'
import ChannelAnalysis from '@/components/dashboard/ChannelAnalysis'
import DetailedAnalysis from '@/components/dashboard/DetailedAnalysis'
import { BarChart3, PieChart } from 'lucide-react'

type ChartTab = 'top10' | 'channel'

export default function DashboardPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [chartTab, setChartTab] = useState<ChartTab>('top10')
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null)

  const refresh = () => setRefreshTrigger(n => n + 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
            <p className="text-sm text-gray-500 mt-1">上传 EXCEL 数据，查看脚本投放效果分析</p>
          </div>
          <PeriodSelector
            value={selectedUploadId}
            onChange={setSelectedUploadId}
            refreshTrigger={refreshTrigger}
          />
        </div>

        <CombinedKpiSection refreshTrigger={refreshTrigger} uploadId={selectedUploadId} />
        <SmartSummary refreshTrigger={refreshTrigger} uploadId={selectedUploadId} />
        <ScriptInsights refreshTrigger={refreshTrigger} />
        <ContentTypeAnalysis refreshTrigger={refreshTrigger} />

        {/* 数据分析控制面板 - 仅管理员可见 */}
        {isAdmin && (
          <AnalysisControls onRefresh={refresh} />
        )}

        {/* 渠道分析 */}
        <ChannelAnalysis refreshTrigger={refreshTrigger} />

        {/* 详细数据分析 */}
        <DetailedAnalysis refreshTrigger={refreshTrigger} uploadId={selectedUploadId} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：图表区 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 图表 Tab 切换 */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => setChartTab('top10')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${chartTab === 'top10' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <BarChart3 className="w-4 h-4" />脚本排行
                  </button>
                  <button onClick={() => setChartTab('channel')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${chartTab === 'channel' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <PieChart className="w-4 h-4" />渠道分析
                  </button>
                </div>
              </div>

              {chartTab === 'top10'
                ? <Top10Charts refreshTrigger={refreshTrigger} uploadId={selectedUploadId} />
                : <ChannelCharts refreshTrigger={refreshTrigger} />
              }
            </div>

            {/* 单脚本查询 */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">单脚本查询</h2>
              <ScriptSearch />
            </div>
          </div>

          {/* 右侧 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">脚本列表</h2>
              <ScriptManager isAdmin={isAdmin} onChanged={refresh} />
            </div>

            {isAdmin && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-semibold text-gray-900 mb-4">上传数据</h2>
                <ExcelUploader onUploadSuccess={refresh} />
              </div>
            )}

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">上传历史</h2>
              <UploadHistory isAdmin={isAdmin} refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
