import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { processExcelFile } from '@/lib/excel'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json<ApiResponse>({ success: false, message: '仅管理员可上传数据' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json<ApiResponse>({ success: false, message: '请求格式错误' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const period = (formData.get('period') as string | null)?.trim()

  if (!file) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请选择要上传的文件' }, { status: 400 })
  }
  if (!period) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请填写数据期次' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls'].includes(ext ?? '')) {
    return NextResponse.json<ApiResponse>({ success: false, message: '仅支持 .xlsx 或 .xls 格式' }, { status: 400 })
  }

  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json<ApiResponse>({ success: false, message: '文件大小不能超过 100MB' }, { status: 400 })
  }

  // 保存文件
  const uploadDir = join(process.cwd(), 'uploads')
  await mkdir(uploadDir, { recursive: true })
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._\u4e00-\u9fa5-]/g, '_')}`
  const filePath = join(uploadDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  // 创建数据库记录
  const upload = await prisma.excelUpload.create({
    data: {
      filename: file.name,
      period,
      uploadedBy: session.user.id,
    },
  })

  const task = await prisma.uploadTask.create({
    data: {
      uploadId: upload.id,
      status: 'pending',
      message: '等待处理...',
    },
  })

  // 后台异步处理（不阻塞响应）
  processExcelFile(task.id, upload.id, filePath).catch(console.error)

  return NextResponse.json<ApiResponse>({
    success: true,
    message: '文件上传成功，正在处理',
    data: { taskId: task.id, uploadId: upload.id },
  })
}
