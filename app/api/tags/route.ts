import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const tags = await prisma.tag.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] })
  return NextResponse.json<ApiResponse>({ success: true, data: tags })
}
