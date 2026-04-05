import { createTask, completeTask, updateTask, deleteTask } from "@/services/taskService"
import { createUser } from "@/services/userService"
import { createProject } from "@/services/projectService"
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors"
import { db } from "@/lib/db"

let userId: string
let projectId: string

beforeAll(async () => {
  const user = await createUser({ name: "Test Task User", email: `test-task-${Date.now()}@example.com` })
  const project = await createProject({ name: `Test Project ${Date.now()}`, ownerId: user.id })
  userId = user.id
  projectId = project.id
})

afterAll(async () => {
  await db.task.deleteMany({ where: { projectId } })
  await db.project.delete({ where: { id: projectId } })
  await db.user.delete({ where: { id: userId } })
  await db.$disconnect()
})

describe("TaskService", () => {

  describe("createTask", () => {
    it("should create a task successfully", async () => {
      const task = await createTask({
        title: "Test Task",
        projectId,
        assigneeId: userId,
        dueDate: "2026-12-01",
      })
      expect(task.title).toBe("Test Task")
      expect(task.status).toBe("PENDING")
    })

    it("should throw ValidationError if title is missing", async () => {
      await expect(createTask({ title: "", projectId }))
        .rejects.toThrow(ValidationError)
    })

    it("should throw NotFoundError for non-existent project", async () => {
      await expect(createTask({ title: "Test Task", projectId: "fake-id" }))
        .rejects.toThrow(NotFoundError)
    })

    it("should throw ValidationError for past dueDate", async () => {
      await expect(createTask({ title: "Test Task", projectId, dueDate: "2020-01-01" }))
        .rejects.toThrow(ValidationError)
    })
  })

  describe("completeTask", () => {
    it("should complete a PENDING task", async () => {
      const task = await createTask({ title: "Test Complete", projectId, dueDate: "2026-12-01" })
      const completed = await completeTask(task.id)
      expect(completed.status).toBe("COMPLETED")
    })

    it("should throw ConflictError when completing an already completed task", async () => {
      const task = await createTask({ title: "Test Complete 2", projectId, dueDate: "2026-12-01" })
      await completeTask(task.id)
      await expect(completeTask(task.id)).rejects.toThrow(ConflictError)
    })
  })

  describe("updateTask", () => {
    it("should update a task priority", async () => {
      const task = await createTask({ title: "Test Update Task", projectId, dueDate: "2026-12-01" })
      const updated = await updateTask(task.id, { priority: "HIGH" })
      expect(updated.priority).toBe("HIGH")
    })

    it("should throw ConflictError when updating a completed task", async () => {
      const task = await createTask({ title: "Test Update Completed", projectId, dueDate: "2026-12-01" })
      await completeTask(task.id)
      await expect(updateTask(task.id, { priority: "LOW" })).rejects.toThrow(ConflictError)
    })
  })

  describe("deleteTask", () => {
    it("should soft delete a task", async () => {
      const task = await createTask({ title: "Test Soft Delete", projectId, dueDate: "2026-12-01" })
      await expect(deleteTask(task.id)).resolves.not.toThrow()
    })

    it("should throw NotFoundError for non-existent task", async () => {
      await expect(deleteTask("fake-id")).rejects.toThrow(NotFoundError)
    })
  })
})