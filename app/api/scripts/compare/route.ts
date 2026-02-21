import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('ids')
  if (!idsParam) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请提供脚本ID' }, { status: 400 })
  }

  const ids = idsParam.split(',').filter(Boolean).slice(0, 4)

  const scripts = await prisma.script.findMany({
    where: { id: { in: ids } },
    include: {
      tags: true,
      stat: true,
      channelStats: { orderBy: { totalCost: 'desc' } },
    },
  })

  // preserve input order + compute derived fields
  const ordered = ids.map(id => {
    const s = scripts.find(sc => sc.id === id)
    if (!s) return null
    return {
      ...s,
      stat: s.stat ? {
        ...s.stat,
        avgCustomerCost: s.stat.customers > 0 ? s.stat.totalCost / s.stat.customers : null,
      } : null,
    }
  }).filter(Boolean)

  return NextResponse.json<ApiResponse>({ success: true, data: ordered })
}
