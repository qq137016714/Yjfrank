import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const config = await prisma.systemConfig.findUnique({ where: { key: 'contentTypes' } })
    const contentTypes: string[] = JSON.parse(config?.value ?? '[]')

    if (contentTypes.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 获取所有脚本统计数据（基于脚本库匹配）
    const scriptStats = await prisma.scriptStat.findMany({
      include: { script: { select: { name: true } } }
    })

    const typeStats = contentTypes.map(contentType => {
      const matchingStats = scriptStats.filter(stat => stat.script.name.endsWith(contentType))

      if (matchingStats.length === 0) {
        return { contentType, scriptCount: 0, totalCost: 0, customers: 0, roi: null }
      }

      const totalCost = matchingStats.reduce((sum, s) => sum + s.totalCost, 0)
      const customers = matchingStats.reduce((sum, s) => sum + s.customers, 0)
      const highCourseRevenue = matchingStats.reduce((sum, s) => sum + s.highCourseRevenue, 0)

      return {
        contentType,
        scriptCount: matchingStats.length,
        totalCost,
        customers,
        roi: totalCost > 0 ? highCourseRevenue / totalCost : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: typeStats.sort((a, b) => b.totalCost - a.totalCost),
    })
  } catch (error) {
    console.error('Get stats by content type error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
