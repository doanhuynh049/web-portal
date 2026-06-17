/**
 * Data store for the Web Portal.
 *
 * When DATABASE_URL is set → reads/writes Neon PostgreSQL via Drizzle ORM.
 * When DATABASE_URL is absent → falls back to local JSON file (data/links.json).
 *
 * Both modes expose the same `readData()` / `writeData()` interface so all
 * Server Actions work unchanged regardless of the backend.
 */

import type { PortalData, Category, Link, Project, PortalSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

// ── ID / timestamp helpers ────────────────────────────────────────────────────

export function newId(): string {
  return Math.random().toString(16).slice(2, 10);
}

export function now(): string {
  return new Date().toISOString();
}

// ── JSON parsing helpers ──────────────────────────────────────────────────────

function parseArr(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

function stringifyArr(arr: string[]): string {
  return JSON.stringify(arr);
}

// ═════════════════════════════════════════════════════════════════════════════
// NEON BACKEND
// ═════════════════════════════════════════════════════════════════════════════

async function readFromNeon(): Promise<PortalData> {
  const { db, ensureTables } = await import("./db/index");
  const {
    portalCategories,
    portalLinks,
    portalProjects,
    portalSettings,
  } = await import("./db/schema");

  await ensureTables();
  if (!db) throw new Error("DB not initialized");

  const [cats, lnks, projs, settingsRows] = await Promise.all([
    db.select().from(portalCategories),
    db.select().from(portalLinks),
    db.select().from(portalProjects),
    db.select().from(portalSettings),
  ]);

  const settingsRow = settingsRows[0];

  const settings: PortalSettings = settingsRow
    ? {
        theme: settingsRow.theme as "dark" | "light" | "system",
        defaultView: settingsRow.defaultView as "links" | "projects",
        profile: {
          name: settingsRow.profileName,
          initial: settingsRow.profileInitial,
          avatarColor: settingsRow.profileAvatarColor,
          role: settingsRow.profileRole,
          avatarIcon: settingsRow.profileAvatarIcon ?? "",
        },
      }
    : DEFAULT_SETTINGS;

  const categories: Category[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    description: c.description ?? undefined,
    order: c.order,
  }));

  const links: Link[] = lnks.map((l) => ({
    id: l.id,
    title: l.title,
    url: l.url,
    categoryId: l.categoryId,
    linkType: l.linkType as Link["linkType"],
    purpose: l.purpose ?? "",
    usageGuide: l.usageGuide ?? "",
    knownIssues: l.knownIssues ?? "",
    tags: parseArr(l.tags),
    status: (l.status as Link["status"]) ?? "unchecked",
    lastCheckedAt: l.lastCheckedAt ?? undefined,
    pinned: l.pinned,
    lastOpenedAt: l.lastOpenedAt ?? undefined,
    projectId: l.projectId ?? undefined,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  }));

  const projects: Project[] = projs.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    categoryId: p.categoryId,
    linkIds: parseArr(p.linkIds),
    techStack: parseArr(p.techStack),
    backlog: parseArr(p.backlog),
    devNotes: p.devNotes ?? "",
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  return { categories, links, projects, settings, version: settingsRow?.version ?? 2 };
}

async function writeToNeon(data: PortalData): Promise<void> {
  const { db, ensureTables } = await import("./db/index");
  const {
    portalCategories,
    portalLinks,
    portalProjects,
    portalSettings,
  } = await import("./db/schema");
  const { eq, notInArray, sql: drizzleSql } = await import("drizzle-orm");

  await ensureTables();
  if (!db) throw new Error("DB not initialized");
  const database = db;

  // Helper: delete rows whose IDs are no longer present
  async function pruneDeleted<T extends { id: string }>(
    table: typeof portalCategories | typeof portalLinks | typeof portalProjects,
    items: T[]
  ) {
    if (items.length === 0) {
      await database.delete(table).execute();
    } else {
      await database
        .delete(table)
        .where(notInArray(table.id as Parameters<typeof notInArray>[0], items.map((i) => i.id)));
    }
  }

  // ── Categories ──
  if (data.categories.length > 0) {
    await db
      .insert(portalCategories)
      .values(
        data.categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          description: c.description ?? null,
          order: c.order,
        }))
      )
      .onConflictDoUpdate({
        target: portalCategories.id,
        set: {
          name: drizzleSql`excluded.name`,
          color: drizzleSql`excluded.color`,
          description: drizzleSql`excluded.description`,
          order: drizzleSql`excluded.order`,
        },
      });
  }
  await pruneDeleted(portalCategories, data.categories);

  // ── Links ──
  if (data.links.length > 0) {
    await db
      .insert(portalLinks)
      .values(
        data.links.map((l) => ({
          id: l.id,
          title: l.title,
          url: l.url,
          categoryId: l.categoryId,
          linkType: l.linkType,
          purpose: l.purpose ?? "",
          usageGuide: l.usageGuide ?? "",
          knownIssues: l.knownIssues ?? "",
          tags: stringifyArr(l.tags),
          status: l.status,
          lastCheckedAt: l.lastCheckedAt ?? null,
          pinned: l.pinned,
          lastOpenedAt: l.lastOpenedAt ?? null,
          projectId: l.projectId ?? null,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
        }))
      )
      .onConflictDoUpdate({
        target: portalLinks.id,
        set: {
          title: drizzleSql`excluded.title`,
          url: drizzleSql`excluded.url`,
          categoryId: drizzleSql`excluded.category_id`,
          linkType: drizzleSql`excluded.link_type`,
          purpose: drizzleSql`excluded.purpose`,
          usageGuide: drizzleSql`excluded.usage_guide`,
          knownIssues: drizzleSql`excluded.known_issues`,
          tags: drizzleSql`excluded.tags`,
          status: drizzleSql`excluded.status`,
          lastCheckedAt: drizzleSql`excluded.last_checked_at`,
          pinned: drizzleSql`excluded.pinned`,
          lastOpenedAt: drizzleSql`excluded.last_opened_at`,
          projectId: drizzleSql`excluded.project_id`,
          updatedAt: drizzleSql`excluded.updated_at`,
        },
      });
  }
  await pruneDeleted(portalLinks, data.links);

  // ── Projects ──
  if (data.projects.length > 0) {
    await db
      .insert(portalProjects)
      .values(
        data.projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? "",
          categoryId: p.categoryId,
          linkIds: stringifyArr(p.linkIds),
          techStack: stringifyArr(p.techStack),
          backlog: stringifyArr(p.backlog),
          devNotes: p.devNotes ?? "",
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }))
      )
      .onConflictDoUpdate({
        target: portalProjects.id,
        set: {
          name: drizzleSql`excluded.name`,
          description: drizzleSql`excluded.description`,
          categoryId: drizzleSql`excluded.category_id`,
          linkIds: drizzleSql`excluded.link_ids`,
          techStack: drizzleSql`excluded.tech_stack`,
          backlog: drizzleSql`excluded.backlog`,
          devNotes: drizzleSql`excluded.dev_notes`,
          updatedAt: drizzleSql`excluded.updated_at`,
        },
      });
  }
  await pruneDeleted(portalProjects, data.projects);

  // ── Settings (upsert single row id=1) ──
  const s = data.settings;
  await db
    .insert(portalSettings)
    .values({
      id: 1,
      theme: s.theme,
      defaultView: s.defaultView,
      profileName: s.profile.name,
      profileInitial: s.profile.initial,
      profileAvatarColor: s.profile.avatarColor,
      profileRole: s.profile.role,
      profileAvatarIcon: s.profile.avatarIcon ?? "",
      version: data.version,
    })
    .onConflictDoUpdate({
      target: portalSettings.id,
      set: {
        theme: drizzleSql`excluded.theme`,
        defaultView: drizzleSql`excluded.default_view`,
        profileName: drizzleSql`excluded.profile_name`,
        profileInitial: drizzleSql`excluded.profile_initial`,
        profileAvatarColor: drizzleSql`excluded.profile_avatar_color`,
        profileRole: drizzleSql`excluded.profile_role`,
        profileAvatarIcon: drizzleSql`excluded.profile_avatar_icon`,
        version: drizzleSql`excluded.version`,
      },
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// JSON FILE BACKEND (fallback when DATABASE_URL is not set)
// ═════════════════════════════════════════════════════════════════════════════

async function readFromFile(): Promise<PortalData> {
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  const { seedData } = await import("./seed-data");

  const DATA_FILE = path.join(process.cwd(), "data", "links.json");

  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw) as PortalData;
    return migrateJson(data);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await writeToFile(seedData);
      return seedData;
    }
    throw err;
  }
}

async function writeToFile(data: PortalData): Promise<void> {
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");

  const DATA_FILE = path.join(process.cwd(), "data", "links.json");
  const TEMP_FILE = DATA_FILE + ".tmp";

  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(TEMP_FILE, json, "utf-8");
  await fs.rename(TEMP_FILE, DATA_FILE);
}

function migrateJson(data: PortalData): PortalData {
  if (!data.settings) {
    data = { ...data, settings: DEFAULT_SETTINGS, version: 2 };
  }
  data = {
    ...data,
    projects: data.projects.map((p) =>
      p.devNotes !== undefined ? p : { ...p, devNotes: "" }
    ),
  };
  return data;
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API — same interface regardless of backend
// ═════════════════════════════════════════════════════════════════════════════

const USE_DB = !!process.env.DATABASE_URL;

// ── Circuit breaker: skip Neon for CIRCUIT_RESET_MS after a failure ──────────
const CIRCUIT_RESET_MS = 60_000; // 1 minute
let neonLastFailure: number | null = null;

function neonCircuitOpen(): boolean {
  if (neonLastFailure === null) return false;
  return Date.now() - neonLastFailure < CIRCUIT_RESET_MS;
}

export async function readData(): Promise<PortalData> {
  if (USE_DB && !neonCircuitOpen()) {
    try {
      return await readFromNeon();
    } catch (err) {
      neonLastFailure = Date.now();
      console.warn("[web-portal] Neon DB read failed, falling back to JSON file:", (err as Error).message);
    }
  }
  return readFromFile();
}

export async function writeData(data: PortalData): Promise<void> {
  if (USE_DB && !neonCircuitOpen()) {
    try {
      await writeToNeon(data);
      return;
    } catch (err) {
      neonLastFailure = Date.now();
      console.warn("[web-portal] Neon DB write failed, falling back to JSON file:", (err as Error).message);
    }
  }
  return writeToFile(data);
}

/**
 * Seed the Neon database from the current data/links.json.
 * Run once after setting DATABASE_URL to migrate your local data to the cloud.
 * Called by the /api/db-seed route (see src/app/api/db-seed/route.ts).
 */
export async function seedDatabaseFromFile(): Promise<{ ok: boolean; message: string }> {
  try {
    const data = await readFromFile();
    await writeToNeon(data);
    return { ok: true, message: `Seeded ${data.links.length} links, ${data.projects.length} projects, ${data.categories.length} categories.` };
  } catch (err) {
    return { ok: false, message: String(err) };
  }
}
