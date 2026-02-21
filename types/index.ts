// 全项目共用类型定义 - 只有架构Agent维护，其他Agent只读

export type UserRole = 'admin' | 'editor'

export interface User {
  id: string
  username: string
  role: UserRole
  isLocked: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  id: string
  username: string
  role: UserRole
}

// API 统一响应结构
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: string
}

// 登录失败锁定相关
export interface LoginAttemptResult {
  success: boolean
  isLocked: boolean
  remainingAttempts?: number
  lockedUntil?: Date
}

// 表单相关类型
export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  confirmPassword: string
}

export interface FormState {
  isLoading: boolean
  error: string | null
}

// 数据分析相关类型（为后续版本预留）
export interface DataFile {
  id: string
  filename: string
  uploadedAt: Date
  userId: string
  status: 'processing' | 'completed' | 'error'
}

export interface AnalysisResult {
  id: string
  fileId: string
  results: Record<string, any>
  createdAt: Date
}

// 脚本管理相关类型（为后续版本预留）
export interface Script {
  id: string
  name: string
  content: string
  userId: string
  createdAt: Date
  updatedAt: Date
}
