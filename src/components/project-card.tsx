/**
 * ProjectCard — full-detail card for the Projects view.
 *
 * Shows:
 *  - Project header (collapse toggle)
 *  - Links table (all link types: Dev, Prod, Repo, etc.)
 *  - Tech stack pills
 *  - Backlog / TODO list
 *  - Dev Notes — editable, free-form text for ideas & development notes
 */
"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  StickyNote,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { recordOpen, updateDevNotes } from "@/actions/links";
import type { Category, Link, Project } from "@/lib/types";
import { STATUS_CONFIG } from "@/lib/types";
import { SiteFavicon } from "./site-favicon";

interface Props {
  project: Project;
  links: Link[];
  category: Category | undefined;
  catMap: Map<string, Category>;
  onEdit: (link: Link) => void;
}

export function ProjectCard({ project, links, category, onEdit }: Props) {
  const [collapsed, setCollapsed] = useState(true);  // collapsed by default
  const [editingNotes, setEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState(project.devNotes ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSaveNotes() {
    startTransition(() => updateDevNotes(project.id, draftNotes));
    setEditingNotes(false);
  }

  function handleCancelNotes() {
    setDraftNotes(project.devNotes ?? "");
    setEditingNotes(false);
  }

  return (
    <article className="card" style={{ border: "1px solid var(--border)" }}>
      {/* ── Header (collapse toggle) ── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
        style={{ cursor: "pointer" }}
      >
        {category && <span className="cat-dot" style={{ background: category.color }} />}
        <FolderOpen size={15} style={{ color: "var(--fg-subtle)", flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {project.name}
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>
            {project.description}
          </div>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: "var(--card)", color: "var(--fg-subtle)", border: "1px solid var(--border)" }}
        >
          {links.length} link{links.length !== 1 ? "s" : ""}
        </span>
        {collapsed ? (
          <ChevronRight size={14} style={{ color: "var(--fg-subtle)", flexShrink: 0 }} />
        ) : (
          <ChevronDown size={14} style={{ color: "var(--fg-subtle)", flexShrink: 0 }} />
        )}
      </button>

      {/* ── Body ── */}
      {!collapsed && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* Links table */}
          {links.length > 0 && (
            <div className="px-5 py-3">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Type", "Title / URL", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs pb-2"
                        style={{ color: "var(--fg-faint)", fontWeight: 600, paddingRight: 12 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => {
                    const status = STATUS_CONFIG[link.status];
                    return (
                      <tr
                        key={link.id}
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <td className="py-2 pr-3">
                          <span className="link-type-pill">{link.linkType}</span>
                        </td>
                        <td className="py-2 pr-3" style={{ minWidth: 0 }}>
                          <div className="flex items-center gap-1.5">
                            <SiteFavicon url={link.url} size={14} />
                            <button
                              onClick={() => onEdit(link)}
                              className="text-xs font-medium truncate max-w-xs hover:underline text-left"
                              style={{ color: "var(--fg-muted)" }}
                            >
                              {link.title}
                            </button>
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono block truncate max-w-xs mt-0.5 hover:underline"
                            style={{ color: "var(--accent)", textDecoration: "none" }}
                            title={link.url}
                          >
                            {link.url}
                          </a>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="status-dot"
                              style={{ background: status.dotColor, flexShrink: 0 }}
                            />
                            <span className="text-xs" style={{ color: status.textColor }}>
                              {status.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => {
                              window.open(link.url, "_blank", "noopener,noreferrer");
                              startTransition(() => recordOpen(link.id));
                            }}
                            className="btn btn-ghost btn-sm"
                            title="Open"
                          >
                            <ExternalLink size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tech stack */}
          {project.techStack.length > 0 && (
            <div
              className="px-5 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-faint)" }}>
                Stack
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.techStack.map((tech) => (
                  <span key={tech} className="link-type-pill">{tech}</span>
                ))}
              </div>
            </div>
          )}

          {/* Backlog */}
          {project.backlog.length > 0 && (
            <div
              className="px-5 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-faint)" }}>
                Backlog
              </p>
              <ul className="flex flex-col gap-1">
                {project.backlog.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: "var(--fg-faint)" }}
                    />
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Dev Notes ── */}
          <div
            className="px-5 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <StickyNote size={12} style={{ color: "var(--fg-faint)" }} />
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--fg-faint)" }}
              >
                Dev Notes
              </p>
              {!editingNotes && (
                <span className="text-xs ml-1" style={{ color: "var(--fg-faint)" }}>
                  — click to edit
                </span>
              )}
            </div>

            {editingNotes ? (
              <div className="flex flex-col gap-2">
                <textarea
                  className="input"
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Ideas, architecture notes, references, TODOs… (plain text or Markdown)"
                  rows={5}
                  autoFocus
                  style={{ resize: "vertical", fontFamily: "ui-monospace, monospace", fontSize: 12 }}
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveNotes} className="btn btn-primary btn-sm" disabled={isPending}>
                    <Check size={12} /> Save Notes
                  </button>
                  <button onClick={handleCancelNotes} className="btn btn-ghost btn-sm">
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Click anywhere on the notes display to enter edit mode */
              <button
                onClick={() => { setDraftNotes(project.devNotes ?? ""); setEditingNotes(true); }}
                className="w-full text-left rounded-md px-2 py-1.5 transition-colors"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--card-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                title="Click to edit dev notes"
              >
                {project.devNotes ? (
                  <pre
                    className="text-xs leading-relaxed whitespace-pre-wrap text-left"
                    style={{ color: "var(--fg-muted)", fontFamily: "ui-monospace, monospace" }}
                  >
                    {project.devNotes}
                  </pre>
                ) : (
                  <p className="text-xs italic flex items-center gap-1.5" style={{ color: "var(--fg-faint)" }}>
                    <Pencil size={11} />
                    Click to add ideas, architecture decisions, or references…
                  </p>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
