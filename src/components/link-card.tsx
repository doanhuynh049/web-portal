/**
 * LinkCard — displays a single link with status, category, quick actions,
 * and an expandable details section (usage guide, known issues, tags).
 *
 * Actions:
 *  Open    — window.open + recordOpen server action
 *  Copy    — navigator.clipboard + toast feedback
 *  Pin     — togglePin server action
 *  Edit    — opens LinkDialog pre-filled
 *  Delete  — deleteLink server action with confirm
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
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { togglePin, deleteLink, recordOpen } from "@/actions/links";
import type { Category, Link } from "@/lib/types";
import { STATUS_CONFIG } from "@/lib/types";
import { SiteFavicon } from "./site-favicon";

interface Props {
  link: Link;
  category: Category | undefined;
  onEdit: (link: Link) => void;
}

export function LinkCard({ link, category, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const status = STATUS_CONFIG[link.status];
  const hasDetails = link.usageGuide || link.knownIssues || link.tags.length > 0;

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleOpen() {
    window.open(link.url, "_blank", "noopener,noreferrer");
    startTransition(() => {
      recordOpen(link.id);
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = link.url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handlePin() {
    startTransition(() => {
      togglePin(link.id);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${link.title}"? This cannot be undone.`)) return;
    startTransition(() => {
      deleteLink(link.id);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <article
      className="card flex flex-col"
      style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 200ms" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex flex-col gap-2">
        {/* Title row */}
        <div className="flex items-start gap-2.5">
          {/* Favicon — prominent at 24px */}
          <SiteFavicon url={link.url} size={24} className="mt-0.5 flex-shrink-0" customIconUrl={link.customIconUrl} />
          <h3
            className="text-sm font-semibold flex-1 leading-snug"
            style={{ color: "var(--fg)" }}
          >
            {link.title}
          </h3>
          {/* Status */}
          <span
            className="pill flex-shrink-0"
            style={{ background: status.bgColor, color: status.textColor }}
          >
            <span
              className="status-dot"
              style={{ background: status.dotColor, width: 5, height: 5 }}
            />
            {status.label}
          </span>
        </div>

        {/* Category + URL row */}
        <div className="flex items-center gap-2">
          {category && (
            <span
              className="cat-dot flex-shrink-0"
              style={{ background: category.color }}
              title={category.name}
            />
          )}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono truncate flex-1 hover:underline"
            style={{ color: "var(--accent)", textDecoration: "none" }}
            title={link.url}
            onClick={(e) => e.stopPropagation()}
          >
            {link.url}
          </a>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="link-type-pill">{link.linkType}</span>
          {link.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs"
              style={{ color: "var(--fg-faint)" }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Purpose */}
        {link.purpose && (
          <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            {link.purpose}
          </p>
        )}
      </div>

      {/* Expandable details */}
      {expanded && (
        <div
          className="px-4 pb-3 flex flex-col gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {link.usageGuide && (
            <DetailBlock label="Usage Guide" text={link.usageGuide} />
          )}
          {link.knownIssues && (
            <DetailBlock
              label="Known Issues"
              text={link.knownIssues}
              textColor="#fbbf24"
            />
          )}
          {link.lastOpenedAt && (
            <p className="text-xs" style={{ color: "var(--fg-faint)" }}>
              Last opened: {formatDate(link.lastOpenedAt)}
            </p>
          )}
          {link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {link.tags.map((tag) => (
                <span
                  key={tag}
                  className="pill"
                  style={{
                    background: "var(--card)",
                    color: "var(--fg-subtle)",
                    border: "1px solid var(--border)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions footer */}
      <div
        className="flex items-center gap-1 px-3 py-2.5"
        style={{ borderTop: "1px solid var(--border)", marginTop: "auto" }}
      >
        {/* Primary: Open */}
        <button onClick={handleOpen} className="btn btn-primary btn-sm">
          <ExternalLink size={12} />
          Open
        </button>

        {/* Copy */}
        <button onClick={handleCopy} className="btn btn-ghost btn-sm" title="Copy URL">
          {copied ? <Check size={12} style={{ color: "#22c55e" }} /> : <Copy size={12} />}
        </button>

        {/* Expand / collapse */}
        {hasDetails && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="btn btn-ghost btn-sm"
            title={expanded ? "Collapse" : "Expand details"}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pin */}
        <button onClick={handlePin} className="btn btn-ghost btn-sm" title={link.pinned ? "Unpin" : "Pin"}>
          {link.pinned ? (
            <PinOff size={12} style={{ color: "var(--accent)" }} />
          ) : (
            <Pin size={12} />
          )}
        </button>

        {/* Edit */}
        <button onClick={() => onEdit(link)} className="btn btn-ghost btn-sm" title="Edit">
          <Pencil size={12} />
        </button>

        {/* Delete */}
        <button onClick={handleDelete} className="btn btn-ghost btn-sm" title="Delete">
          <Trash2 size={12} style={{ color: "#ef4444" }} />
        </button>
      </div>
    </article>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function DetailBlock({
  label,
  text,
  textColor,
}: {
  label: string;
  text: string;
  textColor?: string;
}) {
  return (
    <div className="pt-2">
      <p
        className="text-xs font-semibold mb-1"
        style={{ color: "var(--fg-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}
      >
        {label}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: textColor ?? "var(--fg-muted)" }}>
        {text}
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
