import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const uploads = await prisma.excelUpload.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: { select: { username: true } },
      task: { select: { status: true, error: true } },
    },
  })

  return NextResponse.json<ApiResponse>({
    success: true,
    data: uploads.map(u => ({
      id: u.id,
      filename: u.filename,
      period: u.period,
      rowCount: u.rowCount,
      uploadedBy: u.uploader.username,
      status: u.task?.status ?? 'unknown',
      error: u.task?.error,
      createdAt: u.createdAt,
    })),
  })
}
