import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json<ApiResponse>({ success: false, message: '仅管理员可删除脚本' }, { status: 403 })
  }

  const { id } = await params
  const script = await prisma.script.findUnique({ where: { id } })
  if (!script) {
    return NextResponse.json<ApiResponse>({ success: false, message: '脚本不存在' }, { status: 404 })
  }

  await prisma.script.delete({ where: { id } })
  return NextResponse.json<ApiResponse>({ success: true, message: '已删除' })
}
