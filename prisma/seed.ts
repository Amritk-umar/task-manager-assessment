import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  const user = await db.user.create({
    data: { name: "Alex Johnson", email: "alex@example.com" },
  })

  const project = await db.project.create({
    data: { name: "Website Redesign", description: "Q2 redesign project", ownerId: user.id },
  })

  await db.task.createMany({
    data: [
      { title: "Design mockups", status: "PENDING", priority: "HIGH", projectId: project.id, assigneeId: user.id, dueDate: new Date("2026-12-01") },
      { title: "Set up CI/CD", status: "IN_PROGRESS", priority: "MEDIUM", projectId: project.id, assigneeId: user.id, dueDate: new Date("2026-12-15") },
      { title: "Write unit tests", status: "PENDING", priority: "LOW", projectId: project.id, dueDate: new Date("2026-12-20") },
    ],
  })

  console.log("✅ Seeded successfully")
}

main().catch(console.error).finally(() => db.$disconnect())