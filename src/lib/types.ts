/**
 * Core data types for the Personal Web Portal.
 *
 * All data is stored in `data/links.json` as a `PortalData` object.
 * Every entity uses a string hex ID as its primary key.
 */

// ── Link health status ────────────────────────────────────────────────────────

export type LinkStatus = "active" | "redirected" | "broken" | "unchecked";

// ── Link type taxonomy ────────────────────────────────────────────────────────

export const LINK_TYPES = [
  "Local Dev",
  "Staging",
  "Production",
  "Repository",
  "Documentation",
  "API",
  "Internal Portal",
  "Tool",
  "Research",
  "Learning",
  "Backend Service",
  "Other",
] as const;

export type LinkType = (typeof LINK_TYPES)[number];

// ── Ordered link types used for the project-group card tabs ──────────────────
// Determines display order in the Dev/Prod tab bar
export const PROJECT_TAB_ORDER: LinkType[] = [
  "Local Dev",
  "Staging",
  "Production",
  "Repository",
  "Documentation",
  "API",
  "Backend Service",
  "Tool",
  "Other",
];

// ── Theme ─────────────────────────────────────────────────────────────────────

export type Theme = "dark" | "light" | "system";

// ── User profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  /** Display name, e.g. "Thanh D." */
  name: string;
  /** Single character shown in the avatar circle (auto-derived from name) */
  initial: string;
  /** Hex background color for the avatar */
  avatarColor: string;
  /** Optional job title / role */
  role: string;
  /** Optional emoji icon override for the avatar (e.g. "🚀") */
  avatarIcon?: string;
}

// ── Portal settings ───────────────────────────────────────────────────────────

export interface PortalSettings {
  theme: Theme;
  profile: UserProfile;
  /** Default view when the portal opens: "links" or "projects" */
  defaultView: "links" | "projects";
}

// ── Core entities ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  /** Display name, e.g. "Personal Projects" */
  name: string;
  /** Hex color for the category dot, e.g. "#3b82f6" */
  color: string;
  /** Optional short description shown in sidebar tooltip */
  description?: string;
  /** Sort order — lower = higher in sidebar */
  order: number;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  linkType: LinkType;

  /** One-line purpose, e.g. "Monthly timesheet submission" */
  purpose: string;
  /** Multi-line usage instructions */
  usageGuide: string;
  /** Known bugs, VPN requirements, deprecation warnings, etc. */
  knownIssues: string;

  tags: string[];

  status: LinkStatus;
  /** ISO date string of last health check */
  lastCheckedAt?: string;

  /** Whether this link is pinned to the top of the grid */
  pinned: boolean;
  /** ISO date string of last time the user clicked "Open" */
  lastOpenedAt?: string;

  /** Optional: group this link under a Project */
  projectId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  /** Short description (1–2 sentences) */
  description: string;
  categoryId: string;
  /** Ordered list of link IDs belonging to this project */
  linkIds: string[];
  /** Tech stack labels, e.g. ["Next.js 16", "Neon Postgres"] */
  techStack: string[];
  /** Backlog / TODO items */
  backlog: string[];
  /**
   * Free-form development notes (Markdown-flavored plain text).
   * For ideas, architecture decisions, reference links, etc.
   */
  devNotes: string;
  createdAt: string;
  updatedAt: string;
}

// ── Top-level store shape ─────────────────────────────────────────────────────

export interface PortalData {
  categories: Category[];
  links: Link[];
  projects: Project[];
  settings: PortalSettings;
  /** Schema version — bump when the shape changes */
  version: number;
}

// ── Action payloads ───────────────────────────────────────────────────────────

export type LinkInput = Omit<Link, "id" | "createdAt" | "updatedAt">;
export type CategoryInput = Omit<Category, "id">;
export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;

// ── UI helpers ────────────────────────────────────────────────────────────────

/** Preset category colors for the color picker */
export const CATEGORY_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#a78bfa", // lavender
] as const;

/** Human-readable status label + raw CSS color values for inline styles */
export const STATUS_CONFIG: Record<
  LinkStatus,
  { label: string; textColor: string; bgColor: string; dotColor: string }
> = {
  active: {
    label: "Active",
    textColor: "#4ade80",
    bgColor: "rgba(34, 197, 94, 0.10)",
    dotColor: "#22c55e",
  },
  redirected: {
    label: "Redirected",
    textColor: "#fbbf24",
    bgColor: "rgba(245, 158, 11, 0.10)",
    dotColor: "#f59e0b",
  },
  broken: {
    label: "Broken",
    textColor: "#f87171",
    bgColor: "rgba(239, 68, 68, 0.10)",
    dotColor: "#ef4444",
  },
  unchecked: {
    label: "Unchecked",
    textColor: "#a1a1aa",
    bgColor: "rgba(113, 113, 122, 0.10)",
    dotColor: "#71717a",
  },
};

/** Default settings applied on first run */
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
