import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

async function requireAdmin() {
  const session = await auth()
  if (!session) return { error: NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 }), session: null }
  if (session.user?.role !== 'admin') return { error: NextResponse.json<ApiResponse>({ success: false, message: '无权限' }, { status: 403 }), session: null }
  return { error: null, session }
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, isLocked: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json<ApiResponse>({ success: true, data: users })
}

export async function PUT(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { userId, isLocked } = body as { userId: string; isLocked: boolean }

  if (!userId || typeof isLocked !== 'boolean') {
    return NextResponse.json<ApiResponse>({ success: false, message: '参数错误' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isLocked },
    select: { id: true, username: true, role: true, isLocked: true },
  })

  return NextResponse.json<ApiResponse>({ success: true, data: user })
}

export async function DELETE(req: Request) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json<ApiResponse>({ success: false, message: '缺少 userId' }, { status: 400 })

  // 不能删除自己
  if (session!.user?.id === userId) {
    return NextResponse.json<ApiResponse>({ success: false, message: '不能删除自己' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json<ApiResponse>({ success: true, message: '已删除' })
}
