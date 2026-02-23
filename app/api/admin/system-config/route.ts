import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

async function requireAdmin() {
  const session = await auth()
  if (!session) return { error: NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 }) }
  if (session.user?.role !== 'admin') return { error: NextResponse.json<ApiResponse>({ success: false, message: '无权限' }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: ['blockWords', 'contentTypes'] } },
  })

  const result: Record<string, string[]> = {}
  for (const c of configs) {
    result[c.key] = JSON.parse(c.value)
  }

  return NextResponse.json<ApiResponse>({ success: true, data: result })
}

export async function PUT(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { key, value } = body as { key: string; value: string[] }

  if (!key || !Array.isArray(value)) {
    return NextResponse.json<ApiResponse>({ success: false, message: '参数错误' }, { status: 400 })
  }

  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value: JSON.stringify(value) },
    create: { key, value: JSON.stringify(value) },
  })

  return NextResponse.json<ApiResponse>({ success: true, data: config })
}
