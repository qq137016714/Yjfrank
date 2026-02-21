import NextAuth from "next-auth"
import type { UserRole } from "@/types"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: UserRole
    }
  }

  interface User {
    id: string
    username: string
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    role: UserRole
  }
}
