import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicPaths = ["/login", "/register"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  if (req.auth && isPublic) {
    const homeUrl = new URL("/", req.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
