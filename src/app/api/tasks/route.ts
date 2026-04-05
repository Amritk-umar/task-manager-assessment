import { NextRequest } from "next/server"
import { ok, created, err } from "@/lib/response"
import { AppError } from "@/lib/errors"
import * as taskService from "@/services/taskService"
import { Priority, TaskStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const tasks = await taskService.getAllTasks({
      status: searchParams.get("status") as TaskStatus | null ?? undefined,
      priority: searchParams.get("priority") as Priority | null ?? undefined,
      projectId: searchParams.get("projectId") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      includeDeleted: searchParams.get("includeDeleted") === "true",
    })
    return ok(tasks)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const task = await taskService.createTask(body)
    return created(task)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}