import { NextRequest } from "next/server"
import { ok, noContent, err } from "@/lib/response"
import { AppError } from "@/lib/errors"
import * as taskService from "@/services/taskService"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const task = await taskService.getTaskById(params.id)
    return ok(task)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json()
    const task = await taskService.updateTask(params.id, body)
    return ok(task)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await taskService.deleteTask(params.id)
    return noContent()
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}