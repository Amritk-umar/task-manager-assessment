import { db } from "@/lib/db"
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors"

// ── Types ──────────────────────────────────────────────────────────────────

interface CreateProjectInput {
    name: string
    description?: string
    ownerId: string
}

interface UpdateProjectInput {
    name?: string
    description?: string
}

// ── Service Methods ────────────────────────────────────────────────────────

export async function getAllProjects(filters: {
  ownerId?: string
  page?: number
  limit?: number
}) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 10
  const skip = (page - 1) * limit

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where: {
        ...(filters.ownerId && { ownerId: filters.ownerId }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.project.count({
      where: {
        ...(filters.ownerId && { ownerId: filters.ownerId }),
      },
    }),
  ])

  return {
    data: projects,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  }
}
export async function getProjectById(id: string) {
    const project = await db.project.findUnique({
        where: { id },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            tasks: {
                orderBy: { createdAt: "desc" },
                include: {
                    assignee: { select: { id: true, name: true } },
                },
            },
            _count: { select: { tasks: true } },
        },
    })
    if (!project) throw new NotFoundError("Project")
    return project
}

export async function createProject(input: CreateProjectInput) {
    // Validate required fields
    if (!input.name?.trim()) throw new ValidationError("name is required")
    if (!input.ownerId) throw new ValidationError("ownerId is required")

    // Guard: owner must exist
    const owner = await db.user.findUnique({ where: { id: input.ownerId } })
    if (!owner) throw new NotFoundError("Owner user")

    // Business rule: owner can't have two projects with the same name
    const duplicate = await db.project.findFirst({
        where: { ownerId: input.ownerId, name: { equals: input.name.trim(), mode: "insensitive" } },
    })
    if (duplicate) throw new ConflictError("You already have a project with this name")

    return db.project.create({
        data: {
            name: input.name.trim(),
            description: input.description?.trim(),
            ownerId: input.ownerId,
        },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { tasks: true } },
        },
    })
}

export async function updateProject(id: string, input: UpdateProjectInput) {
    const project = await db.project.findUnique({ where: { id } })
    if (!project) throw new NotFoundError("Project")

    // Business rule: if renaming, check for duplicate name under same owner
    if (input.name) {
        const duplicate = await db.project.findFirst({
            where: {
                ownerId: project.ownerId,
                name: { equals: input.name.trim(), mode: "insensitive" },
                NOT: { id },
            },
        })
        if (duplicate) throw new ConflictError("You already have a project with this name")
    }

    return db.project.update({
        where: { id },
        data: {
            ...(input.name && { name: input.name.trim() }),
            ...(input.description !== undefined && { description: input.description?.trim() }),
        },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { tasks: true } },
        },
    })
}

export async function deleteProject(id: string) {
    const project = await db.project.findUnique({
        where: { id },
        include: {
            tasks: { where: { status: { in: ["PENDING", "IN_PROGRESS"] } } },
        },
    })
    if (!project) throw new NotFoundError("Project")

    // Business rule: cannot delete a project with active tasks
    if (project.tasks.length > 0) {
        throw new ConflictError(
            `Cannot delete project with ${project.tasks.length} active task(s). Complete or cancel them first.`
        )
    }

    await db.project.delete({ where: { id } })
}

export async function getProjectStats(id: string) {
    const project = await db.project.findUnique({ where: { id } })
    if (!project) throw new NotFoundError("Project")

    const tasks = await db.task.groupBy({
        by: ["status"],
        where: { projectId: id },
        _count: { status: true },
    })

    // Shape into a clean summary object
    const stats: Record<string, number> = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, total: 0 }
    for (const row of tasks) {
        stats[row.status] = row._count.status
        stats.total += row._count.status
    }

    const completionRate = stats.total > 0
        ? Math.round((stats.COMPLETED / stats.total) * 100)
        : 0

    return { projectId: id, completionRate, ...stats }
}