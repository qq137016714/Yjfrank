import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

const LINE_RE = /^段落—(前贴|中段|尾贴)\s+内容标签—(.*?)\s+脚本名：(\S+)(?:\s+内容：(.*))?$/
type SegType = 'front' | 'mid' | 'end'
interface PS { name: string; frontContent: string; midContent: string; endContent: string; frontTagNames: string[]; midTagNames: string[]; endTagNames: string[] }

function parse(text: string) {
  const map = new Map<string, PS>()
  let ctx: { name: string; seg: SegType } | null = null
  for (const raw of text.split(/\r?\n/)) {
    const t = raw.trim()
    if (/^===/.test(t)) { ctx = null; continue }
    if (!t) continue
    const m = t.match(LINE_RE)
    if (m) {
      const [, segCN, tagStr, rawName, content = ''] = m
      const seg: SegType = segCN === '前贴' ? 'front' : segCN === '中段' ? 'mid' : 'end'
      const name = rawName.replace(/^\d+/, '')
      const tags = tagStr.split('、').map(s => s.trim()).filter(Boolean)
      if (!map.has(name)) map.set(name, { name, frontContent: '', midContent: '', endContent: '', frontTagNames: [], midTagNames: [], endTagNames: [] })
      const s = map.get(name)!
      if (seg === 'front') { s.frontContent = content; s.frontTagNames = tags }
      else if (seg === 'mid') { s.midContent = content; s.midTagNames = tags }
      else { s.endContent = content; s.endTagNames = tags }
      ctx = { name, seg }
    } else if (ctx) {
      const s = map.get(ctx.name)!
      if (ctx.seg === 'front') s.frontContent += '\n' + t
      else if (ctx.seg === 'mid') s.midContent += '\n' + t
      else s.endContent += '\n' + t
    }
  }
  return Array.from(map.values())
}

async function main() {
  const text = readFileSync(join(process.cwd(), '真实脚本内容.TXT'), 'utf-8')
  const scripts = parse(text)
  let updated = 0
  for (const s of scripts) {
    await prisma.script.updateMany({
      where: { name: s.name },
      data: {
        frontContent: s.frontContent || null,
        midContent:   s.midContent   || null,
        endContent:   s.endContent   || null,
      },
    })
    updated++
  }
  console.log(`✅ 内容更新完成：${updated} 条脚本`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
