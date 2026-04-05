import path from "path"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),
  // @ts-ignore - migrate is valid at runtime in Prisma 7.6 but missing from type definitions
  migrate: {
    async adapter() {
      const { PrismaNeon } = await import("@prisma/adapter-neon")
      return new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
    },
  },
})