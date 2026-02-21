import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const [allStats, uploads] = await Promise.all([
    prisma.channelPeriodStat.findMany({
      orderBy: [{ period: 'asc' }, { totalCost: 'desc' }],
    }),
    prisma.excelUpload.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, period: true, createdAt: true },
    }),
  ])

  // 动态识别所有出现过的渠道（按总消耗排序）
  const channelTotals = new Map<string, number>()
  for (const s of allStats) {
    channelTotals.set(s.channel, (channelTotals.get(s.channel) ?? 0) + s.totalCost)
  }
  const allChannels = [...channelTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([ch]) => ch)

  // 总体汇总（跨所有期次）
  const overall = allChannels.map(channel => {
    const rows = allStats.filter(s => s.channel === channel)
    const totalCost         = rows.reduce((s, r) => s + r.totalCost, 0)
    const customers         = rows.reduce((s, r) => s + r.customers, 0)
    const highCourseRevenue = rows.reduce((s, r) => s + r.highCourseRevenue, 0)
    const periodCount       = rows.length
    return {
      channel,
      totalCost,
      customers,
      highCourseRevenue,
      roi:          totalCost > 0 ? highCourseRevenue / totalCost : null,
      customerCost: customers > 0 ? totalCost / customers : null,
      periodCount,
    }
  })

  // 按期次明细（每期×每渠道，无数据的渠道输出 null）
  const byPeriod = uploads.map(upload => {
    const periodStats = allStats.filter(s => s.uploadId === upload.id)
    const channels = allChannels.map(channel => {
      const s = periodStats.find(r => r.channel === channel)
      if (!s) return { channel, hasData: false }
      return {
        channel,
        hasData:           true,
        rowCount:          s.rowCount,
        totalCost:         s.totalCost,
        customers:         s.customers,
        highCourseRevenue: s.highCourseRevenue,
        roi:               s.roi,
        customerCost:      s.customerCost,
        clickRate:         s.clickRate,
        playRate:          s.playRate,
        conversionRate:    s.conversionRate,
      }
    })
    return { uploadId: upload.id, period: upload.period, channels }
  })

  return NextResponse.json<ApiResponse>({
    success: true,
    data: { allChannels, overall, byPeriod },
  })
}
