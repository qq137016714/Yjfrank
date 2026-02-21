'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, Download } from 'lucide-react'

type UploadStatus = 'idle' | 'selected' | 'uploading' | 'validating' | 'parsing' | 'done' | 'error'

interface TaskData {
  status: string
  progress: number
  total: number
  message: string
  error?: string
  rowCount?: number
}

interface ExcelUploaderProps {
  onUploadSuccess?: () => void
}

export default function ExcelUploader({ onUploadSuccess }: ExcelUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [period, setPeriod] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskData, setTaskData] = useState<TaskData | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // 轮询任务状态
  useEffect(() => {
    if (!taskId) return
    if (status === 'done' || status === 'error') return

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/excel/status?taskId=${taskId}`)
        const json = await res.json()
        if (!json.success) return

        const data: TaskData = json.data
        setTaskData(data)

        if (data.status === 'validating') setStatus('validating')
        else if (data.status === 'parsing') setStatus('parsing')
        else if (data.status === 'done') {
          setStatus('done')
          stopPolling()
          onUploadSuccess?.()
        } else if (data.status === 'error') {
          setStatus('error')
          stopPolling()
        }
      } catch {
        // 网络错误时继续轮询
      }
    }, 2000)

    return stopPolling
  }, [taskId, status, stopPolling, onUploadSuccess])

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext ?? '')) {
      alert('仅支持 .xlsx 或 .xls 格式')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      alert('文件大小不能超过 100MB')
      return
    }
    setSelectedFile(file)
    setStatus('selected')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile || !period.trim()) {
      alert('请填写数据期次')
      return
    }

    setStatus('uploading')
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('period', period.trim())

    try {
      // 使用 XMLHttpRequest 获取上传进度
      const result = await new Promise<{ taskId: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () => {
          const json = JSON.parse(xhr.responseText)
          if (json.success) resolve(json.data)
          else reject(new Error(json.message))
        }
        xhr.onerror = () => reject(new Error('网络错误'))
        xhr.open('POST', '/api/excel/upload')
        xhr.send(formData)
      })

      setTaskId(result.taskId)
      setStatus('validating')
    } catch (err) {
      setTaskData({ status: 'error', progress: 0, total: 0, message: '', error: err instanceof Error ? err.message : '上传失败' })
      setStatus('error')
    }
  }

  const handleReset = () => {
    stopPolling()
    setStatus('idle')
    setSelectedFile(null)
    setPeriod('')
    setUploadProgress(0)
    setTaskId(null)
    setTaskData(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* 模板下载 */}
      <div className="flex justify-end">
        <a
          href="/api/excel/template"
          download
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
        >
          <Download className="w-4 h-4" />
          下载标准模板
        </a>
      </div>

      {/* 上传区域 */}
      {status === 'idle' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">点击或拖拽 EXCEL 文件至此上传</p>
          <p className="text-gray-400 text-sm mt-1">支持 .xlsx .xls，最大 100MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
          />
        </div>
      )}

      {/* 文件已选择 */}
      {status === 'selected' && selectedFile && (
        <div className="border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatSize(selectedFile.size)}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              数据期次 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="如：2026-W08 或 第一期"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!period.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始上传
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 上传中 */}
      {status === 'uploading' && (
        <div className="border rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">正在上传文件...</span>
            <span className="ml-auto text-sm">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">请勿关闭页面</p>
        </div>
      )}

      {/* 验证中 */}
      {status === 'validating' && (
        <div className="border rounded-xl p-6 flex items-center gap-3 text-blue-600">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span className="font-medium">正在验证文件格式...</span>
        </div>
      )}

      {/* 解析中 */}
      {status === 'parsing' && taskData && (
        <div className="border rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">{taskData.message || '正在解析数据...'}</span>
          </div>
          {taskData.total > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((taskData.progress / taskData.total) * 100)}%` }}
              />
            </div>
          )}
          <p className="text-xs text-gray-500">请勿关闭页面</p>
        </div>
      )}

      {/* 成功 */}
      {status === 'done' && taskData && (
        <div className="border border-green-200 bg-green-50 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">数据上传成功！</span>
          </div>
          <p className="text-sm text-green-600">{taskData.message}</p>
          <button
            onClick={handleReset}
            className="text-sm text-green-700 underline hover:no-underline"
          >
            继续上传下一期
          </button>
        </div>
      )}

      {/* 失败 */}
      {status === 'error' && taskData && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">上传失败</span>
          </div>
          <p className="text-sm text-red-600">{taskData.error}</p>
          <button
            onClick={handleReset}
            className="text-sm text-red-700 underline hover:no-underline"
          >
            重新上传
          </button>
        </div>
      )}
    </div>
  )
}
