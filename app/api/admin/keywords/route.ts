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

  const keywords = await prisma.keyword.findMany({ orderBy: [{ type: 'asc' }, { char: 'asc' }] })

  // 按 type 分组
  const grouped = keywords.reduce<Record<string, typeof keywords>>((acc, kw) => {
    if (!acc[kw.type]) acc[kw.type] = []
    acc[kw.type].push(kw)
    return acc
  }, {})

  return NextResponse.json<ApiResponse>({ success: true, data: grouped })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { type, char, name } = body

  if (!type || !char || !name) {
    return NextResponse.json<ApiResponse>({ success: false, message: '缺少必填字段' }, { status: 400 })
  }

  const keyword = await prisma.keyword.create({ data: { type, char, name } })
  return NextResponse.json<ApiResponse>({ success: true, data: keyword })
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json<ApiResponse>({ success: false, message: '缺少 id' }, { status: 400 })

  await prisma.keyword.delete({ where: { id } })
  return NextResponse.json<ApiResponse>({ success: true, message: '已删除' })
}
