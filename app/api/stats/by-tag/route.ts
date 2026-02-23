import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { matchScriptName, type MatchConfig } from '@/lib/matching'

type TagAgg = { scriptCount: number; totalCost: number; customers: number; highCourseRevenue: number }

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const uploadId = searchParams.get('uploadId') || undefined

    const segmentMap: Record<string, Map<string, TagAgg>> = { front: new Map(), mid: new Map(), end: new Map() }

    if (!uploadId) {
      // 全期：使用预计算 scriptStat
      const scripts = await prisma.script.findMany({ include: { tags: true, stat: true } })
      for (const script of scripts.filter(s => s.stat)) {
        const stat = script.stat!
        for (const tag of script.tags) {
          const seg = tag.type as 'front' | 'mid' | 'end'
          if (!segmentMap[seg]) continue
          const ex = segmentMap[seg].get(tag.name)
          if (ex) {
            ex.scriptCount++; ex.totalCost += stat.totalCost; ex.customers += stat.customers; ex.highCourseRevenue += stat.highCourseRevenue
          } else {
            segmentMap[seg].set(tag.name, { scriptCount: 1, totalCost: stat.totalCost, customers: stat.customers, highCourseRevenue: stat.highCourseRevenue })
          }
        }
      }
    } else {
      // 单期：实时计算
      const [scripts, rows, blockWordsConfig, ctConfig] = await Promise.all([
        prisma.script.findMany({ include: { tags: true } }),
        prisma.excelRow.findMany({ where: { uploadId } }),
        prisma.systemConfig.findUnique({ where: { key: 'blockWords' } }),
        prisma.systemConfig.findUnique({ where: { key: 'contentTypes' } }),
      ])
      const config: MatchConfig = {
        blockWords: JSON.parse(blockWordsConfig?.value ?? '[]'),
        contentTypes: JSON.parse(ctConfig?.value ?? '[]'),
      }
      const validRows = rows.filter(r => r.materialName && r.materialName !== '合计' && r.materialName !== 'total')

      for (const script of scripts) {
        const matched = validRows.filter(r => matchScriptName(r.materialName, script.name, config))
        if (matched.length === 0) continue
        const totalCost = matched.reduce((sum, r) => sum + (r.totalCost ?? 0), 0)
        const customers = matched.reduce((sum, r) => sum + (r.customers ?? 0), 0)
        const highCourseRevenue = matched.reduce((sum, r) => sum + (r.highCourseRevenue ?? 0), 0)
        for (const tag of script.tags) {
          const seg = tag.type as 'front' | 'mid' | 'end'
          if (!segmentMap[seg]) continue
          const ex = segmentMap[seg].get(tag.name)
          if (ex) {
            ex.scriptCount++; ex.totalCost += totalCost; ex.customers += customers; ex.highCourseRevenue += highCourseRevenue
          } else {
            segmentMap[seg].set(tag.name, { scriptCount: 1, totalCost, customers, highCourseRevenue })
          }
        }
      }
    }

    const toArray = (map: Map<string, TagAgg>) =>
      [...map.entries()].map(([tagName, s]) => ({
        tagName, scriptCount: s.scriptCount, totalCost: s.totalCost, customers: s.customers,
        roi: s.totalCost > 0 ? s.highCourseRevenue / s.totalCost : null,
      })).sort((a, b) => b.totalCost - a.totalCost)

    return NextResponse.json({ success: true, data: { front: toArray(segmentMap.front), mid: toArray(segmentMap.mid), end: toArray(segmentMap.end) } })
  } catch (error) {
    console.error('Get stats by tag error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
