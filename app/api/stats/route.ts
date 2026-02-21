import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { matchScriptName } from '@/lib/matching'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const uploadId = searchParams.get('uploadId')

  // ── Per-period mode ──────────────────────────────────────────────────────
  if (uploadId) {
    const [rows, scripts] = await Promise.all([
      prisma.excelRow.findMany({
        where: { uploadId },
        select: { materialName: true, totalCost: true, customers: true, highCourseRevenue: true },
      }),
      prisma.script.findMany({ select: { id: true, name: true } }),
    ])

    const validRows = rows.filter(r => {
      const n = r.materialName?.trim().toLowerCase()
      return n && !['合计', 'total'].includes(n)
    })

    type PS = { name: string; totalCost: number; customers: number; highCourseRevenue: number; roi: number | null }
    const scriptStats: PS[] = []
    for (const script of scripts) {
      const matched = validRows.filter(r => matchScriptName(r.materialName, script.name))
      if (matched.length === 0) continue
      const totalCost         = matched.reduce((s, r) => s + (r.totalCost ?? 0), 0)
      const customers         = matched.reduce((s, r) => s + (r.customers ?? 0), 0)
      const highCourseRevenue = matched.reduce((s, r) => s + (r.highCourseRevenue ?? 0), 0)
      scriptStats.push({ name: script.name, totalCost, customers, highCourseRevenue, roi: totalCost > 0 ? highCourseRevenue / totalCost : null })
    }

    const totalCost      = scriptStats.reduce((s, r) => s + r.totalCost, 0)
    const totalCustomers = scriptStats.reduce((s, r) => s + r.customers, 0)
    const totalRevenue   = scriptStats.reduce((s, r) => s + r.highCourseRevenue, 0)

    const sortBy = (key: keyof PS, desc = true) =>
      [...scriptStats].sort((a, b) => desc
        ? ((b[key] as number) ?? 0) - ((a[key] as number) ?? 0)
        : ((a[key] as number) ?? 0) - ((b[key] as number) ?? 0)
      )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalCost,
        totalCustomers,
        avgCustomerCost: totalCustomers > 0 ? totalCost / totalCustomers : null,
        roi: totalCost > 0 ? totalRevenue / totalCost : null,
        scriptCount: scriptStats.length,
        top10Cost:      sortBy('totalCost').slice(0, 10).map(s => ({ name: s.name, value: s.totalCost })),
        top10Customers: sortBy('customers').slice(0, 10).map(s => ({ name: s.name, value: s.customers })),
        top10Roi:       sortBy('roi').slice(0, 10).filter(s => s.roi != null).map(s => ({ name: s.name, value: s.roi! })),
        top3Cost:       sortBy('totalCost').slice(0, 3).map(s => ({ name: s.name, value: s.totalCost })),
        top3Revenue:    sortBy('highCourseRevenue').slice(0, 3).map(s => ({ name: s.name, value: s.highCourseRevenue })),
        topSourceScripts: [],
        topIterationScripts: [],
      },
    })
  }

  // ── All-periods mode ─────────────────────────────────────────────────────
  const [stats, allScripts, iterationScripts] = await Promise.all([
    prisma.scriptStat.findMany({
      include: { script: { select: { name: true } } },
    }),
    prisma.script.findMany({
      select: {
        id: true, name: true, parentId: true,
        stat: { select: { customers: true, totalCost: true, roi: true } },
        _count: { select: { children: true } },
      },
    }),
    prisma.script.findMany({
      where: { parentId: { not: null }, stat: { matchedRows: { gt: 0 } } },
      select: {
        id: true, name: true,
        stat: { select: { totalCost: true, roi: true, customers: true } },
        parent: { select: { name: true } },
      },
    }),
  ])

  // Recursive source aggregation
  const childrenOf = new Map<string, string[]>()
  for (const s of allScripts) {
    if (s.parentId) {
      if (!childrenOf.has(s.parentId)) childrenOf.set(s.parentId, [])
      childrenOf.get(s.parentId)!.push(s.id)
    }
  }
  const scriptById = new Map(allScripts.map(s => [s.id, s]))

  const computeAgg = (id: string, visited = new Set<string>()): { customers: number; totalCost: number } => {
    if (visited.has(id)) return { customers: 0, totalCost: 0 }
    visited.add(id)
    const s = scriptById.get(id)
    const own = { customers: s?.stat?.customers ?? 0, totalCost: s?.stat?.totalCost ?? 0 }
    return (childrenOf.get(id) ?? []).reduce((acc, cid) => {
      const c = computeAgg(cid, visited)
      return { customers: acc.customers + c.customers, totalCost: acc.totalCost + c.totalCost }
    }, own)
  }

  const topSourceScripts = allScripts
    .filter(s => !s.parentId)
    .map(s => {
      const agg = computeAgg(s.id)
      return { id: s.id, name: s.name, _count: s._count, ownStat: s.stat, aggregatedCustomers: agg.customers, aggregatedCost: agg.totalCost }
    })
    .filter(s => s.aggregatedCustomers > 0)
    .sort((a, b) => b.aggregatedCustomers - a.aggregatedCustomers)
    .slice(0, 3)

  const topIterationScripts = [...iterationScripts]
    .sort((a, b) => (b.stat?.roi ?? -Infinity) - (a.stat?.roi ?? -Infinity))
    .slice(0, 3)

  if (stats.length === 0) {
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalCost: 0, totalCustomers: 0, avgCustomerCost: null, roi: null, scriptCount: 0,
        top10Cost: [], top10Roi: [], top10Customers: [],
        top3Cost: [], top3Revenue: [],
        topSourceScripts,
        topIterationScripts,
      },
    })
  }

  const totalCost      = stats.reduce((s, r) => s + r.totalCost, 0)
  const totalCustomers = stats.reduce((s, r) => s + r.customers, 0)
  const totalRevenue   = stats.reduce((s, r) => s + r.highCourseRevenue, 0)

  const sorted = (key: keyof typeof stats[0], desc = true) =>
    [...stats].sort((a, b) => desc
      ? ((b[key] as number) ?? 0) - ((a[key] as number) ?? 0)
      : ((a[key] as number) ?? 0) - ((b[key] as number) ?? 0)
    )

  const toEntry = (s: typeof stats[0], key: keyof typeof stats[0]) => ({
    name: s.script.name,
    value: (s[key] as number) ?? 0,
  })

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      totalCost,
      totalCustomers,
      avgCustomerCost: totalCustomers > 0 ? totalCost / totalCustomers : null,
      roi: totalCost > 0 ? totalRevenue / totalCost : null,
      scriptCount: stats.length,
      top10Cost:      sorted('totalCost').slice(0, 10).map(s => toEntry(s, 'totalCost')),
      top10Customers: sorted('customers').slice(0, 10).map(s => toEntry(s, 'customers')),
      top10Roi:       sorted('roi').slice(0, 10).filter(s => s.roi != null).map(s => toEntry(s, 'roi')),
      top3Cost:       sorted('totalCost').slice(0, 3).map(s => toEntry(s, 'totalCost')),
      top3Revenue:    sorted('highCourseRevenue').slice(0, 3).map(s => toEntry(s, 'highCourseRevenue')),
      topSourceScripts,
      topIterationScripts,
    },
  })
}
