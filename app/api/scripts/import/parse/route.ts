import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseScriptText } from '@/lib/script-parser'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请求格式错误' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json<ApiResponse>({ success: false, message: '未找到文件' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'txt' && ext !== 'docx') {
    return NextResponse.json<ApiResponse>({ success: false, message: '仅支持 .txt 和 .docx 文件' }, { status: 400 })
  }

  let text: string
  if (ext === 'docx') {
    const mammoth = await import('mammoth')
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    text = result.value
  } else {
    text = await file.text()
  }

  const { scripts, errors } = parseScriptText(text)

  const allTags = await prisma.tag.findMany({ select: { name: true } })
  const tagNameSet = new Set(allTags.map(t => t.name))

  const parsedNames = scripts.map(s => s.name)
  const existingScripts = await prisma.script.findMany({
    where: { name: { in: parsedNames } },
    select: { name: true },
  })
  const existingNameSet = new Set(existingScripts.map(s => s.name))

  const allParsedTagNames = new Set<string>()
  for (const s of scripts) {
    s.frontTagNames.forEach(t => allParsedTagNames.add(t))
    s.midTagNames.forEach(t => allParsedTagNames.add(t))
    s.endTagNames.forEach(t => allParsedTagNames.add(t))
  }

  const duplicateNames = parsedNames.filter(n => existingNameSet.has(n))
  const unknownTags = Array.from(allParsedTagNames).filter(t => !tagNameSet.has(t))

  return NextResponse.json<ApiResponse>({
    success: true,
    data: { scripts, errors, warnings: { duplicateNames, unknownTags } },
  })
}
