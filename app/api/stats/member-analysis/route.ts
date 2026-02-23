import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cleanMaterialName } from '@/lib/matching'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const uploadId = searchParams.get('uploadId') || undefined

    const [keywords, rows, blockWordsConfig] = await Promise.all([
      prisma.keyword.findMany({ where: { type: { in: ['EDITOR', 'CUTTER', 'PROJECT'] } } }),
      prisma.excelRow.findMany({ where: uploadId ? { uploadId } : undefined }),
      prisma.systemConfig.findUnique({ where: { key: 'blockWords' } }),
    ])

    const blockWords: string[] = JSON.parse(blockWordsConfig?.value ?? '[]')

    const editors = keywords.filter(k => k.type === 'EDITOR')
    const cutters = keywords.filter(k => k.type === 'CUTTER')
    const validProjects = new Set(keywords.filter(k => k.type === 'PROJECT').map(k => k.char))
    const editorChars = new Set(editors.map(k => k.char))
    const cutterChars = new Set(cutters.map(k => k.char))
    const editorMap = new Map(editors.map(k => [k.char, k.name]))
    const cutterMap = new Map(cutters.map(k => [k.char, k.name]))

    type Stat = { name: string; totalCost: number; customers: number; highCourseRevenue: number; rowCount: number }
    const editorStats = new Map<string, Stat>()
    const cutterStats = new Map<string, Stat>()

    for (const row of rows) {
      const mat = row.materialName?.trim()
      if (!mat || mat === '合计' || mat === 'total' || mat === 'Total') continue

      const cleaned = cleanMaterialName(mat, blockWords)
      if (cleaned.length < 7) continue
      if (validProjects.size > 0 && !validProjects.has(cleaned[0])) continue
      if (cleaned[1] !== '原' && cleaned[1] !== '混') continue

      const editorChar = cleaned[2]
      const cutterChar = cleaned[4]

      const addStat = (map: Map<string, Stat>, char: string, nameMap: Map<string, string>) => {
        if (!char || !nameMap.has(char)) return
        const name = nameMap.get(char)!
        const s = map.get(name) ?? { name, totalCost: 0, customers: 0, highCourseRevenue: 0, rowCount: 0 }
        s.totalCost += row.totalCost ?? 0
        s.customers += row.customers ?? 0
        s.highCourseRevenue += row.highCourseRevenue ?? 0
        s.rowCount += 1
        map.set(name, s)
      }

      if (editorChars.has(editorChar)) addStat(editorStats, editorChar, editorMap)
      if (cutterChars.has(cutterChar)) addStat(cutterStats, cutterChar, cutterMap)
    }

    const toArray = (map: Map<string, Stat>) =>
      Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost).map(s => ({
        ...s,
        roi: s.totalCost > 0 ? s.highCourseRevenue / s.totalCost : null,
        customerCost: s.customers > 0 ? s.totalCost / s.customers : null,
      }))

    return NextResponse.json({ success: true, data: { editors: toArray(editorStats), cutters: toArray(cutterStats) } })
  } catch (error) {
    console.error('member-analysis error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
