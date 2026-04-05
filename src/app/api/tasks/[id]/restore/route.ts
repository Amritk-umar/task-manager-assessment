import { NextRequest } from "next/server"
import { ok, err } from "@/lib/response"
import { AppError } from "@/lib/errors"
import * as taskService from "@/services/taskService"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const task = await taskService.restoreTask(params.id)
    return ok(task)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}