/**
 * GET /api/db-seed
 *
 * One-time migration: copies all data from data/links.json into Neon PostgreSQL.
 * Run this once after setting DATABASE_URL in .env.local.
 *
 * Usage: curl http://localhost:7854/api/db-seed
 * Or visit the URL in your browser.
 */
import { NextResponse } from "next/server";
import { seedDatabaseFromFile } from "@/lib/store";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, message: "DATABASE_URL not configured." },
      { status: 400 }
    );
  }

  const result = await seedDatabaseFromFile();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
