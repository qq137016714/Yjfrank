import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 查询所有脚本名称（脚本库，非Excel数据）
    const scripts = await prisma.script.findMany({ select: { name: true } })

    // 提取最后2个字符作为类型
    const detectedTypes = new Set<string>()
    scripts.forEach(script => {
      if (script.name.length >= 2) detectedTypes.add(script.name.slice(-2))
    })

    // 获取现有的系统配置（key/value 模式）
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: ['contentTypes', 'disabledContentTypes'] } },
    })
    const existingContentTypes: string[] = JSON.parse(configs.find(c => c.key === 'contentTypes')?.value ?? '[]')
    const existingDisabledTypes: string[] = JSON.parse(configs.find(c => c.key === 'disabledContentTypes')?.value ?? '[]')
    const allExistingTypes = [...existingContentTypes, ...existingDisabledTypes]

    // 过滤掉已存在的类型
    const newTypes = Array.from(detectedTypes).filter(type => !allExistingTypes.includes(type))

    if (newTypes.length > 0) {
      const updatedContentTypes = [...existingContentTypes, ...newTypes]
      await prisma.systemConfig.upsert({
        where: { key: 'contentTypes' },
        create: { key: 'contentTypes', value: JSON.stringify(updatedContentTypes) },
        update: { value: JSON.stringify(updatedContentTypes) },
      })
    }

    return NextResponse.json({ success: true, data: { added: newTypes.length, types: newTypes } })
  } catch (error) {
    console.error('Scan content types error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
