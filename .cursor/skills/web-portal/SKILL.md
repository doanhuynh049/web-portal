---
name: web-portal
description: >-
  Personal Web Portal — manage all project links, categories, notes, and settings.
  Use when editing this repo, adding features, fixing bugs, or deploying.
---

# Web Portal — Project Knowledge

| Doc | Contents |
|-----|----------|
| [components.md](components.md) | Full component & API catalog |
| [data-flow.md](data-flow.md) | DB, auth, cache, store patterns, deployment |

**Cursor rules**: `dual-storage.mdc`, `force-dynamic-pages.mdc`, `nextauth-credentials.mdc`

---

## Stack

- **Next.js 16.2.7** App Router, React 19, Tailwind CSS v4, TypeScript 5
- **Auth**: NextAuth v5 (`next-auth@^5.0.0-beta.31`) credentials → JWT (`session.user.id`)
- **DB**: Drizzle ORM + Neon PostgreSQL (HTTP driver `@neondatabase/serverless`)
- **Fallback storage**: `data/links.json` + `data/users.json` (local dev when Neon unreachable)
- **Port**: `7854` (dev + prod). Start: `./start.sh`. Kill: reads `.next/dev/lock` for PID.

---

## Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Server + Client | Main portal — links, projects, search, filters |
| `/login` | Client | NextAuth credentials sign-in |
| `/register` | Client | Create new account |
| `/settings` | Server + Client | Profile, categories, appearance |
| `/api/auth/[...nextauth]` | API | NextAuth handler |
| `/api/register` | API | POST — create user, bcrypt hash, dual-store |
| `/api/setup` | API | GET — seed user + Neon data (idempotent) |
| `/api/db-seed` | API | GET — migrate links.json → Neon |

---

## Data Model

```
PortalData
├── version: number
├── categories: Category[]      id, name, color, description, order
├── links: Link[]                id, title, url, categoryId, linkType,
│                                purpose, usageGuide, knownIssues, tags[],
│                                status, pinned, lastOpenedAt, projectId
├── projects: Project[]          id, name, description, categoryId,
│                                linkIds[], techStack[], backlog[], devNotes
└── settings: PortalSettings     theme, defaultView, profile{name,initial,avatarColor,role}
```

---

## Key Patterns (must-know)

### 1 — Server pages must be force-dynamic
Any page that calls `readData()` must opt out of static pre-rendering:
```ts
export const dynamic = "force-dynamic";
```
Without it, Next.js tries to pre-render at build time → DB connection crash.

### 2 — Dual storage with Neon circuit breaker
`store.ts` wraps Neon + JSON automatically. After the first Neon failure the circuit
opens for 60 s — no retry spam, no 3-second hangs. Never call Neon directly; always use
`readData()` / `writeData()` from `src/lib/store.ts`.

### 3 — NextAuth proxy (not middleware.ts)
The auth guard lives in `src/proxy.ts` (Next.js 16 convention):
```ts
export { auth as proxy } from "@/auth";
```
Public paths (`/login`, `/register`, `/api/auth/*`, `/api/register`, `/api/setup`) are
declared in the `authorized` callback inside `src/auth.ts`.

### 4 — start.sh port-kill logic
`start.sh` reads `.next/dev/lock` (JSON: `{pid, port, ...}`) to find and kill the running
server before starting. The lock file is the authoritative source — do **not** rely only
on `lsof` because the server may be on a different port than the new one.

### 5 — Favicon fallback
`SiteFavicon` uses `https://www.google.com/s2/favicons?domain=…&sz=64`. For `localhost/*`
or any URL that fails it renders a deterministic coloured letter-avatar. Never show
broken image icons.

### 6 — Project group cards
Links with the same `projectId` are grouped into `ProjectGroupCard` with tabbed
environments (`Local Dev | Staging | Production | …`). This grouping happens in
`portal-app.tsx` at render time — the data model keeps them as flat `links[]`.

---

## Seed User

- Email: `quocthien049@gmail.com`  Password: `doanhuynh0409`
- Created at: `GET /api/setup` (idempotent)
- Stored in `data/users.json` locally; `portal_users` table on Neon

---

## Common Tasks

| Task | How |
|------|-----|
| Add a link | Link dialog (`+` button) → `addLink()` server action → `revalidatePath("/")` |
| Add a category | Settings → Category Manager → `addCategory()` |
| Change theme | Sidebar toggle → `saveSettings()` + `localStorage` |
| Reorder categories | Settings → drag handles → `moveCategoryOrder()` |
| Add user | POST `/api/register` or `GET /api/setup` |
| Seed Neon | `GET /api/db-seed` or `GET /api/setup` |
| Kill & restart | `./start.sh` — kills via `.next/dev/lock` first |
