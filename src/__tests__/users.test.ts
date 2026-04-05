import { createUser, getUserById, updateUser, deleteUser, getAllUsers } from "@/services/userService"
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors"
import { db } from "@/lib/db"

afterAll(async () => {
  await db.task.deleteMany({ where: { title: { startsWith: "Test" } } })
  await db.project.deleteMany({ where: { name: { startsWith: "Test" } } })
  await db.user.deleteMany({ where: { email: { contains: "test-" } } })
  await db.$disconnect()
})

describe("UserService", () => {

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const user = await createUser({
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
      })
      expect(user.name).toBe("Test User")
      expect(user.id).toBeDefined()
    })

    it("should throw ValidationError if name is missing", async () => {
      await expect(createUser({ name: "", email: "test@example.com" }))
        .rejects.toThrow(ValidationError)
    })

    it("should throw ValidationError for invalid email", async () => {
      await expect(createUser({ name: "Test", email: "not-an-email" }))
        .rejects.toThrow(ValidationError)
    })

    it("should throw ConflictError for duplicate email", async () => {
      const email = `test-dup-${Date.now()}@example.com`
      await createUser({ name: "Test User", email })
      await expect(createUser({ name: "Test User 2", email }))
        .rejects.toThrow(ConflictError)
    })
  })

  describe("getUserById", () => {
    it("should return a user by id", async () => {
      const created = await createUser({ name: "Test Fetch", email: `test-fetch-${Date.now()}@example.com` })
      const found = await getUserById(created.id)
      expect(found.id).toBe(created.id)
    })

    it("should throw NotFoundError for non-existent id", async () => {
      await expect(getUserById("non-existent-id"))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe("updateUser", () => {
    it("should update a user name", async () => {
      const user = await createUser({ name: "Test Update", email: `test-update-${Date.now()}@example.com` })
      const updated = await updateUser(user.id, { name: "Test Updated" })
      expect(updated.name).toBe("Test Updated")
    })

    it("should throw NotFoundError for non-existent id", async () => {
      await expect(updateUser("fake-id", { name: "New Name" }))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe("deleteUser", () => {
    it("should delete a user with no projects or tasks", async () => {
      const user = await createUser({ name: "Test Delete", email: `test-delete-${Date.now()}@example.com` })
      await expect(deleteUser(user.id)).resolves.not.toThrow()
    })

    it("should throw NotFoundError for non-existent id", async () => {
      await expect(deleteUser("fake-id"))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe("getAllUsers", () => {
    it("should return paginated users", async () => {
      const result = await getAllUsers({ page: 1, limit: 5 })
      expect(result.data).toBeDefined()
      expect(result.meta.limit).toBe(5)
      expect(result.meta.page).toBe(1)
    })
  })
})