'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, FileSpreadsheet, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'

interface UploadRecord {
  id: string
  filename: string
  period: string
  rowCount: number
  uploadedBy: string
  status: string
  error?: string
  createdAt: string
}

interface UploadHistoryProps {
  isAdmin: boolean
  refreshTrigger?: number
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  done:       { label: '成功', color: 'text-green-600', icon: <CheckCircle className="w-4 h-4" /> },
  error:      { label: '失败', color: 'text-red-600',   icon: <XCircle className="w-4 h-4" /> },
  parsing:    { label: '解析中', color: 'text-blue-600', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  validating: { label: '验证中', color: 'text-blue-600', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  pending:    { label: '等待中', color: 'text-gray-500', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
}

export default function UploadHistory({ isAdmin, refreshTrigger }: UploadHistoryProps) {
  const [records, setRecords] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/excel/history')
      const json = await res.json()
      if (json.success) setRecords(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory, refreshTrigger])

  const handleDelete = async (id: string, period: string) => {
    if (!confirm(`确认删除「${period}」的数据？此操作不可恢复，相关原始数据将全部删除。`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/excel/history/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setRecords(prev => prev.filter(r => r.id !== id))
      } else {
        alert(json.message)
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        加载中...
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>暂无上传记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">共 {records.length} 期数据</span>
        <button onClick={fetchHistory} className="text-gray-400 hover:text-gray-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {records.map(record => {
        const s = STATUS_MAP[record.status] ?? { label: record.status, color: 'text-gray-500', icon: null }
        return (
          <div key={record.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
            <FileSpreadsheet className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">{record.period}</span>
                <span className={`flex items-center gap-1 text-xs ${s.color}`}>
                  {s.icon}{s.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">
                {record.filename} · {record.rowCount} 行 · {record.uploadedBy} ·{' '}
                {new Date(record.createdAt).toLocaleDateString('zh-CN')}
              </p>
              {record.error && (
                <p className="text-xs text-red-500 mt-0.5 truncate">{record.error}</p>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDelete(record.id, record.period)}
                disabled={deletingId === record.id}
                className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                title="删除此期数据"
              >
                {deletingId === record.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
