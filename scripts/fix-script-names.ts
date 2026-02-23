import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const scripts = await prisma.script.findMany({ select: { id: true, name: true } })
  let updated = 0, skipped = 0

  for (const s of scripts) {
    const cleaned = s.name.replace(/^\d{5,6}/, '').trim()
    if (cleaned === s.name) continue // no prefix to remove

    // Check for name conflict
    const conflict = await prisma.script.findUnique({ where: { name: cleaned } })
    if (conflict && conflict.id !== s.id) {
      console.log(`跳过（名称冲突）：${s.name} → ${cleaned}`)
      skipped++
      continue
    }

    await prisma.script.update({ where: { id: s.id }, data: { name: cleaned } })
    console.log(`更新：${s.name} → ${cleaned}`)
    updated++
  }

  console.log(`\n✅ 完成：更新 ${updated} 条，跳过 ${skipped} 条`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
