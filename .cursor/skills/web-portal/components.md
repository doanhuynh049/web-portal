# Web Portal — Component & API Catalog

## Pages

### `/` — Home (`src/app/page.tsx`)
- **Type**: Server Component
- **Must have**: `export const dynamic = "force-dynamic";`
- Calls `readData()`, passes `PortalData` to `<PortalApp>`

### `/settings` — Settings (`src/app/settings/page.tsx`)
- **Type**: Server Component
- **Must have**: `export const dynamic = "force-dynamic";`
- Passes data to `<SettingsShell>`

### `/login` — Sign In (`src/app/login/page.tsx`)
- **Type**: Client Component
- Calls `signIn("credentials", { email, password, redirect: false })` from `next-auth/react`
- Shows error if `result?.error` is truthy
- Link to `/register`

### `/register` — Register (`src/app/register/page.tsx`)
- **Type**: Client Component
- POSTs to `/api/register` with `{ email, password, name }`
- On success → redirect to `/login?registered=1`

---

## Core Components

### `PortalApp` (`src/components/portal-app.tsx`)
Main client orchestrator. **All interactive state lives here.**

Props: `PortalData`

State managed:
- `activeCategory` — sidebar filter
- `searchQuery` — search input
- `view` — `"links" | "projects"`
- `theme` — `"dark" | "light"`, synced to `localStorage` + `saveSettings()`
- `editingLink` — link open in `LinkDialog`

Key logic:
- **Project grouping**: links with `projectId` → `Map<projectId, Link[]>` → `ProjectGroupCard`
- Pinned project groups appear at top
- `handleToggleTheme` → sets CSS class on `<html>`, saves `localStorage`, calls `saveSettings()`

### `Sidebar` (`src/components/sidebar.tsx`)
Left panel: logo, category list, stats, profile block, theme toggle, settings link, sign-out button.

Props: `categories[]`, `links[]`, `activeCategoryId`, `onSelectCategory`, `theme`, `onToggleTheme`, `profile`

Sign-out: `signOut({ callbackUrl: "/login" })` from `next-auth/react`

### `LinkCard` (`src/components/link-card.tsx`)
Individual link card. Shows favicon, title, URL (clickable `<a>`), type pill, tags, purpose.

- **Open button**: `window.open(url, "_blank")` + `recordOpen()` server action
- **Expandable**: usage guide, known issues, last opened
- **Inline edit**: pencil → `LinkDialog`
- Favicon via `SiteFavicon`

### `ProjectGroupCard` (`src/components/project-group-card.tsx`)
Groups all links for one project into a tabbed card. Tab order follows `PROJECT_TAB_ORDER`.

- Active tab's URL is clickable hyperlink
- Favicon shown for active tab's URL
- Open button: `window.open` + `recordOpen()`

### `ProjectCard` (`src/components/project-card.tsx`)
Detailed card in Projects view. Collapsed by default.

Sections: description · links table (all clickable) · tech stack · backlog · dev notes

**Dev notes**: click text area → inline edit → `updateDevNotes()` server action on blur/Enter

### `LinkDialog` (`src/components/link-dialog.tsx`)
Modal form for add/edit link.

Fields: title, URL, category (select), link type (select), tags, purpose, usage guide, known issues, status, pinned, projectId

Server actions: `addLink()` or `updateLink()`

### `SiteFavicon` (`src/components/site-favicon.tsx`)
Shows site icon for a URL.

- Public URL → `https://www.google.com/s2/favicons?domain=…&sz=64`
- `localhost/*` or failed load → deterministic coloured letter-avatar (hash of domain → hue)
- Props: `url: string`, `size?: number` (default 16)

### `StatsBar` (`src/components/stats-bar.tsx`)
Top bar showing counts: total links, categories, pinned, broken.

### Settings Components

| Component | Path | Purpose |
|-----------|------|---------|
| `SettingsShell` | `settings/settings-shell.tsx` | Tab nav: Profile / Categories / Appearance |
| `ProfilePanel` | `settings/profile-panel.tsx` | Edit name, initial, avatar colour, role → `saveSettings()` |
| `CategoryManager` | `settings/category-manager.tsx` | Add/edit/delete/reorder categories |
| `AppearancePanel` | `settings/appearance-panel.tsx` | Theme toggle, default view |

---

## Server Actions (`src/actions/links.ts`)

All actions call `writeData()` then `revalidatePath("/")` (and `/settings` where relevant).

| Action | Signature | Notes |
|--------|-----------|-------|
| `addLink` | `(input: LinkInput) => void` | Generates hex ID, sets timestamps |
| `updateLink` | `(id, Partial<LinkInput>) => void` | Merges, updates `updatedAt` |
| `deleteLink` | `(id) => void` | Removes from array; also removes from parent project's `linkIds` |
| `togglePin` | `(id) => void` | Flips `pinned` boolean |
| `recordOpen` | `(id) => void` | Sets `lastOpenedAt` timestamp |
| `addCategory` | `(input: CategoryInput) => void` | |
| `updateCategory` | `(id, Partial<CategoryInput>) => void` | |
| `deleteCategory` | `(id) => void` | Orphans links (keeps them, clears `categoryId`) |
| `moveCategoryOrder` | `(id, direction: "up"\|"down") => void` | Swaps `order` values |
| `addProject` | `(input: ProjectInput) => void` | |
| `updateProject` | `(id, Partial<ProjectInput>) => void` | |
| `deleteProject` | `(id) => void` | |
| `updateDevNotes` | `(id, devNotes: string) => void` | Project-only |
| `saveSettings` | `(Partial<PortalSettings>) => void` | Merges with existing settings |

---

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/[...nextauth]` | GET/POST | public | NextAuth handler (sign-in, session, CSRF) |
| `/api/register` | POST | public | `{ email, password, name? }` → create user |
| `/api/setup` | GET | public | Create seed user + seed Neon (idempotent) |
| `/api/db-seed` | GET | public | Migrate `data/links.json` → Neon |

---

## Lib Modules

| Module | Path | Purpose |
|--------|------|---------|
| `store` | `src/lib/store.ts` | `readData()` / `writeData()` — dual-storage facade |
| `types` | `src/lib/types.ts` | All TS types + constants (`LINK_TYPES`, `DEFAULT_SETTINGS`, etc.) |
| `seed-data` | `src/lib/seed-data.ts` | Initial `PortalData` object (imported when `data/links.json` is missing) |
| `db/schema` | `src/lib/db/schema.ts` | Drizzle table definitions |
| `db/index` | `src/lib/db/index.ts` | Neon connection + `ensureTables()` DDL |
| `auth/user-store` | `src/lib/auth/user-store.ts` | `findUserByEmail` / `createUser` — dual-store |
| `auth` | `src/auth.ts` | NextAuth config: credentials provider, JWT callbacks, `authorized` callback |

---

## CSS Architecture (`src/app/globals.css`)

Tailwind v4 with CSS custom properties for theming. Theme applied as class on `<html>`.

Key variables: `--bg`, `--bg-elevated`, `--bg-panel`, `--fg`, `--fg-muted`, `--fg-subtle`,
`--fg-faint`, `--accent`, `--accent-bg`, `--border`, `--border-strong`, `--card`, `--card-hover`

Utility classes: `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.input`, `.pill`,
`.link-type-pill`, `.cat-dot`, `.portal-sidebar`

Light mode: add class `light` to `<html>` — all vars override via `.light { ... }` block.
