import { db } from "@/lib/db"
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors"
import { Priority, TaskStatus } from "@prisma/client"

// ── Types ──────────────────────────────────────────────────────────────────

interface CreateTaskInput {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  projectId: string
  assigneeId?: string
}

interface UpdateTaskInput {
  title?: string
  description?: string
  priority?: Priority
  status?: TaskStatus
  dueDate?: string
  assigneeId?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function validateDueDate(dueDate: string) {
  const date = new Date(dueDate)
  if (isNaN(date.getTime())) throw new ValidationError("Invalid dueDate format")
  if (date <= new Date()) throw new ValidationError("dueDate must be in the future")
  return date
}

// ── Service Methods ────────────────────────────────────────────────────────

export async function getAllTasks(filters: {
  status?: TaskStatus
  priority?: Priority
  projectId?: string
  page?: number
  limit?: number
  includeDeleted?: boolean
}) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 10
  const skip = (page - 1) * limit

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.projectId && { projectId: filters.projectId }),
        deletedAt: filters.includeDeleted ? undefined : null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.task.count({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
    }),
  ])

  return {
    data: tasks,
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
export async function getTaskById(id: string) {
  const task = await db.task.findUnique({
    where: { id },
    include: { assignee: { select: { id: true, name: true, email: true } }, project: { select: { id: true, name: true } } },
  })
  if (!task || task.deletedAt) throw new NotFoundError("Task")
  return task
}

export async function createTask(input: CreateTaskInput) {
  // Validate required fields
  if (!input.title?.trim()) throw new ValidationError("title is required")
  if (!input.projectId) throw new ValidationError("projectId is required")

  // Guard: project must exist
  const project = await db.project.findUnique({ where: { id: input.projectId } })
  if (!project) throw new NotFoundError("Project")

  // Guard: assignee must exist if provided
  if (input.assigneeId) {
    const user = await db.user.findUnique({ where: { id: input.assigneeId } })
    if (!user) throw new NotFoundError("Assignee user")
  }

  const dueDate = input.dueDate ? validateDueDate(input.dueDate) : undefined

  return db.task.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim(),
      priority: input.priority ?? "MEDIUM",
      dueDate,
      projectId: input.projectId,
      assigneeId: input.assigneeId,
    },
    include: { assignee: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
  })
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const task = await db.task.findUnique({ where: { id } })
  if (!task || task.deletedAt) throw new NotFoundError("Task")

  // Guard: can't update a completed/cancelled task
  if (task.status === "COMPLETED" || task.status === "CANCELLED") {
    throw new ConflictError(`Cannot update a ${task.status.toLowerCase()} task`)
  }

  if (input.assigneeId) {
    const user = await db.user.findUnique({ where: { id: input.assigneeId } })
    if (!user) throw new NotFoundError("Assignee user")
  }

  const dueDate = input.dueDate ? validateDueDate(input.dueDate) : undefined

  return db.task.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.priority && { priority: input.priority }),
      ...(input.status && { status: input.status }),
      ...(dueDate && { dueDate }),
      ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
    },
    include: { assignee: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
  })
}

export async function completeTask(id: string) {
  const task = await db.task.findUnique({ where: { id } })
  if (!task || task.deletedAt) throw new NotFoundError("Task")

  // Business rule: only PENDING or IN_PROGRESS tasks can be completed
  if (!["PENDING", "IN_PROGRESS"].includes(task.status)) {
    throw new ConflictError(`Cannot complete a task that is already ${task.status.toLowerCase()}`)
  }

  return db.task.update({
    where: { id },
    data: { status: "COMPLETED" },
  })
}

export async function deleteTask(id: string) {
  const task = await db.task.findUnique({ where: { id } })
  if (!task || task.deletedAt) throw new NotFoundError("Task")

  await db.task.delete({ where: { id } })
}

export async function restoreTask(id: string) {
  const task = await db.task.findUnique({ where: { id } })
  if (!task) throw new NotFoundError("Task")
  if (!task.deletedAt) throw new ConflictError("Task is not deleted")

  return db.task.update({
    where: { id },
    data: { deletedAt: null },
  })
}