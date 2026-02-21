import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import type { AuthUser } from "@/types"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string }
        })

        if (!user) {
          return null
        }

        // 检查账号是否被锁定
        if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("账号已被锁定，请稍后再试")
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          // 增加登录失败次数
          const newAttempts = user.loginAttempts + 1
          const shouldLock = newAttempts >= 5

          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: newAttempts,
              isLocked: shouldLock,
              lockedUntil: shouldLock ? new Date(Date.now() + 5 * 60 * 1000) : null // 锁定5分钟
            }
          })

          if (shouldLock) {
            throw new Error("登录失败次数过多，账号已被锁定5分钟")
          } else {
            throw new Error(`密码错误，还有 ${5 - newAttempts} 次机会`)
          }
        }

        // 登录成功，重置失败次数
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            isLocked: false,
            lockedUntil: null
          }
        })

        return {
          id: user.id,
          username: user.username,
          role: user.role as "admin" | "editor"
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as AuthUser).username
        token.role = (user as AuthUser).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.sub!,
          username: token.username as string,
          role: token.role as "admin" | "editor"
        } as unknown as typeof session.user
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  }
})