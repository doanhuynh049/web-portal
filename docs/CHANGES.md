# Code Changes — Feature Documentation

**Commit:** `a5ac337`  
**Date:** 2026-06-17  
**Branch:** `master`  
**Summary:** Login redesign · System theme · Avatar picker · Profile defaults · DB migration

---

## Table of Contents

1. [src/lib/types.ts](#1-srclibstatements-typests)
2. [src/lib/db/schema.ts](#2-srclibdbschemats)
3. [src/lib/db/index.ts](#3-srclibdbindexts)
4. [src/lib/store.ts](#4-srclibstorets)
5. [src/lib/seed-data.ts](#5-srclibseed-datats)
6. [src/app/login/page.tsx](#6-srcapploginpagetsx)
7. [src/components/portal-app.tsx](#7-srccomponentsportal-apptsx)
8. [src/components/sidebar.tsx](#8-srccomponentssidebartsx)
9. [src/components/settings/appearance-panel.tsx](#9-srccomponentssettingsappearance-paneltsx)
10. [src/components/settings/profile-panel.tsx](#10-srccomponentssettingsprofile-paneltsx)
11. [DEPLOY.md](#11-deploymd)

---

## 1. `src/lib/types.ts`

**Why changed:** Central type definitions — all other files depend on these.

### Change A — `Theme` union type

```ts
// Before
export type Theme = "dark" | "light";

// After
export type Theme = "dark" | "light" | "system";
```

**Explanation:**  
Added `"system"` as a third theme option. When selected, the app reads the operating system's `prefers-color-scheme` media query and automatically applies dark or light styling. This means users no longer need to manually switch themes — it stays in sync with their OS setting.

---

### Change B — `UserProfile.avatarIcon` field

```ts
// Before
export interface UserProfile {
  name: string;
  initial: string;
  avatarColor: string;
  role: string;
}

// After
export interface UserProfile {
  name: string;
  initial: string;        // auto-derived from name now
  avatarColor: string;
  role: string;
  avatarIcon?: string;    // NEW — optional emoji override (e.g. "🚀")
}
```

**Explanation:**  
`avatarIcon` is an optional emoji string. When set, the sidebar avatar circle shows the emoji instead of the letter initial. When empty/undefined, it falls back to the auto-generated initial letter(s). This is stored in the database and the JSON file alongside the other profile fields.

---

### Change C — `DEFAULT_SETTINGS` profile values

```ts
// Before
export const DEFAULT_SETTINGS: PortalSettings = {
  theme: "dark",
  defaultView: "links",
  profile: {
    name: "My Portal",
    initial: "M",
    avatarColor: "#3b82f6",
    role: "Developer",
  },
};

// After
export const DEFAULT_SETTINGS: PortalSettings = {
  theme: "dark",
  defaultView: "links",
  profile: {
    name: "Quoc Thien",
    initial: "Q",
    avatarColor: "#3b82f6",
    role: "Software Developer",
    avatarIcon: "",
  },
};
```

**Explanation:**  
The generic placeholder values `"My Portal"` / `"Developer"` are replaced with the actual user's name and title. This means a fresh Vercel deploy (before the user visits Settings → Profile) no longer shows confusing defaults.

---

## 2. `src/lib/db/schema.ts`

**Why changed:** The Drizzle ORM schema defines the shape of the Neon PostgreSQL tables. Adding `avatarIcon` to the profile requires a new column.

### Change — Added `profileAvatarIcon` column

```ts
// Before
export const portalSettings = pgTable("portal_settings", {
  id: integer("id").primaryKey().default(1),
  theme: text("theme").notNull().default("dark"),
  defaultView: text("default_view").notNull().default("links"),
  profileName: text("profile_name").notNull().default("My Portal"),
  profileInitial: text("profile_initial").notNull().default("M"),
  profileAvatarColor: text("profile_avatar_color").notNull().default("#3b82f6"),
  profileRole: text("profile_role").notNull().default("Developer"),
  version: integer("version").notNull().default(2),
});

// After
export const portalSettings = pgTable("portal_settings", {
  id: integer("id").primaryKey().default(1),
  theme: text("theme").notNull().default("dark"),
  defaultView: text("default_view").notNull().default("links"),
  profileName: text("profile_name").notNull().default("Quoc Thien"),
  profileInitial: text("profile_initial").notNull().default("Q"),
  profileAvatarColor: text("profile_avatar_color").notNull().default("#3b82f6"),
  profileRole: text("profile_role").notNull().default("Software Developer"),
  profileAvatarIcon: text("profile_avatar_icon").default(""),  // NEW
  version: integer("version").notNull().default(2),
});
```

**Explanation:**  
Drizzle ORM generates SQL queries from this schema. The new `profileAvatarIcon` column is optional (no `.notNull()`) so existing rows are not broken. The column defaults to an empty string meaning "use letter initial".

---

## 3. `src/lib/db/index.ts`

**Why changed:** The `ensureTables()` function runs DDL to create tables on first request. Since we added a new column to an existing table that may already exist in Neon, we need an `ALTER TABLE` statement.

### Change — `ALTER TABLE` migration for existing deployments

```ts
// Added inside ensureTables(), after the CREATE TABLE for portal_settings:

await sqlHttp`
  ALTER TABLE portal_settings ADD COLUMN IF NOT EXISTS profile_avatar_icon TEXT DEFAULT ''
`;
```

**Explanation:**  
`CREATE TABLE IF NOT EXISTS` only runs once. If the `portal_settings` table already exists (from a previous deploy), the new column would never be added without this `ALTER TABLE`. The `IF NOT EXISTS` clause makes it safe to run repeatedly — it's a no-op if the column already exists. This follows the same pattern used for all DB migrations in this project.

---

## 4. `src/lib/store.ts`

**Why changed:** The store is the only place that reads from and writes to Neon. Any new field must be wired through here.

### Change A — Read mapping (Neon → TypeScript)

```ts
// Before
profile: {
  name: settingsRow.profileName,
  initial: settingsRow.profileInitial,
  avatarColor: settingsRow.profileAvatarColor,
  role: settingsRow.profileRole,
},

// After
profile: {
  name: settingsRow.profileName,
  initial: settingsRow.profileInitial,
  avatarColor: settingsRow.profileAvatarColor,
  role: settingsRow.profileRole,
  avatarIcon: settingsRow.profileAvatarIcon ?? "",   // NEW
},
```

**Explanation:**  
When reading from Neon, the `profileAvatarIcon` column value is mapped to `avatarIcon` in the TypeScript `UserProfile` object. The `?? ""` fallback handles rows that were created before the column was added.

---

### Change B — Write mapping (TypeScript → Neon) + Theme type widening

```ts
// Before — theme cast to only "dark" | "light"
theme: settingsRow.theme as "dark" | "light",

// After — theme cast includes "system"
theme: settingsRow.theme as "dark" | "light" | "system",
```

```ts
// Before — upsert did not include avatarIcon
.values({
  id: 1, theme: s.theme, ..., profileRole: s.profile.role,
})

// After — includes avatarIcon in both INSERT and ON CONFLICT UPDATE
.values({
  ...,
  profileRole: s.profile.role,
  profileAvatarIcon: s.profile.avatarIcon ?? "",    // NEW in INSERT
})
.onConflictDoUpdate({
  set: {
    ...,
    profileAvatarIcon: drizzleSql`excluded.profile_avatar_icon`,  // NEW in UPDATE
  },
});
```

**Explanation:**  
Without adding `profileAvatarIcon` to the upsert, saving the profile from the Settings page would overwrite the column with nothing. The `drizzleSql\`excluded.profile_avatar_icon\`` pattern is how Drizzle ORM references the incoming value in an `ON CONFLICT DO UPDATE` clause.

---

## 5. `src/lib/seed-data.ts`

**Why changed:** The seed data is what gets loaded into Neon when you visit `/api/setup` for the first time. It should use the correct default profile.

### Change — Profile in seed settings

```ts
// Before
settings: DEFAULT_SETTINGS,

// After
settings: {
  ...DEFAULT_SETTINGS,
  profile: {
    name: "Quoc Thien",
    initial: "Q",
    avatarColor: "#3b82f6",
    role: "Software Developer",
    avatarIcon: "💻",
  },
},
```

**Explanation:**  
The seed data now uses a real name and a `💻` emoji as the default avatar icon. When `/api/setup` is called after a fresh Vercel deploy, Neon is seeded with these values and the sidebar shows the correct identity immediately.

---

## 6. `src/app/login/page.tsx`

**Why changed:** The old login page was a basic centered card. The new design is a two-panel split-screen layout inspired by modern SaaS/financial dashboards (Vercel, Linear, etc.).

### Architecture — Component split

```
LoginPage (default export)
├── BrandingPanel   ← left side, hidden on mobile (lg:flex)
└── LoginForm       ← right side, wrapped in <Suspense>
```

### Change A — `BrandingPanel` component (new)

```tsx
function BrandingPanel() {
  return (
    <div style={{ background: "linear-gradient(135deg, #0c0c10, #0f172a, #0c1a2e)", flex: "0 0 52%" }}>
      {/* Decorative SVG grid */}
      <svg>
        <pattern id="grid" .../>
        <rect fill="url(#grid)" />
      </svg>

      {/* Two radial glow orbs for depth */}
      <div style={{ background: "radial-gradient(...rgba(59,130,246,0.18)...)" }} />
      <div style={{ background: "radial-gradient(...rgba(139,92,246,0.12)...)" }} />

      {/* Logo */}
      <Globe size={22} />  Web Portal

      {/* Hero headline */}
      <h1>Your Personal <span style={{ color: "#60a5fa" }}>Command Center</span></h1>

      {/* 4 feature highlights */}
      {features.map(f => <FeatureRow icon={...} title={...} desc={...} />)}
    </div>
  );
}
```

**Explanation:**  
- The `linear-gradient` creates a deep dark background that transitions from near-black to dark navy, matching the app's dark theme
- The `<pattern>` SVG draws a subtle blue grid at 6% opacity — visible but not distracting
- Two blurred radial gradients simulate "glow" light sources at top-right (blue) and bottom-left (violet)
- `flex: "0 0 52%"` gives the panel a fixed 52% width that does not shrink

---

### Change B — `LoginForm` layout restructure

```tsx
// Before — centered single card
<div className="min-h-dvh flex items-center justify-center p-4">
  <div style={{ maxWidth: 384, borderRadius: 16, padding: 32 }}>
    ...
  </div>
</div>

// After — full-height right panel
<div style={{ flex: "1 1 0", background: "var(--bg)" }}>
  <div style={{ maxWidth: 400, margin: "0 auto" }}>
    ...
  </div>
</div>
```

**Explanation:**  
The form panel now takes up whatever width is left after the branding panel (`flex: "1 1 0"`). The inner form container is constrained to `maxWidth: 400px` and centered within that space. On screens smaller than `lg` (1024px), the branding panel hides and the form fills the full viewport.

---

### Change C — Mobile logo injection

```tsx
{/* Only visible on screens smaller than lg */}
<div className="flex items-center gap-2.5 mb-10 lg:hidden">
  <Globe /> Web Portal
</div>
```

**Explanation:**  
On mobile the left branding panel is hidden (`hidden lg:flex`), so the logo would disappear entirely. This small logo block is shown only on mobile via `lg:hidden` to maintain brand identity.

---

### Change D — Error banner styling

```tsx
// Before — plain text
<p style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
  {error}
</p>

// After — bordered alert with label
<div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
  <span>Error:</span> {error}
</div>
```

**Explanation:**  
The error banner now has a matching border and a bold "Error:" prefix, making it easier to notice at a glance.

---

## 7. `src/components/portal-app.tsx`

**Why changed:** All theme logic lives in `PortalApp`. Adding "system" mode requires reading the OS media query, reacting to changes, and cycling through 3 states instead of 2.

### Change A — `applyThemeClass` handles system mode

```ts
// Before
function applyThemeClass(t: "dark" | "light") {
  const root = document.documentElement;
  if (t === "light") root.classList.add("light");
  else root.classList.remove("light");
}

// After
function applyThemeClass(t: Theme) {
  const root = document.documentElement;
  const isDark =
    t === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : t === "dark";
  if (isDark) root.classList.remove("light");
  else root.classList.add("light");
}
```

**Explanation:**  
When `t === "system"`, we query the OS preference via `window.matchMedia("(prefers-color-scheme: dark)").matches`. This is a synchronous boolean — `true` if the OS is in dark mode. The function then adds or removes the `light` CSS class on `<html>` accordingly.

---

### Change B — Media query change listener

```ts
// Added as a second useEffect
useEffect(() => {
  if (theme !== "system") return;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => applyThemeClass("system");
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}, [theme]); // re-runs when theme changes
```

**Explanation:**  
If the user is on "system" mode and switches their OS from dark to light (or vice versa), the app must react in real time. This effect attaches a listener to the media query's `change` event. The cleanup function removes the listener when the component unmounts or when the theme changes away from "system" — preventing memory leaks.

---

### Change C — 3-state toggle cycle

```ts
// Before — 2-state toggle
const next: "dark" | "light" = theme === "dark" ? "light" : "dark";

// After — 3-state cycle via lookup table
const cycle: Record<Theme, Theme> = { dark: "light", light: "system", system: "dark" };
const next = cycle[theme];
```

**Explanation:**  
A `Record` lookup table is cleaner than chained ternaries. The cycle is: `dark → light → system → dark`. Clicking the sidebar button once advances to the next state.

---

## 8. `src/components/sidebar.tsx`

**Why changed:** The sidebar contains the avatar display and the theme toggle button, both of which needed to be updated for the new features.

### Change A — Import `Monitor` icon + `Theme` type

```ts
// Before
import { Settings, Sun, Moon, Check, LogOut } from "lucide-react";
import type { Category, Link as LinkType, UserProfile } from "@/lib/types";

// After
import { Settings, Sun, Moon, Monitor, Check, LogOut } from "lucide-react";
import type { Category, Link as LinkType, UserProfile, Theme } from "@/lib/types";
```

**Explanation:**  
`Monitor` from lucide-react is the icon used to represent "System" mode. `Theme` type is now imported so the prop type is correct.

---

### Change B — Avatar shows emoji icon if set

```tsx
// Before
<div style={{ background: profile.avatarColor, color: "#fff" }}>
  {profile.initial}
</div>

// After
<div
  style={{
    background: profile.avatarIcon ? "transparent" : profile.avatarColor,
    fontSize: profile.avatarIcon ? "18px" : undefined,
  }}
>
  {profile.avatarIcon || profile.initial}
</div>
```

**Explanation:**  
When `profile.avatarIcon` is a non-empty string (e.g. `"💻"`), the emoji is displayed at a larger font size and the colored background is hidden (`transparent`) since emojis look better without it. When `avatarIcon` is empty, the behavior is unchanged — colored circle with the initial letter.

---

### Change C — Theme toggle button shows current mode

```tsx
// Before — shows what you're switching TO
{theme === "dark" ? <><Sun /> Light</> : <><Moon /> Dark</>}

// After — shows current mode, cycles on click
{theme === "dark"   && <><Moon size={13} />   Dark</>}
{theme === "light"  && <><Sun size={13} />    Light</>}
{theme === "system" && <><Monitor size={13} /> System</>}
```

**Explanation:**  
The button now shows the **current** mode and its icon. The tooltip (`title` attribute) explains what clicking will do next. This is less confusing than the old behavior where the button showed the opposite state.

---

## 9. `src/components/settings/appearance-panel.tsx`

**Why changed:** The Appearance settings panel had a 2-option theme picker (Dark / Light). It needs a third option for System.

### Change A — System option in theme picker

```tsx
// Before — map over ["dark", "light"]
{(["dark", "light"] as const).map((t) => (...))}

// After — explicit array with icons
{([
  { id: "dark",   label: "Dark",   icon: <Moon size={20} />    },
  { id: "light",  label: "Light",  icon: <Sun size={20} />     },
  { id: "system", label: "System", icon: <Monitor size={20} /> },
] as const).map((t) => (...))}
```

**Explanation:**  
The old code mapped over a plain string array and used a conditional to pick the icon. The new code uses an array of objects with both the value and the icon pre-defined, which is easier to extend and read.

---

### Change B — "System" hint text

```tsx
{theme === "system" && (
  <p className="text-xs mt-2" style={{ color: "var(--fg-subtle)" }}>
    Follows your OS dark/light mode preference automatically.
  </p>
)}
```

**Explanation:**  
An informational hint appears below the picker only when "System" is selected, explaining to the user what it does.

---

### Change C — `handleSave` applies system mode correctly

```ts
// Before
if (theme === "light") document.documentElement.classList.add("light");
else document.documentElement.classList.remove("light");

// After
const isDark =
  theme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : theme === "dark";
if (isDark) document.documentElement.classList.remove("light");
else document.documentElement.classList.add("light");
```

**Explanation:**  
When the user saves "system" as their theme preference, the panel immediately applies the correct class to `<html>` by reading the OS preference. Without this, the page would only update after a full reload.

---

## 10. `src/components/settings/profile-panel.tsx`

**Why changed:** The profile panel needed three new features: auto-derived initials, an emoji icon picker, and the removal of the manual "Avatar Initial" text input.

### Change A — `deriveInitial()` utility function (new)

```ts
function deriveInitial(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0][0].toUpperCase();
  // Two-letter monogram: first letter of first word + first letter of last word
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
```

**Examples:**
| Input | Output |
|-------|--------|
| `"Quoc Thien"` | `"QT"` |
| `"Alice"` | `"A"` |
| `""` | `"?"` |
| `"John Michael Doe"` | `"JD"` |

**Explanation:**  
Instead of making the user manually type their initial, the function derives a 1-or-2-character monogram from their display name. A 2-letter monogram (first name initial + last name initial) is shown in the avatar when no emoji icon is selected.

---

### Change B — `AVATAR_ICONS` constant (new)

```ts
const AVATAR_ICONS = [
  "",     // empty = use letter initial
  "🚀", "💻", "🎯", "📊", "⚡", "🌟", "🔥", "💡",
  "🎨", "🏗️", "🧠", "💰", "🌐", "📈", "🛠️", "🎮",
  "📚", "🏆", "🧩", "🦋",
];
```

**Explanation:**  
20 preset emoji icons for the avatar, plus the empty string (index 0) which represents "use auto-initials". The first tile in the picker shows the user's current initial letter as a preview.

---

### Change C — Avatar preview updates live

```tsx
<div
  style={{
    background: avatarIcon ? "transparent" : avatarColor,
    fontSize: avatarIcon ? 32 : 22,
    border: avatarIcon ? "2px solid var(--border-strong)" : "none",
  }}
>
  {avatarIcon || derivedInitial}
</div>
```

**Explanation:**  
As the user types their name or clicks an icon, the preview updates in real time. When an emoji is selected, the border appears (to show the circle boundary), the background is hidden, and the font size is enlarged. When no emoji is selected, the colored circle with monogram letters appears.

---

### Change D — Removed manual initial input

```tsx
// REMOVED — users no longer type their initial manually
<label>
  <span>Avatar Initial (single character)</span>
  <input maxLength={1} value={initial} onChange={...} />
</label>
```

**Explanation:**  
The initial is now auto-derived from the name. Removing the manual input reduces friction and prevents inconsistency (e.g. name = "Alice" but initial = "B").

---

### Change E — `handleSave` sends derived initial

```ts
// Before — used manual initial state
profile: { name, initial: initial.charAt(0).toUpperCase(), ... }

// After — uses derived initial from name
profile: { name, initial: derivedInitial.charAt(0), avatarColor, role, avatarIcon }
```

**Explanation:**  
The `initial` field stored in the DB is now always consistent with the display name. Only the first character of the monogram is stored (for backward compatibility with the single-character `initial` field in the DB).

---

## 11. `DEPLOY.md` (new file)

**Why added:** A deployment guide was created to document the exact steps needed to deploy to Vercel correctly and avoid the `localhost:7854` redirect bug.

### Contents:
- Root cause explanation of the `NEXTAUTH_URL` bug
- Step-by-step fix in Vercel dashboard
- Environment variable reference table
- First-deploy data seeding instructions
- Vercel CLI quick workflow
- Troubleshooting table

---

## Summary Table

| File | Change Type | Feature |
|------|-------------|---------|
| `types.ts` | Modified | `Theme` union + `avatarIcon` field + better defaults |
| `db/schema.ts` | Modified | New `profileAvatarIcon` DB column |
| `db/index.ts` | Modified | `ALTER TABLE` migration for existing DBs |
| `store.ts` | Modified | Read/write mapping for `avatarIcon` + system theme |
| `seed-data.ts` | Modified | Real name + `💻` emoji in seed profile |
| `login/page.tsx` | Rewritten | Split-screen SaaS login layout |
| `portal-app.tsx` | Modified | System theme: media query + 3-state cycle |
| `sidebar.tsx` | Modified | Emoji avatar + Monitor icon + current-mode toggle |
| `appearance-panel.tsx` | Modified | System theme card + apply-on-save fix |
| `profile-panel.tsx` | Rewritten | Auto-initials + emoji picker + live preview |
| `DEPLOY.md` | New | Vercel deployment guide |
