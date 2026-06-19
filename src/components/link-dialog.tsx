/**
 * LinkDialog — modal dialog for creating and editing links.
 *
 * When `link` is null, renders an "Add New Link" form.
 * When `link` is provided, pre-fills the form for editing.
 *
 * On submit, calls addLink() or updateLink() Server Action.
 * The dialog closes after the action completes.
 */
"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { addLink, updateLink } from "@/actions/links";
import type { Category, Link, Project, LinkStatus, LinkType } from "@/lib/types";
import { LINK_TYPES } from "@/lib/types";

interface Props {
  /** null → Add mode; Link → Edit mode */
  link: Link | null;
  categories: Category[];
  projects: Project[];
  onClose: () => void;
  /** Pre-fill Project when opening from a ProjectGroupCard's + button */
  defaultProjectId?: string;
}

/** Initial blank form state */
const BLANK = {
  title: "",
  url: "",
  categoryId: "",
  linkType: "Local Dev" as LinkType,
  purpose: "",
  usageGuide: "",
  knownIssues: "",
  tags: "",
  status: "active" as LinkStatus,
  pinned: false,
  projectId: "",
  customIconUrl: "",
};

export function LinkDialog({ link, categories, projects, onClose, defaultProjectId }: Props) {
  const isEdit = link !== null;
  const [isPending, startTransition] = useTransition();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState(() => {
    if (!isEdit) return { ...BLANK, projectId: defaultProjectId ?? "" };
    return {
      title: link.title,
      url: link.url,
      categoryId: link.categoryId,
      linkType: link.linkType,
      purpose: link.purpose,
      usageGuide: link.usageGuide,
      knownIssues: link.knownIssues,
      tags: link.tags.join(", "),
      status: link.status,
      pinned: link.pinned,
      projectId: link.projectId ?? "",
      customIconUrl: link.customIconUrl ?? "",
    };
  });

  const [error, setError] = useState("");

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function set<K extends keyof typeof BLANK>(key: K, value: (typeof BLANK)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function parseTags(raw: string): string[] {
    return raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.url.trim()) return setError("URL is required.");
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.categoryId) return setError("Please select a category.");
    setError("");

    const payload = {
      title: form.title.trim(),
      url: form.url.trim(),
      categoryId: form.categoryId,
      linkType: form.linkType,
      purpose: form.purpose.trim(),
      usageGuide: form.usageGuide.trim(),
      knownIssues: form.knownIssues.trim(),
      tags: parseTags(form.tags),
      status: form.status,
      pinned: form.pinned,
      projectId: form.projectId || undefined,
      customIconUrl: form.customIconUrl.trim() || undefined,
    };

    startTransition(async () => {
      if (isEdit) {
        await updateLink(link.id, payload);
      } else {
        await addLink(payload);
      }
      onClose();
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog">
        {/* Dialog header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>
            {isEdit ? "Edit Link" : "Add New Link"}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: "4px" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* URL + Title */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="URL *">
              <input
                className="input"
                type="url"
                placeholder="https://portal.hitachi.com"
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
                autoFocus={!isEdit}
              />
            </Field>
            <Field label="Title *">
              <input
                className="input"
                type="text"
                placeholder="Hitachi Portal"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
          </div>

          {/* Category + Link Type */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category *">
              <select
                className="input"
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Link Type">
              <select
                className="input"
                value={form.linkType}
                onChange={(e) => set("linkType", e.target.value as LinkType)}
              >
                {LINK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Purpose + Custom Icon */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purpose">
              <input
                className="input"
                type="text"
                placeholder="What is this link for? (one line)"
                value={form.purpose}
                onChange={(e) => set("purpose", e.target.value)}
              />
            </Field>
            <Field label="Custom Icon URL">
              <input
                className="input"
                type="url"
                placeholder="https://example.com/icon.png"
                value={form.customIconUrl}
                onChange={(e) => set("customIconUrl", e.target.value)}
              />
            </Field>
          </div>

          {/* Usage Guide + Known Issues */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Usage Guide">
              <textarea
                className="input"
                rows={2}
                placeholder="How to use this link…"
                value={form.usageGuide}
                onChange={(e) => set("usageGuide", e.target.value)}
                style={{ resize: "vertical" }}
              />
            </Field>
            <Field label="Known Issues">
              <textarea
                className="input"
                rows={2}
                placeholder="Requires VPN, slow on mobile…"
                value={form.knownIssues}
                onChange={(e) => set("knownIssues", e.target.value)}
                style={{ resize: "vertical" }}
              />
            </Field>
          </div>

          {/* Tags + Status + Project */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tags">
              <input
                className="input"
                type="text"
                placeholder="hr, vpn, timesheet"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
              />
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={form.status}
                onChange={(e) => set("status", e.target.value as LinkStatus)}
              >
                <option value="active">Active</option>
                <option value="redirected">Redirected</option>
                <option value="broken">Broken</option>
                <option value="unchecked">Unchecked</option>
              </select>
            </Field>
            <Field label="Project (optional)">
              <select
                className="input"
                value={form.projectId}
                onChange={(e) => set("projectId", e.target.value)}
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Pinned toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => set("pinned", e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
              Pin this link (show at top)
            </span>
          </label>

          {/* Error message */}
          {error && (
            <p className="text-sm" style={{ color: "#f87171" }}>
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Link"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
