// EXCEL 列名定义与计算策略
// A列(0) 到 AV列(47)，共48列

export type CalcStrategy =
  | 'sum'       // 加算
  | 'avg'       // 多期平均
  | 'recalc'    // 重算（依赖其他字段）
  | 'first'     // 仅取初次值
  | 'channel'   // 按渠道单独统计
  | 'ignore'    // 忽略

export interface ColumnDef {
  index: number   // 0-based 列索引
  name: string    // 中文列名（用于校验）
  field: string   // 数据库字段名
  strategy: CalcStrategy
  recalcFormula?: string  // 重算公式说明
}

export const EXCEL_COLUMNS: ColumnDef[] = [
  { index: 0,  name: '素材名',           field: 'materialName',      strategy: 'sum'     }, // A - 匹配用
  { index: 1,  name: '投放时间',          field: 'deliveryDate',      strategy: 'first'   }, // B
  { index: 2,  name: '广告渠道',          field: 'channel',           strategy: 'channel' }, // C
  { index: 3,  name: '实际流水',          field: '_ignore',           strategy: 'ignore'  }, // D
  { index: 4,  name: '总成本',            field: 'totalCost',         strategy: 'sum'     }, // E
  { index: 5,  name: '实际成本',          field: '_ignore',           strategy: 'ignore'  }, // F
  { index: 6,  name: '展示数',            field: 'impressions',       strategy: 'sum'     }, // G
  { index: 7,  name: '获客成本',          field: '_recalc',           strategy: 'recalc', recalcFormula: '总成本÷总获客数' }, // H
  { index: 8,  name: '点击率',            field: 'clickRate',         strategy: 'avg'     }, // I
  { index: 9,  name: '3S完播率',          field: 'playRate3s',        strategy: 'avg'     }, // J
  { index: 10, name: '完播率',            field: 'playRate',          strategy: 'avg'     }, // K
  { index: 11, name: '转化率',            field: 'conversionRate',    strategy: 'avg'     }, // L
  { index: 12, name: '平均展示消耗',      field: '_recalc',           strategy: 'recalc', recalcFormula: '总成本÷总展示数' }, // M
  { index: 13, name: '点击数',            field: 'clicks',            strategy: 'sum'     }, // N
  { index: 14, name: '平均点击消耗',      field: '_recalc',           strategy: 'recalc', recalcFormula: '总成本÷总点击数' }, // O
  { index: 15, name: '获客数',            field: 'customers',         strategy: 'sum'     }, // P
  { index: 16, name: '低价课人数',        field: 'lowCourseCount',    strategy: 'sum'     }, // Q
  { index: 17, name: '落地页转化率',      field: 'landingConvRate',   strategy: 'avg'     }, // R
  { index: 18, name: '低价课流水',        field: 'lowCourseRevenue',  strategy: 'sum'     }, // S
  { index: 19, name: '公众号关注人数',    field: 'wechatFollowers',   strategy: 'sum'     }, // T
  { index: 20, name: '公众号关注率',      field: 'wechatFollowRate',  strategy: 'avg'     }, // U
  { index: 21, name: '激活人数',          field: 'activations',       strategy: 'sum'     }, // V
  { index: 22, name: '激活率',            field: 'activationRate',    strategy: 'avg'     }, // W
  { index: 23, name: '激活成本',          field: '_recalc',           strategy: 'recalc', recalcFormula: '总成本÷总激活人数' }, // X
  { index: 24, name: '添加人数',          field: 'additions',         strategy: 'sum'     }, // Y
  { index: 25, name: '添加率',            field: 'additionRate',      strategy: 'avg'     }, // Z
  { index: 26, name: '添加成本',          field: '_recalc',           strategy: 'recalc', recalcFormula: '总成本÷总添加人数' }, // AA
  { index: 27, name: '进群人数',          field: 'groupJoins',        strategy: 'sum'     }, // AB
  { index: 28, name: '进群率',            field: 'groupJoinRate',     strategy: 'avg'     }, // AC
  { index: 29, name: '第一天到播率',      field: 'day1PlayRate',      strategy: 'avg'     }, // AD
  { index: 30, name: '第二天到播率',      field: 'day2PlayRate',      strategy: 'avg'     }, // AE
  { index: 31, name: '第三天到播率',      field: 'day3PlayRate',      strategy: 'avg'     }, // AF
  { index: 32, name: '第四天到播率',      field: 'day4PlayRate',      strategy: 'avg'     }, // AG
  { index: 33, name: '第五天到播率',      field: 'day5PlayRate',      strategy: 'avg'     }, // AH
  { index: 34, name: '高沉浸用户数',      field: 'deepUsers',         strategy: 'sum'     }, // AI
  { index: 35, name: '高沉浸率',          field: 'deepRate',          strategy: 'avg'     }, // AJ
  { index: 36, name: '第三天高沉浸到播率', field: 'day3DeepPlayRate', strategy: 'avg'     }, // AK
  { index: 37, name: '第三天高沉浸转化率', field: 'day3DeepConvRate', strategy: 'avg'     }, // AL
  { index: 38, name: '高价课人数',        field: 'highCourseCount',   strategy: 'sum'     }, // AM
  { index: 39, name: '高价课支付率',      field: 'highCoursePayRate', strategy: 'avg'     }, // AN
  { index: 40, name: '第三天高价课人数',  field: 'day3HighCourse',    strategy: 'sum'     }, // AO
  { index: 41, name: '第四天高价课人数',  field: 'day4HighCourse',    strategy: 'sum'     }, // AP
  { index: 42, name: '第五天高价课人数',  field: 'day5HighCourse',    strategy: 'sum'     }, // AQ
  { index: 43, name: '高价课流水',        field: 'highCourseRevenue', strategy: 'sum'     }, // AR
  { index: 44, name: '退款人数',          field: 'refunds',           strategy: 'sum'     }, // AS
  { index: 45, name: '退款率',            field: 'refundRate',        strategy: 'avg'     }, // AT
  { index: 46, name: '获客占比',          field: '_ignore',           strategy: 'ignore'  }, // AU
  { index: 47, name: 'ROI',              field: '_recalc',           strategy: 'recalc', recalcFormula: '高价课流水÷总成本' }, // AV
]

// 必须校验的列名（前3列是关键列）
export const REQUIRED_COLUMNS = EXCEL_COLUMNS.slice(0, 3).map(c => c.name)

// 校验 EXCEL 表头行
export function validateHeaders(headers: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (headers.length < EXCEL_COLUMNS.length) {
    errors.push(`列数不足：期望 ${EXCEL_COLUMNS.length} 列，实际 ${headers.length} 列`)
    return { valid: false, errors }
  }

  for (const col of EXCEL_COLUMNS) {
    const actual = (headers[col.index] ?? '').toString().trim()
    if (actual !== col.name) {
      errors.push(`第${col.index + 1}列（${colIndexToLetter(col.index)}列）应为「${col.name}」，实际为「${actual}」`)
    }
  }

  return { valid: errors.length === 0, errors }
}

// 将0-based列索引转为 Excel 列字母（0→A, 26→AA）
function colIndexToLetter(index: number): string {
  let result = ''
  let n = index
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  }
  return result
}

// 解析一行数据为 ExcelRow 字段
export function parseRow(row: (string | number | null | undefined)[], rowIndex: number) {
  const num = (v: unknown) => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return isNaN(n) ? null : n
  }
  const str = (v: unknown) => (v === null || v === undefined ? null : String(v).trim() || null)

  return {
    rowIndex,
    materialName:      str(row[0])  ?? '',
    deliveryDate:      str(row[1]),
    channel:           str(row[2]),
    totalCost:         num(row[4]),
    impressions:       num(row[6]),
    clickRate:         num(row[8]),
    playRate3s:        num(row[9]),
    playRate:          num(row[10]),
    conversionRate:    num(row[11]),
    clicks:            num(row[13]),
    customers:         num(row[15]),
    lowCourseCount:    num(row[16]),
    landingConvRate:   num(row[17]),
    lowCourseRevenue:  num(row[18]),
    wechatFollowers:   num(row[19]),
    wechatFollowRate:  num(row[20]),
    activations:       num(row[21]),
    activationRate:    num(row[22]),
    additions:         num(row[24]),
    additionRate:      num(row[25]),
    groupJoins:        num(row[27]),
    groupJoinRate:     num(row[28]),
    day1PlayRate:      num(row[29]),
    day2PlayRate:      num(row[30]),
    day3PlayRate:      num(row[31]),
    day4PlayRate:      num(row[32]),
    day5PlayRate:      num(row[33]),
    deepUsers:         num(row[34]),
    deepRate:          num(row[35]),
    day3DeepPlayRate:  num(row[36]),
    day3DeepConvRate:  num(row[37]),
    highCourseCount:   num(row[38]),
    highCoursePayRate: num(row[39]),
    day3HighCourse:    num(row[40]),
    day4HighCourse:    num(row[41]),
    day5HighCourse:    num(row[42]),
    highCourseRevenue: num(row[43]),
    refunds:           num(row[44]),
    refundRate:        num(row[45]),
  }
}
