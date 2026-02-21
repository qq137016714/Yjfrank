import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const TAGS = [
  // 前贴
  { name: '促销',     type: 'front' },
  { name: '剧情',     type: 'front' },
  { name: '焦虑/共情', type: 'front' },
  { name: '才艺',     type: 'front' },
  { name: '干货',     type: 'front' },
  { name: '提升',     type: 'front' },
  { name: '社交',     type: 'front' },
  { name: '实用价值', type: 'front' },
  { name: '人设',     type: 'front' },
  { name: '课程卖点', type: 'front' },
  { name: '受益者',   type: 'front' },
  // 中段
  { name: '发声技巧',     type: 'mid' },
  { name: '情感带入',     type: 'mid' },
  { name: '课程+对应福利', type: 'mid' },
  { name: '自我提升',     type: 'mid' },
  { name: '角色塑造',     type: 'mid' },
  { name: '应用场景',     type: 'mid' },
  { name: '认知认同',     type: 'mid' },
  { name: '案例分享',     type: 'mid' },
  { name: '沟通技巧',     type: 'mid' },
  { name: '营销免费',     type: 'mid' },
  // 尾贴
  { name: '行为引导',   type: 'end' },
  { name: '时效性节点', type: 'end' },
  { name: '福利加码',   type: 'end' },
  { name: '价格促销',   type: 'end' },
  { name: '收获引导',   type: 'end' },
  { name: '社交',       type: 'end' },
]

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  await prisma.user.upsert({
    where: { username: '管理员' },
    update: {},
    create: { username: '管理员', password: hashedPassword, role: 'admin' },
  })
  console.log('✅ 管理员账号初始化完成')

  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    })
  }
  console.log(`✅ 标签初始化完成（共 ${TAGS.length} 个）`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

