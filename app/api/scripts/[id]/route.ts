import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { recalculateAllStats } from '@/lib/stats'
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
    include: {
      tags: true,
      stat: true,
      uploader: { select: { username: true } },
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
    },
  })

  if (!script) {
    return NextResponse.json<ApiResponse>({ success: false, message: '脚本不存在' }, { status: 404 })
  }

  return NextResponse.json<ApiResponse>({ success: true, data: script })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const { id } = await params
  const script = await prisma.script.findUnique({ where: { id } })
  if (!script) {
    return NextResponse.json<ApiResponse>({ success: false, message: '脚本不存在' }, { status: 404 })
  }

  // 权限：本人或管理员
  if (session.user.role !== 'admin' && script.uploadedBy !== session.user.id) {
    return NextResponse.json<ApiResponse>({ success: false, message: '无权编辑此脚本' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const name = (body?.name as string | undefined)?.trim()
  if (!name) {
    return NextResponse.json<ApiResponse>({ success: false, message: '脚本名不能为空' }, { status: 400 })
  }

  // 检查改名冲突
  if (name !== script.name) {
    const conflict = await prisma.script.findUnique({ where: { name } })
    if (conflict) {
      return NextResponse.json<ApiResponse>({ success: false, message: '该脚本名已存在' }, { status: 409 })
    }
  }

  const tagIds: string[] = Array.isArray(body?.tagIds) ? body.tagIds : []

  const updated = await prisma.script.update({
    where: { id },
    data: {
      name,
      frontContent: body?.frontContent || null,
      midContent:   body?.midContent   || null,
      endContent:   body?.endContent   || null,
      parentId:     body?.parentId || null,
      tags: { set: tagIds.map((tid: string) => ({ id: tid })) },
    },
    include: { tags: true, uploader: { select: { username: true } } },
  })

  recalculateAllStats().catch(console.error)

  return NextResponse.json<ApiResponse>({ success: true, data: updated, message: '脚本更新成功' })
}

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
