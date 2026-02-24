export interface MatchConfig {
  blockWords: string[]
  contentTypes: string[]
}

/**
 * 清洗素材名：移除文件扩展名、脏前缀、日期、改版标记等
 */
export function cleanMaterialName(materialName: string, blockWords: string[] = []): string {
  let name = materialName.trim()

  // 1. 移除文件扩展名
  name = name.replace(/\.(mp4|mov|avi|mkv)$/i, '')

  // 2. 移除 "代理-" 前缀
  name = name.replace(/^代理-/, '')

  // 3. 移除 "一键修复_" 前缀
  name = name.replace(/^一键修复_/, '')

  // 4. 移除末尾 "-xxx" 标记（如 -WJJ、-ABC 等大写字母组合）
  name = name.replace(/-[A-Z]{2,5}$/, '')

  // 5. 移除 5-6 位纯数字日期（如 60106、210601）
  name = name.replace(/^\d{5,6}/, '')

  // 6. 移除 blockWords 中的改版标记（如 "一改"、"二改"）
  for (const word of blockWords) {
    name = name.split(word).join('')
  }

  // 6.5 移除所有改版标记（兜底：改N / N改，支持阿拉伯数字和中文数字）
  name = name.replace(/改\d+|改[一二三四五六七八九十]+|\d+改|[一二三四五六七八九十]+改/g, '')

  // 7. 移除开头的非中文字符（字母、数字、符号）直到遇到第一个中文字符
  name = name.replace(/^[^\u4e00-\u9fa5]+/, '')

  return name.trim()
}

/**
 * 从清洗后的素材名末尾提取内容类型（如 "课程"、"才艺"、"干货"）
 */
export function extractContentType(cleanedName: string, contentTypes: string[]): string | null {
  const sorted = [...contentTypes].sort((a, b) => b.length - a.length)
  for (const ct of sorted) {
    if (cleanedName.endsWith(ct)) return ct
  }
  return null
}

/**
 * 有序子序列匹配：脚本名的每个字符按顺序出现在素材名中即视为匹配
 * 例：脚本名"威原塔威玉通课程" 可匹配 "威原塔威希玉通改二课程"（"希"被跳过，"改二"已被清洗）
 */
function isSubsequenceMatch(script: string, filename: string): boolean {
  let i = 0
  for (const char of filename) {
    if (i < script.length && char === script[i]) i++
    if (i === script.length) return true
  }
  return i === script.length
}

/**
 * 脚本名模糊匹配
 * 策略：清洗素材名后，判断脚本名是否为素材名的有序子序列
 */
export function matchScriptName(
  materialName: string,
  scriptName: string,
  config: MatchConfig = { blockWords: [], contentTypes: [] }
): boolean {
  if (!materialName || !scriptName) return false

  const cleaned = cleanMaterialName(materialName, config.blockWords)
  const searchIn = cleaned || materialName

  return isSubsequenceMatch(scriptName, searchIn)
}
