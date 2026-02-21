'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

interface Upload {
  id: string
  filename: string
  period: string
  createdAt: string
  status: string
}

interface PeriodSelectorProps {
  value: string | null          // null = all data
  onChange: (uploadId: string | null) => void
  refreshTrigger?: number
}

export default function PeriodSelector({ value, onChange, refreshTrigger }: PeriodSelectorProps) {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/excel/history')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          // ascending order: oldest = 第1期
          const sorted = [...json.data].filter((u: Upload) => u.status === 'done').reverse()
          setUploads(sorted)
        }
      })
  }, [refreshTrigger])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = value ? uploads.find(u => u.id === value) : null
  const selectedIndex = value ? uploads.findIndex(u => u.id === value) : -1

  const filtered = uploads.filter(u =>
    !search ||
    u.period.toLowerCase().includes(search.toLowerCase()) ||
    u.filename.toLowerCase().includes(search.toLowerCase()) ||
    String(uploads.indexOf(u) + 1).includes(search)
  )

  const label = selected
    ? `第 ${selectedIndex + 1} 期 · ${selected.period}`
    : '全部数据'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
          value ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
        }`}
      >
        <span className="font-medium">{label}</span>
        {value && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange(null); setSearch('') }}
            className="text-blue-400 hover:text-blue-600"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-72">
          {/* 搜索框 */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索期次或文件名..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto">
            {/* 全部数据选项 */}
            {!search && (
              <button
                onClick={() => { onChange(null); setOpen(false); setSearch('') }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-blue-50 transition-colors ${
                  !value ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'
                }`}
              >
                <span>全部数据</span>
                {!value && <span className="text-xs text-blue-400">当前</span>}
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">无匹配期次</div>
            ) : (
              filtered.map((u, idx) => {
                const periodNum = uploads.indexOf(u) + 1
                const isSelected = value === u.id
                return (
                  <button
                    key={u.id}
                    onClick={() => { onChange(u.id); setOpen(false); setSearch('') }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                      isSelected ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">第 {periodNum} 期</span>
                      <span className={`text-xs ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}>{u.period}</span>
                    </div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{u.filename}</div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
