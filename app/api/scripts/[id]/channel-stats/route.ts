import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const { id } = await params

  const script = await prisma.script.findUnique({
    where: { id },
    include: { channelStats: { orderBy: { totalCost: 'desc' } } },
  })

  if (!script) {
    return NextResponse.json<ApiResponse>({ success: false, message: '脚本不存在' }, { status: 404 })
  }

  return NextResponse.json<ApiResponse>({ success: true, data: script.channelStats })
}
