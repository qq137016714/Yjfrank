export interface ParsedScript {
  name: string
  frontContent: string
  midContent: string
  endContent: string
  frontTagNames: string[]
  midTagNames: string[]
  endTagNames: string[]
}

export interface ParseError {
  line: number
  content: string
  reason: string
}

export interface ParseResult {
  scripts: ParsedScript[]
  errors: ParseError[]
}

const LINE_RE = /^段落—(前贴|中段|尾贴)\s+内容标签—(.*?)\s+脚本名：(\S+)(?:\s+内容：(.*))?$/

type SegType = 'front' | 'mid' | 'end'

interface CurrentCtx {
  name: string
  seg: SegType
}

export function parseScriptText(text: string): ParseResult {
  const map = new Map<string, ParsedScript>()
  const errors: ParseError[] = []
  let ctx: CurrentCtx | null = null

  const lines = text.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()

    // Section headers reset context; blank lines are skipped but keep context
    if (/^===/.test(trimmed)) { ctx = null; continue }
    if (!trimmed) continue

    const m = trimmed.match(LINE_RE)
    if (m) {
      const [, segCN, tagStr, rawName, content = ''] = m
      const seg: SegType = segCN === '前贴' ? 'front' : segCN === '中段' ? 'mid' : 'end'
      const name = rawName.replace(/^\d+/, '')
      const tagNames = tagStr.split('、').map(t => t.trim()).filter(Boolean)

      if (!map.has(name)) {
        map.set(name, {
          name,
          frontContent: '', midContent: '', endContent: '',
          frontTagNames: [], midTagNames: [], endTagNames: [],
        })
      }
      const script = map.get(name)!

      if (seg === 'front') {
        script.frontContent = content
        script.frontTagNames = tagNames
      } else if (seg === 'mid') {
        script.midContent = content
        script.midTagNames = tagNames
      } else {
        script.endContent = content
        script.endTagNames = tagNames
      }

      ctx = { name, seg }
    } else {
      // Continuation line
      if (ctx) {
        const script = map.get(ctx.name)!
        if (ctx.seg === 'front') script.frontContent += '\n' + trimmed
        else if (ctx.seg === 'mid') script.midContent += '\n' + trimmed
        else script.endContent += '\n' + trimmed
      } else {
        errors.push({ line: i + 1, content: trimmed, reason: '无法解析，且无所属段落' })
      }
    }
  }

  return { scripts: Array.from(map.values()), errors }
}
