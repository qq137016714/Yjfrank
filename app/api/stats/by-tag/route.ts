import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const scripts = await prisma.script.findMany({
      include: { tags: true, stat: true },
    })

    const withStat = scripts.filter(s => s.stat !== null)

    // segment -> tagName -> aggregated stats
    const segmentMap: Record<string, Map<string, { scriptCount: number; totalCost: number; customers: number; highCourseRevenue: number }>> = {
      front: new Map(),
      mid: new Map(),
      end: new Map(),
    }

    for (const script of withStat) {
      const stat = script.stat!
      for (const tag of script.tags) {
        const seg = tag.type as 'front' | 'mid' | 'end'
        if (!segmentMap[seg]) continue
        const existing = segmentMap[seg].get(tag.name)
        if (existing) {
          existing.scriptCount++
          existing.totalCost += stat.totalCost
          existing.customers += stat.customers
          existing.highCourseRevenue += stat.highCourseRevenue
        } else {
          segmentMap[seg].set(tag.name, {
            scriptCount: 1,
            totalCost: stat.totalCost,
            customers: stat.customers,
            highCourseRevenue: stat.highCourseRevenue,
          })
        }
      }
    }

    const toArray = (map: Map<string, { scriptCount: number; totalCost: number; customers: number; highCourseRevenue: number }>) =>
      [...map.entries()]
        .map(([tagName, s]) => ({
          tagName,
          scriptCount: s.scriptCount,
          totalCost: s.totalCost,
          customers: s.customers,
          roi: s.totalCost > 0 ? s.highCourseRevenue / s.totalCost : null,
        }))
        .sort((a, b) => b.totalCost - a.totalCost)

    return NextResponse.json({
      success: true,
      data: {
        front: toArray(segmentMap.front),
        mid:   toArray(segmentMap.mid),
        end:   toArray(segmentMap.end),
      },
    })
  } catch (error) {
    console.error('Get stats by tag error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
