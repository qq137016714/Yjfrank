import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { recalculateAllStats } from '@/lib/stats'
import type { ApiResponse } from '@/types'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const scripts = await prisma.script.findMany({
    orderBy: { createdAt: 'asc' },
    include: { stat: true },
  })

  return NextResponse.json<ApiResponse>({ success: true, data: scripts })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json<ApiResponse>({ success: false, message: '仅管理员可添加脚本' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const name = (body?.name as string | undefined)?.trim()
  if (!name) {
    return NextResponse.json<ApiResponse>({ success: false, message: '脚本名不能为空' }, { status: 400 })
  }

  const existing = await prisma.script.findUnique({ where: { name } })
  if (existing) {
    return NextResponse.json<ApiResponse>({ success: false, message: '该脚本名已存在' }, { status: 409 })
  }

  const script = await prisma.script.create({ data: { name } })

  // 新增脚本后触发重算
  recalculateAllStats().catch(console.error)

  return NextResponse.json<ApiResponse>({ success: true, data: script, message: '脚本添加成功' })
}
