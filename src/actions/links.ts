/**
 * Server Actions for the Web Portal.
 *
 * All functions run server-side (`"use server"` directive).
 * After mutations, `revalidatePath("/")` re-renders the page with fresh data.
 *
 * Modules:
 *  - Link CRUD (add, update, delete, togglePin, recordOpen)
 *  - Category CRUD + reorder
 *  - Project CRUD + devNotes update
 *  - Settings (theme, profile)
 */
"use server";

import { revalidatePath } from "next/cache";
import { readData, writeData, newId, now } from "@/lib/store";
import type {
  LinkInput,
  CategoryInput,
  ProjectInput,
  PortalSettings,
} from "@/lib/types";

// ── Link mutations ────────────────────────────────────────────────────────────

export async function addLink(input: LinkInput): Promise<void> {
  const data = await readData();
  data.links.push({ ...input, id: newId(), createdAt: now(), updatedAt: now() });
  await writeData(data);
  revalidatePath("/");
}

export async function updateLink(id: string, input: Partial<LinkInput>): Promise<void> {
  const data = await readData();
  const idx = data.links.findIndex((l) => l.id === id);
  if (idx === -1) return;
  data.links[idx] = { ...data.links[idx], ...input, updatedAt: now() };
  await writeData(data);
  revalidatePath("/");
}

export async function deleteLink(id: string): Promise<void> {
  const data = await readData();
  data.links = data.links.filter((l) => l.id !== id);
  data.projects = data.projects.map((p) => ({
    ...p,
    linkIds: p.linkIds.filter((lid) => lid !== id),
  }));
  await writeData(data);
  revalidatePath("/");
}

export async function togglePin(id: string): Promise<void> {
  const data = await readData();
  const idx = data.links.findIndex((l) => l.id === id);
  if (idx === -1) return;
  data.links[idx] = {
    ...data.links[idx],
    pinned: !data.links[idx].pinned,
    updatedAt: now(),
  };
  await writeData(data);
  revalidatePath("/");
}

/** Fire-and-forget: update lastOpenedAt without revalidating the page. */
export async function recordOpen(id: string): Promise<void> {
  const data = await readData();
  const idx = data.links.findIndex((l) => l.id === id);
  if (idx === -1) return;
  data.links[idx] = { ...data.links[idx], lastOpenedAt: now() };
  await writeData(data);
}

// ── Category mutations ────────────────────────────────────────────────────────

export async function addCategory(input: CategoryInput): Promise<void> {
  const data = await readData();
  // Assign next order value
  const maxOrder = data.categories.reduce((m, c) => Math.max(m, c.order), 0);
  data.categories.push({ ...input, id: newId(), order: input.order ?? maxOrder + 1 });
  await writeData(data);
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<void> {
  const data = await readData();
  const idx = data.categories.findIndex((c) => c.id === id);
  if (idx === -1) return;
  data.categories[idx] = { ...data.categories[idx], ...input };
  await writeData(data);
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function deleteCategory(id: string): Promise<void> {
  const data = await readData();
  data.categories = data.categories.filter((c) => c.id !== id);
  // Clear orphan categoryId references
  data.links = data.links.map((l) =>
    l.categoryId === id ? { ...l, categoryId: "" } : l
  );
  await writeData(data);
  revalidatePath("/");
  revalidatePath("/settings");
}

/**
 * Move a category one position up (lower order) or down (higher order).
 * Swaps the `order` values with its neighbor.
 */
export async function moveCategoryOrder(
  id: string,
  direction: "up" | "down"
): Promise<void> {
  const data = await readData();
  const sorted = [...data.categories].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((c) => c.id === id);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return;

  // Swap orders
  const a = sorted[idx];
  const b = sorted[swapIdx];
  const tempOrder = a.order;

  data.categories = data.categories.map((c) => {
    if (c.id === a.id) return { ...c, order: b.order };
    if (c.id === b.id) return { ...c, order: tempOrder };
    return c;
  });

  await writeData(data);
  revalidatePath("/");
  revalidatePath("/settings");
}

// ── Project mutations ─────────────────────────────────────────────────────────

export async function addProject(input: ProjectInput): Promise<void> {
  const data = await readData();
  data.projects.push({ ...input, id: newId(), createdAt: now(), updatedAt: now() });
  await writeData(data);
  revalidatePath("/");
}

export async function updateProject(
  id: string,
  input: Partial<ProjectInput>
): Promise<void> {
  const data = await readData();
  const idx = data.projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  data.projects[idx] = { ...data.projects[idx], ...input, updatedAt: now() };
  await writeData(data);
  revalidatePath("/");
}

export async function deleteProject(id: string): Promise<void> {
  const data = await readData();
  data.projects = data.projects.filter((p) => p.id !== id);
  data.links = data.links.map((l) =>
    l.projectId === id ? { ...l, projectId: undefined } : l
  );
  await writeData(data);
  revalidatePath("/");
}

/** Update just the devNotes of a project. */
export async function updateDevNotes(id: string, devNotes: string): Promise<void> {
  const data = await readData();
  const idx = data.projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  data.projects[idx] = { ...data.projects[idx], devNotes, updatedAt: now() };
  await writeData(data);
  revalidatePath("/");
}

// ── Settings ──────────────────────────────────────────────────────────────────

/** Persist portal-wide settings (theme, profile, defaultView). */
export async function saveSettings(settings: Partial<PortalSettings>): Promise<void> {
  const data = await readData();
  data.settings = { ...data.settings, ...settings };
  await writeData(data);
  revalidatePath("/");
  revalidatePath("/settings");
}
