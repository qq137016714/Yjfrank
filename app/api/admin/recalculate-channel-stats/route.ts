import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { recalculateChannelPeriodStats } from '@/lib/stats'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 获取重算前的渠道统计
    const beforeChannels = await prisma.channelPeriodStat.groupBy({
      by: ['channel'],
      _count: { channel: true }
    })

    // 执行渠道数据重算
    await recalculateChannelPeriodStats()

    // 获取重算后的渠道统计
    const afterChannels = await prisma.channelPeriodStat.groupBy({
      by: ['channel'],
      _count: { channel: true }
    })

    const totalRecords = await prisma.channelPeriodStat.count()

    return NextResponse.json({
      success: true,
      data: {
        channelsProcessed: afterChannels.length,
        totalRecords,
        channelList: afterChannels.map(c => c.channel),
        executionTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Recalculate channel stats error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}