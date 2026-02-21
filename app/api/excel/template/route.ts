import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import * as XLSX from 'xlsx'
import { EXCEL_COLUMNS } from '@/lib/excel-columns'
import type { ApiResponse } from '@/types'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, message: '请先登录' }, { status: 401 })
  }

  // 生成只有表头的模板文件
  const headers = EXCEL_COLUMNS.map(c => c.name)
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers])

  // 设置列宽
  ws['!cols'] = headers.map(() => ({ wch: 16 }))

  XLSX.utils.book_append_sheet(wb, ws, '数据模板')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="数据上传模板.xlsx"',
    },
  })
}
