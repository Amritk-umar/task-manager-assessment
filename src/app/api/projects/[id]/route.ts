import { NextRequest } from "next/server"
import { ok, noContent, err } from "@/lib/response"
import { AppError } from "@/lib/errors"
import * as projectService from "@/services/projectService"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const project = await projectService.getProjectById(params.id)
    return ok(project)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json()
    const project = await projectService.updateProject(params.id, body)
    return ok(project)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await projectService.deleteProject(params.id)
    return noContent()
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}