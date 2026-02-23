import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// ---- inline parser (mirrors lib/script-parser.ts) ----
interface ParsedScript {
  name: string
  frontContent: string; midContent: string; endContent: string
  frontTagNames: string[]; midTagNames: string[]; endTagNames: string[]
}
const LINE_RE = /^段落—(前贴|中段|尾贴)\s+内容标签—(.*?)\s+脚本名：(\S+)(?:\s+内容：(.*))?$/
type SegType = 'front' | 'mid' | 'end'

function parseScriptText(text: string) {
  const map = new Map<string, ParsedScript>()
  const errors: { line: number; content: string; reason: string }[] = []
  let ctx: { name: string; seg: SegType } | null = null
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (/^===/.test(trimmed)) { ctx = null; continue }
    if (!trimmed) continue
    const m = trimmed.match(LINE_RE)
    if (m) {
      const [, segCN, tagStr, rawName, content = ''] = m
      const seg: SegType = segCN === '前贴' ? 'front' : segCN === '中段' ? 'mid' : 'end'
      const name = rawName.replace(/^\d+/, '')
      const tagNames = tagStr.split('、').map(t => t.trim()).filter(Boolean)
      if (!map.has(name)) map.set(name, { name, frontContent: '', midContent: '', endContent: '', frontTagNames: [], midTagNames: [], endTagNames: [] })
      const s = map.get(name)!
      if (seg === 'front') { s.frontContent = content; s.frontTagNames = tagNames }
      else if (seg === 'mid') { s.midContent = content; s.midTagNames = tagNames }
      else { s.endContent = content; s.endTagNames = tagNames }
      ctx = { name, seg }
    } else {
      if (ctx) {
        const s = map.get(ctx.name)!
        if (ctx.seg === 'front') s.frontContent += '\n' + trimmed
        else if (ctx.seg === 'mid') s.midContent += '\n' + trimmed
        else s.endContent += '\n' + trimmed
      } else {
        errors.push({ line: i + 1, content: trimmed, reason: '无法解析，且无所属段落' })
      }
    }
  }
  return { scripts: Array.from(map.values()), errors }
}
// -------------------------------------------------------

async function main() {
  const filePath = join(process.cwd(), '真实脚本内容.TXT')
  const text = readFileSync(filePath, 'utf-8')
  const { scripts, errors } = parseScriptText(text)
  console.log(`解析完成：${scripts.length} 条脚本，${errors.length} 行错误`)
  if (errors.length > 0) {
    console.log('错误行示例：', errors.slice(0, 3))
  }

  const allTags = await prisma.tag.findMany({ select: { id: true, name: true } })
  const tagByName = new Map(allTags.map(t => [t.name, t.id]))

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (!admin) throw new Error('找不到管理员账号')

  const existingNames = new Set(
    (await prisma.script.findMany({ select: { name: true } })).map(s => s.name)
  )

  let created = 0, skipped = 0
  for (const s of scripts) {
    if (existingNames.has(s.name)) { skipped++; continue }
    const tagIds = [...new Set([
      ...s.frontTagNames, ...s.midTagNames, ...s.endTagNames
    ])].map(n => tagByName.get(n)).filter(Boolean) as string[]

    await prisma.script.create({
      data: {
        name: s.name,
        frontContent: s.frontContent || null,
        midContent:   s.midContent   || null,
        endContent:   s.endContent   || null,
        uploadedBy:   admin.id,
        tags: tagIds.length > 0 ? { connect: tagIds.map(id => ({ id })) } : undefined,
      },
    })
    created++
  }
  console.log(`✅ 脚本导入完成：新建 ${created} 条，跳过 ${skipped} 条`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
