/**
 * Drizzle Kit config — used by "npm run db:push" and "npm run db:studio".
 *
 * Note: drizzle-kit uses the postgres (ws) driver for introspection.
 * For the app itself, we use neon-http (no websockets needed).
 */
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
