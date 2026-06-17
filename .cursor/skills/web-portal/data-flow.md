# Web Portal — Data Flow, DB, Auth & Deployment

## Storage Layers

```
Request
  │
  ├─ readData() / writeData()   ← src/lib/store.ts (always use this)
  │     │
  │     ├─ DATABASE_URL set AND circuit not open?
  │     │     │
  │     │     ├─ YES → readFromNeon() / writeToNeon()  (Drizzle ORM)
  │     │     │         on error → set neonLastFailure, fall through
  │     │     │
  │     │     └─ NO  → readFromFile() / writeToFile()
  │     │
  │     └─ data/links.json  (always present, local dev fallback)
  │
  └─ findUserByEmail() / createUser()   ← src/lib/auth/user-store.ts
        │
        ├─ DATABASE_URL set? → portal_users table (Neon)
        │   on error → fall through
        └─ data/users.json (local fallback)
```

---

## Neon Circuit Breaker

Defined in `src/lib/store.ts`:

```ts
const CIRCUIT_RESET_MS = 60_000;
let neonLastFailure: number | null = null;

function neonCircuitOpen(): boolean {
  if (neonLastFailure === null) return false;
  return Date.now() - neonLastFailure < CIRCUIT_RESET_MS;
}
```

- First request of a server session → tries Neon (may take ~3 s to ETIMEDOUT)
- On failure: `neonLastFailure = Date.now()`
- Next 60 s: all requests skip Neon instantly, serve from JSON
- After 60 s: retries once (important for Vercel cold starts where Neon IS reachable)

**Never bypass the circuit** by calling Neon directly in a page or action.

---

## Neon Tables (Drizzle schema)

File: `src/lib/db/schema.ts`

| Table | Key columns |
|-------|-------------|
| `portal_categories` | `id`, `name`, `color`, `description`, `order` |
| `portal_links` | `id`, `title`, `url`, `category_id`, `link_type`, `tags` (JSON text), `pinned`, `project_id`, `created_at`, `updated_at` |
| `portal_projects` | `id`, `name`, `description`, `category_id`, `link_ids` (JSON text), `tech_stack` (JSON text), `backlog` (JSON text), `dev_notes` |
| `portal_settings` | `id=1` (single row), `theme`, `default_view`, `profile_*` fields |
| `portal_users` | `id`, `email` (UNIQUE), `password_hash`, `name`, `created_at` |

**JSON-as-text columns** (`tags`, `link_ids`, `tech_stack`, `backlog`): always `JSON.parse` on
read and `JSON.stringify` on write. Helpers `parseArr()` / `stringifyArr()` in `store.ts`.

`ensureTables()` in `src/lib/db/index.ts` runs `CREATE TABLE IF NOT EXISTS` for each table
on first DB access. Uses the Neon HTTP tagged-template literal (`sqlHttp`) — one statement
per call (Neon HTTP limitation).

---

## Authentication Flow

### Sign-in

```
Browser /login form
  → signIn("credentials", { email, password }) [next-auth/react]
  → POST /api/auth/callback/credentials  [NextAuth handler]
  → authorize() in src/auth.ts
      → findUserByEmail(email)  [user-store.ts]
      → bcrypt.compare(password, passwordHash)
      → return { id, email, name } on success
  → JWT created, set-cookie: next-auth.session-token
  → redirect to callbackUrl (default "/")
```

### Route protection

`src/proxy.ts` exports the NextAuth `auth` function as `proxy` (Next.js 16 convention).
The `authorized` callback in `src/auth.ts` controls access:

```ts
authorized({ auth: session, request }) {
  const PUBLIC = ["/login", "/register", "/api/auth", "/api/register", "/api/setup"];
  if (PUBLIC.some(p => request.nextUrl.pathname.startsWith(p))) return true;
  return !!session?.user;
}
```

### Session in Server Components

```ts
import { auth } from "@/auth";
const session = await auth();
if (!session) redirect("/login");
const userId = session.user.id;
```

### Session in Client Components

```tsx
import { useSession } from "next-auth/react";
const { data: session } = useSession();
```

`SessionProvider` wraps the entire app in `src/app/layout.tsx`.

---

## User Registration

POST `/api/register`:
1. Validate email format + password length ≥ 6
2. Check `userExists(email)` — reject if duplicate (409)
3. `bcrypt.hash(password, 12)`
4. `createUser({ id, email, passwordHash, name, createdAt })`
   - Writes to `data/users.json` (always)
   - Tries `portal_users` Neon insert (best-effort)

---

## Data Seeding

### `GET /api/setup` (idempotent, safe to call repeatedly)
1. Creates `quocthien049@gmail.com` / `doanhuynh0409` if not present
2. Calls `seedDatabaseFromFile()` → bulk-upserts `data/links.json` into Neon

### `GET /api/db-seed`
Directly calls `seedDatabaseFromFile()` — migrates JSON → Neon only.

---

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | No (local) | Neon connection string with `sslmode=require&channel_binding=require` |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret. `openssl rand -base64 32` |
| `AUTH_SECRET` | Yes | Same value — NextAuth v5 reads either name |
| `NEXTAUTH_URL` | Local dev | `http://localhost:7854` — not needed on Vercel |

---

## Local Dev Data Files

| File | Purpose | Git-tracked? |
|------|---------|--------------|
| `data/links.json` | Portal categories/links/projects/settings | Yes (seed data) |
| `data/users.json` | Local user accounts | No (`.gitignore`) |

`links.json` is regenerated from `src/lib/seed-data.ts` on first load if missing.
`users.json` is created on first `POST /api/register` or `GET /api/setup`.

---

## start.sh Workflow

```bash
./start.sh          # dev on port 7854
PORT=8000 ./start.sh  # dev on custom port
./start.sh --prod   # build + production server
```

Kill sequence:
1. Read `.next/dev/lock` → `{"pid": N, "port": M, ...}` → `kill -TERM N`
2. Wait up to 3 s, then `kill -9 N` if still alive
3. Delete `.next/dev/lock`
4. `lsof -ti tcp:$PORT` → kill any remaining process on the target port
5. `sleep 0.5` (OS socket release)
6. `npx next dev --port $PORT`

---

## Vercel Deployment Checklist

1. Set env vars in Vercel project: `DATABASE_URL`, `NEXTAUTH_SECRET`, `AUTH_SECRET`
2. **Do NOT set `NEXTAUTH_URL`** on Vercel — NextAuth v5 auto-detects the URL
3. First deploy → visit `https://your-app.vercel.app/api/setup` to create seed user + schema
4. All pages with `readData()` have `export const dynamic = "force-dynamic"` ← critical
5. `data/links.json` is bundled as a read fallback, but Neon is the live source on Vercel

---

## Known Connectivity Constraints

Neon HTTP endpoint (`api.*.neon.tech`) is **not reachable from this dev server** (ETIMEDOUT).
The circuit breaker means the app stays fast despite this. On Vercel (or any public cloud)
Neon connects normally.

If you need to access Neon from local, use Vercel CLI `vercel dev` which proxies env vars
from the Vercel project and often has different outbound routing.
