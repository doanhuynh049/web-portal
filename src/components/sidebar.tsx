/**
 * Sidebar — left navigation panel.
 *
 * Sections (top → bottom):
 *  1. Logo / app title with gradient mark
 *  2. Category list with link counts (click to filter)
 *  3. Bottom: profile block, theme toggle, settings, sign-out
 */
"use client";

import Link from "next/link";
import { Settings, Sun, Moon, Monitor, LogOut, Globe } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Category, Link as LinkType, UserProfile, Theme } from "@/lib/types";

interface Props {
  categories: Category[];
  links: LinkType[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  theme: Theme;
  onToggleTheme: () => void;
  profile: UserProfile;
}

export function Sidebar({
  categories,
  links,
  activeCategoryId,
  onSelectCategory,
  theme,
  onToggleTheme,
  profile,
}: Props) {
  const sortedCategories = [...categories].sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name)
  );

  const countMap = new Map<string, number>();
  for (const link of links) {
    countMap.set(link.categoryId, (countMap.get(link.categoryId) ?? 0) + 1);
  }

  const totalLinks = links.length;
  const pinnedCount = links.filter((l) => l.pinned).length;

  return (
    <aside className="portal-sidebar">
      {/* ── Logo ── */}
      <div
        className="px-4 pt-5 pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
              boxShadow: "0 2px 10px rgba(79,131,245,0.35)",
            }}
          >
            <Globe size={16} color="#fff" />
          </div>
          <div>
            <p
              className="text-sm font-semibold leading-tight"
              style={{ color: "var(--fg)", letterSpacing: "-0.01em" }}
            >
              Web Portal
            </p>
            <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--fg-subtle)" }}>
              {totalLinks} links · {pinnedCount} pinned
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto flex flex-col gap-0.5">
        <CategoryRow
          name="All Links"
          count={totalLinks}
          active={activeCategoryId === null}
          onClick={() => onSelectCategory(null)}
          color=""
          isDot={false}
        />

        {sortedCategories.length > 0 && (
          <p
            className="px-2 mt-3 mb-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--fg-faint)" }}
          >
            Categories
          </p>
        )}

        {sortedCategories.map((cat) => (
          <CategoryRow
            key={cat.id}
            name={cat.name}
            color={cat.color}
            count={countMap.get(cat.id) ?? 0}
            active={activeCategoryId === cat.id}
            onClick={() =>
              onSelectCategory(activeCategoryId === cat.id ? null : cat.id)
            }
          />
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div
        className="px-3 py-3 flex flex-col gap-2"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* Profile */}
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
          style={{ textDecoration: "none", transition: "background 150ms ease" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--card-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 select-none"
            style={{
              background: profile.avatarIcon ? "transparent" : profile.avatarColor,
              color: "#fff",
              fontSize: profile.avatarIcon ? "16px" : undefined,
              boxShadow: "0 0 0 2px var(--border-strong)",
            }}
          >
            {profile.avatarIcon || profile.initial}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold leading-tight truncate"
              style={{ color: "var(--fg)" }}
            >
              {profile.name}
            </p>
            <p className="text-xs leading-tight mt-0.5 truncate" style={{ color: "var(--fg-subtle)" }}>
              {profile.role}
            </p>
          </div>
          <Settings size={13} style={{ color: "var(--fg-faint)", flexShrink: 0 }} />
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleTheme}
            className="btn btn-ghost btn-sm flex-1 justify-center"
            title={
              theme === "dark" ? "Dark mode" :
              theme === "light" ? "Light mode" : "System mode"
            }
            style={{ gap: 5 }}
          >
            {theme === "dark" && <><Moon size={12} /><span>Dark</span></>}
            {theme === "light" && <><Sun size={12} /><span>Light</span></>}
            {theme === "system" && <><Monitor size={12} /><span>System</span></>}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn btn-ghost btn-sm"
            title="Sign out"
            style={{ padding: "4px 8px" }}
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── CategoryRow ────────────────────────────────────────────────────────────────

function CategoryRow({
  name,
  color,
  count,
  active,
  onClick,
  isDot = true,
}: {
  name: string;
  color: string;
  count: number;
  active: boolean;
  onClick: () => void;
  isDot?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left"
      style={{
        background: active ? "var(--accent-bg)" : "transparent",
        color: active ? "var(--accent)" : "var(--fg-muted)",
        border: active ? "1px solid rgba(79,131,245,0.15)" : "1px solid transparent",
        transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--card-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {isDot ? (
        <span
          className="flex-shrink-0"
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: color,
            boxShadow: active ? `0 0 6px ${color}60` : "none",
            flexShrink: 0,
            display: "inline-block",
          }}
        />
      ) : (
        <span
          style={{
            width: 8,
            height: 8,
            flexShrink: 0,
            display: "inline-block",
            borderRadius: "50%",
            background: active ? "var(--accent)" : "var(--fg-faint)",
          }}
        />
      )}
      <span
        className="flex-1 text-xs font-medium truncate"
        style={{ letterSpacing: "-0.005em" }}
      >
        {name}
      </span>
      <span
        className="text-xs tabular-nums flex-shrink-0 px-1.5 py-0.5 rounded-md"
        style={{
          color: active ? "var(--accent)" : "var(--fg-faint)",
          background: active ? "rgba(79,131,245,0.12)" : "transparent",
          fontSize: "11px",
          fontWeight: active ? 600 : 400,
        }}
      >
        {count}
      </span>
    </button>
  );
}
