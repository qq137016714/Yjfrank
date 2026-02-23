import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json<ApiResponse>({ success: false, message: '仅管理员可批量删除' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
  if (ids.length === 0) {
    return NextResponse.json<ApiResponse>({ success: false, message: '未提供脚本 ID' }, { status: 400 })
  }

  const { count } = await prisma.script.deleteMany({ where: { id: { in: ids } } })

  return NextResponse.json<ApiResponse>({ success: true, data: { deleted: count } })
}
