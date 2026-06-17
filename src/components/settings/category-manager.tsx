/**
 * CategoryManager — add, edit, reorder, and delete categories.
 *
 * How to use:
 *  1. Drag the ↑/↓ buttons to change category order in the sidebar.
 *  2. Click the color swatch to change category color.
 *  3. Click the name to edit it inline.
 *  4. Click ✕ to delete (disabled if category still has links).
 *  5. Use "+ Add Category" at the bottom to create a new one.
 */
"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import {
  addCategory,
  updateCategory,
  deleteCategory,
  moveCategoryOrder,
} from "@/actions/links";
import type { Category } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";

interface Props {
  categories: Category[];
  linkCountByCategory: Record<string, number>;
}

export function CategoryManager({ categories, linkCountByCategory }: Props) {
  const sorted = [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const [isPending, startTransition] = useTransition();

  // ── Inline edit state ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // ── Add state ──
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(CATEGORY_COLORS[0]);
  const [newDesc, setNewDesc] = useState("");

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditDesc(cat.description ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function commitEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    startTransition(() =>
      updateCategory(id, { name, color: editColor, description: editDesc })
    );
    setEditingId(null);
  }

  function handleDelete(id: string, name: string) {
    const count = linkCountByCategory[id] ?? 0;
    const msg = count > 0
      ? `"${name}" has ${count} link(s). Links will be uncategorized. Delete anyway?`
      : `Delete category "${name}"?`;
    if (!confirm(msg)) return;
    startTransition(() => deleteCategory(id));
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    const maxOrder = sorted.reduce((m, c) => Math.max(m, c.order), 0);
    startTransition(() =>
      addCategory({ name, color: newColor, description: newDesc, order: maxOrder + 1 })
    );
    setNewName("");
    setNewColor(CATEGORY_COLORS[0]);
    setNewDesc("");
    setShowAdd(false);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--fg)" }}>
        Categories
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--fg-subtle)" }}>
        Manage your link categories. Drag the ↑↓ buttons to reorder — the order here is
        the order shown in the sidebar.
      </p>

      {/* Category list */}
      <div className="flex flex-col gap-2 mb-4">
        {sorted.map((cat, i) => {
          const isEditing = editingId === cat.id;
          const count = linkCountByCategory[cat.id] ?? 0;
          const isFirst = i === 0;
          const isLast = i === sorted.length - 1;

          return (
            <div
              key={cat.id}
              className="card flex items-start gap-3 p-3"
              style={{ opacity: isPending ? 0.6 : 1 }}
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
                <button
                  onClick={() => startTransition(() => moveCategoryOrder(cat.id, "up"))}
                  disabled={isPending || isFirst}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "2px 4px" }}
                  title="Move up"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => startTransition(() => moveCategoryOrder(cat.id, "down"))}
                  disabled={isPending || isLast}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "2px 4px" }}
                  title="Move down"
                >
                  <ChevronDown size={12} />
                </button>
              </div>

              {/* Color swatch */}
              {isEditing ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className="w-5 h-5 rounded-full flex-shrink-0 border-2 transition-transform hover:scale-110"
                      style={{
                        background: c,
                        borderColor: editColor === c ? "#fff" : "transparent",
                      }}
                      title={c}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="w-4 h-4 rounded-sm flex-shrink-0 mt-1"
                  style={{ background: cat.color }}
                />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      className="input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Category name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(cat.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <input
                      className="input"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Short description (optional)"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => commitEdit(cat.id)} className="btn btn-primary btn-sm">
                        <Check size={12} /> Save
                      </button>
                      <button onClick={cancelEdit} className="btn btn-ghost btn-sm">
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                        {cat.description}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "var(--fg-faint)" }}>
                      {count} link{count !== 1 ? "s" : ""}
                    </p>
                  </>
                )}
              </div>

              {/* Action buttons */}
              {!isEditing && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(cat)}
                    className="btn btn-ghost btn-sm"
                    title="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="btn btn-ghost btn-sm"
                    title="Delete"
                  >
                    <Trash2 size={12} style={{ color: "#ef4444" }} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new category */}
      {showAdd ? (
        <div className="card p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            New Category
          </p>

          {/* Color picker */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{ background: c, borderColor: newColor === c ? "#fff" : "transparent" }}
                title={c}
              />
            ))}
          </div>

          <input
            className="input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name *"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
          />
          <input
            className="input"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Short description (optional)"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!newName.trim() || isPending} className="btn btn-primary btn-sm">
              <Plus size={12} /> Add Category
            </button>
            <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="btn btn-secondary btn-sm">
          <Plus size={12} /> Add Category
        </button>
      )}
    </div>
  );
}
