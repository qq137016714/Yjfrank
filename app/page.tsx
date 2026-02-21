"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Navbar from "@/components/ui/Navbar"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // 还在加载中

    if (!session) {
      router.push("/login")
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!session) {
    return null // 正在重定向到登录页
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                欢迎使用 Smart Director 数据分析平台
              </h1>

              <p className="text-lg text-gray-600 mb-8">
                您已成功登录系统。当前版本：v0.1 - 基础架构与账号系统
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    数据分析
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    上传Excel文件进行数据分析和统计计算
                  </p>
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md cursor-not-allowed"
                  >
                    即将推出 (v0.2)
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    脚本管理
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    创建和管理数据处理脚本
                  </p>
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md cursor-not-allowed"
                  >
                    即将推出 (v1.1)
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    AI二创
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    基于AI的内容创作和优化
                  </p>
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md cursor-not-allowed"
                  >
                    即将推出 (v3.0)
                  </button>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  当前用户信息
                </h4>
                <p className="text-sm text-blue-700">
                  用户名: {session.user?.username} |
                  角色: {session.user?.role === 'admin' ? '管理员' : '编导'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
