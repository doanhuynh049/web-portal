/**
 * User store — reads/writes portal_users from Neon (when reachable) or
 * falls back to data/users.json for local development.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export interface PortalUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

// ── JSON file helpers ─────────────────────────────────────────────────────────

async function readLocalUsers(): Promise<PortalUser[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(raw) as PortalUser[];
  } catch {
    return [];
  }
}

async function writeLocalUsers(users: PortalUser[]): Promise<void> {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// ── Neon helpers ──────────────────────────────────────────────────────────────

async function neonFindByEmail(email: string): Promise<PortalUser | null> {
  try {
    const { db } = await import("@/lib/db/index");
    const { portalUsers } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    if (!db) return null;
    const rows = await db
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.email, email.toLowerCase().trim()));
    if (rows.length === 0) return null;
    const r = rows[0];
    return { id: r.id, email: r.email, passwordHash: r.passwordHash, name: r.name, createdAt: r.createdAt };
  } catch {
    return null;
  }
}

async function neonInsertUser(user: PortalUser): Promise<void> {
  const { db, ensureTables } = await import("@/lib/db/index");
  const { portalUsers } = await import("@/lib/db/schema");
  if (!db) throw new Error("DB not available");
  await ensureTables();
  await db.insert(portalUsers).values({
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    name: user.name,
    createdAt: user.createdAt,
  }).onConflictDoNothing();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<PortalUser | null> {
  const norm = email.toLowerCase().trim();

  // Try Neon first
  if (process.env.DATABASE_URL) {
    const dbUser = await neonFindByEmail(norm);
    if (dbUser) return dbUser;
  }

  // Fall back to local JSON
  const users = await readLocalUsers();
  return users.find((u) => u.email === norm) ?? null;
}

export async function createUser(user: PortalUser): Promise<void> {
  // Always write to local JSON (works offline)
  const users = await readLocalUsers();
  const exists = users.some((u) => u.email === user.email);
  if (!exists) {
    users.push(user);
    await writeLocalUsers(users);
  }

  // Also try Neon
  if (process.env.DATABASE_URL) {
    try {
      await neonInsertUser(user);
    } catch {
      // Neon might not be reachable — local file is the fallback
    }
  }
}

export async function userExists(email: string): Promise<boolean> {
  return (await findUserByEmail(email)) !== null;
}

export function generateUserId(): string {
  return Math.random().toString(16).slice(2, 18);
}
