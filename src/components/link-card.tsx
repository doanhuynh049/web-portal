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
    startTransition(() => { recordOpen(link.id); });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
    startTransition(() => { togglePin(link.id); });
  }

  function handleDelete() {
    if (!confirm(`Delete "${link.title}"? This cannot be undone.`)) return;
    startTransition(() => { deleteLink(link.id); });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <article
      className="card flex flex-col"
      style={{
        opacity: isPending ? 0.55 : 1,
        transition: "opacity 200ms ease",
        borderLeft: category ? `3px solid ${category.color}40` : undefined,
        animation: "fadeIn 200ms ease",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5">
        {/* Title row */}
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 rounded-lg overflow-hidden mt-0.5"
            style={{
              width: 28,
              height: 28,
              background: "var(--card-hover)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SiteFavicon url={link.url} size={18} customIconUrl={link.customIconUrl} />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-semibold leading-snug"
              style={{ color: "var(--fg)", letterSpacing: "-0.01em" }}
            >
              {link.title}
            </h3>
          </div>
          {/* Status pill */}
          <span
            className="pill flex-shrink-0"
            style={{
              background: status.bgColor,
              color: status.textColor,
              fontSize: "10.5px",
              padding: "2px 7px",
            }}
          >
            <span
              className="status-dot"
              style={{ background: status.dotColor, width: 5, height: 5 }}
            />
            {status.label}
          </span>
        </div>

        {/* URL */}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-mono truncate block"
          style={{
            color: "var(--accent)",
            textDecoration: "none",
            opacity: 0.85,
            transition: "opacity 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
          title={link.url}
        >
          {link.url}
        </a>

        {/* Meta */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="link-type-pill">{link.linkType}</span>
          {link.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="pill"
              style={{
                background: "var(--card-hover)",
                color: "var(--fg-subtle)",
                border: "1px solid var(--border)",
                fontSize: "10.5px",
                padding: "1px 6px",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Purpose */}
        {link.purpose && (
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--fg-subtle)", marginTop: -2 }}
          >
            {link.purpose}
          </p>
        )}
      </div>

      {/* Expandable details */}
      {expanded && (
        <div
          className="px-4 pb-3 flex flex-col gap-3"
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 12,
            animation: "fadeIn 150ms ease",
          }}
        >
          {link.usageGuide && (
            <DetailBlock label="Usage Guide" text={link.usageGuide} />
          )}
          {link.knownIssues && (
            <DetailBlock label="Known Issues" text={link.knownIssues} textColor="#fbbf24" />
          )}
          {link.lastOpenedAt && (
            <p className="text-xs" style={{ color: "var(--fg-faint)" }}>
              Last opened: {formatDate(link.lastOpenedAt)}
            </p>
          )}
          {link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
        <button onClick={handleOpen} className="btn btn-primary btn-sm">
          <ExternalLink size={11} />
          Open
        </button>

        <button onClick={handleCopy} className="btn btn-ghost btn-sm" title="Copy URL">
          {copied
            ? <Check size={11} style={{ color: "#22c55e" }} />
            : <Copy size={11} />
          }
        </button>

        {hasDetails && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="btn btn-ghost btn-sm"
            title={expanded ? "Collapse" : "Expand details"}
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={handlePin}
          className="btn btn-ghost btn-sm"
          title={link.pinned ? "Unpin" : "Pin"}
        >
          {link.pinned
            ? <PinOff size={11} style={{ color: "var(--accent)" }} />
            : <Pin size={11} />
          }
        </button>

        <button
          onClick={() => onEdit(link)}
          className="btn btn-ghost btn-sm"
          title="Edit"
        >
          <Pencil size={11} />
        </button>

        <button
          onClick={handleDelete}
          className="btn btn-ghost btn-sm"
          title="Delete"
          style={{ color: "var(--fg-faint)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--fg-faint)"; }}
        >
          <Trash2 size={11} />
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
    <div>
      <p
        className="text-xs font-semibold mb-1"
        style={{
          color: "var(--fg-faint)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "10px",
        }}
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
