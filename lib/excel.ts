import * as XLSX from 'xlsx'
import { prisma } from '@/lib/db'
import { validateHeaders, parseRow } from '@/lib/excel-columns'
import { recalculateAllStats, recalculateChannelPeriodStats } from '@/lib/stats'

// 异步处理 EXCEL 文件（上传接口调用后在后台运行）
export async function processExcelFile(taskId: string, uploadId: string, filePath: string) {
  const updateTask = async (
    status: string,
    progress = 0,
    total = 0,
    message = '',
    error?: string
  ) => {
    await prisma.uploadTask.update({
      where: { id: taskId },
      data: { status, progress, total, message, error: error ?? null },
    })
  }

  try {
    // 1. 验证文件格式
    await updateTask('validating', 0, 0, '正在验证文件格式...')

    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.readFile(filePath)
    } catch {
      await updateTask('error', 0, 0, '', '无法读取文件，请确认上传的是有效的 .xlsx 或 .xls 文件')
      return
    }

    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      await updateTask('error', 0, 0, '', '文件中没有找到工作表')
      return
    }

    const sheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      defval: null,
    })

    if (rawData.length < 2) {
      await updateTask('error', 0, 0, '', '文件内容为空或只有表头，没有数据行')
      return
    }

    // 2. 校验列名
    const headers = (rawData[0] as (string | null)[]).map(h => (h ?? '').toString().trim())
    const { valid, errors } = validateHeaders(headers)

    if (!valid) {
      const errMsg = errors.slice(0, 5).join('；') + (errors.length > 5 ? `…（共${errors.length}处错误）` : '')
      await updateTask('error', 0, 0, '', `列名校验失败：${errMsg}`)
      return
    }

    // 3. 解析数据行
    const dataRows = rawData.slice(1).filter(row =>
      Array.isArray(row) && row.some(cell => cell !== null && cell !== '')
    )
    const total = dataRows.length

    await updateTask('parsing', 0, total, `正在解析数据（0/${total} 行）...`)

    // 更新 upload 的 rowCount
    await prisma.excelUpload.update({
      where: { id: uploadId },
      data: { rowCount: total },
    })

    // 批量插入，每100行更新一次进度
    const BATCH_SIZE = 100
    for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
      const batch = dataRows.slice(i, i + BATCH_SIZE)
      const rowsToInsert = batch
        .map((row, batchIdx) => parseRow(row as (string | number | null)[], i + batchIdx + 1))
        .filter(r => r.materialName) // 跳过素材名为空的行

      if (rowsToInsert.length > 0) {
        await prisma.excelRow.createMany({
          data: rowsToInsert.map(r => ({ ...r, uploadId })),
        })
      }

      const processed = Math.min(i + BATCH_SIZE, total)
      await updateTask('parsing', processed, total, `正在解析数据（${processed}/${total} 行）...`)
    }

    // 4. 匹配脚本 + 渠道×期次统计
    await updateTask('matching', total, total, '正在匹配脚本数据...')
    await Promise.all([
      recalculateAllStats(),
      recalculateChannelPeriodStats(),
    ])

    // 5. 完成
    await updateTask('done', total, total, `解析完成，共录入 ${total} 行数据`)
  } catch (err) {
    console.error('processExcelFile error:', err)
    await updateTask('error', 0, 0, '', err instanceof Error ? err.message : '服务器内部错误')
  }
}
