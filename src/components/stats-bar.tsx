/**
 * StatsBar — four metric tiles at the top of the main content area.
 */
"use client";

import { Link2, Pin, AlertCircle, Layers } from "lucide-react";

interface Props {
  totalLinks: number;
  pinnedCount: number;
  brokenCount: number;
  categoryCount: number;
}

const STATS = [
  {
    key: "total",
    label: "Total Links",
    icon: Link2,
    color: "#4f83f5",
    bg: "rgba(79,131,245,0.10)",
    border: "rgba(79,131,245,0.18)",
  },
  {
    key: "pinned",
    label: "Pinned",
    icon: Pin,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.10)",
    border: "rgba(167,139,250,0.18)",
  },
  {
    key: "broken",
    label: "Broken",
    icon: AlertCircle,
    color: null,
    bg: null,
    border: null,
  },
  {
    key: "cats",
    label: "Categories",
    icon: Layers,
    color: "#34d399",
    bg: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.18)",
  },
] as const;

export function StatsBar({ totalLinks, pinnedCount, brokenCount, categoryCount }: Props) {
  const values: Record<string, number> = {
    total: totalLinks,
    pinned: pinnedCount,
    broken: brokenCount,
    cats: categoryCount,
  };

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {STATS.map(({ key, label, icon: Icon, color, bg, border }) => {
        const value = values[key];
        const isDanger = key === "broken" && value > 0;
        const iconColor = isDanger ? "#ef4444" : color ?? "#4f83f5";
        const bgColor = isDanger ? "rgba(239,68,68,0.08)" : bg ?? "rgba(79,131,245,0.08)";
        const borderColor = isDanger ? "rgba(239,68,68,0.18)" : border ?? "rgba(79,131,245,0.15)";

        return (
          <div
            key={key}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              transition: "box-shadow 150ms ease, border-color 150ms ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = borderColor;
              el.style.boxShadow = `0 0 0 1px ${borderColor}, 0 4px 16px rgba(0,0,0,0.3)`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--border)";
              el.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: 34,
                height: 34,
                background: bgColor,
                border: `1px solid ${borderColor}`,
              }}
            >
              <Icon size={15} style={{ color: iconColor }} />
            </div>
            <div>
              <div
                className="text-xl font-bold tabular-nums leading-none"
                style={{
                  color: isDanger ? "#f87171" : "var(--fg)",
                  letterSpacing: "-0.03em",
                }}
              >
                {value}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--fg-subtle)", letterSpacing: "-0.005em" }}
              >
                {label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
