import { NextRequest } from "next/server"
import { ok, created, err } from "@/lib/response"
import { AppError } from "@/lib/errors"
import * as projectService from "@/services/projectService"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const projects = await projectService.getAllProjects({
      ownerId: searchParams.get("ownerId") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    })
    return ok(projects)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const project = await projectService.createProject(body)
    return created(project)
  } catch (e) {
    if (e instanceof AppError) return err(e.message, e.statusCode)
    return err("Internal server error", 500)
  }
}