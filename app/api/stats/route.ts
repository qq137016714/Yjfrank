import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const stats = await prisma.scriptStat.findMany({
    include: { script: { select: { name: true } } },
  })

  if (stats.length === 0) {
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalCost: 0, totalCustomers: 0, avgCustomerCost: null, roi: null, scriptCount: 0,
        top10Cost: [], top10Roi: [], top10Customers: [],
        top3Cost: [], top3Revenue: [],
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
    },
  })
}
