@AGENTS.md

## Project skill

For architecture, components, and conventions, read `.cursor/skills/web-portal/SKILL.md`.

- Component catalog: `.cursor/skills/web-portal/components.md`
- DB / auth / Vercel ops: `.cursor/skills/web-portal/data-flow.md`

## Cursor rules

- `dual-storage.mdc` — use `store.ts` facade only; never call Neon directly; circuit breaker pattern
- `force-dynamic-pages.mdc` — `export const dynamic = "force-dynamic"` on pages that read live data
- `nextauth-credentials.mdc` — proxy.ts convention, public paths, session usage, bcryptjs
