import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const name = request.nextUrl.searchParams.get('name')?.trim()
  if (!name) {
    return NextResponse.json<ApiResponse>({ success: false, message: '缺少 name 参数' }, { status: 400 })
  }

  const existing = await prisma.script.findUnique({ where: { name } })
  return NextResponse.json<ApiResponse>({ success: true, data: { available: !existing } })
}
