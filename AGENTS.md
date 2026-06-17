<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project knowledge

Read `.cursor/skills/web-portal/SKILL.md` before editing this repo.

| Doc | Path |
|-----|------|
| Skill (overview) | `.cursor/skills/web-portal/SKILL.md` |
| Components & APIs | `.cursor/skills/web-portal/components.md` |
| DB, auth, cache, deployment | `.cursor/skills/web-portal/data-flow.md` |

## Cursor rules

| Rule | Purpose |
|------|---------|
| `dual-storage.mdc` | Always use `store.ts` facade; never call Neon directly; circuit breaker |
| `force-dynamic-pages.mdc` | `export const dynamic = "force-dynamic"` on every page that reads DB |
| `nextauth-credentials.mdc` | NextAuth v5 proxy, public paths, session, sign-in/out, env vars |
