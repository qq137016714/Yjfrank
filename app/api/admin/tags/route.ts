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

// GET /api/admin/tags → 返回所有标签，按 type 分组
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { scripts: true } } },
  })

  const grouped: Record<string, typeof tags> = {}
  for (const tag of tags) {
    if (!grouped[tag.type]) grouped[tag.type] = []
    grouped[tag.type].push(tag)
  }

  return NextResponse.json<ApiResponse>({ success: true, data: grouped })
}

// POST /api/admin/tags → 新增标签 { name, type }
export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { name, type } = await req.json() as { name: string; type: string }
  if (!name?.trim() || !type) {
    return NextResponse.json<ApiResponse>({ success: false, message: '参数错误' }, { status: 400 })
  }

  const tag = await prisma.tag.create({ data: { name: name.trim(), type } })
  return NextResponse.json<ApiResponse>({ success: true, data: tag })
}

// DELETE /api/admin/tags?id=xxx → 删除空标签
export async function DELETE(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json<ApiResponse>({ success: false, message: '缺少 id' }, { status: 400 })

  const tag = await prisma.tag.findUnique({
    where: { id },
    include: { _count: { select: { scripts: true } } },
  })
  if (!tag) return NextResponse.json<ApiResponse>({ success: false, message: '标签不存在' }, { status: 404 })
  if (tag._count.scripts > 0) {
    return NextResponse.json<ApiResponse>({ success: false, message: '该标签下有脚本数据，无法删除' }, { status: 400 })
  }

  await prisma.tag.delete({ where: { id } })
  return NextResponse.json<ApiResponse>({ success: true })
}
