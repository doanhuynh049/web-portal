/**
 * Sidebar — left navigation panel.
 *
 * Sections (top → bottom):
 *  1. Logo / app title
 *  2. Category list with link counts (click to filter)
 *  3. Summary stats
 *  4. Profile block, theme toggle, settings link  ← bottom-left
 */
"use client";

import Link from "next/link";
import { Settings, Sun, Moon, Monitor, Check, LogOut } from "lucide-react";
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
  // Sort categories by order, then name
  const sortedCategories = [...categories].sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name)
  );

  // Count links per category
  const countMap = new Map<string, number>();
  for (const link of links) {
    countMap.set(link.categoryId, (countMap.get(link.categoryId) ?? 0) + 1);
  }

  const totalLinks = links.length;
  const brokenCount = links.filter((l) => l.status === "broken").length;

  return (
    <aside className="portal-sidebar">
      {/* ── App logo ── */}
      <div className="px-4 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: "var(--accent)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt=""
              width={20}
              height={20}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) parent.textContent = "W";
              }}
              style={{ objectFit: "contain" }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight" style={{ color: "var(--fg)" }}>
              Web Portal
            </p>
            <p className="text-xs leading-tight" style={{ color: "var(--fg-subtle)" }}>
              {totalLinks} links
            </p>
          </div>
        </div>
      </div>

      {/* ── Category list ── */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {/* "All" row */}
        <CategoryRow
          name="All Links"
          color="var(--fg-faint)"
          count={totalLinks}
          active={activeCategoryId === null}
          onClick={() => onSelectCategory(null)}
          isDot={false}
        />

        {sortedCategories.length > 0 && (
          <div
            className="mt-2 mb-1 px-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--fg-faint)" }}
          >
            Categories
          </div>
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

      {/* ── Summary stats ── */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex flex-col gap-1.5">
          <StatRow label="Categories" value={categories.length} />
          <StatRow label="Total links" value={totalLinks} />
          {brokenCount > 0 && (
            <StatRow label="Broken" value={brokenCount} valueColor="#f87171" />
          )}
        </div>
      </div>

      {/* ── Bottom: profile + theme + settings ── */}
      <div className="px-3 py-3 flex flex-col gap-2">
        {/* Profile card */}
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors"
          style={{ textDecoration: "none" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--card-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 select-none"
            style={{ background: profile.avatarIcon ? "transparent" : profile.avatarColor, color: "#fff", fontSize: profile.avatarIcon ? "18px" : undefined }}
          >
            {profile.avatarIcon || profile.initial}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium leading-tight truncate"
              style={{ color: "var(--fg)" }}
            >
              {profile.name}
            </p>
            <p className="text-xs leading-tight truncate" style={{ color: "var(--fg-subtle)" }}>
              {profile.role}
            </p>
          </div>
        </Link>

        {/* Actions row: theme toggle + settings + sign-out */}
        <div className="flex items-center gap-1">
          {/* Theme toggle — cycles dark → light → system */}
          <button
            onClick={onToggleTheme}
            className="btn btn-ghost btn-sm flex-1 justify-center"
            title={
              theme === "dark" ? "Dark mode (click for Light)" :
              theme === "light" ? "Light mode (click for System)" :
              "System mode (click for Dark)"
            }
          >
            {theme === "dark" && <><Moon size={13} /> Dark</>}
            {theme === "light" && <><Sun size={13} /> Light</>}
            {theme === "system" && <><Monitor size={13} /> System</>}
          </button>

          {/* Settings link */}
          <Link href="/settings" className="btn btn-ghost btn-sm" title="Settings" style={{ textDecoration: "none" }}>
            <Settings size={13} />
          </Link>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn btn-ghost btn-sm"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors"
      style={{
        background: active ? "var(--accent-bg)" : "transparent",
        color: active ? "var(--accent)" : "var(--fg-muted)",
      }}
    >
      {isDot ? (
        <span className="cat-dot flex-shrink-0" style={{ background: color }} />
      ) : (
        <span className="w-2 h-2 flex-shrink-0" />
      )}
      <span className="flex-1 text-xs font-medium truncate">{name}</span>
      <span
        className="text-xs tabular-nums flex-shrink-0"
        style={{ color: active ? "var(--accent)" : "var(--fg-faint)" }}
      >
        {count}
      </span>
      {active && (
        <Check size={11} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
      )}
    </button>
  );
}

function StatRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: number;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
        {label}
      </span>
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color: valueColor ?? "var(--fg-muted)" }}
      >
        {value}
      </span>
    </div>
  );
}
