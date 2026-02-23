import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { matchScriptName, type MatchConfig } from '@/lib/matching'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const uploadId = searchParams.get('uploadId') || undefined

    const [ctConfig, blockWordsConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'contentTypes' } }),
      prisma.systemConfig.findUnique({ where: { key: 'blockWords' } }),
    ])
    const contentTypes: string[] = JSON.parse(ctConfig?.value ?? '[]')
    if (contentTypes.length === 0) return NextResponse.json({ success: true, data: [] })

    if (!uploadId) {
      // 全期：使用预计算 scriptStat
      const scriptStats = await prisma.scriptStat.findMany({ include: { script: { select: { name: true } } } })
      const typeStats = contentTypes.map(ct => {
        const matching = scriptStats.filter(s => s.script.name.endsWith(ct))
        const totalCost = matching.reduce((sum, s) => sum + s.totalCost, 0)
        const customers = matching.reduce((sum, s) => sum + s.customers, 0)
        const highCourseRevenue = matching.reduce((sum, s) => sum + s.highCourseRevenue, 0)
        return { contentType: ct, scriptCount: matching.length, totalCost, customers, roi: totalCost > 0 ? highCourseRevenue / totalCost : null }
      })
      return NextResponse.json({ success: true, data: typeStats.sort((a, b) => b.totalCost - a.totalCost) })
    }

    // 单期：实时计算
    const blockWords: string[] = JSON.parse(blockWordsConfig?.value ?? '[]')
    const config: MatchConfig = { blockWords, contentTypes }
    const [scripts, rows] = await Promise.all([
      prisma.script.findMany({ select: { name: true } }),
      prisma.excelRow.findMany({ where: { uploadId } }),
    ])

    const validRows = rows.filter(r => r.materialName && r.materialName !== '合计' && r.materialName !== 'total')
    const scriptAgg = scripts.map(s => {
      const matched = validRows.filter(r => matchScriptName(r.materialName, s.name, config))
      return {
        name: s.name,
        totalCost: matched.reduce((sum, r) => sum + (r.totalCost ?? 0), 0),
        customers: matched.reduce((sum, r) => sum + (r.customers ?? 0), 0),
        highCourseRevenue: matched.reduce((sum, r) => sum + (r.highCourseRevenue ?? 0), 0),
      }
    })

    const typeStats = contentTypes.map(ct => {
      const matching = scriptAgg.filter(s => s.name.endsWith(ct))
      const totalCost = matching.reduce((sum, s) => sum + s.totalCost, 0)
      const customers = matching.reduce((sum, s) => sum + s.customers, 0)
      const highCourseRevenue = matching.reduce((sum, s) => sum + s.highCourseRevenue, 0)
      return { contentType: ct, scriptCount: matching.length, totalCost, customers, roi: totalCost > 0 ? highCourseRevenue / totalCost : null }
    })

    return NextResponse.json({ success: true, data: typeStats.sort((a, b) => b.totalCost - a.totalCost) })
  } catch (error) {
    console.error('Get stats by content type error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
