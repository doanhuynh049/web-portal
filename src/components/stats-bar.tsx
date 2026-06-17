/**
 * StatsBar — horizontal strip of summary metrics shown at the top of the
 * main content area (total links, pinned, broken, categories).
 */
"use client";

import { Link2, Pin, AlertCircle, Tag } from "lucide-react";

interface Props {
  totalLinks: number;
  pinnedCount: number;
  brokenCount: number;
  categoryCount: number;
}

export function StatsBar({ totalLinks, pinnedCount, brokenCount, categoryCount }: Props) {
  const stats = [
    { label: "Total Links", value: totalLinks, icon: Link2, danger: false },
    { label: "Pinned", value: pinnedCount, icon: Pin, danger: false },
    { label: "Broken", value: brokenCount, icon: AlertCircle, danger: brokenCount > 0 },
    { label: "Categories", value: categoryCount, icon: Tag, danger: false },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {stats.map(({ label, value, icon: Icon, danger }) => (
        <div
          key={label}
          className="card flex items-center gap-3 px-4 py-3"
        >
          <Icon
            size={16}
            style={{ color: danger ? "#ef4444" : "var(--fg-subtle)", flexShrink: 0 }}
          />
          <div>
            <div
              className="text-xl font-bold tabular-nums leading-none"
              style={{ color: danger ? "#ef4444" : "var(--fg)" }}
            >
              {value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--fg-subtle)" }}>
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
