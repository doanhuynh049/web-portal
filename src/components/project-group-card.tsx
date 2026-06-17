/**
 * ProjectGroupCard — displays all links for a project as ONE card with a
 * mode tab bar (Local Dev | Production | Repository | …).
 *
 * Instead of showing separate cards for localhost:4962 and the Vercel URL,
 * this component groups them under the project name with a tab selector.
 *
 * Visual structure:
 * ┌────────────────────────────────────────────────────────┐
 * │ ● VN Stocks Dashboard              [Personal Projects] │
 * │ ─────────────────────────────────────────────────────  │
 * │ [Dev ●] [Prod] [Repo]                                  │
 * │                                                        │
 * │ http://localhost:4962                                  │
 * │ Local Next.js dev server                               │
 * │                                                        │
 * │ [Open]  [Copy]                    [Pin] [Edit] [Del]   │
 * └────────────────────────────────────────────────────────┘
 */
"use client";

import { useState, useTransition } from "react";
import {
  ExternalLink,
  Copy,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { togglePin, deleteLink, recordOpen } from "@/actions/links";
import type { Category, Link, Project } from "@/lib/types";
import { STATUS_CONFIG, PROJECT_TAB_ORDER } from "@/lib/types";
import { SiteFavicon } from "./site-favicon";

interface Props {
  project: Project;
  links: Link[];
  category: Category | undefined;
  onEdit: (link: Link) => void;
}

export function ProjectGroupCard({ project, links, category, onEdit }: Props) {
  // Sort links by canonical tab order
  const sorted = [...links].sort((a, b) => {
    const ai = PROJECT_TAB_ORDER.indexOf(a.linkType);
    const bi = PROJECT_TAB_ORDER.indexOf(b.linkType);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const [activeIdx, setActiveIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const active = sorted[activeIdx] ?? sorted[0];
  if (!active) return null;

  const status = STATUS_CONFIG[active.status];
  const hasDetails = active.usageGuide || active.knownIssues;

  // ── Actions ─────────────────────────────────────────────────────────────────

  function handleOpen() {
    window.open(active.url, "_blank", "noopener,noreferrer");
    startTransition(() => recordOpen(active.id));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(active.url);
    } catch {
      const el = document.createElement("textarea");
      el.value = active.url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePin() {
    startTransition(() => togglePin(active.id));
  }

  function handleDelete() {
    if (!confirm(`Delete "${active.title}"?`)) return;
    startTransition(() => deleteLink(active.id));
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <article
      className="card flex flex-col"
      style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 200ms" }}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3">
        {/* Project title row — show favicon of the first/active link */}
        <div className="flex items-center gap-2.5 mb-2">
          <SiteFavicon url={active.url} size={24} className="flex-shrink-0" />
          <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--fg)" }}>
            {project.name}
          </span>
          {category && (
            <span
              className="text-xs flex-shrink-0"
              style={{ color: "var(--fg-faint)" }}
            >
              <span className="cat-dot inline-block mr-1" style={{ background: category.color }} />
              {category.name}
            </span>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1">
          {sorted.map((link, i) => {
            const st = STATUS_CONFIG[link.status];
            const isActive = i === activeIdx;
            return (
              <button
                key={link.id}
                onClick={() => setActiveIdx(i)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: isActive ? "var(--accent-bg)" : "var(--card)",
                  color: isActive ? "var(--accent)" : "var(--fg-muted)",
                  border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                <span
                  className="status-dot"
                  style={{ background: st.dotColor, width: 5, height: 5 }}
                />
                {link.linkType}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active link body ── */}
      <div
        className="px-4 pb-3 flex flex-col gap-2"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* URL row */}
        <div className="flex items-center gap-2 pt-2">
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono flex-1 truncate hover:underline"
            style={{ color: "var(--accent)", textDecoration: "none" }}
            title={active.url}
          >
            {active.url}
          </a>
          <span
            className="pill flex-shrink-0"
            style={{ background: status.bgColor, color: status.textColor }}
          >
            {status.label}
          </span>
        </div>

        {/* Purpose */}
        {active.purpose && (
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            {active.purpose}
          </p>
        )}

        {/* Expanded details */}
        {expanded && hasDetails && (
          <div className="flex flex-col gap-2 pt-1">
            {active.usageGuide && (
              <div>
                <p
                  className="text-xs font-semibold mb-0.5 uppercase tracking-wider"
                  style={{ color: "var(--fg-faint)" }}
                >
                  Usage
                </p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  {active.usageGuide}
                </p>
              </div>
            )}
            {active.knownIssues && (
              <div>
                <p
                  className="text-xs font-semibold mb-0.5 uppercase tracking-wider"
                  style={{ color: "var(--fg-faint)" }}
                >
                  Issues
                </p>
                <p className="text-xs" style={{ color: "#fbbf24" }}>
                  {active.knownIssues}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Actions footer ── */}
      <div
        className="flex items-center gap-1 px-3 py-2.5"
        style={{ borderTop: "1px solid var(--border)", marginTop: "auto" }}
      >
        <button onClick={handleOpen} className="btn btn-primary btn-sm">
          <ExternalLink size={12} />
          Open
        </button>
        <button onClick={handleCopy} className="btn btn-ghost btn-sm" title="Copy URL">
          {copied ? (
            <Check size={12} style={{ color: "#22c55e" }} />
          ) : (
            <Copy size={12} />
          )}
        </button>
        {hasDetails && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="btn btn-ghost btn-sm"
            title={expanded ? "Collapse" : "Details"}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}

        <div className="flex-1" />

        <button onClick={handlePin} className="btn btn-ghost btn-sm" title={active.pinned ? "Unpin" : "Pin"}>
          {active.pinned ? (
            <PinOff size={12} style={{ color: "var(--accent)" }} />
          ) : (
            <Pin size={12} />
          )}
        </button>
        <button onClick={() => onEdit(active)} className="btn btn-ghost btn-sm" title="Edit link">
          <Pencil size={12} />
        </button>
        <button onClick={handleDelete} className="btn btn-ghost btn-sm" title="Delete">
          <Trash2 size={12} style={{ color: "#ef4444" }} />
        </button>
      </div>
    </article>
  );
}
