/**
 * PortalApp — main client shell.
 *
 * Data flow:
 *  page.tsx (Server) → PortalApp (Client) ← all data as props
 *
 * State:
 *  - search / activeCategoryId / viewMode  → in memory, never persisted
 *  - theme                                  → localStorage + CSS class on <html>
 *  - mutations                              → Server Actions (revalidatePath re-renders page)
 */
"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, LayoutGrid, FolderOpen } from "lucide-react";
import type { PortalData, Category, Link, Project, Theme } from "@/lib/types";
import { saveSettings } from "@/actions/links";
import { Sidebar } from "./sidebar";
import { LinkCard } from "./link-card";
import { ProjectCard } from "./project-card";
import { ProjectGroupCard } from "./project-group-card";
import { LinkDialog } from "./link-dialog";
import { StatsBar } from "./stats-bar";

type ViewMode = "links" | "projects";

interface Props { data: PortalData }

export function PortalApp({ data }: Props) {
  const { links, categories, projects } = data;
  // Guard against stale data files that pre-date the settings field
  const settings = data.settings ?? {
    theme: "dark" as const,
    defaultView: "links" as const,
    profile: { name: "My Portal", initial: "M", avatarColor: "#3b82f6", role: "Developer" },
  };

  // ── Theme ─────────────────────────────────────────────────────────────────
  // Always boot from localStorage so server re-renders (revalidatePath) never
  // flash the wrong theme. "dark" is the SSR default (no class = dark).
  const [theme, setTheme] = useState<Theme>("dark");

  function applyThemeClass(t: Theme) {
    const root = document.documentElement;
    const isDark =
      t === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : t === "dark";
    if (isDark) root.classList.remove("light");
    else root.classList.add("light");
  }

  // On first mount: read localStorage → apply class.
  useEffect(() => {
    const saved = (localStorage.getItem("portal-theme") as Theme | null) ?? settings.theme ?? "dark";
    setTheme(saved);
    applyThemeClass(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When theme is "system", listen for OS preference changes.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyThemeClass("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleToggleTheme() {
    const cycle: Record<Theme, Theme> = { dark: "light", light: "system", system: "dark" };
    const next = cycle[theme];
    setTheme(next);
    applyThemeClass(next);
    localStorage.setItem("portal-theme", next);
    saveSettings({ ...settings, theme: next });
  }

  // ── UI state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(
    (settings.defaultView as ViewMode) ?? "links"
  );
  const [showDialog, setShowDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  // ── Derived data ───────────────────────────────────────────────────────────
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const projMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const filteredLinks = useMemo(() => {
    const q = search.toLowerCase().trim();
    return links.filter((link) => {
      const matchCat = !activeCategoryId || link.categoryId === activeCategoryId;
      const matchSearch =
        !q ||
        link.title.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q) ||
        link.purpose.toLowerCase().includes(q) ||
        link.tags.some((t) => t.toLowerCase().includes(q)) ||
        link.linkType.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [links, activeCategoryId, search]);

  const brokenLinks = useMemo(() => links.filter((l) => l.status === "broken"), [links]);

  // ── Project grouping ───────────────────────────────────────────────────────
  // ALL project links are grouped into ProjectGroupCard regardless of pinned.
  // A project group is "pinned" when at least one of its links is pinned,
  // and is shown in the Pinned section at the top.
  const { pinnedGroups, pinnedLinks, regularGroups, standaloneLinks } = useMemo(() => {
    const grouped = new Map<string, Link[]>();
    const standalone: Link[] = [];

    for (const link of filteredLinks) {
      if (link.projectId && projMap.has(link.projectId)) {
        const arr = grouped.get(link.projectId) ?? [];
        arr.push(link);
        grouped.set(link.projectId, arr);
      } else {
        standalone.push(link);
      }
    }

    const allGroups = projects
      .filter((p) => grouped.has(p.id))
      .map((p) => ({ project: p, links: grouped.get(p.id)! }));

    return {
      pinnedGroups:    allGroups.filter((g) => g.links.some((l) => l.pinned)),
      regularGroups:   allGroups.filter((g) => g.links.every((l) => !l.pinned)),
      pinnedLinks:     standalone.filter((l) => l.pinned),
      standaloneLinks: standalone.filter((l) => !l.pinned),
    };
  }, [filteredLinks, projMap, projects]);

  // ── Dialog ─────────────────────────────────────────────────────────────────
  const openEdit = (link: Link) => { setEditingLink(link); setShowDialog(true); };
  const closeDialog = () => { setShowDialog(false); setEditingLink(null); };

  const isEmpty = filteredLinks.length === 0;

  return (
    <div className="portal-layout">
      <Sidebar
        categories={categories}
        links={links}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        profile={settings.profile}
      />

      <main className="portal-main">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--fg-subtle)" }}
            />
            <input
              className="input pl-8"
              type="search"
              placeholder="Search links, tags, or notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* View toggle */}
          <div
            className="flex items-center gap-1 rounded-lg p-1"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {(["links", "projects"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="btn btn-sm"
                style={{
                  background: viewMode === mode ? "var(--border-strong)" : "transparent",
                  color: viewMode === mode ? "var(--fg)" : "var(--fg-subtle)",
                }}
              >
                {mode === "links" ? <LayoutGrid size={13} /> : <FolderOpen size={13} />}
                {mode === "links" ? "Links" : "Projects"}
              </button>
            ))}
          </div>

          <button onClick={() => { setEditingLink(null); setShowDialog(true); }} className="btn btn-primary btn-sm">
            <Plus size={14} />
            Add Link
          </button>
        </div>

        <StatsBar
          totalLinks={links.length}
          pinnedCount={links.filter((l) => l.pinned).length}
          brokenCount={brokenLinks.length}
          categoryCount={categories.length}
        />

        {/* Broken links warning */}
        {brokenLinks.length > 0 && !activeCategoryId && !search && (
          <div
            className="rounded-lg px-4 py-3 mb-5 text-sm"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
            }}
          >
            <span style={{ fontWeight: 600 }}>
              {brokenLinks.length} broken link{brokenLinks.length > 1 ? "s" : ""}:
            </span>{" "}
            {brokenLinks.map((l) => l.title).join(", ")}
          </div>
        )}

        {/* ── Links view ── */}
        {viewMode === "links" && (
          <LinksView
            pinnedGroups={pinnedGroups}
            pinnedLinks={pinnedLinks}
            regularGroups={regularGroups}
            standaloneLinks={standaloneLinks}
            catMap={catMap}
            activeCategoryId={activeCategoryId}
            search={search}
            isEmpty={isEmpty}
            onEdit={openEdit}
          />
        )}

        {/* ── Projects view ── */}
        {viewMode === "projects" && (
          <ProjectsView
            projects={projects}
            links={links}
            catMap={catMap}
            onEdit={openEdit}
          />
        )}
      </main>

      {showDialog && (
        <LinkDialog
          link={editingLink}
          categories={categories}
          projects={projects}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}

// ── Links view ─────────────────────────────────────────────────────────────────

function LinksView({
  pinnedGroups,
  pinnedLinks,
  regularGroups,
  standaloneLinks,
  catMap,
  activeCategoryId,
  search,
  isEmpty,
  onEdit,
}: {
  pinnedGroups: { project: Project; links: Link[] }[];
  pinnedLinks: Link[];
  regularGroups: { project: Project; links: Link[] }[];
  standaloneLinks: Link[];
  catMap: Map<string, Category>;
  activeCategoryId: string | null;
  search: string;
  isEmpty: boolean;
  onEdit: (link: Link) => void;
}) {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center" style={{ color: "var(--fg-subtle)" }}>
        <Search size={36} className="mb-3 opacity-30" />
        <p className="text-base font-medium" style={{ color: "var(--fg-muted)" }}>
          {search ? `No links matching "${search}"` : "No links in this category"}
        </p>
        <p className="text-sm mt-1">
          {search ? "Try a different search term." : "Use + Add Link to get started."}
        </p>
      </div>
    );
  }

  const allLabel = activeCategoryId
    ? (catMap.get(activeCategoryId)?.name ?? "Links")
    : search ? "Search Results" : "All Links";

  const hasPinned = pinnedGroups.length > 0 || pinnedLinks.length > 0;
  const hasRegular = regularGroups.length > 0 || standaloneLinks.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Pinned section ── */}
      {hasPinned && (
        <section>
          <SectionHeading label="Pinned" count={pinnedGroups.length + pinnedLinks.length} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {pinnedGroups.map(({ project, links }) => (
              <ProjectGroupCard key={project.id} project={project} links={links} category={catMap.get(project.categoryId)} onEdit={onEdit} />
            ))}
            {pinnedLinks.map((link) => (
              <LinkCard key={link.id} link={link} category={catMap.get(link.categoryId)} onEdit={onEdit} />
            ))}
          </div>
        </section>
      )}

      {/* ── All / filtered section ── */}
      {hasRegular && (
        <section>
          <SectionHeading label={allLabel} count={regularGroups.length + standaloneLinks.length} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {regularGroups.map(({ project, links }) => (
              <ProjectGroupCard key={project.id} project={project} links={links} category={catMap.get(project.categoryId)} onEdit={onEdit} />
            ))}
            {standaloneLinks.map((link) => (
              <LinkCard key={link.id} link={link} category={catMap.get(link.categoryId)} onEdit={onEdit} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Projects view ──────────────────────────────────────────────────────────────

function ProjectsView({
  projects,
  links,
  catMap,
  onEdit,
}: {
  projects: Project[];
  links: Link[];
  catMap: Map<string, Category>;
  onEdit: (link: Link) => void;
}) {
  const linkMap = useMemo(() => new Map(links.map((l) => [l.id, l])), [links]);

  if (projects.length === 0) {
    return (
      <div className="text-center py-20" style={{ color: "var(--fg-subtle)" }}>
        <FolderOpen size={36} className="mx-auto mb-3 opacity-30" />
        <p style={{ color: "var(--fg-muted)" }}>No projects yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {projects.map((project) => {
        const projectLinks = project.linkIds
          .map((id) => linkMap.get(id))
          .filter((l): l is Link => l != null);
        return (
          <ProjectCard
            key={project.id}
            project={project}
            links={projectLinks}
            category={catMap.get(project.categoryId)}
            catMap={catMap}
            onEdit={onEdit}
          />
        );
      })}
    </div>
  );
}

// ── Shared ─────────────────────────────────────────────────────────────────────

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-sm font-semibold" style={{ color: "var(--fg-muted)" }}>{label}</h2>
      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--card)", color: "var(--fg-subtle)", border: "1px solid var(--border)" }}>
        {count}
      </span>
    </div>
  );
}

function LinkGrid({ links, catMap, onEdit }: { links: Link[]; catMap: Map<string, Category>; onEdit: (l: Link) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
      {links.map((link) => (
        <LinkCard key={link.id} link={link} category={catMap.get(link.categoryId)} onEdit={onEdit} />
      ))}
    </div>
  );
}
