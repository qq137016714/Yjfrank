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
    orderBy: { createdAt: 'desc' },
    include: {
      tags: true,
      stat: { select: { matchedRows: true, totalCost: true, roi: true, customers: true } },
      uploader: { select: { id: true, username: true } },
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true } },
    },
  })

  return NextResponse.json<ApiResponse>({ success: true, data: scripts })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
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

  const tagIds: string[] = Array.isArray(body?.tagIds) ? body.tagIds : []
  const parentId: string | undefined = body?.parentId || undefined

  const script = await prisma.script.create({
    data: {
      name,
      frontContent: body?.frontContent || null,
      midContent:   body?.midContent   || null,
      endContent:   body?.endContent   || null,
      parentId:     parentId || null,
      uploadedBy:   session.user.id,
      tags: tagIds.length > 0 ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
    },
    include: { tags: true, uploader: { select: { username: true } } },
  })

  recalculateAllStats().catch(console.error)

  return NextResponse.json<ApiResponse>({ success: true, data: script, message: '脚本创建成功' })
}
