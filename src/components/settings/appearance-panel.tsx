/**
 * AppearancePanel — theme preference + default view.
 * Note: theme is also toggled from the sidebar in real-time.
 * This panel persists the preference to data/links.json so the server
 * knows the user's preferred theme on initial render.
 */
"use client";

import { useState, useTransition } from "react";
import { Sun, Moon, LayoutGrid, FolderOpen, Check } from "lucide-react";
import { saveSettings } from "@/actions/links";
import type { PortalSettings, Theme } from "@/lib/types";

interface Props {
  settings: PortalSettings;
}

export function AppearancePanel({ settings }: Props) {
  const [theme, setTheme] = useState<Theme>(settings.theme);
  const [defaultView, setDefaultView] = useState(settings.defaultView);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveSettings({ ...settings, theme, defaultView });
      // Also apply to current document so preview is instant
      if (theme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
      localStorage.setItem("portal-theme", theme);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--fg)" }}>
        Appearance
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--fg-subtle)" }}>
        Control how the portal looks and what you see first.
      </p>

      {/* Theme */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-faint)" }}>
          Color Theme
        </p>
        <div className="flex gap-3">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors"
              style={{
                borderColor: theme === t ? "var(--accent)" : "var(--border)",
                background: theme === t ? "var(--accent-bg)" : "var(--card)",
              }}
            >
              {t === "dark" ? (
                <Moon size={20} style={{ color: theme === t ? "var(--accent)" : "var(--fg-muted)" }} />
              ) : (
                <Sun size={20} style={{ color: theme === t ? "var(--accent)" : "var(--fg-muted)" }} />
              )}
              <span className="text-sm font-medium capitalize" style={{ color: theme === t ? "var(--accent)" : "var(--fg-muted)" }}>
                {t}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Default view */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-faint)" }}>
          Default View on Open
        </p>
        <div className="flex gap-3">
          {(["links", "projects"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setDefaultView(v)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors"
              style={{
                borderColor: defaultView === v ? "var(--accent)" : "var(--border)",
                background: defaultView === v ? "var(--accent-bg)" : "var(--card)",
              }}
            >
              {v === "links" ? (
                <LayoutGrid size={20} style={{ color: defaultView === v ? "var(--accent)" : "var(--fg-muted)" }} />
              ) : (
                <FolderOpen size={20} style={{ color: defaultView === v ? "var(--accent)" : "var(--fg-muted)" }} />
              )}
              <span className="text-sm font-medium capitalize" style={{ color: defaultView === v ? "var(--accent)" : "var(--fg-muted)" }}>
                {v}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={isPending} className="btn btn-primary btn-sm">
        {saved ? (
          <>
            <Check size={13} style={{ color: "#4ade80" }} /> Saved!
          </>
        ) : (
          "Save Appearance"
        )}
      </button>
    </div>
  );
}
