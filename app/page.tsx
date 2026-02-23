"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/ui/Navbar"
import { BarChart3, FileText, Settings, ArrowRight } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) router.push("/login")
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!session) return null

  const isAdmin = session.user?.role === 'admin'

  const cards = [
    {
      href: '/dashboard',
      icon: BarChart3,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      title: '数据分析',
      desc: '查看脚本投放效果、渠道分析、成员绩效、素材类型等多维度数据',
    },
    {
      href: '/scripts',
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      title: '脚本管理',
      desc: '管理脚本库、批量导入、标签分类、父子迭代关系',
    },
    ...(isAdmin ? [{
      href: '/admin',
      icon: Settings,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      title: '管理后台',
      desc: '配置命名规则、屏蔽词、素材类型、用户管理、Excel 历史',
    }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            你好，{session.user?.username}
          </h1>
          <p className="mt-2 text-gray-500">Smart Director 数据分析平台 · v3.1</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map(card => {
            const Icon = card.icon
            return (
              <Link key={card.href} href={card.href}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.bg} mb-4`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  进入 <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">当前版本 v3.1</p>
            <p className="text-xs text-blue-600 mt-0.5">成员数据分析 · 分期筛选全覆盖 · 匹配逻辑优化</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isAdmin ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
            {isAdmin ? '管理员' : '编导'}
          </span>
        </div>
      </main>
    </div>
  )
}
