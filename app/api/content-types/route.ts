import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const config = await prisma.systemConfig.findUnique({ where: { key: 'contentTypes' } })
    const contentTypes: string[] = JSON.parse(config?.value ?? '[]')

    return NextResponse.json({ success: true, data: contentTypes })
  } catch (error) {
    console.error('Get content types error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
