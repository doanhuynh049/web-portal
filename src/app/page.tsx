/**
 * Portal home page — Server Component.
 *
 * Reads all data from the JSON store on the server, then passes it as props
 * to PortalApp (a Client Component that manages UI state).
 *
 * Re-renders automatically whenever a Server Action calls revalidatePath("/").
 */

import { readData } from "@/lib/store";
import { PortalApp } from "@/components/portal-app";

// Always server-render — data comes from Neon at request time
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await readData();
  return <PortalApp data={data} />;
}
