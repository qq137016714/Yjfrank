import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { recalculateAllStats } from '@/lib/stats'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 获取统计信息
    const [scriptCount, channelCount] = await Promise.all([
      prisma.script.count(),
      prisma.scriptChannelStat.groupBy({
        by: ['channel'],
        _count: { channel: true }
      }).then(result => result.length)
    ])

    // 执行重算
    await recalculateAllStats()

    // 获取处理后的统计信息
    const [processedScripts, processedChannels] = await Promise.all([
      prisma.scriptStat.count(),
      prisma.scriptChannelStat.groupBy({
        by: ['channel'],
        _count: { channel: true }
      }).then(result => result.length)
    ])

    return NextResponse.json({
      success: true,
      data: {
        scriptsProcessed: processedScripts,
        channelsProcessed: processedChannels,
        totalScripts: scriptCount,
        executionTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Recalculate stats error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}