import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { recalculateAllStats } from '@/lib/stats'
import type { ParsedScript } from '@/lib/script-parser'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const scripts: ParsedScript[] = Array.isArray(body?.scripts) ? body.scripts : []

  if (scripts.length === 0) {
    return NextResponse.json<ApiResponse>({ success: false, message: '没有可导入的脚本' }, { status: 400 })
  }

  const allTags = await prisma.tag.findMany({ select: { id: true, name: true, type: true } })
  const tagByName = new Map(allTags.map(t => [t.name, t]))

  const names = scripts.map(s => s.name)
  const existing = await prisma.script.findMany({ where: { name: { in: names } }, select: { name: true } })
  const existingNames = new Set(existing.map(s => s.name))

  let created = 0
  let skipped = 0

  for (const s of scripts) {
    if (existingNames.has(s.name)) { skipped++; continue }

    const frontTagIds = s.frontTagNames.map(n => tagByName.get(n)?.id).filter(Boolean) as string[]
    const midTagIds   = s.midTagNames.map(n => tagByName.get(n)?.id).filter(Boolean) as string[]
    const endTagIds   = s.endTagNames.map(n => tagByName.get(n)?.id).filter(Boolean) as string[]
    const allTagIds   = [...new Set([...frontTagIds, ...midTagIds, ...endTagIds])]

    await prisma.script.create({
      data: {
        name:         s.name,
        frontContent: s.frontContent || null,
        midContent:   s.midContent   || null,
        endContent:   s.endContent   || null,
        uploadedBy:   session.user.id,
        tags: allTagIds.length > 0 ? { connect: allTagIds.map(id => ({ id })) } : undefined,
      },
    })
    created++
  }

  if (created > 0) {
    recalculateAllStats().catch(console.error)
  }

  return NextResponse.json<ApiResponse>({ success: true, data: { created, skipped } })
}
