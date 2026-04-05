import { db } from "@/lib/db"
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors"

// ── Types ──────────────────────────────────────────────────────────────────

interface CreateUserInput {
  name: string
  email: string
}

interface UpdateUserInput {
  name?: string
  email?: string
}

// ── Service Methods ────────────────────────────────────────────────────────

export async function getAllUsers(filters: {
  page?: number
  limit?: number
} = {}) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 10
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    db.user.findMany({
      include: {
        _count: { select: { projects: true, tasks: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.user.count(),
  ])

  return {
    data: users,
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

export async function getUserById(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      projects: {
        include: { _count: { select: { tasks: true } } },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { dueDate: "asc" },
      },
      _count: { select: { projects: true, tasks: true } },
    },
  })
  if (!user) throw new NotFoundError("User")
  return user
}

export async function createUser(input: CreateUserInput) {
  // Validate required fields
  if (!input.name?.trim()) throw new ValidationError("name is required")
  if (!input.email?.trim()) throw new ValidationError("email is required")

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(input.email)) throw new ValidationError("Invalid email format")

  // Business rule: email must be unique
  const existing = await db.user.findUnique({ where: { email: input.email.toLowerCase() } })
  if (existing) throw new ConflictError("A user with this email already exists")

  return db.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
    },
  })
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const user = await db.user.findUnique({ where: { id } })
  if (!user) throw new NotFoundError("User")

  // If changing email, validate and check uniqueness
  if (input.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.email)) throw new ValidationError("Invalid email format")

    const existing = await db.user.findUnique({ where: { email: input.email.toLowerCase() } })
    if (existing && existing.id !== id) throw new ConflictError("A user with this email already exists")
  }

  return db.user.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name.trim() }),
      ...(input.email && { email: input.email.toLowerCase().trim() }),
    },
    include: {
      _count: { select: { projects: true, tasks: true } },
    },
  })
}

export async function deleteUser(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      projects: { where: { } },
      tasks: { where: { status: { in: ["PENDING", "IN_PROGRESS"] } } },
    },
  })
  if (!user) throw new NotFoundError("User")

  // Business rule: can't delete a user who owns projects
  if (user.projects.length > 0) {
    throw new ConflictError(
      `Cannot delete user who owns ${user.projects.length} project(s). Reassign or delete them first.`
    )
  }

  // Business rule: can't delete a user with active task assignments
  if (user.tasks.length > 0) {
    throw new ConflictError(
      `Cannot delete user assigned to ${user.tasks.length} active task(s). Unassign them first.`
    )
  }

  await db.user.delete({ where: { id } })
}