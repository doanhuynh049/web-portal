# My Web Portal

A personal link manager for organizing all project URLs, work resources, and dev tools in one place.

**Run at:** `http://localhost:7854`

---

## Features

- **Categories** — organize links by project, company, or topic with colored labels
- **Projects view** — group dev/staging/prod/repo links under a named project
- **Search** — instant full-text search across title, URL, purpose, and tags
- **Pin links** — keep frequently-used links at the top
- **Expandable cards** — usage guide, known issues, and tags hidden until needed
- **Health status** — mark links as Active / Redirected / Broken / Unchecked
- **Add / Edit / Delete** — full CRUD from the UI, no config files to touch
- **Zero-config storage** — data lives in `data/links.json` (auto-created on first run)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (port 7854)
npm run dev

# 3. Open the portal
open http://localhost:7854
```

The portal is pre-populated with all your personal projects. Update any incorrect ports or production URLs directly in the UI.

---

## Project Structure

```
web-portal/
├── data/
│   └── links.json              # All data (auto-created with seed on first run)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + metadata
│   │   ├── page.tsx            # Server Component: reads data, renders PortalApp
│   │   └── globals.css         # CSS variables, Tailwind import, component styles
│   ├── actions/
│   │   └── links.ts            # Server Actions: addLink, updateLink, deleteLink, togglePin…
│   ├── components/
│   │   ├── portal-app.tsx      # Main client shell (search, filter, view toggle)
│   │   ├── sidebar.tsx         # Left nav: categories + link counts
│   │   ├── stats-bar.tsx       # Top strip: totals, pinned, broken, categories
│   │   ├── link-card.tsx       # Individual link card with actions
│   │   ├── project-card.tsx    # Project group (collapsible) with backlog
│   │   └── link-dialog.tsx     # Add / Edit modal
│   └── lib/
│       ├── types.ts            # All TypeScript types and constants
│       ├── store.ts            # JSON file read/write (atomic)
│       └── seed-data.ts        # Pre-populated personal projects data
├── package.json
├── next.config.ts
├── tsconfig.json
└── postcss.config.mjs
```

---

## Data Model

All data is stored in `data/links.json` as a `PortalData` object.

### `Link`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated 8-char hex ID |
| `title` | string | Display name |
| `url` | string | Full URL |
| `categoryId` | string | FK → Category |
| `linkType` | LinkType | One of: Local Dev, Production, Repository, etc. |
| `purpose` | string | One-line description |
| `usageGuide` | string | Multi-line usage instructions |
| `knownIssues` | string | Bugs, VPN requirements, etc. |
| `tags` | string[] | Searchable tags |
| `status` | LinkStatus | active / redirected / broken / unchecked |
| `pinned` | boolean | Show at top of grid |
| `projectId` | string? | FK → Project (optional) |
| `lastOpenedAt` | string? | ISO date of last "Open" click |

### `Category`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID |
| `name` | string | Display name |
| `color` | string | Hex color for the dot |
| `order` | number | Sort position in sidebar |

### `Project`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID |
| `name` | string | Project display name |
| `description` | string | Short description |
| `linkIds` | string[] | Ordered list of link IDs |
| `techStack` | string[] | Tech labels |
| `backlog` | string[] | Todo tasks |

---

## Architecture

```
page.tsx (Server Component)
  └─ reads data/links.json via store.ts
  └─ passes data as props to:

PortalApp (Client Component)
  ├─ Sidebar       — category filter navigation
  ├─ StatsBar      — total / pinned / broken / categories
  ├─ LinksView     — 3-column responsive card grid
  │   └─ LinkCard  — status, URL, actions, expandable details
  ├─ ProjectsView  — collapsible project cards
  │   └─ ProjectCard
  └─ LinkDialog    — add / edit modal (Server Actions on submit)
```

**Data flow:**
1. `page.tsx` reads `data/links.json` on the server
2. Passes `PortalData` to `PortalApp`
3. `PortalApp` filters/searches in memory (no server round-trip)
4. On mutation (add / edit / delete / pin), a **Server Action** writes to `links.json`
5. `revalidatePath("/")` causes `page.tsx` to re-render with fresh data

---

## Pre-populated Projects

| Project | Local Dev | Notes |
|---------|-----------|-------|
| VN Stocks Dashboard | http://localhost:4962 | Next.js 16, Neon DB, Vercel |
| Targets 2026 | http://localhost:7329 | Next.js 16, Prisma |
| AI Learning Coach | http://localhost:8523 | Next.js 16 |
| IELTS Pro (Frontend) | http://localhost:5174 | Vite + React |
| IELTS Pro (NestJS API) | http://localhost:3001 | NestJS backend |
| Global Football Manager | http://localhost:5173 | Vite game |
| AssetIQ | http://localhost:3002 | Next.js (est.) |
| Career Knowledge Hub | http://localhost:3003 | Next.js (est.) |
| Career AI | http://localhost:3004 | Next.js (est.) |
| LinguaChat | http://localhost:3005 | Next.js (est.) |
| Personal Webpage | http://localhost:3000 | Node.js server |
| Polyglot Pro | http://localhost:3006 | Next.js (est.) |
| Target Service (API) | http://localhost:8000 | FastAPI |
| Crypto Service | http://localhost:8080 | Spring Boot |
| English Service | http://localhost:8081 | Spring Boot |
| Knowledge Service | http://localhost:8082 | Spring Boot |
| Stock Service | http://localhost:8083 | (est.) |

> Ports marked `(est.)` are estimates. Verify against each project's `package.json`
> and update the URL in this portal's UI.

---

## Updating Production URLs

1. Open http://localhost:7854
2. Find the link card for the project
3. Click the pencil icon → Edit
4. Update the URL field
5. Click Save Changes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.7 (App Router) |
| Runtime | React 19, Node.js |
| Styling | Tailwind CSS v4, CSS custom properties |
| Icons | Lucide React |
| Storage | JSON file (`data/links.json`) |
| Mutations | Next.js Server Actions |
| Port | 7854 |
