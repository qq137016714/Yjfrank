import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const taskId = request.nextUrl.searchParams.get('taskId')
  if (!taskId) {
    return NextResponse.json<ApiResponse>({ success: false, message: '缺少 taskId 参数' }, { status: 400 })
  }

  const task = await prisma.uploadTask.findUnique({
    where: { id: taskId },
    include: { upload: { select: { filename: true, period: true, rowCount: true } } },
  })

  if (!task) {
    return NextResponse.json<ApiResponse>({ success: false, message: '任务不存在' }, { status: 404 })
  }

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      total: task.total,
      message: task.message,
      error: task.error,
      filename: task.upload.filename,
      period: task.upload.period,
      rowCount: task.upload.rowCount,
    },
  })
}
