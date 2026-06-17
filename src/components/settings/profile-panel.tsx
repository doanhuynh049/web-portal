/**
 * ProfilePanel — edit display name, avatar initial & color, and role.
 * Changes are persisted to data/links.json via saveSettings server action.
 */
"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveSettings } from "@/actions/links";
import type { PortalSettings } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";

interface Props {
  settings: PortalSettings;
}

export function ProfilePanel({ settings }: Props) {
  const [name, setName] = useState(settings.profile.name);
  const [initial, setInitial] = useState(settings.profile.initial);
  const [avatarColor, setAvatarColor] = useState(settings.profile.avatarColor);
  const [role, setRole] = useState(settings.profile.role ?? "");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveSettings({
        ...settings,
        profile: { name, initial: initial.charAt(0).toUpperCase() || "?", avatarColor, role },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--fg)" }}>
        Profile
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--fg-subtle)" }}>
        Shown at the bottom-left corner of the sidebar. Local only — no account required.
      </p>

      {/* Avatar preview */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold select-none"
          style={{ background: avatarColor, color: "#fff" }}
        >
          {initial.charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <p className="font-semibold" style={{ color: "var(--fg)" }}>{name || "Your Name"}</p>
          <p className="text-sm" style={{ color: "var(--fg-subtle)" }}>{role || "Role"}</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
            Display Name
          </span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Thanh D."
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
            Avatar Initial (single character)
          </span>
          <input
            className="input"
            value={initial}
            onChange={(e) => setInitial(e.target.value.charAt(0))}
            placeholder="T"
            maxLength={1}
            style={{ width: 60 }}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
            Role / Job Title
          </span>
          <input
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Software Developer"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
            Avatar Color
          </span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setAvatarColor(c)}
                className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                style={{ background: c, borderColor: avatarColor === c ? "#fff" : "transparent" }}
                title={c}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn btn-primary btn-sm self-start"
        >
          {saved ? (
            <>
              <Check size={13} style={{ color: "#4ade80" }} /> Saved!
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </div>
    </div>
  );
}
