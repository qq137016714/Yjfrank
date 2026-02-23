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

  // 7. 移除开头的非中文字符（字母、数字、符号）直到遇到第一个中文字符
  name = name.replace(/^[^\u4e00-\u9fa5]+/, '')

  return name.trim()
}

/**
 * 从清洗后的素材名末尾提取内容类型（如 "课程"、"才艺"、"干货"）
 */
export function extractContentType(cleanedName: string, contentTypes: string[]): string | null {
  for (const ct of contentTypes) {
    if (cleanedName.endsWith(ct)) return ct
  }
  return null
}

/**
 * 脚本名模糊匹配
 * 策略：
 * 1. 清洗素材名
 * 2. 若清洗后长度 >= 8，尝试精确提取（取第7位之后，移除末尾 contentType，与 scriptName 精确比对）
 * 3. 精确提取失败时，回退到子串匹配（保留数字边界保护）
 */
export function matchScriptName(
  materialName: string,
  scriptName: string,
  config: MatchConfig = { blockWords: [], contentTypes: [] }
): boolean {
  if (!materialName || !scriptName) return false

  const cleaned = cleanMaterialName(materialName, config.blockWords)

  // 精确提取路径（清洗后长度 >= 8）
  if (cleaned.length >= 8) {
    let extracted = cleaned.slice(6) // 取第7位（index 6）之后的内容
    const ct = extractContentType(extracted, config.contentTypes)
    if (ct) extracted = extracted.slice(0, extracted.length - ct.length)
    extracted = extracted.trim()
    if (extracted && extracted === scriptName) return true
  }

  // 回退：子串匹配（在清洗后的名称中查找）
  const searchIn = cleaned || materialName
  const idx = searchIn.indexOf(scriptName)
  if (idx === -1) return false

  // 数字边界保护：脚本名后紧跟数字则不匹配
  const afterIdx = idx + scriptName.length
  if (afterIdx < searchIn.length && /\d/.test(searchIn[afterIdx])) return false

  return true
}
