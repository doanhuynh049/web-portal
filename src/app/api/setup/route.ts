/**
 * GET /api/setup
 *
 * One-time setup endpoint that:
 *   1. Creates the seed user (quocthien049@gmail.com) if not already present.
 *   2. Seeds all portal data (links.json) to the Neon database if a DATABASE_URL
 *      is configured and the DB is reachable.
 *
 * Safe to call multiple times — all operations are idempotent.
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, generateUserId, userExists } from "@/lib/auth/user-store";

const SEED_USER = {
  email: "quocthien049@gmail.com",
  password: "doanhuynh0409",
  name: "Quoc Thien",
};

export async function GET() {
  const results: Record<string, string> = {};

  // ── 1. Create seed user ────────────────────────────────────────────────────
  try {
    const already = await userExists(SEED_USER.email);
    if (already) {
      results.user = `already exists (${SEED_USER.email})`;
    } else {
      const passwordHash = await bcrypt.hash(SEED_USER.password, 12);
      await createUser({
        id: generateUserId(),
        email: SEED_USER.email,
        passwordHash,
        name: SEED_USER.name,
        createdAt: new Date().toISOString(),
      });
      results.user = `created (${SEED_USER.email})`;
    }
  } catch (err) {
    results.user = `error: ${(err as Error).message}`;
  }

  // ── 2. Seed portal data to Neon ────────────────────────────────────────────
  if (!process.env.DATABASE_URL) {
    results.data = "skipped — no DATABASE_URL configured";
  } else {
    try {
      const { seedDatabaseFromFile } = await import("@/lib/store");
      await seedDatabaseFromFile();
      results.data = "seeded successfully";
    } catch (err) {
      results.data = `error: ${(err as Error).message}`;
    }
  }

  return NextResponse.json({ ok: true, results });
}
