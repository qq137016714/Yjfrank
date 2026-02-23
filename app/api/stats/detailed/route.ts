import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const uploadId = searchParams.get('uploadId')

    let whereClause = {}
    if (uploadId) {
      // 如果指定了uploadId，只统计该期次的数据
      const rows = await prisma.excelRow.findMany({
        where: { uploadId },
        select: { materialName: true }
      })
      const materialNames = rows.map(r => r.materialName)

      whereClause = {
        script: {
          name: { in: materialNames }
        }
      }
    }

    // 获取所有脚本统计数据的聚合
    const aggregateResult = await prisma.scriptStat.aggregate({
      where: whereClause,
      _sum: {
        totalCost: true,
        customers: true,
        highCourseRevenue: true,
        impressions: true,
        clicks: true,
        lowCourseCount: true,
        lowCourseRevenue: true,
        wechatFollowers: true,
        activations: true,
        additions: true,
        groupJoins: true,
        deepUsers: true,
        highCourseCount: true,
        day3HighCourse: true,
        day4HighCourse: true,
        day5HighCourse: true,
        refunds: true
      },
      _avg: {
        clickRate: true,
        playRate3s: true,
        playRate: true,
        conversionRate: true,
        landingConvRate: true,
        wechatFollowRate: true,
        activationRate: true,
        additionRate: true,
        groupJoinRate: true,
        day1PlayRate: true,
        day2PlayRate: true,
        day3PlayRate: true,
        day4PlayRate: true,
        day5PlayRate: true,
        deepRate: true,
        day3DeepPlayRate: true,
        day3DeepConvRate: true,
        highCoursePayRate: true,
        refundRate: true
      }
    })

    const sums = aggregateResult._sum
    const avgs = aggregateResult._avg

    // 计算衍生指标
    const totalCost = sums.totalCost || 0
    const customers = sums.customers || 0
    const impressions = sums.impressions || 0
    const clicks = sums.clicks || 0
    const activations = sums.activations || 0
    const additions = sums.additions || 0
    const highCourseRevenue = sums.highCourseRevenue || 0

    const detailedStats = {
      // 基础数据
      totalCost,
      customers,
      highCourseRevenue,
      roi: totalCost > 0 ? highCourseRevenue / totalCost : null,

      // 展示和点击数据
      impressions,
      clicks,
      clickRate: avgs.clickRate,
      avgImpressionCost: impressions > 0 ? totalCost / impressions : null,
      avgClickCost: clicks > 0 ? totalCost / clicks : null,

      // 转化漏斗数据
      conversionRate: avgs.conversionRate,
      landingConvRate: avgs.landingConvRate,
      customerCost: customers > 0 ? totalCost / customers : null,

      // 激活和添加数据
      activations,
      activationRate: avgs.activationRate,
      activationCost: activations > 0 ? totalCost / activations : null,
      additions,
      additionRate: avgs.additionRate,
      additionCost: additions > 0 ? totalCost / additions : null,

      // 社群数据
      wechatFollowers: sums.wechatFollowers || 0,
      wechatFollowRate: avgs.wechatFollowRate,
      groupJoins: sums.groupJoins || 0,
      groupJoinRate: avgs.groupJoinRate,

      // 播放数据
      playRate3s: avgs.playRate3s,
      playRate: avgs.playRate,
      day1PlayRate: avgs.day1PlayRate,
      day2PlayRate: avgs.day2PlayRate,
      day3PlayRate: avgs.day3PlayRate,
      day4PlayRate: avgs.day4PlayRate,
      day5PlayRate: avgs.day5PlayRate,

      // 高沉浸数据
      deepUsers: sums.deepUsers || 0,
      deepRate: avgs.deepRate,
      day3DeepPlayRate: avgs.day3DeepPlayRate,
      day3DeepConvRate: avgs.day3DeepConvRate,

      // 高价课数据
      highCourseCount: sums.highCourseCount || 0,
      highCoursePayRate: avgs.highCoursePayRate,
      day3HighCourse: sums.day3HighCourse || 0,
      day4HighCourse: sums.day4HighCourse || 0,
      day5HighCourse: sums.day5HighCourse || 0,

      // 低价课数据
      lowCourseCount: sums.lowCourseCount || 0,
      lowCourseRevenue: sums.lowCourseRevenue || 0,

      // 退款数据
      refunds: sums.refunds || 0,
      refundRate: avgs.refundRate
    }

    return NextResponse.json({
      success: true,
      data: detailedStats
    })
  } catch (error) {
    console.error('Get detailed stats error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}