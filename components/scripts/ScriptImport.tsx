'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Download, ChevronDown, ChevronUp, Loader2, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import type { ParsedScript, ParseError } from '@/lib/script-parser'

interface ParseWarnings {
  duplicateNames: string[]
  unknownTags: string[]
}

interface ParseResponse {
  scripts: ParsedScript[]
  errors: ParseError[]
  warnings: ParseWarnings
}

type Stage = 'upload' | 'preview' | 'done'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

const FORMAT_EXAMPLE = `=== 前贴 模块 ===
段落—前贴   内容标签—促销  脚本名：1脚本名称示例  内容：脚本前贴内容...

=== 中段 模块 ===
段落—中段   内容标签—发声技巧  脚本名：1脚本名称示例  内容：脚本中段内容...

=== 后贴 模块 ===
段落—尾贴   内容标签—收获引导  脚本名：1脚本名称示例  内容：脚本尾贴内容...`

export default function ScriptImport({ onClose, onSuccess }: Props) {
  const [stage, setStage] = useState<Stage>('upload')
  const [dragging, setDragging] = useState(false)
  const [showFormat, setShowFormat] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parseData, setParseData] = useState<ParseResponse | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/scripts/import/parse', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.success) { setError(json.message || '解析失败'); return }
      const data: ParseResponse = json.data
      setParseData(data)
      // Default: select all non-duplicate scripts
      const dupSet = new Set(data.warnings.duplicateNames)
      setSelected(new Set(data.scripts.filter(s => !dupSet.has(s.name)).map(s => s.name)))
      setStage('preview')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setUploading(false)
    }
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const toggleSelect = (name: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })

  const handleSave = async () => {
    if (!parseData) return
    setSaving(true)
    setError(null)
    const toSave = parseData.scripts.filter(s => selected.has(s.name))
    try {
      const res = await fetch('/api/scripts/import/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scripts: toSave }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.message || '保存失败'); return }
      setResult(json.data)
      setStage('done')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">批量导入脚本</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Stage: upload */}
          {stage === 'upload' && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}>
                {uploading
                  ? <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin" />
                  : <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />}
                <p className="text-sm text-gray-600 mt-1">拖拽文件到此处，或点击选择</p>
                <p className="text-xs text-gray-400 mt-1">支持 .txt 和 .docx 格式</p>
                <input ref={fileRef} type="file" accept=".txt,.docx" className="hidden" onChange={onFileChange} />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              {/* Format guide */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowFormat(!showFormat)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                  <span className="font-medium">格式说明</span>
                  {showFormat ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showFormat && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                    <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto text-gray-700 whitespace-pre-wrap">{FORMAT_EXAMPLE}</pre>
                    <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                      <li>每行一条脚本段落，格式严格按照示例</li>
                      <li>脚本名开头的数字会自动去除</li>
                      <li>多个标签用「、」分隔</li>
                      <li>同名脚本的前贴/中段/尾贴会自动合并</li>
                    </ul>
                    <a href="/script-template.txt" download
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700">
                      <Download className="w-3.5 h-3.5" />下载模板文件
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Stage: preview */}
          {stage === 'preview' && parseData && (() => {
            const dupSet = new Set(parseData.warnings.duplicateNames)
            return (
              <>
                {/* Summary row */}
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <span className="flex items-center gap-1.5 text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4" />解析成功 {parseData.scripts.length} 条
                  </span>
                  {parseData.errors.length > 0 && (
                    <span className="flex items-center gap-1.5 text-red-500">
                      <AlertCircle className="w-4 h-4" />{parseData.errors.length} 行无法解析
                    </span>
                  )}
                </div>

                {/* Warnings */}
                {parseData.warnings.duplicateNames.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                    <span className="font-medium flex items-center gap-1 mb-1"><AlertTriangle className="w-3.5 h-3.5" />重复脚本（已取消勾选，导入时将跳过）</span>
                    <p className="text-amber-600">{parseData.warnings.duplicateNames.join('、')}</p>
                  </div>
                )}
                {parseData.warnings.unknownTags.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                    <span className="font-medium flex items-center gap-1 mb-1"><AlertTriangle className="w-3.5 h-3.5" />未知标签（导入时将忽略）</span>
                    <p className="text-amber-600">{parseData.warnings.unknownTags.join('、')}</p>
                  </div>
                )}

                {/* Script list */}
                {parseData.scripts.length > 0 && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
                      <span>脚本列表（已勾选 {selected.size} 条）</span>
                      <div className="flex gap-2">
                        <button onClick={() => setSelected(new Set(parseData.scripts.filter(s => !dupSet.has(s.name)).map(s => s.name)))}
                          className="text-blue-500 hover:text-blue-700">全选非重复</button>
                        <button onClick={() => setSelected(new Set())} className="text-gray-400 hover:text-gray-600">取消全选</button>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
                      {parseData.scripts.map(s => (
                        <label key={s.name} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 ${dupSet.has(s.name) ? 'opacity-50' : ''}`}>
                          <input type="checkbox" checked={selected.has(s.name)} onChange={() => toggleSelect(s.name)}
                            className="rounded border-gray-300 text-blue-600" />
                          <span className="text-sm text-gray-800 flex-1 truncate">{s.name}</span>
                          {dupSet.has(s.name) && <span className="text-xs text-amber-500 shrink-0">已存在</span>}
                          <span className="text-xs text-gray-400 shrink-0">
                            {[s.frontContent && '前贴', s.midContent && '中段', s.endContent && '尾贴'].filter(Boolean).join('+')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error lines */}
                {parseData.errors.length > 0 && (
                  <div className="border border-red-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-600 font-medium">
                      无法解析的行（不影响其他脚本导入）
                    </div>
                    <div className="divide-y divide-red-100 max-h-36 overflow-y-auto">
                      {parseData.errors.map((e, i) => (
                        <div key={i} className="px-4 py-2 text-xs">
                          <span className="text-gray-400 mr-2">第 {e.line} 行</span>
                          <span className="text-red-600">{e.reason}</span>
                          <p className="text-gray-500 truncate mt-0.5">{e.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}
              </>
            )
          })()}

          {/* Stage: done */}
          {stage === 'done' && result && (
            <div className="text-center py-8 space-y-2">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <p className="text-base font-medium text-gray-900">导入完成</p>
              <p className="text-sm text-gray-500">
                成功导入 <span className="text-green-600 font-medium">{result.created}</span> 条，
                跳过 <span className="text-gray-400">{result.skipped}</span> 条
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
          {stage === 'upload' && (
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
          )}
          {stage === 'preview' && (
            <>
              <button onClick={() => { setStage('upload'); setParseData(null); setError(null) }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">重新上传</button>
              <button onClick={handleSave} disabled={saving || selected.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                确认导入 {selected.size} 条
              </button>
            </>
          )}
          {stage === 'done' && (
            <button onClick={() => { onSuccess(); onClose() }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
