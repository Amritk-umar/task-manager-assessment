import { NextRequest } from "next/server"
import { ok, err } from "@/lib/response"
import { AppError } from "@/lib/errors"
import * as projectService from "@/services/projectService"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const stats = await projectService.getProjectStats(params.id)
    return ok(stats)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}