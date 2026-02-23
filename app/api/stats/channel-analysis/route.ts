import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const channelStats = await prisma.channelPeriodStat.groupBy({
      by: ['channel'],
      _sum: {
        totalCost: true,
        customers: true,
        highCourseRevenue: true,
        impressions: true,
        clicks: true,
        activations: true,
        additions: true,
        highCourseCount: true,
        refunds: true,
        lowCourseRevenue: true,
      },
      _avg: {
        clickRate: true,
        conversionRate: true,
      },
      _count: { uploadId: true },
    })

    const data = channelStats.map(stat => {
      const totalCost = stat._sum.totalCost || 0
      const customers = stat._sum.customers || 0
      const highCourseRevenue = stat._sum.highCourseRevenue || 0

      return {
        channel: stat.channel,
        totalCost,
        customers,
        highCourseRevenue,
        roi: totalCost > 0 ? highCourseRevenue / totalCost : null,
        impressions: stat._sum.impressions || 0,
        clicks: stat._sum.clicks || 0,
        clickRate: stat._avg.clickRate,
        conversionRate: stat._avg.conversionRate,
        customerCost: customers > 0 ? totalCost / customers : null,
        activations: stat._sum.activations || 0,
        additions: stat._sum.additions || 0,
        highCourseCount: stat._sum.highCourseCount || 0,
        refunds: stat._sum.refunds || 0,
        periods: stat._count.uploadId,
      }
    })

    return NextResponse.json({
      success: true,
      data: data.sort((a, b) => b.totalCost - a.totalCost),
    })
  } catch (error) {
    console.error('Get channel analysis error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
