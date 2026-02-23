import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { join } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

const prisma = new PrismaClient()

async function main() {
  // 1. 找管理员
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (!admin) throw new Error('找不到管理员账号')

  // 2. 复制文件到 uploads 目录
  const src = join(process.cwd(), '紫威真实数据.xlsx')
  const uploadDir = join(process.cwd(), 'uploads')
  mkdirSync(uploadDir, { recursive: true })
  const filename = `${Date.now()}_紫威真实数据.xlsx`
  const dest = join(uploadDir, filename)
  copyFileSync(src, dest)
  console.log(`文件已复制到 ${dest}`)

  // 3. 创建 DB 记录
  const upload = await prisma.excelUpload.create({
    data: { filename: '紫威真实数据.xlsx', period: '第1期', uploadedBy: admin.id },
  })
  const task = await prisma.uploadTask.create({
    data: { uploadId: upload.id, status: 'pending', message: '等待处理...' },
  })
  console.log(`DB 记录创建完成，uploadId=${upload.id}，taskId=${task.id}`)

  // 4. 动态 import processExcelFile（需要 @/ 路径别名）
  // 使用 require + tsconfig-paths 已注册，直接 require 相对路径
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { processExcelFile } = require('../lib/excel')
  console.log('开始处理 Excel 文件...')
  await processExcelFile(task.id, upload.id, dest)

  // 5. 查询最终状态
  const finalTask = await prisma.uploadTask.findUnique({ where: { id: task.id } })
  console.log(`✅ 处理完成：status=${finalTask?.status}，message=${finalTask?.message}`)
  if (finalTask?.error) console.error('错误：', finalTask.error)
}

main().catch(console.error).finally(() => prisma.$disconnect())
