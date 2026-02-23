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

  // 收集所有需要的标签及其类型（front > mid > end 优先）
  const tagTypeMap = new Map<string, string>()
  for (const s of scripts) {
    for (const n of s.frontTagNames) if (!tagTypeMap.has(n)) tagTypeMap.set(n, 'front')
    for (const n of s.midTagNames)   if (!tagTypeMap.has(n)) tagTypeMap.set(n, 'mid')
    for (const n of s.endTagNames)   if (!tagTypeMap.has(n)) tagTypeMap.set(n, 'end')
  }

  // Upsert 所有标签（不存在则创建，已存在则跳过）
  for (const [name, type] of tagTypeMap) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name, type },
    })
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

    // Auto-detect content types from imported script names
    const newTypes = [...new Set(scripts.map(s => s.name.slice(-2)).filter(t => t.length === 2))]
    prisma.systemConfig.findMany({ where: { key: { in: ['contentTypes', 'disabledContentTypes'] } } })
      .then(configs => {
        const ct: string[] = JSON.parse(configs.find(c => c.key === 'contentTypes')?.value ?? '[]')
        const dt: string[] = JSON.parse(configs.find(c => c.key === 'disabledContentTypes')?.value ?? '[]')
        const toAdd = newTypes.filter(t => !ct.includes(t) && !dt.includes(t))
        if (toAdd.length > 0) {
          return prisma.systemConfig.upsert({
            where: { key: 'contentTypes' },
            update: { value: JSON.stringify([...ct, ...toAdd]) },
            create: { key: 'contentTypes', value: JSON.stringify(toAdd) },
          })
        }
      })
      .catch(console.error)
  }

  return NextResponse.json<ApiResponse>({ success: true, data: { created, skipped } })
}
