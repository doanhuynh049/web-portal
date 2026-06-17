/**
 * ProfilePanel — edit display name, avatar icon/color, and role.
 * Changes are persisted via saveSettings server action.
 *
 * Avatar: emoji icon picker (optional) or auto-derived letter initial.
 * Initial is auto-generated from the first letter of each name word.
 */
"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveSettings } from "@/actions/links";
import type { PortalSettings } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";

const AVATAR_ICONS = [
  "", // no icon (use letter)
  "🚀", "💻", "🎯", "📊", "⚡", "🌟", "🔥", "💡",
  "🎨", "🏗️", "🧠", "💰", "🌐", "📈", "🛠️", "🎮",
  "📚", "🏆", "🧩", "🦋",
];

function deriveInitial(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0][0].toUpperCase();
  // Two-letter monogram from first + last word
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

interface Props {
  settings: PortalSettings;
}

export function ProfilePanel({ settings }: Props) {
  const [name, setName] = useState(settings.profile.name);
  const [avatarColor, setAvatarColor] = useState(settings.profile.avatarColor);
  const [role, setRole] = useState(settings.profile.role ?? "");
  const [avatarIcon, setAvatarIcon] = useState(settings.profile.avatarIcon ?? "");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const derivedInitial = deriveInitial(name);

  function handleSave() {
    startTransition(async () => {
      await saveSettings({
        ...settings,
        profile: {
          name,
          initial: derivedInitial.charAt(0),
          avatarColor,
          role,
          avatarIcon,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--fg)" }}>
        Profile
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--fg-subtle)" }}>
        Shown at the bottom-left of the sidebar.
      </p>

      {/* Avatar preview */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-bold select-none"
          style={{
            background: avatarIcon ? "transparent" : avatarColor,
            color: "#fff",
            fontSize: avatarIcon ? 32 : 22,
            border: avatarIcon ? "2px solid var(--border-strong)" : "none",
          }}
        >
          {avatarIcon || derivedInitial}
        </div>
        <div>
          <p className="font-semibold" style={{ color: "var(--fg)" }}>{name || "Your Name"}</p>
          <p className="text-sm" style={{ color: "var(--fg-subtle)" }}>{role || "Role"}</p>
          {!avatarIcon && (
            <p className="text-xs mt-1" style={{ color: "var(--fg-faint)" }}>
              Initials auto-derived from name
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Display Name */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
            Display Name
          </span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quoc Thien"
          />
        </label>

        {/* Role */}
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

        {/* Avatar Icon Picker */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
            Avatar Icon
          </span>
          <div className="flex flex-wrap gap-2">
            {AVATAR_ICONS.map((icon, i) => (
              <button
                key={i}
                onClick={() => setAvatarIcon(icon)}
                className="flex items-center justify-center rounded-lg border-2 transition-all hover:scale-110"
                style={{
                  width: 40,
                  height: 40,
                  background: icon === "" && avatarIcon === ""
                    ? avatarColor
                    : avatarIcon === icon && icon !== ""
                    ? "var(--accent-bg)"
                    : "var(--card)",
                  borderColor:
                    avatarIcon === icon
                      ? "var(--accent)"
                      : "var(--border)",
                  fontSize: icon ? 20 : 14,
                  color: icon === "" && avatarIcon === "" ? "#fff" : "var(--fg-muted)",
                  fontWeight: icon === "" ? 700 : undefined,
                }}
                title={icon === "" ? "Use initials (auto from name)" : icon}
              >
                {icon === "" ? derivedInitial.charAt(0) : icon}
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
            {avatarIcon ? `Using emoji icon. Click the "A" tile to switch back to initials.` : "Using auto-generated initials from your name."}
          </p>
        </div>

        {/* Avatar Color (only shown when no emoji icon selected) */}
        {!avatarIcon && (
          <div className="flex flex-col gap-2">
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
        )}

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
