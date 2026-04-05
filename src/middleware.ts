import { NextRequest, NextResponse } from "next/server"
import { ratelimit } from "@/lib/ratelimit"

export async function middleware(req: NextRequest) {
  const { method, nextUrl } = req

  console.log(`→ ${method} ${nextUrl.pathname}`)

  if (["POST", "PATCH", "DELETE"].includes(method)) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
    const { success, limit, remaining, reset } = await ratelimit.limit(ip)

    console.log(`Rate limit — success: ${success}, remaining: ${remaining}`)

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      )
    }
  }

  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")

  return response
}

export const config = {
  matcher: "/api/:path*",
}