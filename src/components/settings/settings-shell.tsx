/**
 * SettingsShell — client shell for the settings page.
 * Handles the tab navigation between Profile, Categories, Appearance.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Tag, Palette } from "lucide-react";
import type { Category, PortalSettings } from "@/lib/types";
import { CategoryManager } from "./category-manager";
import { ProfilePanel } from "./profile-panel";
import { AppearancePanel } from "./appearance-panel";

type Tab = "profile" | "categories" | "appearance";

interface Props {
  categories: Category[];
  settings: PortalSettings;
  linkCountByCategory: Record<string, number>;
}

export function SettingsShell({ categories, settings, linkCountByCategory }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User size={14} /> },
    { id: "categories", label: "Categories", icon: <Tag size={14} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={14} /> },
  ];

  return (
    <div className="flex min-h-dvh">
      {/* ── Settings sidebar ── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col py-6"
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Back link */}
        <div className="px-4 mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: "var(--fg-subtle)", textDecoration: "none" }}
          >
            <ArrowLeft size={14} />
            Back to Portal
          </Link>
        </div>

        {/* Title */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-faint)" }}>
            Settings
          </p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-colors w-full"
              style={{
                background: activeTab === tab.id ? "var(--accent-bg)" : "transparent",
                color: activeTab === tab.id ? "var(--accent)" : "var(--fg-muted)",
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Content panel ── */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === "profile" && <ProfilePanel settings={settings} />}
        {activeTab === "categories" && (
          <CategoryManager
            categories={categories}
            linkCountByCategory={linkCountByCategory}
          />
        )}
        {activeTab === "appearance" && <AppearancePanel settings={settings} />}
      </main>
    </div>
  );
}
