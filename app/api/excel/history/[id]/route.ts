import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { recalculateAllStats, recalculateChannelPeriodStats } from '@/lib/stats'
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
    return NextResponse.json<ApiResponse>({ success: false, message: '仅管理员可删除数据' }, { status: 403 })
  }

  const { id } = await params

  const upload = await prisma.excelUpload.findUnique({ where: { id } })
  if (!upload) {
    return NextResponse.json<ApiResponse>({ success: false, message: '记录不存在' }, { status: 404 })
  }

  // 级联删除 task 和 rows（schema 已配置 onDelete: Cascade）
  await prisma.excelUpload.delete({ where: { id } })

  // 重新计算统计，确保删除后数据与现存 Excel 一致
  Promise.all([
    recalculateAllStats(),
    recalculateChannelPeriodStats(),
  ]).catch(console.error)

  return NextResponse.json<ApiResponse>({ success: true, message: '已删除该期数据' })
}
