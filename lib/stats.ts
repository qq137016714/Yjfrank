import { prisma } from '@/lib/db'
import { matchScriptName, type MatchConfig } from '@/lib/matching'

/** 判断渠道值是否有效（过滤 "-"、空值、"合计" 等汇总行） */
function isValidChannel(channel: string | null | undefined): channel is string {
  if (!channel) return false
  const t = channel.trim()
  return t !== '' && t !== '-' && t !== '—' && t !== '合计' && t !== 'total'
}

/** 判断素材名是否为汇总行（过滤 "合计" 等） */
function isDataRow(materialName: string): boolean {
  const t = materialName.trim()
  return t !== '' && t !== '合计' && t !== 'total' && t !== 'Total'
}

// ─── 渠道×期次统计（独立于脚本匹配）────────────────────────────────────────
export async function recalculateChannelPeriodStats(): Promise<void> {
  const uploads = await prisma.excelUpload.findMany({
    include: { rows: true },
    orderBy: { createdAt: 'asc' },
  })

  // 全量重算：先清空旧数据
  await prisma.channelPeriodStat.deleteMany()

  for (const upload of uploads) {
    // 过滤汇总行 + 无效渠道行
    const validRows = upload.rows.filter(
      r => isDataRow(r.materialName) && isValidChannel(r.channel)
    )

    // 动态识别本期出现的渠道
    const channels = [...new Set(validRows.map(r => r.channel as string))]

    for (const channel of channels) {
      const cRows = validRows.filter(r => r.channel === channel)

      const sum = (field: keyof typeof cRows[0]) =>
        cRows.reduce((acc, r) => acc + ((r[field] as number | null) ?? 0), 0)
      const avg = (field: keyof typeof cRows[0]) => {
        const vals = cRows.map(r => r[field] as number | null).filter(v => v !== null) as number[]
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      }

      const totalCost = sum('totalCost')
      const customers = sum('customers')
      const highCourseRevenue = sum('highCourseRevenue')

      await prisma.channelPeriodStat.create({
        data: {
          channel,
          uploadId: upload.id,
          period: upload.period,
          rowCount:          cRows.length,
          totalCost,
          impressions:       sum('impressions'),
          clicks:            sum('clicks'),
          customers,
          highCourseRevenue,
          lowCourseRevenue:  sum('lowCourseRevenue'),
          activations:       sum('activations'),
          additions:         sum('additions'),
          highCourseCount:   sum('highCourseCount'),
          refunds:           sum('refunds'),
          clickRate:         avg('clickRate'),
          playRate3s:        avg('playRate3s'),
          playRate:          avg('playRate'),
          conversionRate:    avg('conversionRate'),
          customerCost:      customers > 0 ? totalCost / customers : null,
          roi:               totalCost > 0 ? highCourseRevenue / totalCost : null,
        },
      })
    }
  }
}

// ─── 脚本统计（含渠道分组）────────────────────────────────────────────────
export async function recalculateAllStats(): Promise<void> {
  const [scripts, allRows, uploads, blockWordsConfig, contentTypesConfig] = await Promise.all([
    prisma.script.findMany(),
    prisma.excelRow.findMany(),
    prisma.excelUpload.findMany({ select: { id: true } }),
    prisma.systemConfig.findUnique({ where: { key: 'blockWords' } }),
    prisma.systemConfig.findUnique({ where: { key: 'contentTypes' } }),
  ])

  const config: MatchConfig = {
    blockWords: JSON.parse(blockWordsConfig?.value ?? '[]'),
    contentTypes: JSON.parse(contentTypesConfig?.value ?? '[]'),
  }

  const uploadCount = uploads.length

  for (const script of scripts) {
    const rows = allRows.filter(
      r => isDataRow(r.materialName) && matchScriptName(r.materialName, script.name, config)
    )

    if (rows.length === 0) {
      await prisma.scriptStat.deleteMany({ where: { scriptId: script.id } })
      await prisma.scriptChannelStat.deleteMany({ where: { scriptId: script.id } })
      continue
    }

    const sum = (field: keyof typeof rows[0]) =>
      rows.reduce((acc, r) => acc + ((r[field] as number | null) ?? 0), 0)
    const avg = (field: keyof typeof rows[0]) => {
      const vals = rows.map(r => r[field] as number | null).filter(v => v !== null) as number[]
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    }

    const totalCost         = sum('totalCost')
    const impressions       = sum('impressions')
    const clicks            = sum('clicks')
    const customers         = sum('customers')
    const activations       = sum('activations')
    const additions         = sum('additions')
    const highCourseRevenue = sum('highCourseRevenue')

    const globalData = {
      matchedRows: rows.length, uploadCount,
      totalCost, impressions, clicks, customers, activations, additions, highCourseRevenue,
      lowCourseCount:    sum('lowCourseCount'),
      lowCourseRevenue:  sum('lowCourseRevenue'),
      wechatFollowers:   sum('wechatFollowers'),
      groupJoins:        sum('groupJoins'),
      deepUsers:         sum('deepUsers'),
      highCourseCount:   sum('highCourseCount'),
      day3HighCourse:    sum('day3HighCourse'),
      day4HighCourse:    sum('day4HighCourse'),
      day5HighCourse:    sum('day5HighCourse'),
      refunds:           sum('refunds'),
      clickRate:         avg('clickRate'),
      playRate3s:        avg('playRate3s'),
      playRate:          avg('playRate'),
      conversionRate:    avg('conversionRate'),
      landingConvRate:   avg('landingConvRate'),
      wechatFollowRate:  avg('wechatFollowRate'),
      activationRate:    avg('activationRate'),
      additionRate:      avg('additionRate'),
      groupJoinRate:     avg('groupJoinRate'),
      day1PlayRate:      avg('day1PlayRate'),
      day2PlayRate:      avg('day2PlayRate'),
      day3PlayRate:      avg('day3PlayRate'),
      day4PlayRate:      avg('day4PlayRate'),
      day5PlayRate:      avg('day5PlayRate'),
      deepRate:          avg('deepRate'),
      day3DeepPlayRate:  avg('day3DeepPlayRate'),
      day3DeepConvRate:  avg('day3DeepConvRate'),
      highCoursePayRate: avg('highCoursePayRate'),
      refundRate:        avg('refundRate'),
      customerCost:      customers > 0 ? totalCost / customers : null,
      avgImpressionCost: impressions > 0 ? totalCost / impressions : null,
      avgClickCost:      clicks > 0 ? totalCost / clicks : null,
      activationCost:    activations > 0 ? totalCost / activations : null,
      additionCost:      additions > 0 ? totalCost / additions : null,
      roi:               totalCost > 0 ? highCourseRevenue / totalCost : null,
    }

    await prisma.scriptStat.upsert({
      where: { scriptId: script.id },
      create: { scriptId: script.id, ...globalData },
      update: globalData,
    })

    // 按渠道分组（过滤无效渠道）
    const channels = [...new Set(
      rows.map(r => r.channel).filter(isValidChannel)
    )] as string[]

    await prisma.scriptChannelStat.deleteMany({
      where: { scriptId: script.id, channel: { notIn: channels } },
    })

    for (const channel of channels) {
      const cRows = rows.filter(r => r.channel === channel)

      const cSum = (field: keyof typeof cRows[0]) =>
        cRows.reduce((acc, r) => acc + ((r[field] as number | null) ?? 0), 0)
      const cAvg = (field: keyof typeof cRows[0]) => {
        const vals = cRows.map(r => r[field] as number | null).filter(v => v !== null) as number[]
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      }

      const cCost      = cSum('totalCost')
      const cCustomers = cSum('customers')
      const cRevenue   = cSum('highCourseRevenue')

      const channelData = {
        matchedRows:       cRows.length,
        totalCost:         cCost,
        impressions:       cSum('impressions'),
        clicks:            cSum('clicks'),
        customers:         cCustomers,
        highCourseRevenue: cRevenue,
        lowCourseRevenue:  cSum('lowCourseRevenue'),
        activations:       cSum('activations'),
        additions:         cSum('additions'),
        highCourseCount:   cSum('highCourseCount'),
        refunds:           cSum('refunds'),
        clickRate:         cAvg('clickRate'),
        playRate3s:        cAvg('playRate3s'),
        playRate:          cAvg('playRate'),
        conversionRate:    cAvg('conversionRate'),
        customerCost:      cCustomers > 0 ? cCost / cCustomers : null,
        roi:               cCost > 0 ? cRevenue / cCost : null,
      }

      await prisma.scriptChannelStat.upsert({
        where: { scriptId_channel: { scriptId: script.id, channel } },
        create: { scriptId: script.id, channel, ...channelData },
        update: channelData,
      })
    }
  }
}
