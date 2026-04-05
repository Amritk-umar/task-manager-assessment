import { NextRequest } from "next/server"
import { ok, created, err } from "@/lib/response"
import { AppError } from "@/lib/errors"
import * as userService from "@/services/userService"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const users = await userService.getAllUsers({
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  })
    return ok(users)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const user = await userService.createUser(body)
    return created(user)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}