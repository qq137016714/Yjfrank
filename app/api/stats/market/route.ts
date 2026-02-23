import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  // 查询每个上传期次的合计行（materialName 含"合计"）
  const rows = await prisma.excelRow.findMany({
    where: { materialName: { contains: '合计' } },
    select: { totalCost: true, customers: true, highCourseRevenue: true },
  })

  const totalCost = rows.reduce((s, r) => s + (r.totalCost ?? 0), 0)
  const totalCustomers = rows.reduce((s, r) => s + (r.customers ?? 0), 0)
  const totalRevenue = rows.reduce((s, r) => s + (r.highCourseRevenue ?? 0), 0)
  const avgCustomerCost = totalCustomers > 0 ? totalCost / totalCustomers : null
  const roi = totalCost > 0 ? totalRevenue / totalCost : null

  return NextResponse.json<ApiResponse>({
    success: true,
    data: { totalCost, totalCustomers, avgCustomerCost, roi },
  })
}
