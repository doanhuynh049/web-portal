/**
 * /settings — Server Component
 *
 * Reads PortalData and passes relevant slices to Client Components.
 *
 * Tabs:
 *  - Profile   → name, avatar, role
 *  - Categories → add / edit / reorder / delete
 *  - Appearance → theme preference
 */
import { readData } from "@/lib/store";
import { SettingsShell } from "@/components/settings/settings-shell";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const data = await readData();

  return (
    <SettingsShell
      categories={data.categories}
      settings={data.settings}
      linkCountByCategory={Object.fromEntries(
        data.categories.map((c) => [
          c.id,
          data.links.filter((l) => l.categoryId === c.id).length,
        ])
      )}
    />
  );
}
