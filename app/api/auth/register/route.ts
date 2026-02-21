import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { z } from "zod"
import type { ApiResponse } from "@/types"

const prisma = new PrismaClient()

const registerSchema = z.object({
  username: z.string().min(1, "用户名不能为空").max(50, "用户名不能超过50个字符"),
  password: z.string().min(6, "密码至少6位").max(100, "密码不能超过100个字符"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入数据
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.errors.map(err => err.message).join(", ")
      return NextResponse.json<ApiResponse>({
        success: false,
        message: errors
      }, { status: 400 })
    }

    const { username, password } = result.data

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "用户名已存在"
      }, { status: 409 })
    }

    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "editor" // 默认角色为编导
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "注册成功",
      data: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })

  } catch (error) {
    console.error("注册失败:", error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "服务器错误，请稍后重试"
    }, { status: 500 })
  }
}