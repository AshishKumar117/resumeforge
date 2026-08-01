import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved the datasource URL out of schema.prisma and into this file.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL") ?? "postgresql://localhost:5432/resumeforge",
  },
});
