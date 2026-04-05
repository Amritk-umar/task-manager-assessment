import { NextRequest } from "next/server"
import { ok, noContent, err } from "@/lib/response"
import { AppError } from "@/lib/errors"
import * as userService from "@/services/userService"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await userService.getUserById(params.id)
    return ok(user)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json()
    const user = await userService.updateUser(params.id, body)
    return ok(user)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await userService.deleteUser(params.id)
    return noContent()
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}