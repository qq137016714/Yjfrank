'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'

type Tab = 'users' | 'keywords' | 'blockWords' | 'contentTypes' | 'excel'

interface UserRow { id: string; username: string; role: string; isLocked: boolean; createdAt: string }
interface Keyword { id: string; type: string; char: string; name: string }
interface ExcelUpload { id: string; filename: string; period: string; rowCount: number; uploadedBy: string; createdAt: string; status: string }

const KEYWORD_TYPES = ['EDITOR', 'CUTTER', 'INVESTOR', 'ACTOR', 'PROJECT']
const KEYWORD_TYPE_LABELS: Record<string, string> = {
  EDITOR: '编导', CUTTER: '剪辑', INVESTOR: '投手', ACTOR: '演员', PROJECT: '项目',
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('users')

  // Users state
  const [users, setUsers] = useState<UserRow[]>([])
  // Keywords state
  const [keywords, setKeywords] = useState<Record<string, Keyword[]>>({})
  const [newKw, setNewKw] = useState({ type: 'EDITOR', char: '', name: '' })
  // BlockWords state
  const [blockWords, setBlockWords] = useState<string[]>([])
  const [newBlockWord, setNewBlockWord] = useState('')
  // ContentTypes state
  const [contentTypes, setContentTypes] = useState<string[]>([])
  const [disabledContentTypes, setDisabledContentTypes] = useState<string[]>([])
  const [newContentType, setNewContentType] = useState('')
  const [scanningTypes, setScanningTypes] = useState(false)
  // Excel state
  const [excels, setExcels] = useState<ExcelUpload[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'admin') router.replace('/dashboard')
  }, [session, status, router])

  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    const json = await res.json()
    if (json.success) setUsers(json.data)
  }, [])

  const loadKeywords = useCallback(async () => {
    const res = await fetch('/api/admin/keywords')
    const json = await res.json()
    if (json.success) setKeywords(json.data)
  }, [])

  const loadSystemConfig = useCallback(async () => {
    const res = await fetch('/api/admin/system-config')
    const json = await res.json()
    if (json.success) {
      setBlockWords(json.data.blockWords ?? [])
      setContentTypes(json.data.contentTypes ?? [])
      setDisabledContentTypes(json.data.disabledContentTypes ?? [])
    }
  }, [])

  const loadExcels = useCallback(async () => {
    const res = await fetch('/api/excel/history')
    const json = await res.json()
    if (json.success) setExcels(json.data)
  }, [])

  useEffect(() => {
    if (tab === 'users') loadUsers()
    else if (tab === 'keywords') loadKeywords()
    else if (tab === 'blockWords' || tab === 'contentTypes') loadSystemConfig()
    else if (tab === 'excel') loadExcels()
  }, [tab, loadUsers, loadKeywords, loadSystemConfig, loadExcels])

  if (status === 'loading' || !session || session.user?.role !== 'admin') return null

  // ── Users ──────────────────────────────────────────────────────────────────
  const toggleLock = async (userId: string, isLocked: boolean) => {
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isLocked }),
    })
    loadUsers()
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('确认删除该用户？')) return
    await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
    loadUsers()
  }

  // ── Keywords ───────────────────────────────────────────────────────────────
  const addKeyword = async () => {
    if (!newKw.char || !newKw.name) return
    await fetch('/api/admin/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newKw),
    })
    setNewKw(prev => ({ ...prev, char: '', name: '' }))
    loadKeywords()
  }

  const deleteKeyword = async (id: string) => {
    await fetch(`/api/admin/keywords?id=${id}`, { method: 'DELETE' })
    loadKeywords()
  }

  // ── SystemConfig helpers ───────────────────────────────────────────────────
  const saveConfig = async (key: string, value: string[]) => {
    setSaving(true)
    await fetch('/api/admin/system-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setSaving(false)
  }

  const scanContentTypes = async () => {
    setScanningTypes(true)
    try {
      const res = await fetch('/api/admin/scan-content-types', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        await loadSystemConfig()
        if (json.data.added > 0) {
          alert(`扫描完成！新增 ${json.data.added} 个类型：${json.data.types.join(', ')}`)
        } else {
          alert('扫描完成！未发现新类型')
        }
      } else {
        alert('扫描失败：' + json.error)
      }
    } catch (error) {
      alert('扫描失败：' + error)
    } finally {
      setScanningTypes(false)
    }
  }

  // ── Excel ──────────────────────────────────────────────────────────────────
  const deleteExcel = async (id: string) => {
    if (!confirm('确认删除该上传记录？')) return
    await fetch(`/api/excel/history/${id}`, { method: 'DELETE' })
    loadExcels()
  }

  const TAB_LABELS: Record<Tab, string> = {
    users: '用户管理', keywords: '命名规则', blockWords: '屏蔽词', contentTypes: '素材类型', excel: 'Excel管理',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">管理后台</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b">
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                tab === t ? 'bg-white border border-b-white text-blue-700 -mb-px' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['用户名', '角色', '状态', '注册时间', '操作'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role === 'admin' ? '管理员' : '编辑'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {u.isLocked ? '已锁定' : '正常'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td className="px-4 py-3 flex gap-2">
                      {u.id !== session.user?.id && (
                        <>
                          <button
                            onClick={() => toggleLock(u.id, !u.isLocked)}
                            className="text-xs px-2 py-1 rounded border hover:bg-gray-100"
                          >
                            {u.isLocked ? '解锁' : '锁定'}
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            删除
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Keywords Tab */}
        {tab === 'keywords' && (
          <div className="space-y-6">
            {/* Add form */}
            <div className="bg-white rounded-lg shadow-sm border p-4 flex gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">类型</label>
                <select
                  value={newKw.type}
                  onChange={e => setNewKw(p => ({ ...p, type: e.target.value }))}
                  className="border rounded px-2 py-1.5 text-sm"
                >
                  {KEYWORD_TYPES.map(t => <option key={t} value={t}>{KEYWORD_TYPE_LABELS[t]}（{t}）</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">代号字符</label>
                <input
                  value={newKw.char}
                  onChange={e => setNewKw(p => ({ ...p, char: e.target.value }))}
                  placeholder="如：塔"
                  className="border rounded px-2 py-1.5 text-sm w-20"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">真实姓名</label>
                <input
                  value={newKw.name}
                  onChange={e => setNewKw(p => ({ ...p, name: e.target.value }))}
                  placeholder="如：波塔"
                  className="border rounded px-2 py-1.5 text-sm w-28"
                />
              </div>
              <button
                onClick={addKeyword}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                添加
              </button>
            </div>

            {/* Grouped list */}
            {KEYWORD_TYPES.map(type => (
              <div key={type} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b text-sm font-medium text-gray-700">
                  {KEYWORD_TYPE_LABELS[type]}（{type}）
                </div>
                {(keywords[type] ?? []).length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">暂无数据</p>
                ) : (
                  <div className="divide-y">
                    {(keywords[type] ?? []).map(kw => (
                      <div key={kw.id} className="px-4 py-2 flex items-center justify-between">
                        <span className="text-sm"><span className="font-mono bg-gray-100 px-1 rounded">{kw.char}</span> → {kw.name}</span>
                        <button
                          onClick={() => deleteKeyword(kw.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* BlockWords Tab */}
        {tab === 'blockWords' && (
          <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
            <div className="flex gap-2">
              <input
                value={newBlockWord}
                onChange={e => setNewBlockWord(e.target.value)}
                placeholder="输入屏蔽词，如：十一改"
                className="border rounded px-3 py-1.5 text-sm flex-1"
              />
              <button
                onClick={() => {
                  if (!newBlockWord.trim() || blockWords.includes(newBlockWord.trim())) return
                  setBlockWords(prev => [...prev, newBlockWord.trim()])
                  setNewBlockWord('')
                }}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blockWords.map(w => (
                <span key={w} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                  {w}
                  <button onClick={() => setBlockWords(prev => prev.filter(x => x !== w))} className="text-gray-400 hover:text-red-500 ml-1">×</button>
                </span>
              ))}
            </div>
            <button
              onClick={() => saveConfig('blockWords', blockWords)}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}

        {/* ContentTypes Tab */}
        {tab === 'contentTypes' && (
          <div className="space-y-4">
            {/* Add form and scan button */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  value={newContentType}
                  onChange={e => setNewContentType(e.target.value)}
                  placeholder="手动添加素材类型，如：直播"
                  className="border rounded px-3 py-1.5 text-sm flex-1"
                />
                <button
                  onClick={async () => {
                    const t = newContentType.trim()
                    if (!t || contentTypes.includes(t) || disabledContentTypes.includes(t)) return
                    const next = [...contentTypes, t]
                    setContentTypes(next)
                    setNewContentType('')
                    await saveConfig('contentTypes', next)
                  }}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={scanContentTypes}
                  disabled={scanningTypes}
                  className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {scanningTypes ? '扫描中...' : '扫描脚本库'}
                </button>
                <span className="text-xs text-gray-500 self-center">自动检测脚本名称后缀并添加为素材类型</span>
              </div>
            </div>

            {/* Enabled types */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-xs font-medium text-gray-500 mb-3">已启用（{contentTypes.length}）</p>
              {contentTypes.length === 0 ? (
                <p className="text-sm text-gray-400">暂无</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map(ct => (
                    <span key={ct} className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      {ct}
                      <button
                        onClick={async () => {
                          const nextEnabled = contentTypes.filter(x => x !== ct)
                          const nextDisabled = [...disabledContentTypes, ct]
                          setContentTypes(nextEnabled)
                          setDisabledContentTypes(nextDisabled)
                          await saveConfig('contentTypes', nextEnabled)
                          await saveConfig('disabledContentTypes', nextDisabled)
                        }}
                        className="text-xs text-blue-400 hover:text-orange-500 ml-1"
                        title="禁用"
                      >禁用</button>
                      <button
                        onClick={async () => {
                          const next = contentTypes.filter(x => x !== ct)
                          setContentTypes(next)
                          await saveConfig('contentTypes', next)
                        }}
                        className="text-gray-400 hover:text-red-500 ml-0.5"
                        title="删除"
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Disabled types */}
            {disabledContentTypes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <p className="text-xs font-medium text-gray-500 mb-3">已禁用（{disabledContentTypes.length}）</p>
                <div className="flex flex-wrap gap-2">
                  {disabledContentTypes.map(ct => (
                    <span key={ct} className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-sm text-gray-500">
                      {ct}
                      <button
                        onClick={async () => {
                          const nextDisabled = disabledContentTypes.filter(x => x !== ct)
                          const nextEnabled = [...contentTypes, ct]
                          setDisabledContentTypes(nextDisabled)
                          setContentTypes(nextEnabled)
                          await saveConfig('disabledContentTypes', nextDisabled)
                          await saveConfig('contentTypes', nextEnabled)
                        }}
                        className="text-xs text-gray-400 hover:text-green-600 ml-1"
                        title="启用"
                      >启用</button>
                      <button
                        onClick={async () => {
                          const next = disabledContentTypes.filter(x => x !== ct)
                          setDisabledContentTypes(next)
                          await saveConfig('disabledContentTypes', next)
                        }}
                        className="text-gray-400 hover:text-red-500 ml-0.5"
                        title="删除"
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Excel Tab */}
        {tab === 'excel' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['文件名', '期次', '行数', '上传者', '状态', '时间', '操作'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excels.map(e => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 max-w-xs truncate" title={e.filename}>{e.filename}</td>
                    <td className="px-4 py-3">{e.period}</td>
                    <td className="px-4 py-3">{e.rowCount}</td>
                    <td className="px-4 py-3">{e.uploadedBy}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${e.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(e.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteExcel(e.id)}
                        className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
