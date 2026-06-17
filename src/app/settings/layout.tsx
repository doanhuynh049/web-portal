/**
 * Settings layout — wraps all /settings sub-pages.
 * Full-width panel, no max-w constraint, with a back navigation link.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        color: "var(--fg)",
      }}
    >
      {children}
    </div>
  );
}
