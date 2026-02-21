/**
 * 脚本名模糊匹配
 * 规则：素材名包含脚本名即算匹配
 * 边界处理：脚本名后紧跟数字则不匹配（防止「脚本3」匹配「脚本30」）
 */
export function matchScriptName(materialName: string, scriptName: string): boolean {
  if (!materialName || !scriptName) return false

  const idx = materialName.indexOf(scriptName)
  if (idx === -1) return false

  // 检查脚本名结尾后的字符
  const afterIdx = idx + scriptName.length
  if (afterIdx < materialName.length) {
    const afterChar = materialName[afterIdx]
    // 若紧跟数字，则不匹配（边界保护）
    if (/\d/.test(afterChar)) return false
  }

  return true
}
