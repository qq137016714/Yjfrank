import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)
  
  await prisma.user.upsert({
    where: { username: '管理员' },
    update: {},
    create: {
      username: '管理员',
      password: hashedPassword,
      role: 'admin',
    },
  })
  
  console.log('✅ 管理员账号初始化完成')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
